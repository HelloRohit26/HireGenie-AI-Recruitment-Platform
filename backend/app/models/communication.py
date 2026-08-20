"""Communication Agent models — logs every communication across all hiring stages."""
import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.db.base import Base


class CommunicationStage(str, enum.Enum):
    APPLICATION_RECEIVED = "APPLICATION_RECEIVED"
    SHORTLISTED = "SHORTLISTED"
    INTERVIEW_INVITATION = "INTERVIEW_INVITATION"
    INTERVIEW_REMINDER = "INTERVIEW_REMINDER"
    INTERVIEW_COMPLETED = "INTERVIEW_COMPLETED"
    HR_DECISION = "HR_DECISION"
    OFFER = "OFFER"
    REJECTION = "REJECTION"
    TEST_EMAIL = "TEST_EMAIL"


class CommunicationChannel(str, enum.Enum):
    EMAIL = "EMAIL"
    SMS = "SMS"
    IN_APP = "IN_APP"


class DeliveryStatus(str, enum.Enum):
    PENDING = "PENDING"
    QUEUED = "QUEUED"
    SENDING = "SENDING"
    SENT = "SENT"
    DELIVERED = "DELIVERED"
    FAILED = "FAILED"
    BOUNCED = "BOUNCED"


class CommunicationLog(Base):
    __tablename__ = "communication_logs"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("candidate_applications.id"), nullable=True, index=True)
    stage = Column(SQLEnum(CommunicationStage), nullable=False)
    channel = Column(SQLEnum(CommunicationChannel), default=CommunicationChannel.EMAIL)
    recipient_email = Column(String(255), nullable=True)
    recipient_name = Column(String(255), nullable=True)
    subject = Column(String(500), nullable=True)
    body = Column(Text, nullable=True)
    template_used = Column(String(100), nullable=True)
    delivery_status = Column(SQLEnum(DeliveryStatus), default=DeliveryStatus.PENDING)
    retry_count = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    extra_metadata = Column(JSON, nullable=True)  # Extra data like magic_link, etc.
    sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    application = relationship("CandidateApplication", backref="communication_logs")
