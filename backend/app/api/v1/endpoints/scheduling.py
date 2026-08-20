"""Interview Scheduling API — automated scheduling with magic links and reminders."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.db.session import get_db
from app.services.scheduling_service import SchedulingService

router = APIRouter()


class ScheduleRequest(BaseModel):
    application_id: int
    scheduled_at: Optional[str] = None  # ISO format datetime string
    duration_minutes: int = 15


class RescheduleRequest(BaseModel):
    schedule_id: int
    new_datetime: str  # ISO format
    reason: Optional[str] = None


@router.post("/schedule")
def schedule_interview(payload: ScheduleRequest, db: Session = Depends(get_db)):
    """Schedule an interview with magic link."""
    scheduled_at = None
    if payload.scheduled_at:
        try:
            scheduled_at = datetime.fromisoformat(payload.scheduled_at)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid datetime format. Use ISO format.")

    result = SchedulingService.schedule_interview(
        db, payload.application_id, scheduled_at, payload.duration_minutes
    )
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.post("/reschedule")
def reschedule_interview(payload: RescheduleRequest, db: Session = Depends(get_db)):
    """Reschedule an existing interview."""
    try:
        new_dt = datetime.fromisoformat(payload.new_datetime)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid datetime format.")

    result = SchedulingService.reschedule(db, payload.schedule_id, new_dt, payload.reason)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.post("/confirm/{schedule_id}")
def confirm_interview(schedule_id: int, db: Session = Depends(get_db)):
    """Candidate confirms interview schedule."""
    result = SchedulingService.confirm_schedule(db, schedule_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.post("/reminder/{schedule_id}")
def send_reminder(schedule_id: int, db: Session = Depends(get_db)):
    """Send interview reminder."""
    result = SchedulingService.send_reminder(db, schedule_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.get("/{application_id}")
def get_schedule(application_id: int, db: Session = Depends(get_db)):
    """Get interview schedule for an application."""
    result = SchedulingService.get_schedule(db, application_id)
    if not result:
        raise HTTPException(status_code=404, detail="No schedule found")
    return result


@router.get("/upcoming/all")
def get_upcoming(hours: int = 24, db: Session = Depends(get_db)):
    """Get all upcoming interviews within N hours."""
    return {"interviews": SchedulingService.get_upcoming_interviews(db, hours)}
