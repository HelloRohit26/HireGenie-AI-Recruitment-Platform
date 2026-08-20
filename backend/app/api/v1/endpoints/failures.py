"""Failure & Retry API — manage failed tasks, retry, and manual resolution."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.db.session import get_db
from app.services.retry_service import RetryService

router = APIRouter()


class ResolveRequest(BaseModel):
    resolved_by: str
    notes: Optional[str] = None


@router.get("/all")
def get_all_failures(limit: int = Query(100, ge=1, le=500), db: Session = Depends(get_db)):
    """List all failed tasks regardless of status."""
    return {"failures": RetryService.get_all_failures(db, limit=limit)}


@router.get("/pending")
def get_pending_failures(
    task_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Get all pending failures awaiting retry."""
    return {"failures": RetryService.get_pending_failures(db, task_type=task_type)}


@router.get("/manual-queue")
def get_manual_review_queue(db: Session = Depends(get_db)):
    """Get all tasks that need manual review."""
    return {"queue": RetryService.get_manual_review_queue(db)}


@router.post("/{task_id}/retry")
def retry_task(task_id: int, db: Session = Depends(get_db)):
    """Attempt to retry a failed task."""
    result = RetryService.retry_task(db, task_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.post("/{task_id}/resolve")
def resolve_task(task_id: int, payload: ResolveRequest, db: Session = Depends(get_db)):
    """Manually resolve a failed task."""
    result = RetryService.resolve_manually(db, task_id, payload.resolved_by, payload.notes)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result
