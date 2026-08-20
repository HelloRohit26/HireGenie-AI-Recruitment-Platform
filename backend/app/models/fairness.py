"""Bias & Fairness monitoring models — tracks fairness reports and bias flags."""
import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, JSON, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.db.base import Base


class BiasType(str, enum.Enum):
    GENDER = "GENDER"
    NAME = "NAME"
    COLLEGE = "COLLEGE"
    LOCATION = "LOCATION"
    AGE = "AGE"
    EXPERIENCE_LEVEL = "EXPERIENCE_LEVEL"


class BiasSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class FairnessReport(Base):
    __tablename__ = "fairness_reports"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False, index=True)
    report_date = Column(DateTime, default=datetime.utcnow)
    total_candidates_analyzed = Column(Integer, default=0)
    overall_fairness_score = Column(Float, nullable=True)  # 0-100, higher = fairer
    metrics = Column(JSON, nullable=True)  # Detailed metric breakdowns
    flagged_issues = Column(JSON, nullable=True)  # List of flagged bias issues
    recommendations = Column(JSON, nullable=True)  # Suggested improvements
    generated_by = Column(String(50), default="SYSTEM")

    # Relationships
    job = relationship("Job", backref="fairness_reports")


class BiasFlag(Base):
    __tablename__ = "bias_flags"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("fairness_reports.id"), nullable=False)
    bias_type = Column(SQLEnum(BiasType), nullable=False)
    severity = Column(SQLEnum(BiasSeverity), nullable=False)
    affected_group = Column(String(255), nullable=True)  # e.g., "Female candidates"
    details = Column(Text, nullable=True)
    selection_rate_a = Column(Float, nullable=True)  # Group A selection rate
    selection_rate_b = Column(Float, nullable=True)  # Group B selection rate
    disparity_ratio = Column(Float, nullable=True)  # A/B ratio
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    report = relationship("FairnessReport", backref="bias_flags")
