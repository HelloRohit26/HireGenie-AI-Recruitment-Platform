"""Communication API — multi-stage email pipeline and communication timeline."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict, Any

from app.db.session import get_db
from app.models.models import CandidateApplication
from app.models.communication import CommunicationStage
from app.services.communication_agent import CommunicationAgent

router = APIRouter()


class SendCommunicationRequest(BaseModel):
    application_id: int
    stage: str  # One of CommunicationStage values
    template_vars: Dict[str, Any] = {}


@router.post("/send")
def send_communication(payload: SendCommunicationRequest, db: Session = Depends(get_db)):
    """Manually trigger communication for a specific stage."""
    application = db.query(CandidateApplication).filter(
        CandidateApplication.id == payload.application_id
    ).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    try:
        stage = CommunicationStage(payload.stage)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid stage. Valid: {[s.value for s in CommunicationStage]}",
        )

    candidate = application.candidate
    result = CommunicationAgent.send_communication(
        db=db,
        application_id=payload.application_id,
        stage=stage,
        recipient_email=candidate.email if candidate else "unknown@email.com",
        recipient_name=candidate.full_name if candidate else "Candidate",
        template_vars={
            "job_title": application.job.title if application.job else "Position",
            "company": application.job.company if application.job else "Company",
            "match_score": application.overall_match_score or 0,
            **payload.template_vars,
        },
    )

    return result


@router.get("/log/{application_id}")
def get_communication_log(application_id: int, db: Session = Depends(get_db)):
    """Get full communication timeline for an application."""
    timeline = CommunicationAgent.get_communication_timeline(db, application_id)
    return {
        "application_id": application_id,
        "total_communications": len(timeline),
        "timeline": timeline,
    }


@router.get("/templates")
def list_templates():
    """List all available communication templates."""
    return {"templates": CommunicationAgent.get_all_templates()}


@router.get("/status")
def get_provider_status():
    """Exposes email delivery provider status telemetry."""
    from app.services.email_provider import get_email_provider_status
    return get_email_provider_status()


class TestEmailRequest(BaseModel):
    recipient_email: str = "test_candidate@example.com"
    job_title: Optional[str] = "AI Engineer"


@router.post("/test-email")
def test_email_delivery(payload: TestEmailRequest, db: Session = Depends(get_db)):
    """Development Endpoint: Test email delivery and verify provider configuration."""
    from app.services.email_provider import get_email_provider_status
    status_info = get_email_provider_status()

    result = CommunicationAgent.send_communication(
        db=db,
        application_id=None,
        stage=CommunicationStage.TEST_EMAIL,
        recipient_email=payload.recipient_email,
        recipient_name="Test Candidate User",
        template_vars={
            "job_title": payload.job_title or "AI Engineer",
            "company": "HireGenie AI Test Labs",
            "match_score": 92.5
        }
    )

    return {
        "provider_configuration": status_info,
        "dispatch_result": result
    }

