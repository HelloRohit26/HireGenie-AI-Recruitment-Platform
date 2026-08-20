from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from app.db.session import get_db
from app.models.models import Job, CandidateApplication, ApplicationStatus
from app.schemas.schemas import MassScreeningRequest

router = APIRouter()


@router.get("/candidates")
def list_candidates(job_id: Optional[int] = None, status: Optional[str] = None, db: Session = Depends(get_db)):
    """Recruiter Roster: Fetches live candidate applications directly from database ordered by rank/score."""
    query = db.query(CandidateApplication)
    if job_id:
        query = query.filter(CandidateApplication.job_id == job_id)
    
    if status is not None and status.strip() != "":
        clean_status = status.strip()
        if clean_status.lower() != "all":
            valid_status = None
            try:
                valid_status = ApplicationStatus(clean_status.upper())
            except ValueError:
                for member in ApplicationStatus:
                    if member.value.upper() == clean_status.upper() or member.name.upper() == clean_status.upper():
                        valid_status = member
                        break

            if not valid_status:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid status '{status}'. Valid statuses are: 'All', {', '.join([s.value for s in ApplicationStatus])}"
                )
            query = query.filter(CandidateApplication.status == valid_status)

    apps = query.order_by(CandidateApplication.rank.asc().nullslast(), CandidateApplication.overall_match_score.desc().nullslast()).all()
    res = []
    for app in apps:
        active_invitation = app.invitations[0] if (hasattr(app, "invitations") and app.invitations) else None
        res.append({
            "id": app.id,
            "application_id": app.id,
            "candidate_id": app.candidate_id,
            "candidate_name": app.candidate.full_name if app.candidate else f"Candidate #{app.candidate_id}",
            "email": app.candidate.email if app.candidate else "candidate@example.com",
            "job_id": app.job_id,
            "job_title": app.job.title if app.job else "Requisition",
            "status": app.status,
            "rank": app.rank,
            "invitation_status": active_invitation.status.value if active_invitation else "NOT_INVITED",
            "invitation_token": active_invitation.invitation_token if active_invitation else None,
            "overall_match_score": app.overall_match_score or 0.0,
            "score_breakdown": app.score_breakdown or {},
            "applied_date": app.applied_at.strftime("%b %d, %Y") if app.applied_at else "Recently"
        })
    return res


@router.post("/trigger-screening")
def run_mass_screening(payload: MassScreeningRequest, db: Session = Depends(get_db)):
    """Recruiter Dashboard: Triggers real candidate screening across applicants for a job."""
    from app.services.screening_pipeline import evaluate_job_vs_candidate, recalculate_job_candidate_ranks
    from app.services.communication_service import send_candidate_email_job

    job = db.query(Job).filter(Job.id == payload.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job opening not found")

    target_count = payload.override_top_n or getattr(job, "target_shortlist_count", 5) or 5
    applications = db.query(CandidateApplication).filter(CandidateApplication.job_id == payload.job_id).all()

    if not applications:
        return {
            "status": "COMPLETED",
            "message": "No candidate applications found to screen.",
            "shortlisted_count": 0,
            "screening_mode": "REAL_MULTI_CRITERIA",
            "ai_pipeline_status": "REAL AI PIPELINE: NOT CONNECTED (NO APPLICANTS)"
        }

    shortlisted_candidates = []
    min_threshold = payload.min_score_threshold or getattr(job, "shortlist_threshold", None) or getattr(job, "min_score_threshold", 70.0) or 70.0

    from app.services.screening_pipeline import get_or_create_interview_invitation

    for app in applications:
        app.status = ApplicationStatus.MATCHING
        resume = app.resume
        candidate_user = app.candidate

        eval_result = evaluate_job_vs_candidate(
            job=job,
            resume=resume,
            candidate_user=candidate_user,
            cover_note=""
        )

        overall_score = eval_result["overall_score"]
        app.overall_match_score = overall_score
        app.score_breakdown = eval_result

        if len(shortlisted_candidates) < target_count and overall_score >= min_threshold:
            app.status = ApplicationStatus.SHORTLISTED
            shortlisted_candidates.append(app.id)
            invitation = get_or_create_interview_invitation(db, app, job)
            send_candidate_email_job(db, app, job, candidate_user.full_name if candidate_user else "Candidate", invitation_token=invitation.invitation_token)
        else:
            app.status = ApplicationStatus.REJECTED
            app.rejection_reason = f"Match score {overall_score}% below threshold ({min_threshold}%) or shortlist capacity reached"

    db.commit()

    # Recalculate dynamic ranks for this job
    recalculate_job_candidate_ranks(db, payload.job_id)

    return {
        "status": "COMPLETED",
        "job_id": job.id,
        "total_applicants_processed": len(applications),
        "target_shortlist_count": target_count,
        "shortlisted_applications": shortlisted_candidates,
        "screening_mode": "REAL_MULTI_CRITERIA_EVALUATION",
        "ai_pipeline_status": "REAL EVALUATION PIPELINE ACTIVE",
    }


@router.patch("/applications/{application_id}/status")
def update_application_status(application_id: int, status_update: Dict[str, Any], db: Session = Depends(get_db)):
    """Updates and persists a candidate application's pipeline status in SQLite DB."""
    app = db.query(CandidateApplication).filter(CandidateApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Candidate application not found")
    
    new_status = status_update.get("status")
    if new_status:
        try:
            app.status = ApplicationStatus(new_status)
        except ValueError:
            app.status = new_status
        db.commit()
        db.refresh(app)
        
    return {
        "application_id": app.id,
        "status": app.status,
        "message": "Application status updated successfully"
    }


@router.get("/dossier/{application_id}")
def get_candidate_dossier(application_id: int, db: Session = Depends(get_db)):
    """Recruiter Candidate Dossier: Fetches full insights, rank, invitation status, audio recording, and score breakdown."""
    app = db.query(CandidateApplication).filter(CandidateApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Candidate application record not found")

    active_invitation = app.invitations[0] if (hasattr(app, "invitations") and app.invitations) else None

    # Fetch latest evaluation record for this application
    from app.models.models import InterviewEvaluation, EvaluationStatus
    eval_rec = db.query(InterviewEvaluation).filter(
        InterviewEvaluation.application_id == app.id
    ).order_by(InterviewEvaluation.created_at.desc()).first()

    eval_data = None
    if eval_rec:
        if eval_rec.status == EvaluationStatus.COMPLETED:
            eval_data = {
                "id": eval_rec.id,
                "status": "COMPLETED",
                "technical_score": eval_rec.technical_score,
                "problem_solving_score": eval_rec.problem_solving_score,
                "communication_score": eval_rec.communication_score,
                "role_fit_score": eval_rec.role_fit_score,
                "overall_score": eval_rec.overall_score,
                "recommendation": eval_rec.recommendation.value if eval_rec.recommendation else "CONSIDER",
                "strengths": eval_rec.strengths or [],
                "gaps": eval_rec.gaps or [],
                "evidence": eval_rec.evidence or [],
                "explanation": eval_rec.explanation,
                "completed_at": eval_rec.completed_at.isoformat() if eval_rec.completed_at else None
            }
        elif eval_rec.status in [EvaluationStatus.PENDING, EvaluationStatus.ANALYZING]:
            eval_data = {
                "id": eval_rec.id,
                "status": eval_rec.status.value,
                "message": "Evaluation in progress..."
            }
        elif eval_rec.status == EvaluationStatus.FAILED:
            eval_data = {
                "id": eval_rec.id,
                "status": "FAILED",
                "error_message": eval_rec.error_message or "Evaluation failed",
                "can_retry": True
            }
    else:
        eval_data = {
            "status": "NOT_STARTED",
            "message": "No evaluation available."
        }

    # Fetch offer record if exists
    from app.models.models import JobOffer
    offer_rec = db.query(JobOffer).filter(JobOffer.application_id == app.id).first()
    offer_data = None
    if offer_rec:
        offer_data = {
            "id": offer_rec.id,
            "offer_token": offer_rec.offer_token,
            "status": offer_rec.status.value if offer_rec.status else "OFFERED",
            "compensation": offer_rec.compensation,
            "role_title": offer_rec.role_title,
            "company_name": offer_rec.company_name,
            "created_at": offer_rec.created_at.isoformat() if offer_rec.created_at else None,
            "expires_at": offer_rec.expires_at.isoformat() if offer_rec.expires_at else None,
            "accepted_at": offer_rec.accepted_at.isoformat() if offer_rec.accepted_at else None,
            "declined_at": offer_rec.declined_at.isoformat() if offer_rec.declined_at else None,
        }

    # Determine eligibility for hiring decision
    from app.models.models import InterviewSession, SessionStatus
    has_completed_interview = db.query(InterviewSession).filter(
        InterviewSession.application_id == app.id,
        InterviewSession.status == SessionStatus.COMPLETED
    ).first() is not None

    has_completed_evaluation = eval_rec is not None and eval_rec.status == EvaluationStatus.COMPLETED
    can_make_decision = has_completed_interview and has_completed_evaluation

    return {
        "candidate_name": app.candidate.full_name if app.candidate else "Applicant",
        "email": app.candidate.email if app.candidate else "",
        "application_id": app.id,
        "candidate_id": app.candidate_id,
        "status": app.status,
        "rank": app.rank,
        "invitation_status": active_invitation.status.value if active_invitation else "NOT_INVITED",
        "invitation_token": active_invitation.invitation_token if active_invitation else None,
        "overall_score": app.overall_match_score,
        "score_breakdown": app.score_breakdown,
        "job_title": app.job.title if app.job else "",
        "job_id": app.job_id,
        "salary_range": app.job.salary_range if app.job else None,
        "company": app.job.company if app.job else "",
        "interview_mode": app.job.interview_mode if app.job else "WEBRTC",
        "screening_answers": [
            {"question": sa.question.question_text if sa.question else "", "answer": sa.answer_text}
            for sa in app.screening_answers
        ],
        "interview_session": [
            {
                "id": i.id,
                "status": i.status,
                "audio_url": i.audio_recording_url or getattr(i, "audio_url", None),
                "transcript": i.transcript,
                "overall_score": getattr(i, "overall_score", None),
            }
            for i in app.interviews
        ],
        "interview_evaluation": eval_data,
        "offer": offer_data,
        "can_make_decision": can_make_decision,
        "has_completed_interview": has_completed_interview,
        "has_completed_evaluation": has_completed_evaluation
    }