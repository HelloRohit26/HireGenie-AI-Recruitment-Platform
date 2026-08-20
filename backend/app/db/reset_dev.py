"""Development Database Reset Script — Cleans test applications and jobs in development mode."""
import os
import sys

# Ensure backend root is on Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.db.session import engine, SessionLocal
from app.models.models import Job, CandidateApplication, ScreeningQuestion, ScreeningAnswer, Resume, User, UserRole, InterviewInvitation
from app.models.audit import AuditLog
from app.models.communication import CommunicationLog
from app.core.logger import logger


def reset_development_database():
    """Resets development SQLite database tables safely."""
    env = os.getenv("ENVIRONMENT", "development").lower()
    if env not in ("dev", "development", "local", "test"):
        print("[BLOCK] Reset script blocked: Can only be executed in development mode.")
        sys.exit(1)

    print("==================================================")
    print("RESETTING HIREGENIE DEVELOPMENT DATABASE")
    print("==================================================")

    db = SessionLocal()
    try:
        from app.db.base import Base
        Base.metadata.create_all(bind=engine)

        from sqlalchemy import text
        for tbl in [
            "matches", "job_offers", "interview_evaluations", "interview_sessions",
            "interview_schedules", "communication_logs", "failed_tasks", "recruiter_overrides",
            "ai_explanations", "bias_flags", "fairness_reports", "interview_invitations",
            "screening_answers", "screening_questions", "candidate_applications",
            "resumes", "jobs", "audit_logs"
        ]:
            try:
                db.execute(text(f"DELETE FROM {tbl}"))
                db.commit()
            except Exception:
                db.rollback()

        try:
            db.query(User).filter(User.role == UserRole.CANDIDATE).delete()
            db.commit()
        except Exception:
            db.rollback()

        print("[CLEAN] Cleaned test records across all tables")
        print("==================================================")
        print("DATABASE RESET COMPLETE! SQLite database is clean.")
        print("==================================================")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error resetting database: {str(e)}")
    finally:
        db.close()


if __name__ == "__main__":
    reset_development_database()
