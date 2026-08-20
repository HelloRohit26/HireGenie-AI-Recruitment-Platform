"""Audit Log API — querying, filtering, and candidate audit trails."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db
from app.services.audit_service import AuditService

router = APIRouter()


@router.get("/logs")
def get_audit_logs(
    actor_type: Optional[str] = Query(None, description="Filter by actor type"),
    action: Optional[str] = Query(None, description="Filter by action"),
    target_type: Optional[str] = Query(None, description="Filter by target type"),
    target_id: Optional[int] = Query(None, description="Filter by target ID"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Get paginated audit logs with optional filters."""
    logs = AuditService.get_logs(
        db, actor_type=actor_type, action=action,
        target_type=target_type, target_id=target_id,
        limit=limit, offset=offset,
    )
    return {
        "total": len(logs),
        "logs": [
            {
                "id": log.id,
                "actor_type": log.actor_type.value if log.actor_type else "UNKNOWN",
                "actor_name": log.actor_name,
                "action": log.action.value if log.action else "UNKNOWN",
                "target_type": log.target_type,
                "target_id": log.target_id,
                "details": log.details,
                "ip_address": log.ip_address,
                "timestamp": log.timestamp.isoformat() if log.timestamp else None,
            }
            for log in logs
        ],
    }


@router.get("/trail/{application_id}")
def get_candidate_audit_trail(application_id: int, db: Session = Depends(get_db)):
    """Get complete audit trail for a specific candidate application."""
    logs = AuditService.get_candidate_trail(db, application_id)
    return {
        "application_id": application_id,
        "total_events": len(logs),
        "trail": [
            {
                "id": log.id,
                "actor_type": log.actor_type.value if log.actor_type else "UNKNOWN",
                "actor_name": log.actor_name,
                "action": log.action.value if log.action else "UNKNOWN",
                "details": log.details,
                "timestamp": log.timestamp.isoformat() if log.timestamp else None,
            }
            for log in logs
        ],
    }


@router.get("/agent-decisions")
def get_agent_decisions(limit: int = Query(100, ge=1, le=500), db: Session = Depends(get_db)):
    """Get all AI agent decisions for transparency and debugging."""
    logs = AuditService.get_agent_decisions(db, limit=limit)
    return {
        "total": len(logs),
        "decisions": [
            {
                "id": log.id,
                "agent": log.actor_name,
                "action": log.action.value if log.action else "UNKNOWN",
                "target_type": log.target_type,
                "target_id": log.target_id,
                "details": log.details,
                "timestamp": log.timestamp.isoformat() if log.timestamp else None,
            }
            for log in logs
        ],
    }
