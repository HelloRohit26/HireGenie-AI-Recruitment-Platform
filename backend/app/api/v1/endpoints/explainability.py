"""Explainability API — AI explanations and recruiter overrides."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.db.session import get_db
from app.models.models import CandidateApplication
from app.models.explainability import AIExplanation, RecruiterOverride, ExplanationType
from app.services.audit_service import AuditService
from app.models.audit import ActorType, AuditAction

router = APIRouter()


class OverrideRequest(BaseModel):
    original_decision: str
    override_to: str
    reason: str
    overridden_by: int  # recruiter user_id


@router.get("/{application_id}")
def get_ai_explanation(application_id: int, db: Session = Depends(get_db)):
    """Get full AI explanation for a candidate application."""
    application = db.query(CandidateApplication).filter(
        CandidateApplication.id == application_id
    ).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    explanations = (
        db.query(AIExplanation)
        .filter(AIExplanation.application_id == application_id)
        .order_by(AIExplanation.created_at.desc())
        .all()
    )

    overrides = (
        db.query(RecruiterOverride)
        .filter(RecruiterOverride.application_id == application_id)
        .order_by(RecruiterOverride.created_at.desc())
        .all()
    )

    return {
        "application_id": application_id,
        "candidate_name": application.candidate.full_name if application.candidate else "Unknown",
        "current_status": application.status.value if application.status else "UNKNOWN",
        "overall_score": application.overall_match_score,
        "score_breakdown": application.score_breakdown,
        "explanations": [
            {
                "id": e.id,
                "type": e.explanation_type.value if e.explanation_type else "UNKNOWN",
                "matched_skills": e.matched_skills or [],
                "missing_skills": e.missing_skills or [],
                "strengths": e.strengths or [],
                "weaknesses": e.weaknesses or [],
                "reasoning": e.reasoning,
                "confidence": e.confidence,
                "score_breakdown": e.score_breakdown,
                "created_at": e.created_at.isoformat() if e.created_at else None,
            }
            for e in explanations
        ],
        "overrides": [
            {
                "id": o.id,
                "original_decision": o.original_decision,
                "overridden_to": o.overridden_to,
                "reason": o.override_reason,
                "overridden_by": o.overridden_by,
                "created_at": o.created_at.isoformat() if o.created_at else None,
            }
            for o in overrides
        ],
    }


@router.post("/override/{application_id}")
def override_ai_decision(
    application_id: int,
    payload: OverrideRequest,
    db: Session = Depends(get_db),
):
    """Recruiter manually overrides AI decision."""
    application = db.query(CandidateApplication).filter(
        CandidateApplication.id == application_id
    ).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    # Save override record
    override = RecruiterOverride(
        application_id=application_id,
        original_decision=payload.original_decision,
        overridden_to=payload.override_to,
        override_reason=payload.reason,
        overridden_by=payload.overridden_by,
    )
    db.add(override)

    # Update application status
    status_map = {
        "SHORTLISTED": "SHORTLISTED",
        "REJECTED": "REJECTED",
        "MANUAL_REVIEW": "SCREENING",
        "HR_APPROVED": "HR_APPROVED",
    }
    from app.models.models import ApplicationStatus as AppStatus
    new_status = status_map.get(payload.override_to, payload.override_to)
    try:
        application.status = AppStatus(new_status)
    except ValueError:
        pass  # Keep current status if invalid

    # Audit log
    AuditService.log_no_commit(
        db,
        actor_type=ActorType.RECRUITER,
        actor_name=f"Recruiter #{payload.overridden_by}",
        action=AuditAction.DECISION_OVERRIDDEN,
        target_type="APPLICATION",
        target_id=application_id,
        details={
            "original": payload.original_decision,
            "overridden_to": payload.override_to,
            "reason": payload.reason,
        },
    )

    db.commit()

    return {
        "status": "OVERRIDDEN",
        "application_id": application_id,
        "new_decision": payload.override_to,
        "override_id": override.id,
    }


@router.get("/overrides/all")
def get_all_overrides(db: Session = Depends(get_db)):
    """List all recruiter overrides for audit purposes."""
    overrides = db.query(RecruiterOverride).order_by(RecruiterOverride.created_at.desc()).limit(100).all()
    return {
        "total": len(overrides),
        "overrides": [
            {
                "id": o.id,
                "application_id": o.application_id,
                "original_decision": o.original_decision,
                "overridden_to": o.overridden_to,
                "reason": o.override_reason,
                "overridden_by": o.overridden_by,
                "created_at": o.created_at.isoformat() if o.created_at else None,
            }
            for o in overrides
        ],
    }
