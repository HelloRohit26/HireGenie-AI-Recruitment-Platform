"""Enhanced Analytics API — full hiring funnel and comprehensive metrics."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db
from app.services.analytics_service import AnalyticsService

router = APIRouter()


@router.get("/dashboard")
def get_comprehensive_dashboard(
    job_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    """Get comprehensive analytics dashboard with all metrics."""
    return AnalyticsService.get_comprehensive_dashboard(db, job_id=job_id)


@router.get("/funnel")
def get_hiring_funnel(
    job_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    """Get complete hiring funnel breakdown."""
    return AnalyticsService.get_hiring_funnel(db, job_id=job_id)


@router.get("/time-metrics")
def get_time_metrics(
    job_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    """Get time-to-hire and pipeline duration metrics."""
    return AnalyticsService.get_time_metrics(db, job_id=job_id)


@router.get("/ai-accuracy")
def get_ai_accuracy(
    job_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    """Get AI screening accuracy metrics."""
    return AnalyticsService.get_ai_accuracy_metrics(db, job_id=job_id)


@router.get("/interview-metrics")
def get_interview_metrics(
    job_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    """Get interview completion and performance metrics."""
    return AnalyticsService.get_interview_metrics(db, job_id=job_id)


@router.get("/skill-availability")
def get_skill_availability(
    job_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    """Get skill-wise candidate distribution."""
    return AnalyticsService.get_skill_availability(db, job_id=job_id)


@router.get("/summary")
def get_summary_telemetry(db: Session = Depends(get_db)):
    """Get real top-level system metrics, telemetry, and activity stream from SQLite."""
    return AnalyticsService.get_summary_telemetry(db)


@router.get("/insights")
def get_real_insights(db: Session = Depends(get_db)):
    """Get calculated insights metrics directly from SQLite database."""
    return AnalyticsService.get_real_insights(db)

