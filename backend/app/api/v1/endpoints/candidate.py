import uuid
import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, File, UploadFile
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import (
    CandidateApplication, ScreeningAnswer, ApplicationStatus, Job, Resume, User, UserRole,
    AgentTelemetry, InterviewInvitation, InterviewSession, InterviewEvaluation,
    HiringDecision, JobOffer, InvitationStatus, SessionStatus, EvaluationStatus, OfferStatus
)
from app.schemas.schemas import ApplicationSubmit, ApplicationStatusResponse
from app.services.screening_pipeline import process_candidate_screening_async
from app.services.resume_parser import ResumeParser
from app.core.rbac import get_current_user

router = APIRouter()


@router.post("/upload-resume")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Candidate Portal: Uploads candidate resume file (PDF, DOCX, TXT), parses metadata, and stores Resume record in DB for authenticated candidate."""
    candidate_id = current_user.id
    upload_dir = os.path.join("uploads", "resumes")
    os.makedirs(upload_dir, exist_ok=True)

    file_ext = os.path.splitext(file.filename or "resume.pdf")[1].lower()
    safe_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(upload_dir, safe_filename)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    # Real file text extraction (PDF, DOCX, TXT)
    try:
        raw_text = ResumeParser.extract_text_from_file(file_path)
    except Exception:
        raw_text = content.decode('utf-8', errors='ignore')

    # Comprehensive AI-Powered + Canonical Skill & Experience Parsing
    parsed_data = ResumeParser.parse_resume(raw_text)
    parsed_skills = parsed_data.skills
    parsed_experience_years = parsed_data.experience_years

    resume = db.query(Resume).filter(Resume.candidate_id == candidate_id).first()
    if not resume:
        resume = Resume(
            candidate_id=candidate_id,
            file_path=f"/uploads/resumes/{safe_filename}",
            raw_text=raw_text,
            parsed_skills=parsed_skills,
            parsed_experience_years=parsed_experience_years
        )
        db.add(resume)
    else:
        resume.file_path = f"/uploads/resumes/{safe_filename}"
        resume.raw_text = raw_text
        resume.parsed_skills = parsed_skills
        resume.parsed_experience_years = parsed_experience_years

    db.commit()
    db.refresh(resume)

    return {
        "resume_id": resume.id,
        "filename": file.filename,
        "file_path": resume.file_path,
        "parsed_skills": resume.parsed_skills,
        "parsed_experience_years": resume.parsed_experience_years,
        "message": "Resume file uploaded and parsed successfully."
    }


@router.post("/apply", response_model=ApplicationStatusResponse, status_code=status.HTTP_201_CREATED)
def apply_for_job(
    payload: ApplicationSubmit,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Candidate Portal: Allows authenticated job seekers to apply and triggers asynchronous screening background task."""
    job = db.query(Job).filter(Job.id == payload.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Target job not found")

    # Enforce closed job behavior
    if job.status and job.status.upper() == "CLOSED":
        raise HTTPException(status_code=400, detail="Applications are closed for this job position.")

    # Derive candidate identity directly from authenticated JWT token
    candidate_id = current_user.id

    # Check if candidate already applied
    existing = (
        db.query(CandidateApplication)
        .filter(
            CandidateApplication.candidate_id == candidate_id,
            CandidateApplication.job_id == payload.job_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Candidate has already applied for this job position.")

    # Ensure resume entry exists in DB
    resume_id = payload.resume_id
    if not resume_id:
        resume = db.query(Resume).filter(Resume.candidate_id == candidate_id).first()
        if not resume:
            resume = Resume(
                candidate_id=candidate_id,
                file_path="/uploads/resumes/candidate_resume.pdf",
                raw_text=f"{current_user.full_name} candidate profile",
                parsed_skills=[],
                parsed_experience_years=0.0
            )
            db.add(resume)
            db.commit()
            db.refresh(resume)
        resume_id = resume.id

    # Generate one-time magic token for secure interview routing
    magic_token = str(uuid.uuid4())

    application = CandidateApplication(
        candidate_id=candidate_id,
        job_id=payload.job_id,
        resume_id=resume_id,
        status=ApplicationStatus.RECEIVED,
        magic_token=magic_token,
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    # Save screening answers independently
    if payload.answers:
        for ans in payload.answers:
            sa = ScreeningAnswer(
                application_id=application.id,
                question_id=ans.question_id,
                answer_text=ans.answer_text,
            )
            db.add(sa)
        db.commit()

    # Trigger Application Received Email Notification (Idempotent, non-blocking)
    try:
        from app.models.communication import CommunicationStage
        from app.services.communication_agent import CommunicationAgent
        CommunicationAgent.send_communication(
            db=db,
            application_id=application.id,
            stage=CommunicationStage.APPLICATION_RECEIVED,
            recipient_email=current_user.email,
            recipient_name=current_user.full_name or "Candidate",
            template_vars={
                "job_title": job.title,
                "company": job.company or "HireGenie AI",
                "application_id": application.id
            }
        )
    except Exception as comm_err:
        from app.core.logger import logger
        logger.warning(f"Application received email dispatch note: {comm_err}")

    # Trigger durable worker screening task immediately
    from app.workers.dispatcher import dispatch_screening_task
    dispatch_screening_task(application.id)

    return application


def build_application_journey(app: CandidateApplication, db: Session) -> dict:
    """Builds a complete, 100% real data aggregation of the candidate journey from PostgreSQL."""
    app_status_str = app.status.value if hasattr(app.status, "value") else str(app.status or "APPLIED").upper()
    
    # 1. Related Records
    telemetry_records = db.query(AgentTelemetry).filter(
        AgentTelemetry.application_id == app.id
    ).order_by(AgentTelemetry.created_at.asc()).all()

    invitation = db.query(InterviewInvitation).filter(
        InterviewInvitation.application_id == app.id
    ).order_by(InterviewInvitation.created_at.desc()).first()

    session = db.query(InterviewSession).filter(
        InterviewSession.application_id == app.id
    ).order_by(InterviewSession.created_at.desc()).first()

    evaluation = db.query(InterviewEvaluation).filter(
        InterviewEvaluation.application_id == app.id
    ).order_by(InterviewEvaluation.created_at.desc()).first()

    hiring_decision = db.query(HiringDecision).filter(
        HiringDecision.application_id == app.id
    ).order_by(HiringDecision.decided_at.desc()).first()

    offer = db.query(JobOffer).filter(
        JobOffer.application_id == app.id
    ).order_by(JobOffer.created_at.desc()).first()

    # 2. Derive Stage States
    # Stage: APPLIED
    applied_stage = {
        "id": "APPLIED",
        "name": "Application Submitted",
        "status": "COMPLETED",
        "timestamp": app.applied_at.isoformat() if app.applied_at else None,
        "detail": "Application successfully recorded in PostgreSQL."
    }

    # Stage: AI_SCREENING
    active_screening_statuses = {"RECEIVED", "APPLIED", "PARSING", "MATCHING", "RANKING"}
    terminal_rejected = app_status_str in {"REJECTED", "FAILED"}
    
    if app_status_str in active_screening_statuses and not any(t.status == "PROCESSING" for t in telemetry_records):
        # If in early stage
        screening_state = "ACTIVE" if not app.overall_match_score else "COMPLETED"
    elif any(t.status == "PROCESSING" for t in telemetry_records):
        screening_state = "ACTIVE"
    elif app_status_str == "FAILED":
        screening_state = "FAILED"
    else:
        screening_state = "COMPLETED"

    screening_stage = {
        "id": "AI_SCREENING",
        "name": "AI Screening",
        "status": screening_state,
        "score": app.overall_match_score,
        "rank": app.rank,
        "score_breakdown": app.score_breakdown,
        "rejection_reason": app.rejection_reason,
        "detail": f"Match Score: {app.overall_match_score:.1f}%" if app.overall_match_score is not None else "Analyzing resume and skills..."
    }

    # Stage: SHORTLISTED
    if app_status_str == "REJECTED" and not invitation:
        shortlisted_state = "FAILED"
    elif app_status_str in active_screening_statuses and not app.overall_match_score:
        shortlisted_state = "PENDING"
    elif app_status_str in {"INTERVIEW", "INTERVIEW_SCHEDULED", "INTERVIEWING", "INTERVIEW_COMPLETED", "EVALUATED", "OFFERED", "HIRED", "OFFER_DECLINED"} or invitation:
        shortlisted_state = "COMPLETED"
    elif app_status_str == "SHORTLISTED":
        shortlisted_state = "ACTIVE"
    elif app_status_str == "REJECTED":
        shortlisted_state = "FAILED"
    else:
        shortlisted_state = "PENDING"

    shortlisted_stage = {
        "id": "SHORTLISTED",
        "name": "Shortlisted",
        "status": shortlisted_state,
        "detail": "Selected for interview stage" if shortlisted_state in ("COMPLETED", "ACTIVE") else ("Not shortlisted" if shortlisted_state == "FAILED" else "Awaiting screening result")
    }

    # Stage: INTERVIEW
    if session and session.status == SessionStatus.COMPLETED:
        interview_state = "COMPLETED"
    elif session and session.status in (SessionStatus.IN_PROGRESS, SessionStatus.CONNECTING, SessionStatus.CONNECTED):
        interview_state = "ACTIVE"
    elif invitation and invitation.status in (InvitationStatus.INVITED, InvitationStatus.ACCEPTED, InvitationStatus.READY, InvitationStatus.VIEWED):
        interview_state = "ACTIVE"
    elif shortlisted_state == "FAILED":
        interview_state = "NOT_APPLICABLE"
    else:
        interview_state = "PENDING"

    interview_stage = {
        "id": "INTERVIEW",
        "name": "Voice AI Interview",
        "status": interview_state,
        "invitation_token": invitation.invitation_token if invitation else (app.magic_token or None),
        "session_token": session.session_token if session else None,
        "detail": "Interview session completed" if interview_state == "COMPLETED" else ("Interview ready to start" if interview_state == "ACTIVE" else ("Not applicable" if interview_state == "NOT_APPLICABLE" else "Awaiting shortlist"))
    }

    # Stage: FINAL_REVIEW
    if offer or (hiring_decision and hiring_decision.decision == "HIRED"):
        review_state = "COMPLETED"
    elif hiring_decision and hiring_decision.decision == "REJECTED":
        review_state = "FAILED"
    elif evaluation and evaluation.status == EvaluationStatus.COMPLETED:
        review_state = "ACTIVE"
    elif interview_state == "COMPLETED":
        review_state = "ACTIVE"
    elif shortlisted_state == "FAILED" or interview_state == "NOT_APPLICABLE":
        review_state = "NOT_APPLICABLE"
    else:
        review_state = "PENDING"

    review_stage = {
        "id": "FINAL_REVIEW",
        "name": "Final Review & Offer",
        "status": review_state,
        "decision": hiring_decision.decision if hiring_decision else None,
        "detail": "Offer extended" if offer else ("Application approved" if review_state == "COMPLETED" else ("Application not selected" if review_state == "FAILED" else ("Recruiter final review in progress" if review_state == "ACTIVE" else "Awaiting interview completion")))
    }

    # 3. Chronological Timeline Events
    timeline_events = []
    
    # 1. Application Submitted
    if app.applied_at:
        timeline_events.append({
            "key": "APPLICATION_SUBMITTED",
            "title": "Application Submitted",
            "description": f"Applied for {app.job.title if app.job else 'Position'}",
            "timestamp": app.applied_at.isoformat(),
            "status": "SUCCESS"
        })

    # 2. Telemetry Records
    for t in telemetry_records:
        if t.completed_at:
            timeline_events.append({
                "key": f"TELEMETRY_{t.agent_name.upper().replace(' ', '_')}",
                "title": t.agent_name,
                "description": f"Status: {t.status} (Duration: {t.duration_ms:.0f}ms)" if t.duration_ms else f"Status: {t.status}",
                "timestamp": t.completed_at.isoformat(),
                "status": "SUCCESS" if t.status == "COMPLETED" else ("FAILED" if t.status == "FAILED" else "IN_PROGRESS")
            })

    # 3. Screening Outcome
    if app.overall_match_score is not None:
        outcome_title = "Candidate Shortlisted" if app_status_str in ("SHORTLISTED", "INTERVIEW", "INTERVIEW_SCHEDULED", "INTERVIEWING", "INTERVIEW_COMPLETED", "EVALUATED", "OFFERED", "HIRED") else ("Application Rejected" if app_status_str == "REJECTED" else "Screening Evaluation Completed")
        timeline_events.append({
            "key": "SCREENING_OUTCOME",
            "title": outcome_title,
            "description": f"AI Match Score: {app.overall_match_score:.1f}% | Rank: #{app.rank or 1}",
            "timestamp": (telemetry_records[-1].completed_at.isoformat() if telemetry_records and telemetry_records[-1].completed_at else app.applied_at.isoformat()) if app.applied_at else None,
            "status": "SUCCESS" if outcome_title != "Application Rejected" else "FAILED"
        })

    # 4. Invitation
    if invitation and invitation.created_at:
        timeline_events.append({
            "key": "INTERVIEW_INVITATION",
            "title": "Interview Invitation Issued",
            "description": "Candidate invited to Voice AI evaluation session.",
            "timestamp": invitation.created_at.isoformat(),
            "status": "SUCCESS"
        })

    if invitation and invitation.accepted_at:
        timeline_events.append({
            "key": "INVITATION_ACCEPTED",
            "title": "Interview Invitation Accepted",
            "description": "Candidate accepted invitation and entered preparation.",
            "timestamp": invitation.accepted_at.isoformat(),
            "status": "SUCCESS"
        })

    # 5. Session
    if session and session.started_at:
        timeline_events.append({
            "key": "INTERVIEW_STARTED",
            "title": "Voice AI Interview Started",
            "description": "Candidate connected to WebRTC autonomous voice room.",
            "timestamp": session.started_at.isoformat(),
            "status": "IN_PROGRESS"
        })

    if session and session.ended_at:
        timeline_events.append({
            "key": "INTERVIEW_COMPLETED",
            "title": "Voice AI Interview Completed",
            "description": f"Interview finished. Duration: {session.elapsed_seconds or 0}s.",
            "timestamp": session.ended_at.isoformat(),
            "status": "SUCCESS"
        })

    # 6. Evaluation
    if evaluation and evaluation.completed_at:
        timeline_events.append({
            "key": "EVALUATION_COMPLETED",
            "title": "Interview Evaluation Completed",
            "description": f"Overall Score: {evaluation.overall_score:.1f}/100 | Recommendation: {evaluation.recommendation.value if hasattr(evaluation.recommendation, 'value') else evaluation.recommendation}",
            "timestamp": evaluation.completed_at.isoformat(),
            "status": "SUCCESS"
        })

    # 7. Decision / Offer
    if hiring_decision and hiring_decision.decided_at:
        timeline_events.append({
            "key": "HIRING_DECISION",
            "title": f"Recruiter Decision: {hiring_decision.decision}",
            "description": hiring_decision.reason or "Decision recorded by recruiter.",
            "timestamp": hiring_decision.decided_at.isoformat(),
            "status": "SUCCESS" if hiring_decision.decision == "HIRED" else "FAILED"
        })

    if offer and offer.created_at:
        timeline_events.append({
            "key": "OFFER_EXTENDED",
            "title": "Job Offer Extended",
            "description": f"Offer for {offer.role_title} at {offer.company_name} ({offer.compensation or 'Competitive'}).",
            "timestamp": offer.created_at.isoformat(),
            "status": "SUCCESS"
        })

    if offer and offer.accepted_at:
        timeline_events.append({
            "key": "OFFER_ACCEPTED",
            "title": "Offer Accepted — Candidate Hired! 🎉",
            "description": f"Candidate accepted offer for {offer.role_title}.",
            "timestamp": offer.accepted_at.isoformat(),
            "status": "SUCCESS"
        })
    elif offer and offer.declined_at:
        timeline_events.append({
            "key": "OFFER_DECLINED",
            "title": "Offer Declined",
            "description": offer.decline_reason or "Candidate declined the job offer.",
            "timestamp": offer.declined_at.isoformat(),
            "status": "FAILED"
        })

    # Sort timeline chronologically
    timeline_events.sort(key=lambda x: x.get("timestamp") or "")

    # 4. Is Actively Processing Flag
    is_processing = (
        app_status_str in active_screening_statuses
        or any(t.status == "PROCESSING" for t in telemetry_records)
        or (session and session.status in (SessionStatus.IN_PROGRESS, SessionStatus.CONNECTING, SessionStatus.CONNECTED))
        or (evaluation and evaluation.status in (EvaluationStatus.PENDING, EvaluationStatus.ANALYZING))
    )

    job_obj = app.job
    candidate_obj = app.candidate

    return {
        "application": {
            "id": app.id,
            "candidate_id": app.candidate_id,
            "job_id": app.job_id,
            "status": app_status_str,
            "overall_match_score": app.overall_match_score,
            "score_breakdown": app.score_breakdown,
            "rejection_reason": app.rejection_reason,
            "rank": app.rank,
            "magic_token": app.magic_token,
            "applied_at": app.applied_at.isoformat() if app.applied_at else None,
        },
        "job": {
            "id": job_obj.id if job_obj else app.job_id,
            "title": job_obj.title if job_obj else f"Position #{app.job_id}",
            "company": (job_obj.company if job_obj and hasattr(job_obj, "company") else None) or "HireGenie AI",
            "department": job_obj.department if job_obj else "Engineering",
            "location": job_obj.location if job_obj else "Remote",
            "work_mode": job_obj.work_mode.value if job_obj and hasattr(job_obj.work_mode, "value") else (str(job_obj.work_mode) if job_obj and job_obj.work_mode else "REMOTE"),
            "employment_type": job_obj.employment_type.value if job_obj and hasattr(job_obj.employment_type, "value") else (str(job_obj.employment_type) if job_obj and job_obj.employment_type else "FULL_TIME"),
            "salary_range": job_obj.salary_range if job_obj else None,
            "status": job_obj.status if job_obj else "OPEN",
            "must_have_skills": job_obj.must_have_skills if job_obj else [],
            "description": job_obj.description if job_obj else ""
        },
        "candidate": {
            "id": candidate_obj.id if candidate_obj else app.candidate_id,
            "full_name": candidate_obj.full_name if candidate_obj else "Candidate User",
            "email": candidate_obj.email if candidate_obj else "candidate@example.com"
        },
        "agent_telemetry": [
            {
                "id": t.id,
                "agent_name": t.agent_name,
                "status": t.status,
                "started_at": t.started_at.isoformat() if t.started_at else None,
                "completed_at": t.completed_at.isoformat() if t.completed_at else None,
                "duration_ms": t.duration_ms,
                "error_message": t.error_message,
                "details": t.details
            }
            for t in telemetry_records
        ],
        "interview_invitation": {
            "id": invitation.id,
            "invitation_token": invitation.invitation_token,
            "status": invitation.status.value if hasattr(invitation.status, "value") else str(invitation.status),
            "interview_mode": invitation.interview_mode,
            "created_at": invitation.created_at.isoformat() if invitation.created_at else None,
            "expires_at": invitation.expires_at.isoformat() if invitation.expires_at else None,
            "accepted_at": invitation.accepted_at.isoformat() if invitation.accepted_at else None,
            "scheduled_at": invitation.scheduled_at.isoformat() if invitation.scheduled_at else None
        } if invitation else None,
        "interview_session": {
            "id": session.id,
            "session_token": session.session_token,
            "status": session.status.value if hasattr(session.status, "value") else str(session.status),
            "started_at": session.started_at.isoformat() if session.started_at else None,
            "ended_at": session.ended_at.isoformat() if session.ended_at else None,
            "elapsed_seconds": session.elapsed_seconds
        } if session else None,
        "interview_evaluation": {
            "id": evaluation.id,
            "status": evaluation.status.value if hasattr(evaluation.status, "value") else str(evaluation.status),
            "overall_score": evaluation.overall_score,
            "technical_score": evaluation.technical_score,
            "problem_solving_score": evaluation.problem_solving_score,
            "communication_score": evaluation.communication_score,
            "role_fit_score": evaluation.role_fit_score,
            "recommendation": evaluation.recommendation.value if hasattr(evaluation.recommendation, "value") else str(evaluation.recommendation),
            "strengths": evaluation.strengths,
            "gaps": evaluation.gaps,
            "explanation": evaluation.explanation
        } if evaluation else None,
        "hiring_decision": {
            "id": hiring_decision.id,
            "decision": hiring_decision.decision,
            "decided_at": hiring_decision.decided_at.isoformat() if hiring_decision.decided_at else None,
            "reason": hiring_decision.reason
        } if hiring_decision else None,
        "job_offer": {
            "id": offer.id,
            "offer_token": offer.offer_token,
            "status": offer.status.value if hasattr(offer.status, "value") else str(offer.status),
            "compensation": offer.compensation,
            "role_title": offer.role_title,
            "company_name": offer.company_name,
            "created_at": offer.created_at.isoformat() if offer.created_at else None,
            "expires_at": offer.expires_at.isoformat() if offer.expires_at else None,
            "accepted_at": offer.accepted_at.isoformat() if offer.accepted_at else None,
            "declined_at": offer.declined_at.isoformat() if offer.declined_at else None,
            "decline_reason": offer.decline_reason
        } if offer else None,
        "tracking_stages": [
            applied_stage,
            screening_stage,
            shortlisted_stage,
            interview_stage,
            review_stage
        ],
        "timeline": timeline_events,
        "is_processing": is_processing
    }


@router.get("/applications")
def get_candidate_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves candidate applications with full journey data belonging ONLY to the authenticated user."""
    if current_user.role == UserRole.CANDIDATE:
        apps = db.query(CandidateApplication).filter(
            CandidateApplication.candidate_id == current_user.id
        ).order_by(CandidateApplication.applied_at.desc()).all()
    elif current_user.role in (UserRole.RECRUITER, UserRole.ADMIN):
        apps = db.query(CandidateApplication).order_by(CandidateApplication.applied_at.desc()).all()
    else:
        raise HTTPException(status_code=403, detail="Access denied.")

    return [build_application_journey(a, db) for a in apps]


@router.get("/applications/{application_id}/journey")
def get_application_journey_by_id(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Candidate Application Tracker: Single aggregated endpoint returning the complete real candidate journey."""
    app = db.query(CandidateApplication).filter(CandidateApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application record not found")

    if current_user.role == UserRole.CANDIDATE and app.candidate_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied. You cannot view another candidate's application.")

    return build_application_journey(app, db)


@router.get("/track/{application_id}")
def track_application_status(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Candidate Application Tracker: Real-time status update for job seekers with strict authorization check."""
    app = db.query(CandidateApplication).filter(CandidateApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application record not found")

    if current_user.role == UserRole.CANDIDATE and app.candidate_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied. You cannot view another candidate's application.")

    return build_application_journey(app, db)


@router.get("/applications/{application_id}/telemetry")
def get_application_telemetry(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves live agent execution telemetry for a specific application."""
    app = db.query(CandidateApplication).filter(CandidateApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application record not found")

    if current_user.role == UserRole.CANDIDATE and app.candidate_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    telemetry_records = db.query(AgentTelemetry).filter(
        AgentTelemetry.application_id == application_id
    ).order_by(AgentTelemetry.created_at.asc()).all()

    return [
        {
            "id": t.id,
            "agent_name": t.agent_name,
            "status": t.status,
            "started_at": t.started_at.isoformat() if t.started_at else None,
            "completed_at": t.completed_at.isoformat() if t.completed_at else None,
            "duration_ms": t.duration_ms,
            "error_message": t.error_message,
            "details": t.details
        }
        for t in telemetry_records
    ]


@router.post("/applications/{application_id}/retry")
def retry_failed_screening(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Idempotently retries screening pipeline for a failed or rejected application."""
    app = db.query(CandidateApplication).filter(CandidateApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application record not found")

    if current_user.role == UserRole.CANDIDATE and app.candidate_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    # Reset application status to RECEIVED
    app.status = ApplicationStatus.RECEIVED
    app.rejection_reason = None
    db.commit()

    # Re-dispatch worker task idempotently
    from app.workers.dispatcher import dispatch_screening_task
    dispatch_screening_task(app.id)

    return {
        "status": "RECEIVED",
        "message": f"Screening pipeline re-triggered for application #{app.id}.",
        "application_id": app.id
    }