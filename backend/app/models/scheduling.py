"""Interview Scheduling models — manages automated interview scheduling with magic links."""
import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.db.base import Base


class ScheduleStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    CONFIRMED = "CONFIRMED"
    RESCHEDULED = "RESCHEDULED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    NO_SHOW = "NO_SHOW"


class InterviewSchedule(Base):
    __tablename__ = "interview_schedules"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("candidate_applications.id"), nullable=False, index=True)
    scheduled_at = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=15)
    magic_link = Column(String(512), unique=True, nullable=False)
    status = Column(SQLEnum(ScheduleStatus), default=ScheduleStatus.SCHEDULED)
    reminder_sent = Column(Boolean, default=False)
    reminder_sent_at = Column(DateTime, nullable=True)
    confirmed_at = Column(DateTime, nullable=True)
    reschedule_count = Column(Integer, default=0)
    reschedule_reason = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    application = relationship("CandidateApplication", backref="schedules")
