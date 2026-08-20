"""Interview Scheduling Service — manages automated interview scheduling with magic links and emails."""
import uuid
import os
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session

from app.models.scheduling import InterviewSchedule, ScheduleStatus
from app.models.models import CandidateApplication, ApplicationStatus, InterviewInvitation, InvitationStatus
from app.models.communication import CommunicationStage
from app.services.communication_agent import CommunicationAgent
from app.core.logger import logger


class SchedulingService:
    """Handles interview scheduling, reminders, rescheduling, and automated lifecycle email notifications."""

    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

    @staticmethod
    def schedule_interview(
        db: Session,
        application_id: int,
        scheduled_at: Optional[datetime] = None,
        duration_minutes: int = 15,
    ) -> Dict[str, Any]:
        """Create an interview schedule with magic link and dispatch candidate invitation email."""
        application = db.query(CandidateApplication).filter(
            CandidateApplication.id == application_id
        ).first()

        if not application:
            return {"error": "Application not found"}

        # Default to 24 hours from now if no time specified
        if scheduled_at is None:
            scheduled_at = datetime.utcnow() + timedelta(hours=24)

        # Get or create InterviewInvitation with active invitation_token
        invitation = db.query(InterviewInvitation).filter(
            InterviewInvitation.application_id == application_id
        ).first()

        if not invitation:
            token = str(uuid.uuid4())
            invitation = InterviewInvitation(
                application_id=application_id,
                candidate_id=application.candidate_id,
                job_id=application.job_id,
                invitation_token=token,
                status=InvitationStatus.INVITED,
                interview_mode="WEBRTC",
                created_at=datetime.utcnow(),
                expires_at=datetime.utcnow() + timedelta(days=7)
            )
            db.add(invitation)
            db.commit()
            db.refresh(invitation)

        magic_token = invitation.invitation_token
        magic_link = f"{SchedulingService.FRONTEND_URL}/interview/{magic_token}/prep"

        schedule = InterviewSchedule(
            application_id=application_id,
            scheduled_at=scheduled_at,
            duration_minutes=duration_minutes,
            magic_link=magic_link,
            status=ScheduleStatus.SCHEDULED,
        )
        db.add(schedule)

        # Update application status
        application.status = ApplicationStatus.INTERVIEW_SCHEDULED
        db.commit()
        db.refresh(schedule)

        logger.info(f"📅 [SCHEDULED] Application {application_id} → {scheduled_at.isoformat()} | Magic Link: {magic_link}")

        # Dispatch real Interview Invitation Email (Idempotent, non-blocking)
        try:
            candidate_user = application.candidate
            job = application.job
            if candidate_user and candidate_user.email:
                CommunicationAgent.send_communication(
                    db=db,
                    application_id=application.id,
                    stage=CommunicationStage.INTERVIEW_INVITATION,
                    recipient_email=candidate_user.email,
                    recipient_name=candidate_user.full_name or "Candidate",
                    template_vars={
                        "job_title": job.title if job else "Engineering Position",
                        "company": job.company if job else "HireGenie AI",
                        "interview_datetime": scheduled_at.strftime("%A, %B %d, %Y at %I:%M %p UTC"),
                        "interview_mode": "AI Voice Assessment (WebRTC)",
                        "magic_link": magic_link,
                        "reschedule_link": f"{SchedulingService.FRONTEND_URL}/interview/{magic_token}/prep"
                    }
                )
        except Exception as comm_err:
            logger.warning(f"Interview invitation email dispatch note: {comm_err}")

        return {
            "schedule_id": schedule.id,
            "application_id": application_id,
            "scheduled_at": scheduled_at.isoformat(),
            "duration_minutes": duration_minutes,
            "magic_link": magic_link,
            "status": schedule.status.value,
        }

    @staticmethod
    def reschedule(
        db: Session,
        schedule_id: int,
        new_datetime: datetime,
        reason: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Reschedule an existing interview."""
        schedule = db.query(InterviewSchedule).filter(
            InterviewSchedule.id == schedule_id
        ).first()

        if not schedule:
            return {"error": "Schedule not found"}

        if schedule.reschedule_count >= 3:
            return {"error": "Maximum reschedule limit (3) reached"}

        old_time = schedule.scheduled_at
        schedule.scheduled_at = new_datetime
        schedule.status = ScheduleStatus.RESCHEDULED
        schedule.reschedule_count += 1
        schedule.reschedule_reason = reason
        schedule.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(schedule)

        logger.info(f"🔄 [RESCHEDULED] Schedule {schedule_id}: {old_time} → {new_datetime}")

        return {
            "schedule_id": schedule.id,
            "old_datetime": old_time.isoformat(),
            "new_datetime": new_datetime.isoformat(),
            "reschedule_count": schedule.reschedule_count,
            "status": schedule.status.value,
        }

    @staticmethod
    def confirm_schedule(db: Session, schedule_id: int) -> Dict[str, Any]:
        """Candidate confirms the interview schedule."""
        schedule = db.query(InterviewSchedule).filter(
            InterviewSchedule.id == schedule_id
        ).first()

        if not schedule:
            return {"error": "Schedule not found"}

        schedule.status = ScheduleStatus.CONFIRMED
        schedule.confirmed_at = datetime.utcnow()
        db.commit()

        return {
            "schedule_id": schedule.id,
            "status": "CONFIRMED",
            "confirmed_at": schedule.confirmed_at.isoformat(),
        }

    @staticmethod
    def send_reminder(db: Session, schedule_id: int) -> Dict[str, Any]:
        """Send interview reminder (1 hour before)."""
        schedule = db.query(InterviewSchedule).filter(
            InterviewSchedule.id == schedule_id
        ).first()

        if not schedule:
            return {"error": "Schedule not found"}

        if schedule.reminder_sent:
            return {"status": "ALREADY_SENT"}

        schedule.reminder_sent = True
        schedule.reminder_sent_at = datetime.utcnow()
        db.commit()

        logger.info(f"⏰ [REMINDER SENT] Schedule {schedule_id}")

        # Send reminder email
        try:
            app = schedule.application
            if app and app.candidate:
                CommunicationAgent.send_communication(
                    db=db,
                    application_id=app.id,
                    stage=CommunicationStage.INTERVIEW_REMINDER,
                    recipient_email=app.candidate.email,
                    recipient_name=app.candidate.full_name or "Candidate",
                    template_vars={
                        "job_title": app.job.title if app.job else "Position",
                        "company": app.job.company if app.job else "HireGenie AI",
                        "magic_link": schedule.magic_link
                    }
                )
        except Exception as comm_err:
            logger.warning(f"Reminder email dispatch note: {comm_err}")

        return {
            "schedule_id": schedule.id,
            "reminder_sent": True,
            "reminder_sent_at": schedule.reminder_sent_at.isoformat(),
        }

    @staticmethod
    def get_schedule(db: Session, application_id: int) -> Optional[Dict[str, Any]]:
        """Get the latest schedule for an application."""
        schedule = (
            db.query(InterviewSchedule)
            .filter(InterviewSchedule.application_id == application_id)
            .order_by(InterviewSchedule.created_at.desc())
            .first()
        )

        if not schedule:
            return None

        return {
            "schedule_id": schedule.id,
            "application_id": schedule.application_id,
            "scheduled_at": schedule.scheduled_at.isoformat(),
            "duration_minutes": schedule.duration_minutes,
            "magic_link": schedule.magic_link,
            "status": schedule.status.value,
            "reminder_sent": schedule.reminder_sent,
            "confirmed_at": schedule.confirmed_at.isoformat() if schedule.confirmed_at else None,
            "reschedule_count": schedule.reschedule_count,
        }

    @staticmethod
    def get_upcoming_interviews(db: Session, hours_ahead: int = 24) -> List[Dict[str, Any]]:
        """Get all interviews scheduled within the next N hours."""
        cutoff = datetime.utcnow() + timedelta(hours=hours_ahead)
        schedules = (
            db.query(InterviewSchedule)
            .filter(
                InterviewSchedule.scheduled_at <= cutoff,
                InterviewSchedule.scheduled_at >= datetime.utcnow(),
                InterviewSchedule.status.in_([ScheduleStatus.SCHEDULED, ScheduleStatus.CONFIRMED, ScheduleStatus.RESCHEDULED]),
            )
            .order_by(InterviewSchedule.scheduled_at)
            .all()
        )

        return [
            {
                "schedule_id": s.id,
                "application_id": s.application_id,
                "scheduled_at": s.scheduled_at.isoformat(),
                "status": s.status.value,
                "reminder_sent": s.reminder_sent,
            }
            for s in schedules
        ]
