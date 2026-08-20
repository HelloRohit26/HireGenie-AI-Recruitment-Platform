"""Explainable AI models — stores AI reasoning and recruiter overrides."""
import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, JSON, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.db.base import Base


class ExplanationType(str, enum.Enum):
    SHORTLIST = "SHORTLIST"
    REJECT = "REJECT"
    SCORE = "SCORE"
    MANUAL_REVIEW = "MANUAL_REVIEW"


class AIExplanation(Base):
    __tablename__ = "ai_explanations"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("candidate_applications.id"), nullable=False, index=True)
    explanation_type = Column(SQLEnum(ExplanationType), nullable=False)
    overall_score = Column(Float, nullable=True)
    matched_skills = Column(JSON, nullable=True)  # ["Python", "FastAPI", ...]
    missing_skills = Column(JSON, nullable=True)  # ["Kubernetes", ...]
    strengths = Column(JSON, nullable=True)  # ["3+ years experience", ...]
    weaknesses = Column(JSON, nullable=True)  # ["No cloud experience", ...]
    reasoning = Column(Text, nullable=True)  # Natural language explanation
    confidence = Column(Float, nullable=True)  # 0-100
    score_breakdown = Column(JSON, nullable=True)  # {skill: 92, experience: 88, ...}
    model_version = Column(String(50), default="gemini-3.5-flash")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    application = relationship("CandidateApplication", backref="ai_explanations")


class RecruiterOverride(Base):
    __tablename__ = "recruiter_overrides"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("candidate_applications.id"), nullable=False, index=True)
    original_decision = Column(String(50), nullable=False)  # SHORTLISTED / REJECTED / MANUAL_REVIEW
    overridden_to = Column(String(50), nullable=False)  # The new decision
    override_reason = Column(Text, nullable=False)
    overridden_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    application = relationship("CandidateApplication", backref="overrides")
    recruiter = relationship("User", backref="overrides_made")
