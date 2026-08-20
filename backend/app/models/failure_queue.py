"""Failure & Retry Queue models — tracks failed tasks with retry logic and manual escalation."""
import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.db.base import Base


class TaskType(str, enum.Enum):
    RESUME_PARSE = "RESUME_PARSE"
    VOICE_CALL = "VOICE_CALL"
    EMAIL_SEND = "EMAIL_SEND"
    AI_SERVICE = "AI_SERVICE"
    INTERVIEW_SCHEDULE = "INTERVIEW_SCHEDULE"
    SKILL_MATCHING = "SKILL_MATCHING"
    SCORING = "SCORING"


class FailureStatus(str, enum.Enum):
    PENDING = "PENDING"
    RETRYING = "RETRYING"
    RESOLVED = "RESOLVED"
    MANUAL_REVIEW = "MANUAL_REVIEW"
    ABANDONED = "ABANDONED"


class FailedTask(Base):
    __tablename__ = "failed_tasks"

    id = Column(Integer, primary_key=True, index=True)
    task_type = Column(SQLEnum(TaskType), nullable=False, index=True)
    application_id = Column(Integer, ForeignKey("candidate_applications.id"), nullable=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True)
    error_message = Column(Text, nullable=False)
    error_traceback = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    status = Column(SQLEnum(FailureStatus), default=FailureStatus.PENDING, index=True)
    resolved_by = Column(String(255), nullable=True)  # Who resolved it
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_retry_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    application = relationship("CandidateApplication", backref="failed_tasks")
    job = relationship("Job", backref="failed_tasks")
