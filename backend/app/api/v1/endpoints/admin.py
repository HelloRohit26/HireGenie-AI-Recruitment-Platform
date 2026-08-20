from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import (
    CandidateApplication, ScreeningAnswer, Interview, Job, User, Resume, UserRole,
    InterviewInvitation, InterviewSession, InterviewEvaluation, JobOffer, HiringDecision,
    AgentTelemetry
)
from app.models.audit import AuditLog
from app.models.communication import CommunicationLog
from app.models.explainability import AIExplanation, RecruiterOverride
from app.models.fairness import FairnessReport, BiasFlag
from app.models.failure_queue import FailedTask
from app.models.scheduling import InterviewSchedule

router = APIRouter()


@router.delete("/clean-database")
@router.post("/clean-fake-data")
def clean_fake_data(db: Session = Depends(get_db)):
    """
    Administrative Endpoint:
    Wipes test candidate applications, screening answers, interview sessions, offers, and test records in correct FK dependency order.
    """
    try:
        db.query(JobOffer).delete()
        db.query(HiringDecision).delete()
        db.query(InterviewEvaluation).delete()
        db.query(InterviewSession).delete()
        db.query(InterviewInvitation).delete()
        db.query(ScreeningAnswer).delete()
        db.query(InterviewSchedule).delete()
        db.query(AgentTelemetry).delete()
        db.query(AIExplanation).delete()
        db.query(RecruiterOverride).delete()
        db.query(BiasFlag).delete()
        db.query(FairnessReport).delete()
        db.query(FailedTask).delete()
        db.query(Interview).delete()
        db.query(CommunicationLog).delete()
        db.query(AuditLog).delete()
        db.query(CandidateApplication).delete()
        db.query(Resume).delete()
        # Delete test candidate users (keep seeded admin & recruiter)
        db.query(User).filter(User.role == UserRole.CANDIDATE).delete()
        # Delete non-seed jobs if any
        db.query(Job).filter(Job.title == "Senior ML Engineer").delete()

        db.commit()
        return {
            "status": "SUCCESS",
            "message": "Database cleaned successfully for E2E testing."
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clean test data: {str(e)}"
        )
