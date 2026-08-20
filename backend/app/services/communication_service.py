"""Communication Service helper for triggering email jobs from background tasks."""
from sqlalchemy.orm import Session
from app.models.models import CandidateApplication, Job
from app.models.communication import CommunicationStage
from app.services.communication_agent import CommunicationAgent


def send_candidate_email_job(db: Session, application: CandidateApplication, job: Job, candidate_name: str, invitation_token: str = None):
    """Sends email notification job when candidate is shortlisted or updated."""
    token_val = invitation_token
    if not token_val and hasattr(application, "invitations") and application.invitations:
        token_val = application.invitations[0].invitation_token

    recipient_email = application.candidate.email if (application.candidate and application.candidate.email) else f"candidate_{application.candidate_id}@example.com"

    return CommunicationAgent.send_communication(
        db=db,
        application_id=application.id,
        stage=CommunicationStage.SHORTLISTED,
        recipient_email=recipient_email,
        recipient_name=candidate_name,
        template_vars={
            "job_title": job.title,
            "company": job.company or "HireGenie AI",
            "match_score": application.overall_match_score or 90.0,
            "invitation_token": token_val or "invitation_token",
            "magic_link": f"{CommunicationAgent.FRONTEND_URL}/interview/{token_val}/prep" if token_val else f"{CommunicationAgent.FRONTEND_URL}/candidate/applications"
        }
    )
