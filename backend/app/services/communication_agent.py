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

    # ── Email Plain-Text Templates ───────────────────────────────────

    TEMPLATES = {
        CommunicationStage.APPLICATION_RECEIVED: {
            "subject": "Application Received: {job_title} at {company}",
            "body": """Hi {candidate_name},

Thank you for applying for the position of {job_title} at {company}.

Our talent intelligence system and hiring team are currently reviewing your profile against the role requirements. We will update you within 4–6 hours with the next steps.

Application Details:
• Candidate: {candidate_name}
• Requisition ID: #{application_id}
• Position: {job_title}
• Company: {company}

Track your application status anytime: {frontend_url}/candidate/applications

Best regards,
{company} Hiring Team & HireGenie AI""",
        },
        CommunicationStage.SHORTLISTED: {
            "subject": "🎉 Congratulations! You're invited to the Next Round for {job_title}",
            "body": """Hi {candidate_name},

Great news! Your profile stood out, and our technical hiring panel has shortlisted you for the next round for {job_title} at {company}.

Evaluation Match Score: {match_score}%

The next step is an autonomous, two-way AI Voice & Technical Assessment (15 minutes). You can choose any convenient time slot over the next 48 hours.

👉 Schedule your AI Voice Interview here:
{schedule_link}

Best regards,
{company} Talent Acquisition & HireGenie AI""",
        },
        CommunicationStage.INTERVIEW_INVITATION: {
            "subject": "Confirmed: AI Voice Interview for {job_title} on {interview_datetime}",
            "body": """Hi {candidate_name},

Your AI Technical Voice Assessment for {job_title} at {company} has been confirmed.

Interview Details:
• Scheduled Date & Time: {interview_datetime}
• Duration: 15 minutes
• Format: Autonomous AI Voice Assessment
• Direct Room Link: {magic_link}
• Google Calendar Invite: {calendar_link}

Preparation Checklist:
✓ Quiet environment with stable internet
✓ Microphone access enabled in your browser
✓ Be ready to discuss your architecture, projects, and skills

Need to reschedule? Click here: {schedule_link}

Best regards,
{company} Assessment Team & HireGenie AI""",
        },
        CommunicationStage.INTERVIEW_REMINDER: {
            "subject": "⏰ Reminder: Your AI Voice Interview for {job_title} starts in 1 hour",
            "body": """Hi {candidate_name},

This is a reminder that your AI Voice Interview for {job_title} at {company} is starting in 1 hour.

👉 Join Interview Room: {magic_link}

Tips for success:
• Ensure microphone permissions are active
• Test audio in the prep room
• Speak naturally or type responses

Good luck!
{company} Hiring Team & HireGenie AI""",
        },
        CommunicationStage.INTERVIEW_COMPLETED: {
            "subject": "Interview Completed: {job_title} Assessment — Next Steps",
            "body": """Hi {candidate_name},

Thank you for completing your AI Voice Assessment for {job_title} with HireGenie AI.

Your spoken responses, technical answers, and conversational metrics have been processed and submitted to the hiring panel for final evaluation.

We will notify you of the outcome within 24–48 hours.

Track application status: {frontend_url}/candidate/applications

Best regards,
{company} Hiring Panel & HireGenie AI""",
        },
        CommunicationStage.HR_DECISION: {
            "subject": "Update regarding your application for {job_title} at {company}",
            "body": """Hi {candidate_name},

The hiring panel has reviewed your technical voice assessment and interview scorecard for {job_title}.

Status: {hr_decision}
{decision_details}

Track your status: {frontend_url}/candidate/applications

Best regards,
{company} Hiring Team & HireGenie AI""",
        },
        CommunicationStage.OFFER: {
            "subject": "🎉 Official Offer: {job_title} at {company}",
            "body": """Dear {candidate_name},

Congratulations! We are delighted to formally extend an offer for the position of {job_title} at {company}.

{offer_details}

Review your offer letter and next steps in the candidate portal: {frontend_url}/candidate/applications

We look forward to welcoming you to our team!

Best regards,
{company} Leadership Team""",
        },
        CommunicationStage.REJECTION: {
            "subject": "Update regarding your application for {job_title}",
            "body": """Hi {candidate_name},

Thank you for your interest in {company} and for taking the time to apply for the {job_title} role.

After thorough evaluation, we have decided to proceed with other candidates whose current skill profile more closely matches this specific position.

{rejection_feedback}

We were genuinely impressed with your background and will retain your profile in our talent pool for future openings that match your expertise.

Best regards,
{company} Talent Team & HireGenie AI""",
        },
        CommunicationStage.TEST_EMAIL: {
            "subject": "🧪 Test Email — HireGenie AI ({job_title})",
            "body": """Hi {candidate_name},

This is a test notification from HireGenie AI.

Configuration Telemetry:
• Environment: Active Provider Test
• Target Role: {job_title}
• Company: {company}
• Test Timestamp: {test_timestamp}

Best regards,
HireGenie AI Engineering Team""",
        },
    }

    @staticmethod
    def generate_html_email(stage: CommunicationStage, vars: Dict[str, Any]) -> str:
        """Generates an ultra-premium executive dark-luxe HTML email template."""
        candidate_name = vars.get("candidate_name", "Candidate")
        job_title = vars.get("job_title", "Technical Position")
        company = vars.get("company", "HireGenie AI")
        app_id = vars.get("application_id", "N/A")
        frontend_url = vars.get("frontend_url", CommunicationAgent.FRONTEND_URL)
        schedule_link = vars.get("schedule_link", f"{frontend_url}/candidate/applications")
        magic_link = vars.get("magic_link", schedule_link)
        match_score = vars.get("match_score", 90.0)
        interview_datetime = vars.get("interview_datetime", "Tomorrow at 4:00 PM")
        calendar_link = vars.get("calendar_link", magic_link)

        # Stage specific content blocks
        hero_title = "Application Update"
        hero_badge = "REQUISITION UPDATE"
        hero_color = "#6366F1"
        action_button_text = "View Application Portal"
        action_button_url = f"{frontend_url}/candidate/applications"
        body_content = ""

        if stage == CommunicationStage.APPLICATION_RECEIVED:
            hero_title = "Application Received"
            hero_badge = "ACKNOWLEDGEMENT"
            hero_color = "#10B981"
            action_button_text = "Track Application Status"
            action_button_url = f"{frontend_url}/candidate/applications"
            body_content = f"""
                <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #E2E8F0;">
                    Hi <strong>{candidate_name}</strong>, thank you for applying for <strong>{job_title}</strong> at <strong>{company}</strong>.
                </p>
                <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #94A3B8;">
                    Our talent intelligence system and hiring team are reviewing your profile against the technical competencies. You will receive an update on the next steps within <strong>4–6 hours</strong>.
                </p>
                <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid #334155; border-radius: 12px; padding: 16px; margin: 20px 0;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #CBD5E1;">
                        <tr><td style="padding: 6px 0; color: #64748B;">Requisition ID:</td><td style="font-weight: 600; text-align: right; color: #F8FAFC;">#{app_id}</td></tr>
                        <tr><td style="padding: 6px 0; color: #64748B;">Target Role:</td><td style="font-weight: 600; text-align: right; color: #F8FAFC;">{job_title}</td></tr>
                        <tr><td style="padding: 6px 0; color: #64748B;">Hiring Company:</td><td style="font-weight: 600; text-align: right; color: #F8FAFC;">{company}</td></tr>
                        <tr><td style="padding: 6px 0; color: #64748B;">Status:</td><td style="font-weight: 600; text-align: right; color: #10B981;">Under Review</td></tr>
                    </table>
                </div>
            """

        elif stage == CommunicationStage.SHORTLISTED:
            hero_title = "You've Been Shortlisted!"
            hero_badge = "ROUND 2 INVITATION"
            hero_color = "#6366F1"
            action_button_text = "📅 Schedule Your AI Interview"
            action_button_url = schedule_link
            body_content = f"""
                <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #E2E8F0;">
                    Hi <strong>{candidate_name}</strong>, congratulations! Your background stood out, and the hiring panel for <strong>{job_title}</strong> at <strong>{company}</strong> has shortlisted you for the technical evaluation round.
                </p>
                <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15)); border: 1px solid rgba(99, 102, 241, 0.4); border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                    <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #A5B4FC; font-weight: 600;">Match Evaluation Score</div>
                    <div style="font-size: 32px; font-weight: 800; color: #FFFFFF; margin: 6px 0;">{match_score}%</div>
                    <div style="font-size: 13px; color: #CBD5E1;">Qualified for Autonomous Voice & Technical Assessment</div>
                </div>
                <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #94A3B8;">
                    Please select a convenient 15-minute time slot over the next 48 hours to complete your assessment with our AI technical interviewer.
                </p>
            """

        elif stage == CommunicationStage.INTERVIEW_INVITATION:
            hero_title = "Interview Confirmed"
            hero_badge = "CALENDAR CONFIRMATION"
            hero_color = "#38BDF8"
            action_button_text = "🎙️ Enter Interview Room"
            action_button_url = magic_link
            body_content = f"""
                <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #E2E8F0;">
                    Hi <strong>{candidate_name}</strong>, your AI Voice Assessment for <strong>{job_title}</strong> has been scheduled.
                </p>
                <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid #334155; border-radius: 12px; padding: 18px; margin: 20px 0;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #CBD5E1;">
                        <tr><td style="padding: 6px 0; color: #64748B;">Date & Time:</td><td style="font-weight: 700; text-align: right; color: #FCD34D;">{interview_datetime}</td></tr>
                        <tr><td style="padding: 6px 0; color: #64748B;">Duration:</td><td style="font-weight: 600; text-align: right; color: #F8FAFC;">15 Minutes</td></tr>
                        <tr><td style="padding: 6px 0; color: #64748B;">Format:</td><td style="font-weight: 600; text-align: right; color: #38BDF8;">AI Voice Assessment</td></tr>
                    </table>
                </div>
                <div style="text-align: center; margin: 16px 0 24px;">
                    <a href="{calendar_link}" style="display: inline-block; padding: 10px 18px; background: #1E293B; border: 1px solid #475569; border-radius: 8px; font-size: 12px; color: #E2E8F0; text-decoration: none; font-weight: 600;">
                        📅 Add to Google Calendar / ICS
                    </a>
                </div>
                <p style="margin: 0 0 8px; font-size: 13px; color: #94A3B8; font-weight: 600;">Checklist for your session:</p>
                <ul style="margin: 0 0 20px; padding-left: 20px; font-size: 13px; line-height: 1.7; color: #94A3B8;">
                    <li>Quiet room with stable internet connection</li>
                    <li>Microphone access enabled in browser (Google Chrome recommended)</li>
                    <li>You can also type code and text responses in the room terminal</li>
                </ul>
            """

        elif stage == CommunicationStage.INTERVIEW_COMPLETED:
            hero_title = "Assessment Completed"
            hero_badge = "SUBMITTED FOR REVIEW"
            hero_color = "#10B981"
            action_button_text = "Track Application Status"
            action_button_url = f"{frontend_url}/candidate/applications"
            body_content = f"""
                <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #E2E8F0;">
                    Hi <strong>{candidate_name}</strong>, thank you for completing your AI Voice Assessment for <strong>{job_title}</strong> at <strong>{company}</strong>.
                </p>
                <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #94A3B8;">
                    Your conversational turns, audio responses, and technical problem-solving metrics have been securely submitted to the hiring panel.
                </p>
                <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 13px; color: #A7F3D0;">
                    ⏱️ <strong>Next Steps:</strong> The hiring panel will review your comprehensive scorecard and provide final decision feedback within <strong>24–48 hours</strong>.
                </div>
            """

        elif stage == CommunicationStage.REJECTION:
            hero_title = "Application Update"
            hero_badge = "STATUS UPDATE"
            hero_color = "#94A3B8"
            action_button_text = "Explore Other Openings"
            action_button_url = f"{frontend_url}/candidate/jobs"
            body_content = f"""
                <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #E2E8F0;">
                    Hi <strong>{candidate_name}</strong>, thank you for taking the time to apply for <strong>{job_title}</strong> at <strong>{company}</strong>.
                </p>
                <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #94A3B8;">
                    After reviewing all candidate evaluations, the hiring panel has decided to move forward with candidates whose technical background more closely matches our immediate requirements.
                </p>
                <p style="margin: 0 0 20px; font-size: 13px; line-height: 1.6; color: #64748B;">
                    We truly appreciate your effort and have retained your resume in our talent pool for relevant future positions.
                </p>
            """

        else:
            hero_title = vars.get("subject", "Notification")
            hero_badge = "NOTIFICATION"
            body_content = f"""<p style="font-size: 14px; line-height: 1.6; color: #E2E8F0;">{vars.get('body', '')}</p>"""

        html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{hero_title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #07090E; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F8FAFC;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #07090E; padding: 40px 16px;">
        <tr>
            <td align="center">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #0B0F19; border: 1px solid #1E293B; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 32px 32px 24px; border-bottom: 1px solid #1E293B; background: linear-gradient(180deg, #111827 0%, #0B0F19 100%);">
                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td>
                                        <div style="font-size: 11px; font-weight: 700; color: #D6A85F; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px;">{company}</div>
                                        <div style="font-size: 20px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">{hero_title}</div>
                                    </td>
                                    <td align="right">
                                        <span style="display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 10px; font-weight: 700; background-color: rgba(99, 102, 241, 0.15); color: {hero_color}; border: 1px solid rgba(99, 102, 241, 0.3);">
                                            {hero_badge}
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 32px;">
                            {body_content}

                            <!-- Action Button -->
                            <div style="text-align: center; margin: 32px 0 16px;">
                                <a href="{action_button_url}" style="display: inline-block; background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4); text-align: center;">
                                    {action_button_text}
                                </a>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 32px; background-color: #07090F; border-top: 1px solid #1E293B; text-align: center;">
                            <div style="font-size: 12px; color: #64748B; margin-bottom: 6px;">
                                Powered by <strong>HireGenie AI</strong> • Autonomous Recruitment Intelligence
                            </div>
                            <div style="font-size: 11px; color: #475569;">
                                Secure End-to-End Recruitment Communication • SOC-2 & ISO-27001 Certified
                            </div>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>"""
        return html

    @staticmethod
    def send_communication(
        db: Session,
        application_id: Optional[int],
        stage: CommunicationStage,
        recipient_email: str,
        recipient_name: str,
        template_vars: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Send personalized communication for a given stage with idempotency check, rich HTML, & live telemetry."""
        
        # 1. IDEMPOTENCY CHECK: Do not send duplicate emails for the same application & production stage.
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

        invitation_token = template_vars.get("invitation_token") or "session"
        schedule_url = f"{CommunicationAgent.FRONTEND_URL}/interview/schedule/{invitation_token}"
        room_url = f"{CommunicationAgent.FRONTEND_URL}/interview/{invitation_token}/room"

        # Fill template variables
        vars_with_defaults = {
            "frontend_url": CommunicationAgent.FRONTEND_URL,
            "candidate_name": recipient_name,
            "application_id": application_id or "N/A",
            "company": "HireGenie AI",
            "job_title": "Position",
            "match_score": 90.0,
            "test_timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            "interview_datetime": "Tomorrow at 4:00 PM",
            "interview_mode": "Autonomous Voice Assessment",
            "schedule_link": schedule_url,
            "magic_link": room_url,
            "calendar_link": f"https://calendar.google.com/calendar/render?action=TEMPLATE&text=AI+Voice+Interview+-+{template_vars.get('job_title', 'Position')}&details=Direct+Room+Link:+{room_url}&location=Online+HireGenie+Room",
            "hr_decision": "Shortlisted",
            "decision_details": "Congratulations on progressing to the next stage.",
            "offer_details": "Your official offer details will be available in the portal.",
            "rejection_feedback": "Our team appreciated your technical application.",
            **template_vars,
        }

        try:
            subject = template["subject"].format(**vars_with_defaults)
            body = template["body"].format(**vars_with_defaults)
        except KeyError as e:
            subject = template["subject"]
            body = template["body"]
            logger.warning(f"Template variable missing: {e}")

        # Generate Rich HTML email
        html_body = CommunicationAgent.generate_html_email(stage, vars_with_defaults)

        # 2. LOG QUEUED STATE WITH HTML BODY IN EXTRA_METADATA
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
            extra_metadata={"body_html": html_body, "schedule_link": schedule_url, "magic_link": room_url}
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
