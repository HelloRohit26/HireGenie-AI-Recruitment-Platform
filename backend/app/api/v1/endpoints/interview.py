"""Interview Invitation & Candidate Consent API Endpoints."""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.db.session import get_db
from app.models.models import (
    InterviewInvitation, InvitationStatus, CandidateApplication, ApplicationStatus,
    InterviewSession, SessionStatus
)
from app.core.logger import logger

router = APIRouter()


class RespondInvitationRequest(BaseModel):
    action: str  # "ACCEPT" or "DECLINE"
    notes: Optional[str] = None


class StartSessionRequest(BaseModel):
    token: str


class CompleteSessionRequest(BaseModel):
    transcript: Optional[list] = None
    notes: Optional[str] = None


class UpdateSessionStatusRequest(BaseModel):
    status: str


@router.get("/invitation/{token}")
def get_invitation_by_token(token: str, db: Session = Depends(get_db)):
    """Candidate Portal: Token-based secure access to interview invitation & preparation details.
    Transitions state INVITED -> VIEWED on first access.
    """
    invitation = db.query(InterviewInvitation).filter(InterviewInvitation.invitation_token == token).first()
    if not invitation:
        raise HTTPException(status_code=404, detail="Invalid or non-existent interview invitation token.")

    # Check if application was rejected
    if invitation.application and invitation.application.status == ApplicationStatus.REJECTED:
        raise HTTPException(status_code=403, detail="Access denied. Candidate application was not shortlisted.")

    # Expiry Check
    if invitation.expires_at and datetime.utcnow() > invitation.expires_at:
        if invitation.status != InvitationStatus.EXPIRED:
            invitation.status = InvitationStatus.EXPIRED
            db.commit()
        return {
            "status": "EXPIRED",
            "expired": True,
            "message": "This interview invitation has expired.",
            "job_title": invitation.job.title if invitation.job else "Position",
            "candidate_name": invitation.candidate.full_name if invitation.candidate else "Candidate"
        }

    # Transition state to VIEWED if currently INVITED
    if invitation.status == InvitationStatus.INVITED:
        invitation.status = InvitationStatus.VIEWED
        invitation.viewed_at = datetime.utcnow()
        db.commit()
        db.refresh(invitation)

    job = invitation.job
    candidate = invitation.candidate

    return {
        "token": invitation.invitation_token,
        "application_id": invitation.application_id,
        "job_id": invitation.job_id,
        "status": invitation.status.value,
        "candidate_name": candidate.full_name if candidate else "Candidate",
        "job_title": job.title if job else "Requisition",
        "company": (job.company if job and hasattr(job, "company") else None) or "HireGenie AI",
        "interview_mode": invitation.interview_mode or "WEBRTC",
        "duration_minutes": 15,
        "requirements": {
            "microphone_required": True,
            "camera_required": False,
            "quiet_environment": True,
            "browser_compatibility": "Google Chrome, Mozilla Firefox, Microsoft Edge, Apple Safari"
        },
        "privacy_notice": "Your audio responses will be processed securely for assessment purposes.",
        "created_at": invitation.created_at.isoformat() if invitation.created_at else None,
        "expires_at": invitation.expires_at.isoformat() if invitation.expires_at else None,
        "expired": False
    }


@router.post("/invitation/{token}/respond")
def respond_to_invitation(token: str, payload: RespondInvitationRequest, db: Session = Depends(get_db)):
    """Candidate Portal: Explicit candidate consent endpoint (ACCEPT or DECLINE).
    Accepting transitions invitation state to ACCEPTED/READY. Does NOT open WebRTC/mic automatically.
    """
    invitation = db.query(InterviewInvitation).filter(InterviewInvitation.invitation_token == token).first()
    if not invitation:
        raise HTTPException(status_code=404, detail="Interview invitation token not found.")

    if invitation.expires_at and datetime.utcnow() > invitation.expires_at:
        invitation.status = InvitationStatus.EXPIRED
        db.commit()
        raise HTTPException(status_code=400, detail="Interview invitation has expired.")

    action = payload.action.upper()
    app_record = invitation.application

    if action == "ACCEPT":
        invitation.status = InvitationStatus.READY
        invitation.accepted_at = datetime.utcnow()
        if app_record:
            app_record.status = ApplicationStatus.INTERVIEW_SCHEDULED
        db.commit()
        logger.info(f"✅ [INVITATION ACCEPTED] Candidate accepted invitation #{invitation.id} (App #{invitation.application_id}) -> READY")

        return {
            "status": "READY",
            "invitation_status": "ACCEPTED",
            "message": "Candidate consent recorded. You are ready to start the interview."
        }

    elif action == "DECLINE":
        invitation.status = InvitationStatus.DECLINED
        invitation.declined_at = datetime.utcnow()
        db.commit()
        logger.info(f"🚫 [INVITATION DECLINED] Candidate declined invitation #{invitation.id} (App #{invitation.application_id})")

        return {
            "status": "DECLINED",
            "invitation_status": "DECLINED",
            "message": "Interview invitation declined."
        }

    else:
        raise HTTPException(status_code=400, detail="Invalid action. Allowed: ACCEPT, DECLINE.")


@router.get("/invitation/application/{application_id}")
def get_invitation_by_application(application_id: int, db: Session = Depends(get_db)):
    """Fetch active invitation for a candidate application ID."""
    invitation = db.query(InterviewInvitation).filter(InterviewInvitation.application_id == application_id).first()
    if not invitation:
        return {"status": "NOT_INVITED", "has_invitation": False}

    return {
        "has_invitation": True,
        "id": invitation.id,
        "token": invitation.invitation_token,
        "status": invitation.status.value,
        "created_at": invitation.created_at.isoformat() if invitation.created_at else None,
        "expires_at": invitation.expires_at.isoformat() if invitation.expires_at else None
    }


# =====================================================================
# STEP 4 REAL-TIME VOICE AI INTERVIEW SESSION ENDPOINTS
# =====================================================================

@router.post("/session/start")
def start_interview_session(payload: StartSessionRequest, db: Session = Depends(get_db)):
    """Starts or recovers an interview session. Candidate must have invitation_status == READY.
    Prevents duplicate active sessions for the same invitation.
    """
    token = payload.token
    invitation = db.query(InterviewInvitation).filter(InterviewInvitation.invitation_token == token).first()
    if not invitation:
        raise HTTPException(status_code=404, detail="Invalid interview token.")

    # Requirement 1: Entry Condition check
    if invitation.status != InvitationStatus.READY:
        raise HTTPException(
            status_code=400,
            detail=f"Interview cannot start. Candidate invitation status is '{invitation.status.value}', expected 'READY'."
        )

    # Requirement 10: Check for existing active or previous session to prevent duplicates
    existing_session = db.query(InterviewSession).filter(
        (InterviewSession.session_token == token) | (InterviewSession.invitation_id == invitation.id)
    ).order_by(InterviewSession.created_at.desc()).first()

    if existing_session:
        logger.info(f"🔄 [EXISTING SESSION RECOVERED] Resuming session #{existing_session.id} for invitation #{invitation.id}")
        now = datetime.utcnow()
        started_at = existing_session.started_at or now
        elapsed = int((now - started_at).total_seconds())
        remaining = max(0, existing_session.max_duration_seconds - elapsed)

        return {
            "has_session": True,
            "session_id": existing_session.id,
            "session_token": existing_session.session_token,
            "status": existing_session.status.value,
            "started_at": started_at.isoformat(),
            "max_duration_seconds": existing_session.max_duration_seconds,
            "elapsed_seconds": elapsed,
            "remaining_seconds": remaining,
            "application_id": existing_session.application_id,
            "job_id": existing_session.job_id,
            "candidate_id": existing_session.candidate_id,
            "current_question_index": existing_session.current_question_index or 0,
            "reused": True
        }

    # Create new persisted interview session
    now = datetime.utcnow()
    new_session = InterviewSession(
        invitation_id=invitation.id,
        application_id=invitation.application_id,
        candidate_id=invitation.candidate_id,
        job_id=invitation.job_id,
        session_token=token,
        status=SessionStatus.IN_PROGRESS,
        started_at=now,
        max_duration_seconds=900,  # 15 minutes
        elapsed_seconds=0,
        current_question_index=0
    )
    db.add(new_session)

    # Update candidate application status
    app_record = invitation.application
    if app_record:
        app_record.status = ApplicationStatus.INTERVIEWING

    db.commit()
    db.refresh(new_session)

    logger.info(f"🎙️ [NEW SESSION STARTED] Created interview session #{new_session.id} for App #{invitation.application_id}")

    return {
        "has_session": True,
        "session_id": new_session.id,
        "session_token": new_session.session_token,
        "status": new_session.status.value,
        "started_at": now.isoformat(),
        "max_duration_seconds": 900,
        "elapsed_seconds": 0,
        "remaining_seconds": 900,
        "application_id": new_session.application_id,
        "job_id": new_session.job_id,
        "candidate_id": new_session.candidate_id,
        "current_question_index": 0,
        "reused": False
    }


@router.get("/session/{token}")
def get_interview_session(token: str, db: Session = Depends(get_db)):
    """Fetch active interview session state for recovery & candidate timer persistence."""
    invitation = db.query(InterviewInvitation).filter(InterviewInvitation.invitation_token == token).first()
    if not invitation:
        raise HTTPException(status_code=404, detail="Invalid interview token.")

    session = db.query(InterviewSession).filter(
        InterviewSession.invitation_id == invitation.id
    ).order_by(InterviewSession.created_at.desc()).first()

    if not session:
        return {
            "has_session": False,
            "invitation_status": invitation.status.value,
            "message": "No active interview session found for this invitation."
        }

    now = datetime.utcnow()
    started_at = session.started_at or now
    elapsed = int((now - started_at).total_seconds()) if session.status == SessionStatus.IN_PROGRESS else session.elapsed_seconds
    remaining = max(0, session.max_duration_seconds - elapsed)

    job = session.job
    candidate = session.candidate

    return {
        "has_session": True,
        "session_id": session.id,
        "session_token": session.session_token,
        "status": session.status.value,
        "started_at": session.started_at.isoformat() if session.started_at else None,
        "ended_at": session.ended_at.isoformat() if session.ended_at else None,
        "max_duration_seconds": session.max_duration_seconds,
        "elapsed_seconds": elapsed,
        "remaining_seconds": remaining,
        "current_question_index": session.current_question_index or 0,
        "transcript": session.transcript or [],
        "job_title": job.title if job else "Position",
        "candidate_name": candidate.full_name if candidate else "Candidate",
        "invitation_status": invitation.status.value
    }


@router.post("/session/{token}/complete")
def complete_interview_session(token: str, payload: Optional[CompleteSessionRequest] = None, db: Session = Depends(get_db)):
    """Candidate finishes interview. Stops tracks, updates session & application status to COMPLETED.
    Does NOT trigger post-interview evaluation agent yet (Step 5).
    """
    invitation = db.query(InterviewInvitation).filter(InterviewInvitation.invitation_token == token).first()
    if not invitation:
        raise HTTPException(status_code=404, detail="Invalid interview token.")

    session = db.query(InterviewSession).filter(
        InterviewSession.invitation_id == invitation.id
    ).order_by(InterviewSession.created_at.desc()).first()

    now = datetime.utcnow()

    if session:
        session.status = SessionStatus.COMPLETED
        session.ended_at = now
        if session.started_at:
            session.elapsed_seconds = int((now - session.started_at).total_seconds())
        if payload and payload.transcript:
            session.transcript = payload.transcript
    else:
        # Create a completed session record if missing
        session = InterviewSession(
            invitation_id=invitation.id,
            application_id=invitation.application_id,
            candidate_id=invitation.candidate_id,
            job_id=invitation.job_id,
            session_token=token,
            status=SessionStatus.COMPLETED,
            started_at=now,
            ended_at=now,
            transcript=payload.transcript if payload else None
        )
        db.add(session)

    # Update candidate application status to INTERVIEW_COMPLETED
    app_record = invitation.application
    if app_record:
        app_record.status = ApplicationStatus.INTERVIEW_COMPLETED

    db.commit()
    logger.info(f"🎉 [INTERVIEW COMPLETED] Session #{session.id} finished for App #{invitation.application_id}")

    # STEP 5: Automatically trigger Evaluation Agent asynchronously
    from app.services.evaluation_service import trigger_interview_evaluation_async
    eval_result = trigger_interview_evaluation_async(invitation.application_id, session.id)

    return {
        "status": "COMPLETED",
        "message": "Interview completed. Your responses have been submitted.",
        "session_id": session.id,
        "ended_at": now.isoformat(),
        "evaluation_pending": True,
        "evaluation_task": eval_result
    }


@router.post("/evaluation/{application_id}/retry")
def retry_evaluation_endpoint(application_id: int, db: Session = Depends(get_db)):
    """Recruiter Endpoint: Retries a failed evaluation for an application."""
    from app.services.evaluation_service import retry_interview_evaluation
    result = retry_interview_evaluation(db, application_id)
    if result.get("status") == "FAILED" and "not found" in result.get("error_message", "").lower():
        raise HTTPException(status_code=404, detail=result.get("error_message"))
    return result


@router.get("/evaluation/{application_id}")
def get_evaluation_endpoint(application_id: int, db: Session = Depends(get_db)):
    """Fetches evaluation status and details for an application."""
    from app.models.models import InterviewEvaluation
    eval_rec = db.query(InterviewEvaluation).filter(
        InterviewEvaluation.application_id == application_id
    ).order_by(InterviewEvaluation.created_at.desc()).first()

    if not eval_rec:
        return {"status": "NOT_STARTED", "message": "No evaluation available."}

    return {
        "id": eval_rec.id,
        "application_id": eval_rec.application_id,
        "status": eval_rec.status.value,
        "technical_score": eval_rec.technical_score,
        "problem_solving_score": eval_rec.problem_solving_score,
        "communication_score": eval_rec.communication_score,
        "role_fit_score": eval_rec.role_fit_score,
        "overall_score": eval_rec.overall_score,
        "recommendation": eval_rec.recommendation.value if eval_rec.recommendation else None,
        "strengths": eval_rec.strengths or [],
        "gaps": eval_rec.gaps or [],
        "evidence": eval_rec.evidence or [],
        "explanation": eval_rec.explanation,
        "error_message": eval_rec.error_message,
        "completed_at": eval_rec.completed_at.isoformat() if eval_rec.completed_at else None
    }


@router.post("/session/{token}/update-status")
def update_interview_session_status(token: str, payload: UpdateSessionStatusRequest, db: Session = Depends(get_db)):
    """Update interview session state (CONNECTING, IN_PROGRESS, PAUSED, FAILED)."""
    invitation = db.query(InterviewInvitation).filter(InterviewInvitation.invitation_token == token).first()
    if not invitation:
        raise HTTPException(status_code=404, detail="Invalid interview token.")

    session = db.query(InterviewSession).filter(
        InterviewSession.invitation_id == invitation.id
    ).order_by(InterviewSession.created_at.desc()).first()

    if not session:
        raise HTTPException(status_code=404, detail="Active interview session not found.")

    new_status = payload.status.upper()
    if new_status in SessionStatus.__members__:
        session.status = SessionStatus[new_status]
        db.commit()
        return {"status": session.status.value, "updated": True}
    else:
        raise HTTPException(status_code=400, detail=f"Invalid status '{payload.status}'.")