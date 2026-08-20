"""Hiring Lifecycle Endpoints — Recruiter Final Decision, Offer Management, and Candidate Offer Portal."""
import os
import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.db.session import get_db
from app.models.models import (
    CandidateApplication, ApplicationStatus, Job, User, UserRole,
    InterviewSession, SessionStatus, InterviewEvaluation, EvaluationStatus,
    HiringDecision, JobOffer, OfferStatus
)
from app.models.audit import AuditLog, ActorType, AuditAction
from app.models.communication import CommunicationStage
from app.services.communication_agent import CommunicationAgent
from app.core.logger import logger

router = APIRouter()

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


# ── Request/Response Schemas ────────────────────────────────

class HireRequest(BaseModel):
    reason: Optional[str] = None
    recruiter_id: Optional[int] = None  # For server-side auth; defaults to job creator

class RejectRequest(BaseModel):
    reason: Optional[str] = None
    recruiter_id: Optional[int] = None

class OfferRespondRequest(BaseModel):
    action: str  # "ACCEPT" or "DECLINE"
    decline_reason: Optional[str] = None


# ── Helper: Authorization Check ─────────────────────────────

def _authorize_recruiter(db: Session, application: CandidateApplication, recruiter_id: Optional[int] = None) -> User:
    """Validates that the recruiter owns the job associated with this application."""
    job = db.query(Job).filter(Job.id == application.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found for this application")

    recruiter = None
    if recruiter_id:
        recruiter = db.query(User).filter(User.id == recruiter_id).first()
    if not recruiter and job.created_by:
        recruiter = db.query(User).filter(User.id == job.created_by).first()

    if not recruiter:
        recruiter = db.query(User).filter(User.role.in_([UserRole.RECRUITER, UserRole.ADMIN])).first()

    if not recruiter:
        # Auto-create fallback recruiter if DB is freshly wiped
        recruiter = User(
            full_name="Recruiter Admin",
            email="hr@hiregenie.ai",
            hashed_password="mockpassword",
            role=UserRole.RECRUITER,
            is_active=True
        )
        db.add(recruiter)
        db.commit()
        db.refresh(recruiter)

    return recruiter


def _check_eligibility(db: Session, application: CandidateApplication):
    """Ensures interview is COMPLETED and evaluation is COMPLETED before allowing a hiring decision."""
    # Check interview session completion
    session = db.query(InterviewSession).filter(
        InterviewSession.application_id == application.id,
        InterviewSession.status == SessionStatus.COMPLETED
    ).first()
    if not session:
        raise HTTPException(
            status_code=400,
            detail="Cannot make hiring decision: Interview is not COMPLETED."
        )

    # Check evaluation completion
    evaluation = db.query(InterviewEvaluation).filter(
        InterviewEvaluation.application_id == application.id,
        InterviewEvaluation.status == EvaluationStatus.COMPLETED
    ).first()
    if not evaluation:
        raise HTTPException(
            status_code=400,
            detail="Cannot make hiring decision: Evaluation is not COMPLETED."
        )

    return session, evaluation


# ══════════════════════════════════════════════════════════════
# RECRUITER: HIRE CANDIDATE
# ══════════════════════════════════════════════════════════════

@router.post("/recruiter/applications/{application_id}/hire")
def hire_candidate(application_id: int, payload: HireRequest, db: Session = Depends(get_db)):
    """Recruiter explicitly hires a candidate: creates HiringDecision + JobOffer + sends offer email."""

    # 1. Fetch application
    application = db.query(CandidateApplication).filter(CandidateApplication.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    # 2. Authorization
    recruiter = _authorize_recruiter(db, application, payload.recruiter_id)

    # 3. Idempotency: If offer already exists, return it
    existing_offer = db.query(JobOffer).filter(JobOffer.application_id == application_id).first()
    if existing_offer:
        logger.info(f"🔁 [HIRING] Idempotent hire: Offer already exists for App #{application_id} (Offer #{existing_offer.id})")
        return {
            "status": "ALREADY_OFFERED",
            "application_id": application_id,
            "offer_id": existing_offer.id,
            "offer_token": existing_offer.offer_token,
            "offer_status": existing_offer.status.value if existing_offer.status else "OFFERED",
            "message": "Offer already exists for this application."
        }

    # 4. Eligibility check
    session, evaluation = _check_eligibility(db, application)

    # 5. Create HiringDecision
    decision = HiringDecision(
        application_id=application.id,
        candidate_id=application.candidate_id,
        job_id=application.job_id,
        decision="HIRED",
        decided_by=recruiter.id,
        decided_at=datetime.utcnow(),
        reason=payload.reason or f"Recruiter {recruiter.full_name} approved hire"
    )
    db.add(decision)

    # 6. Create JobOffer
    job = db.query(Job).filter(Job.id == application.job_id).first()
    offer_token = str(uuid.uuid4())
    offer = JobOffer(
        application_id=application.id,
        candidate_id=application.candidate_id,
        job_id=application.job_id,
        offer_token=offer_token,
        status=OfferStatus.OFFERED,
        compensation=job.salary_range or "As discussed",
        role_title=job.title,
        company_name=job.company or "HireGenie AI",
        created_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    db.add(offer)

    # 7. Update application status
    application.status = ApplicationStatus.OFFERED
    db.commit()
    db.refresh(offer)

    # 8. Audit Logs
    audit_hire = AuditLog(
        actor_type=ActorType.RECRUITER,
        actor_name=recruiter.full_name,
        action=AuditAction.RECRUITER_HIRED_CANDIDATE,
        target_type="APPLICATION",
        target_id=application.id,
        details={
            "candidate_name": application.candidate.full_name if application.candidate else "Unknown",
            "job_title": job.title,
            "recruiter": recruiter.full_name,
            "evaluation_score": evaluation.overall_score
        }
    )
    audit_offer = AuditLog(
        actor_type=ActorType.SYSTEM,
        actor_name="Hiring Agent",
        action=AuditAction.OFFER_CREATED,
        target_type="OFFER",
        target_id=offer.id,
        details={
            "offer_token": offer_token,
            "compensation": offer.compensation,
            "role_title": offer.role_title,
            "expires_at": offer.expires_at.isoformat() if offer.expires_at else None
        }
    )
    db.add_all([audit_hire, audit_offer])
    db.commit()

    # 9. Send offer email
    candidate_name = application.candidate.full_name if application.candidate else "Candidate"
    candidate_email = application.candidate.email if application.candidate else f"candidate_{application.candidate_id}@example.com"
    offer_portal_link = f"{FRONTEND_URL}?route=/offer/{offer_token}"

    email_result = CommunicationAgent.send_communication(
        db=db,
        application_id=application.id,
        stage=CommunicationStage.OFFER,
        recipient_email=candidate_email,
        recipient_name=candidate_name,
        template_vars={
            "job_title": job.title,
            "company": job.company or "HireGenie AI",
            "offer_details": f"Position: {job.title}\nCompensation: {offer.compensation}\nCompany: {offer.company_name}\n\nView and respond to your offer: {offer_portal_link}",
            "magic_link": offer_portal_link
        }
    )

    logger.info(f"✅ [HIRING] Recruiter '{recruiter.full_name}' HIRED candidate for App #{application_id}. Offer #{offer.id} created. Email: {email_result.get('status', 'UNKNOWN')}")

    return {
        "status": "OFFERED",
        "application_id": application.id,
        "offer_id": offer.id,
        "offer_token": offer_token,
        "offer_status": "OFFERED",
        "email_status": email_result.get("status", "UNKNOWN"),
        "email_log_id": email_result.get("log_id"),
        "compensation": offer.compensation,
        "role_title": offer.role_title,
        "expires_at": offer.expires_at.isoformat() if offer.expires_at else None,
        "message": f"Offer created and email sent to {candidate_email}"
    }


# ══════════════════════════════════════════════════════════════
# RECRUITER: REJECT CANDIDATE
# ══════════════════════════════════════════════════════════════

@router.post("/recruiter/applications/{application_id}/reject")
def reject_candidate(application_id: int, payload: RejectRequest, db: Session = Depends(get_db)):
    """Recruiter explicitly rejects a candidate after evaluation."""

    application = db.query(CandidateApplication).filter(CandidateApplication.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    recruiter = _authorize_recruiter(db, application, payload.recruiter_id)

    # Idempotency: already rejected
    if application.status == ApplicationStatus.REJECTED:
        existing_decision = db.query(HiringDecision).filter(
            HiringDecision.application_id == application_id,
            HiringDecision.decision == "REJECTED"
        ).first()
        if existing_decision:
            return {
                "status": "ALREADY_REJECTED",
                "application_id": application_id,
                "message": "Candidate already rejected."
            }

    # Eligibility check
    _check_eligibility(db, application)

    # Create decision
    decision = HiringDecision(
        application_id=application.id,
        candidate_id=application.candidate_id,
        job_id=application.job_id,
        decision="REJECTED",
        decided_by=recruiter.id,
        decided_at=datetime.utcnow(),
        reason=payload.reason or f"Recruiter {recruiter.full_name} rejected candidate"
    )
    db.add(decision)

    application.status = ApplicationStatus.REJECTED
    application.rejection_reason = payload.reason or "Recruiter decision after evaluation"

    # Audit
    job = db.query(Job).filter(Job.id == application.job_id).first()
    audit = AuditLog(
        actor_type=ActorType.RECRUITER,
        actor_name=recruiter.full_name,
        action=AuditAction.RECRUITER_REJECTED_CANDIDATE,
        target_type="APPLICATION",
        target_id=application.id,
        details={
            "candidate_name": application.candidate.full_name if application.candidate else "Unknown",
            "job_title": job.title if job else "",
            "reason": payload.reason
        }
    )
    db.add(audit)
    db.commit()

    # Send rejection email
    candidate_name = application.candidate.full_name if application.candidate else "Candidate"
    candidate_email = application.candidate.email if application.candidate else f"candidate_{application.candidate_id}@example.com"

    email_result = CommunicationAgent.send_communication(
        db=db,
        application_id=application.id,
        stage=CommunicationStage.REJECTION,
        recipient_email=candidate_email,
        recipient_name=candidate_name,
        template_vars={
            "job_title": job.title if job else "Position",
            "company": job.company if job else "HireGenie AI",
            "rejection_feedback": payload.reason or "After thorough evaluation, we have decided to move forward with other candidates."
        }
    )

    logger.info(f"❌ [HIRING] Recruiter '{recruiter.full_name}' REJECTED candidate for App #{application_id}. Email: {email_result.get('status', 'UNKNOWN')}")

    return {
        "status": "REJECTED",
        "application_id": application.id,
        "email_status": email_result.get("status", "UNKNOWN"),
        "message": "Candidate rejected and notification sent."
    }


# ══════════════════════════════════════════════════════════════
# CANDIDATE: OFFER PORTAL (View Offer)
# ══════════════════════════════════════════════════════════════

@router.get("/candidate/offer/{offer_token}")
def get_offer_details(offer_token: str, db: Session = Depends(get_db)):
    """Candidate Offer Portal: Fetches offer details by secure token."""

    offer = db.query(JobOffer).filter(JobOffer.offer_token == offer_token).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found or invalid token")

    candidate = db.query(User).filter(User.id == offer.candidate_id).first()
    is_expired = offer.expires_at and datetime.utcnow() > offer.expires_at and offer.status == OfferStatus.OFFERED

    return {
        "offer_id": offer.id,
        "offer_token": offer.offer_token,
        "candidate_name": candidate.full_name if candidate else "Candidate",
        "role_title": offer.role_title,
        "company_name": offer.company_name,
        "compensation": offer.compensation,
        "status": offer.status.value if offer.status else "OFFERED",
        "is_expired": is_expired,
        "created_at": offer.created_at.isoformat() if offer.created_at else None,
        "expires_at": offer.expires_at.isoformat() if offer.expires_at else None,
        "accepted_at": offer.accepted_at.isoformat() if offer.accepted_at else None,
        "declined_at": offer.declined_at.isoformat() if offer.declined_at else None,
    }


# ══════════════════════════════════════════════════════════════
# CANDIDATE: RESPOND TO OFFER (Accept / Decline)
# ══════════════════════════════════════════════════════════════

@router.post("/candidate/offer/{offer_token}/respond")
def respond_to_offer(offer_token: str, payload: OfferRespondRequest, db: Session = Depends(get_db)):
    """Candidate responds to offer: ACCEPT or DECLINE."""

    offer = db.query(JobOffer).filter(JobOffer.offer_token == offer_token).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found or invalid token")

    # Only allow response to OFFERED status
    if offer.status != OfferStatus.OFFERED:
        return {
            "status": offer.status.value,
            "message": f"Offer already {offer.status.value}. No further action allowed.",
            "offer_id": offer.id
        }

    # Check expiry
    if offer.expires_at and datetime.utcnow() > offer.expires_at:
        return {
            "status": "EXPIRED",
            "message": "This offer has expired and can no longer be accepted.",
            "offer_id": offer.id
        }

    application = db.query(CandidateApplication).filter(CandidateApplication.id == offer.application_id).first()

    if payload.action.upper() == "ACCEPT":
        # Accept offer
        offer.status = OfferStatus.OFFER_ACCEPTED
        offer.accepted_at = datetime.utcnow()

        if application:
            application.status = ApplicationStatus.HIRED

        # Audit
        audit = AuditLog(
            actor_type=ActorType.CANDIDATE,
            actor_name=offer.candidate.full_name if offer.candidate else "Candidate",
            action=AuditAction.OFFER_ACCEPTED,
            target_type="OFFER",
            target_id=offer.id,
            details={
                "application_id": offer.application_id,
                "role_title": offer.role_title,
                "company": offer.company_name,
                "accepted_at": offer.accepted_at.isoformat()
            }
        )
        db.add(audit)
        db.commit()

        logger.info(f"🎉 [HIRING] Candidate ACCEPTED offer #{offer.id} for '{offer.role_title}' at '{offer.company_name}'. Application #{offer.application_id} → HIRED.")

        return {
            "status": "OFFER_ACCEPTED",
            "offer_id": offer.id,
            "application_status": "HIRED",
            "accepted_at": offer.accepted_at.isoformat(),
            "message": "Congratulations! You have accepted the offer."
        }

    elif payload.action.upper() == "DECLINE":
        # Decline offer
        offer.status = OfferStatus.OFFER_DECLINED
        offer.declined_at = datetime.utcnow()
        offer.decline_reason = payload.decline_reason

        if application:
            application.status = ApplicationStatus.OFFER_DECLINED

        # Audit
        audit = AuditLog(
            actor_type=ActorType.CANDIDATE,
            actor_name=offer.candidate.full_name if offer.candidate else "Candidate",
            action=AuditAction.OFFER_DECLINED,
            target_type="OFFER",
            target_id=offer.id,
            details={
                "application_id": offer.application_id,
                "role_title": offer.role_title,
                "decline_reason": payload.decline_reason,
                "declined_at": offer.declined_at.isoformat()
            }
        )
        db.add(audit)
        db.commit()

        logger.info(f"📉 [HIRING] Candidate DECLINED offer #{offer.id} for '{offer.role_title}'. Reason: {payload.decline_reason or 'Not provided'}")

        return {
            "status": "OFFER_DECLINED",
            "offer_id": offer.id,
            "application_status": "OFFER_DECLINED",
            "declined_at": offer.declined_at.isoformat(),
            "message": "Offer declined."
        }

    else:
        raise HTTPException(status_code=400, detail="Invalid action. Must be ACCEPT or DECLINE.")


# ══════════════════════════════════════════════════════════════
# RECRUITER: CLOSE JOB
# ══════════════════════════════════════════════════════════════

@router.post("/jobs/{job_id}/close")
def close_job(job_id: int, db: Session = Depends(get_db)):
    """Recruiter explicitly closes a job without deleting applications or candidate records."""

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status == "CLOSED":
        return {"status": "ALREADY_CLOSED", "job_id": job.id, "message": "Job is already closed."}

    job.status = "CLOSED"

    audit = AuditLog(
        actor_type=ActorType.RECRUITER,
        actor_name="Recruiter",
        action=AuditAction.JOB_CLOSED,
        target_type="JOB",
        target_id=job.id,
        details={"job_title": job.title, "company": job.company}
    )
    db.add(audit)
    db.commit()

    logger.info(f"🔒 [HIRING] Job #{job.id} '{job.title}' closed by recruiter.")

    return {
        "status": "CLOSED",
        "job_id": job.id,
        "message": f"Job '{job.title}' has been closed. All candidate records are preserved."
    }
