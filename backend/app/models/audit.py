"""Audit Log model — records every AI decision, recruiter action, and system event."""
import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Enum as SQLEnum
from app.db.base import Base


class ActorType(str, enum.Enum):
    SYSTEM = "SYSTEM"
    AI_AGENT = "AI_AGENT"
    RECRUITER = "RECRUITER"
    CANDIDATE = "CANDIDATE"
    ADMIN = "ADMIN"


class AuditAction(str, enum.Enum):
    # AI Pipeline
    RESUME_PARSED = "RESUME_PARSED"
    SKILL_MATCHED = "SKILL_MATCHED"
    CANDIDATE_SCORED = "CANDIDATE_SCORED"
    CANDIDATE_SHORTLISTED = "CANDIDATE_SHORTLISTED"
    CANDIDATE_REJECTED = "CANDIDATE_REJECTED"
    MANUAL_REVIEW_FLAGGED = "MANUAL_REVIEW_FLAGGED"
    INTERVIEW_EVALUATED = "INTERVIEW_EVALUATED"
    # Recruiter actions
    DECISION_OVERRIDDEN = "DECISION_OVERRIDDEN"
    JOB_CREATED = "JOB_CREATED"
    SCREENING_TRIGGERED = "SCREENING_TRIGGERED"
    OFFER_SENT = "OFFER_SENT"
    # Hiring lifecycle
    RECRUITER_HIRED_CANDIDATE = "RECRUITER_HIRED_CANDIDATE"
    RECRUITER_REJECTED_CANDIDATE = "RECRUITER_REJECTED_CANDIDATE"
    OFFER_CREATED = "OFFER_CREATED"
    OFFER_ACCEPTED = "OFFER_ACCEPTED"
    OFFER_DECLINED = "OFFER_DECLINED"
    JOB_CLOSED = "JOB_CLOSED"
    # Communication
    EMAIL_SENT = "EMAIL_SENT"
    EMAIL_FAILED = "EMAIL_FAILED"
    # Scheduling
    INTERVIEW_SCHEDULED = "INTERVIEW_SCHEDULED"
    INTERVIEW_RESCHEDULED = "INTERVIEW_RESCHEDULED"
    INTERVIEW_COMPLETED = "INTERVIEW_COMPLETED"
    # System
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    FAILURE_RECORDED = "FAILURE_RECORDED"
    FAILURE_RETRIED = "FAILURE_RETRIED"
    FAIRNESS_REPORT_GENERATED = "FAIRNESS_REPORT_GENERATED"


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_type = Column(SQLEnum(ActorType), nullable=False)
    actor_name = Column(String(255), nullable=False)
    action = Column(SQLEnum(AuditAction), nullable=False)
    target_type = Column(String(100), nullable=True)  # APPLICATION, JOB, INTERVIEW, etc.
    target_id = Column(Integer, nullable=True)
    details = Column(JSON, nullable=True)  # score, reason, agent name, etc.
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
