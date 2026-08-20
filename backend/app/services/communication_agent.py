"""Communication Agent Service — handles personalized emails for every hiring stage."""
import os
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.communication import CommunicationLog, CommunicationStage, CommunicationChannel, DeliveryStatus
from app.core.logger import logger


class CommunicationAgent:
    """Dedicated agent for sending personalized communications at every hiring stage."""

    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # ── Email Templates ──────────────────────────────────────────────

    TEMPLATES = {
        CommunicationStage.APPLICATION_RECEIVED: {
            "subject": "Application Received — {job_title}",
            "body": """Dear {candidate_name},

Thank you for applying for the position of {job_title} at {company}.

We have received your application and our AI-powered screening system is currently reviewing your profile. You will be notified of the next steps shortly.

Application ID: {application_id}
Track your application: {frontend_url}/track/{application_id}

Best regards,
HireGenie AI Recruitment Team""",
        },
        CommunicationStage.SHORTLISTED: {
            "subject": "🎉 Congratulations! You've been shortlisted — {job_title}",
            "body": """Dear {candidate_name},

Great news! Your profile has been shortlisted for the position of {job_title} at {company}.

Your Match Score: {match_score}%

Our AI screening system found your profile to be an excellent match. The next step is an AI-powered voice interview.

Prepare for your AI Voice Interview here: {magic_link}

Best regards,
HireGenie AI Recruitment Team""",
        },
        CommunicationStage.INTERVIEW_INVITATION: {
            "subject": "📅 Interview Invitation — {job_title}",
            "body": """Dear {candidate_name},

Your AI Voice Interview for {job_title} has been scheduled.

Interview Details:
• Date & Time: {interview_datetime}
• Duration: 15 minutes
• Mode: {interview_mode}
• Interview Link: {magic_link}

Please ensure you are in a quiet environment with microphone access.

Need to reschedule? Click here: {reschedule_link}

Best regards,
HireGenie AI Recruitment Team""",
        },
        CommunicationStage.INTERVIEW_REMINDER: {
            "subject": "⏰ Interview Reminder — {job_title} (in 1 hour)",
            "body": """Dear {candidate_name},

This is a friendly reminder that your AI Voice Interview for {job_title} is scheduled in 1 hour.

Interview Link: {magic_link}

Tips for success:
• Use a quiet room with good internet
• Have your resume handy for reference
• Be ready to discuss your projects and experience

Good luck!

HireGenie AI Recruitment Team""",
        },
        CommunicationStage.INTERVIEW_COMPLETED: {
            "subject": "✅ Interview Completed — {job_title}",
            "body": """Dear {candidate_name},

Thank you for completing your AI Voice Interview for {job_title}.

Your responses are being evaluated by our AI assessment system. The hiring team will review the results and you will be notified of their decision.

Track your application status: {frontend_url}/track/{application_id}

Best regards,
HireGenie AI Recruitment Team""",
        },
        CommunicationStage.HR_DECISION: {
            "subject": "Update on your application — {job_title}",
            "body": """Dear {candidate_name},

The hiring team has reviewed your application and interview performance for {job_title}.

Decision: {hr_decision}

{decision_details}

Best regards,
HireGenie AI Recruitment Team""",
        },
        CommunicationStage.OFFER: {
            "subject": "🎉 Offer Letter — {job_title} at {company}",
            "body": """Dear {candidate_name},

Congratulations! We are thrilled to extend an offer for the position of {job_title} at {company}.

{offer_details}

Please review the offer and respond at your earliest convenience.

We are excited to potentially have you join our team!

Best regards,
HireGenie AI Recruitment Team""",
        },
        CommunicationStage.REJECTION: {
            "subject": "Application Update — {job_title}",
            "body": """Dear {candidate_name},

Thank you for your interest in the {job_title} position at {company} and for taking the time to apply.

After careful review, we have decided to move forward with other candidates whose profiles more closely match our current requirements.

{rejection_feedback}

We encourage you to apply for future openings that match your skills and experience.

Best regards,
HireGenie AI Recruitment Team""",
        },
        CommunicationStage.TEST_EMAIL: {
            "subject": "🧪 Test Email — HireGenie AI ({job_title})",
            "body": """Dear {candidate_name},

This is a test email dispatched from HireGenie AI Autonomous Recruitment Platform.

Configuration Telemetry:
• Environment: Active Provider Test
• Target Role: {job_title}
• Organization: {company}
• Test Timestamp: {test_timestamp}

If you received this message, your email provider configuration is working correctly!

Best regards,
HireGenie AI Engineering Team""",
        },
    }

    @staticmethod
    def send_communication(
        db: Session,
        application_id: Optional[int],
        stage: CommunicationStage,
        recipient_email: str,
        recipient_name: str,
        template_vars: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Send personalized communication for a given stage with idempotency check & live telemetry."""
        
        # 1. IDEMPOTENCY CHECK: Do not send duplicate emails for the same application & production stage.
        # Test emails (stage == TEST_EMAIL or application_id is None) always bypass production idempotency.
        if application_id is not None and stage != CommunicationStage.TEST_EMAIL:
            existing_sent_log = (
                db.query(CommunicationLog)
                .filter(
                    CommunicationLog.application_id == application_id,
                    CommunicationLog.stage == stage
                )
                .first()
            )
            if existing_sent_log:
                logger.info(f"🔁 [COMM AGENT] Skipped duplicate email for App #{application_id} ({stage.value}) — log #{existing_sent_log.id} already exists")
                return {
                    "status": "SKIPPED_DUPLICATE",
                    "log_id": existing_sent_log.id,
                    "stage": stage.value,
                    "recipient": recipient_email,
                    "message": "Email log already exists for this application and stage."
                }

        template = CommunicationAgent.TEMPLATES.get(stage)
        if not template:
            return {"status": "ERROR", "message": f"No template for stage {stage.value}"}

        # Fill template variables
        vars_with_defaults = {
            "frontend_url": CommunicationAgent.FRONTEND_URL,
            "candidate_name": recipient_name,
            "application_id": application_id or "N/A",
            "company": "HireGenie AI",
            "job_title": "Position",
            "match_score": 90.0,
            "test_timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            "interview_datetime": "Tomorrow at 10:00 AM",
            "interview_mode": "AI Voice Assessment",
            "magic_link": f"{CommunicationAgent.FRONTEND_URL}/candidate/interview?app={application_id or 1}",
            "reschedule_link": f"{CommunicationAgent.FRONTEND_URL}/candidate/reschedule?app={application_id or 1}",
            "hr_decision": "Shortlisted",
            "decision_details": "Congratulations on progressing to the next stage.",
            "offer_details": "Your official offer details will be available in the portal.",
            "rejection_feedback": "Thank you for applying.",
            **template_vars,
        }

        try:
            subject = template["subject"].format(**vars_with_defaults)
            body = template["body"].format(**vars_with_defaults)
        except KeyError as e:
            subject = template["subject"]
            body = template["body"]
            logger.warning(f"Template variable missing: {e}")

        # 2. LOG QUEUED STATE (Persisted BEFORE queueing durable task)
        comm_log = CommunicationLog(
            application_id=application_id,
            stage=stage,
            channel=CommunicationChannel.EMAIL,
            recipient_email=recipient_email,
            recipient_name=recipient_name,
            subject=subject,
            body=body,
            template_used=stage.value,
            delivery_status=DeliveryStatus.QUEUED,
            sent_at=None,
            error_message=None,
        )
        db.add(comm_log)
        db.commit()
        db.refresh(comm_log)

        # 3. DISPATCH DURABLE EMAIL TASK TO CELERY WORKER
        from app.workers.dispatcher import dispatch_email_task
        dispatch_email_task(comm_log.id)

        # Re-query log to reflect eager/worker updated state
        db.refresh(comm_log)

        return {
            "status": comm_log.delivery_status.value,
            "log_id": comm_log.id,
            "stage": stage.value,
            "recipient": recipient_email,
            "subject": subject,
            "error": comm_log.error_message,
            "provider_status": comm_log.delivery_status.value
        }

    @staticmethod
    def get_communication_timeline(db: Session, application_id: int):
        """Get full communication history for an application."""
        logs = (
            db.query(CommunicationLog)
            .filter(CommunicationLog.application_id == application_id)
            .order_by(CommunicationLog.created_at)
            .all()
        )

        return [
            {
                "id": log.id,
                "stage": log.stage.value if log.stage else "UNKNOWN",
                "channel": log.channel.value if log.channel else "EMAIL",
                "subject": log.subject,
                "delivery_status": log.delivery_status.value if log.delivery_status else "UNKNOWN",
                "sent_at": log.sent_at.isoformat() if log.sent_at else None,
                "created_at": log.created_at.isoformat() if log.created_at else None,
            }
            for log in logs
        ]

    @staticmethod
    def get_all_templates():
        """Return available communication templates."""
        return [
            {
                "stage": stage.value,
                "subject_template": template["subject"],
                "has_body": True,
            }
            for stage, template in CommunicationAgent.TEMPLATES.items()
        ]
