from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.core.config import settings
from app.core.logger import logger
from app.core.audit_middleware import AuditMiddleware
from app.api.v1.api import api_router
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.models.models import (
    User, UserRole, Job, InterviewMode, CandidateApplication, ApplicationStatus,
    ScreeningQuestion, InterviewSession, SessionStatus, InterviewEvaluation,
    EvaluationStatus, EvaluationRecommendation, JobOffer, HiringDecision, OfferStatus
)
# Import new models so they're registered with SQLAlchemy
from app.models.audit import AuditLog
from app.models.explainability import AIExplanation, RecruiterOverride
from app.models.fairness import FairnessReport, BiasFlag
from app.models.communication import CommunicationLog
from app.models.scheduling import InterviewSchedule
from app.models.failure_queue import FailedTask

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="🚀 HireGenie AI — Autonomous Recruitment Platform with Trust & Safety Layer",
)

# Audit Middleware — logs all API requests
app.add_middleware(AuditMiddleware)

# Enable CORS as outermost middleware so OPTIONS preflight requests succeed across all ports & origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.on_event("startup")
def startup():
    logger.info("HireGenie AI Backend Starting - Initializing DB Tables")
    # Auto-create database tables (including all new feature tables)
    Base.metadata.create_all(bind=engine)

    # Auto-migrate missing columns for existing DB tables
    with engine.connect() as conn:
        for query in [
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'OPEN'",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS department VARCHAR(100) DEFAULT 'Engineering'",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS responsibilities TEXT",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS requirements TEXT",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS required_qualifications TEXT",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS preferred_qualifications TEXT",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS location VARCHAR(255)",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS work_mode VARCHAR(50) DEFAULT 'REMOTE'",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS employment_type VARCHAR(50) DEFAULT 'FULL_TIME'",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS experience_level VARCHAR(50) DEFAULT 'MID_LEVEL'",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS min_experience FLOAT DEFAULT 0.0",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS max_experience FLOAT DEFAULT 5.0",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_disclosed BOOLEAN DEFAULT TRUE",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_type VARCHAR(50) DEFAULT 'ANNUAL'",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD'",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS min_salary FLOAT",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS max_salary FLOAT",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_range VARCHAR(100)",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_website VARCHAR(255)",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_description TEXT",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_size VARCHAR(50)",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS extracted_skills JSON",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS must_have_skills JSON",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS nice_to_have_skills JSON",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS skill_weights JSON",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS jd_quality_score FLOAT",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS screening_enabled BOOLEAN DEFAULT TRUE",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS education_requirements VARCHAR(100)",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS certifications JSON",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS resume_required BOOLEAN DEFAULT TRUE",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS target_shortlist_count INTEGER DEFAULT 20",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS shortlist_threshold FLOAT DEFAULT 70.0",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS max_interview_candidates INTEGER DEFAULT 10",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS auto_shortlist BOOLEAN DEFAULT TRUE",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS interview_mode VARCHAR(50) DEFAULT 'WEBRTC'",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS interview_duration_minutes INTEGER DEFAULT 15",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS interview_topics JSON",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS technical_topics JSON",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS behavioral_topics JSON",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS interview_difficulty VARCHAR(50) DEFAULT 'MEDIUM'",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS interview_rubric JSON",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id)",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
            "ALTER TABLE screening_questions ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT TRUE",
            "ALTER TABLE candidate_applications ADD COLUMN IF NOT EXISTS overall_match_score FLOAT",
            "ALTER TABLE candidate_applications ADD COLUMN IF NOT EXISTS score_breakdown JSON",
            "ALTER TABLE candidate_applications ADD COLUMN IF NOT EXISTS rejection_reason TEXT",
            "ALTER TABLE candidate_applications ADD COLUMN IF NOT EXISTS resume_id INTEGER",
            "ALTER TABLE candidate_applications ADD COLUMN IF NOT EXISTS rank INTEGER",
            "ALTER TABLE candidate_applications ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
            "ALTER TABLE candidate_applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS hashed_password VARCHAR(255) DEFAULT ''",
            "ALTER TABLE users ALTER COLUMN password DROP NOT NULL",
            "ALTER TABLE communication_logs ALTER COLUMN application_id DROP NOT NULL",
            "ALTER TYPE communicationstage ADD VALUE IF NOT EXISTS 'TEST_EMAIL'",
            "ALTER TABLE resumes ADD COLUMN IF NOT EXISTS candidate_id INTEGER REFERENCES users(id)",
            "ALTER TABLE resumes ALTER COLUMN user_id DROP NOT NULL",
            "ALTER TABLE resumes ALTER COLUMN file_name DROP NOT NULL",
            "ALTER TABLE resumes ADD COLUMN IF NOT EXISTS raw_text TEXT",
            "ALTER TABLE resumes ADD COLUMN IF NOT EXISTS parsed_skills JSON",
            "ALTER TABLE resumes ADD COLUMN IF NOT EXISTS parsed_experience_years FLOAT DEFAULT 0.0",
            "ALTER TABLE resumes ADD COLUMN IF NOT EXISTS vector_id VARCHAR(255)",
            "ALTER TABLE resumes ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
            "ALTER TABLE interview_sessions ADD COLUMN IF NOT EXISTS code_submissions JSON",
            "ALTER TABLE interview_sessions ADD COLUMN IF NOT EXISTS proctoring_data JSON",
            "ALTER TABLE interview_sessions ADD COLUMN IF NOT EXISTS integrity_score FLOAT DEFAULT 100.0",
            "ALTER TABLE interviews ADD COLUMN IF NOT EXISTS code_submissions JSON",
            "ALTER TABLE interviews ADD COLUMN IF NOT EXISTS proctoring_data JSON",
            "ALTER TABLE interviews ADD COLUMN IF NOT EXISTS integrity_score FLOAT DEFAULT 100.0",
        ]:
            try:
                conn.execute(text(query))
                conn.commit()
            except Exception:
                conn.rollback()  # Reset transaction state for PostgreSQL
    
    # Seed initial data if DB users are missing
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.email == "admin@hiregenie.ai").first():
            # Seed Admin User
            admin = User(
                full_name="Admin User",
                email="admin@hiregenie.ai",
                hashed_password="mockhashedpassword",
                role=UserRole.ADMIN,
                is_active=True,
            )
            db.add(admin)
            db.commit()

        if not db.query(User).filter(User.email == "hr@hiregenie.ai").first():
            # Seed Recruiter
            recruiter = User(
                full_name="Recruiter Admin",
                email="hr@hiregenie.ai",
                hashed_password="mockhashedpassword",
                role=UserRole.RECRUITER,
                is_active=True,
            )
            db.add(recruiter)
            db.commit()
            db.refresh(recruiter)

        if db.query(Job).count() == 0:
            try:
                from seed_fresher_jobs import seed_two_real_fresher_jobs
                seed_two_real_fresher_jobs()
                logger.info("✅ Seeded 2 Real AI Engineer Fresher Jobs in India!")
            except Exception as seed_err:
                logger.warning(f"Could not auto-seed fresher jobs: {seed_err}")
    finally:
        db.close()


@app.get("/")
def root():
    logger.info("Root endpoint called")
    return {
        "message": f"{settings.APP_NAME} Backend Running 🚀",
        "version": settings.APP_VERSION,
        "features": [
            "🔐 Authentication + RBAC",
            "🧠 Explainable AI + Human-in-the-Loop",
            "⚖️ Bias & Fairness Monitoring",
            "📄 JD Intelligence",
            "📅 Interview Scheduling Agent",
            "📧 Communication Agent",
            "🔄 Failure & Retry System",
            "📊 Recruitment Analytics",
            "🔌 External Integrations",
            "🛡️ Audit Log",
        ],
    }


app.include_router(
    api_router,
    prefix="/api/v1"
)
