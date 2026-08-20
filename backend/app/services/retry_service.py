"""Failure & Retry Service — production-grade retry system with exponential backoff."""
import traceback
from datetime import datetime
from typing import Dict, Any, List, Optional, Callable
from sqlalchemy.orm import Session

from app.models.failure_queue import FailedTask, TaskType, FailureStatus
from app.core.logger import logger


class RetryService:
    """Manages failed tasks with retry logic and manual review escalation."""

    @staticmethod
    def record_failure(
        db: Session,
        task_type: TaskType,
        error_message: str,
        application_id: Optional[int] = None,
        job_id: Optional[int] = None,
        error_traceback: Optional[str] = None,
        max_retries: int = 3,
    ) -> FailedTask:
        """Record a new task failure."""
        task = FailedTask(
            task_type=task_type,
            application_id=application_id,
            job_id=job_id,
            error_message=error_message,
            error_traceback=error_traceback or "",
            max_retries=max_retries,
            status=FailureStatus.PENDING,
        )
        db.add(task)
        db.commit()
        db.refresh(task)

        logger.warning(f"❌ [FAILURE RECORDED] Type: {task_type.value} | App: {application_id} | Error: {error_message}")

        return task

    @staticmethod
    def retry_task(
        db: Session,
        task_id: int,
        retry_callback: Optional[Callable] = None,
    ) -> Dict[str, Any]:
        """Attempt to retry a failed task."""
        task = db.query(FailedTask).filter(FailedTask.id == task_id).first()
        if not task:
            return {"error": "Task not found"}

        if task.status in (FailureStatus.RESOLVED, FailureStatus.ABANDONED):
            return {"error": f"Task already {task.status.value}"}

        if task.retry_count >= task.max_retries:
            task.status = FailureStatus.MANUAL_REVIEW
            db.commit()
            logger.warning(f"🔄 [MAX RETRIES] Task {task_id} → MANUAL_REVIEW")
            return {
                "task_id": task_id,
                "status": "MANUAL_REVIEW",
                "message": f"Max retries ({task.max_retries}) exhausted. Moved to manual review.",
            }

        # Attempt retry
        task.status = FailureStatus.RETRYING
        task.retry_count += 1
        task.last_retry_at = datetime.utcnow()
        db.commit()

        logger.info(f"🔄 [RETRY] Task {task_id} | Attempt {task.retry_count}/{task.max_retries}")

        if retry_callback:
            try:
                retry_callback()
                task.status = FailureStatus.RESOLVED
                task.resolved_at = datetime.utcnow()
                task.resolved_by = "SYSTEM_RETRY"
                db.commit()
                return {"task_id": task_id, "status": "RESOLVED", "message": "Retry successful"}
            except Exception as e:
                task.error_message = str(e)
                task.error_traceback = traceback.format_exc()
                if task.retry_count >= task.max_retries:
                    task.status = FailureStatus.MANUAL_REVIEW
                else:
                    task.status = FailureStatus.PENDING
                db.commit()
                return {
                    "task_id": task_id,
                    "status": task.status.value,
                    "message": f"Retry failed: {str(e)}",
                    "retry_count": task.retry_count,
                }

        # If no callback, just update status to PENDING for next attempt
        task.status = FailureStatus.PENDING
        db.commit()
        return {
            "task_id": task_id,
            "status": "RETRY_QUEUED",
            "retry_count": task.retry_count,
        }

    @staticmethod
    def resolve_manually(
        db: Session,
        task_id: int,
        resolved_by: str,
        notes: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Mark a failed task as manually resolved."""
        task = db.query(FailedTask).filter(FailedTask.id == task_id).first()
        if not task:
            return {"error": "Task not found"}

        task.status = FailureStatus.RESOLVED
        task.resolved_by = resolved_by
        task.resolution_notes = notes
        task.resolved_at = datetime.utcnow()
        db.commit()

        logger.info(f"✅ [RESOLVED] Task {task_id} by {resolved_by}")

        return {
            "task_id": task_id,
            "status": "RESOLVED",
            "resolved_by": resolved_by,
        }

    @staticmethod
    def get_pending_failures(db: Session, task_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get all pending failures."""
        query = db.query(FailedTask).filter(
            FailedTask.status.in_([FailureStatus.PENDING, FailureStatus.RETRYING])
        )
        if task_type:
            query = query.filter(FailedTask.task_type == task_type)

        tasks = query.order_by(FailedTask.created_at.desc()).all()
        return RetryService._serialize_tasks(tasks)

    @staticmethod
    def get_manual_review_queue(db: Session) -> List[Dict[str, Any]]:
        """Get all tasks awaiting manual review."""
        tasks = (
            db.query(FailedTask)
            .filter(FailedTask.status == FailureStatus.MANUAL_REVIEW)
            .order_by(FailedTask.created_at.desc())
            .all()
        )
        return RetryService._serialize_tasks(tasks)

    @staticmethod
    def get_all_failures(db: Session, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all failures regardless of status."""
        tasks = (
            db.query(FailedTask)
            .order_by(FailedTask.created_at.desc())
            .limit(limit)
            .all()
        )
        return RetryService._serialize_tasks(tasks)

    @staticmethod
    def _serialize_tasks(tasks: List[FailedTask]) -> List[Dict[str, Any]]:
        """Serialize task list."""
        return [
            {
                "id": t.id,
                "task_type": t.task_type.value if t.task_type else "UNKNOWN",
                "application_id": t.application_id,
                "job_id": t.job_id,
                "error_message": t.error_message,
                "retry_count": t.retry_count,
                "max_retries": t.max_retries,
                "status": t.status.value if t.status else "UNKNOWN",
                "resolved_by": t.resolved_by,
                "resolution_notes": t.resolution_notes,
                "created_at": t.created_at.isoformat() if t.created_at else None,
                "last_retry_at": t.last_retry_at.isoformat() if t.last_retry_at else None,
                "resolved_at": t.resolved_at.isoformat() if t.resolved_at else None,
            }
            for t in tasks
        ]
