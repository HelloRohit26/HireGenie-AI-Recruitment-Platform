import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

ENVIRONMENT = (settings.ENVIRONMENT or os.getenv("ENVIRONMENT", "production")).lower()
ALLOW_DEV_SQLITE_FALLBACK = settings.ALLOW_DEV_SQLITE_FALLBACK or (os.getenv("ALLOW_DEV_SQLITE_FALLBACK", "false").lower() in ("true", "1", "yes"))
DATABASE_URL = (settings.DATABASE_URL or os.getenv("DATABASE_URL", "")).strip()

if not DATABASE_URL:
    if ENVIRONMENT in ("development", "dev", "test") or ALLOW_DEV_SQLITE_FALLBACK:
        DATABASE_URL = "sqlite:///./hiregenie.db"
    else:
        raise RuntimeError(
            "CRITICAL CONFIGURATION ERROR: DATABASE_URL is missing! "
            "Production database requires a valid PostgreSQL connection string "
            "(e.g., postgresql+psycopg2://USER:PASSWORD@HOST:5432/DB). "
            "SQLite fallback is disabled in production."
        )

# Enforce PostgreSQL in production environment
if ENVIRONMENT not in ("development", "dev", "test") and not ALLOW_DEV_SQLITE_FALLBACK:
    if DATABASE_URL.startswith("sqlite"):
        raise RuntimeError(
            "CRITICAL SECURITY ERROR: SQLite database is forbidden in production! "
            "Set a valid PostgreSQL connection string for DATABASE_URL in backend/.env."
        )

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """FastAPI Dependency for database session management."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()