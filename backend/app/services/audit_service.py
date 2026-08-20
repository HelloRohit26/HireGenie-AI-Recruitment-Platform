"""Audit Service — centralized logging for all AI decisions, user actions, and system events."""
from datetime import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.audit import AuditLog, ActorType, AuditAction


class AuditService:
    """Centralized audit logging service used across all agents and endpoints."""

    @staticmethod
    def log(
        db: Session,
        actor_type: ActorType,
        actor_name: str,
        action: AuditAction,
        target_type: Optional[str] = None,
        target_id: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
    ) -> AuditLog:
        """Record an audit entry."""
        entry = AuditLog(
            actor_type=actor_type,
            actor_name=actor_name,
            action=action,
            target_type=target_type,
            target_id=target_id,
            details=details or {},
            ip_address=ip_address,
            timestamp=datetime.utcnow(),
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry

    @staticmethod
    def log_no_commit(
        db: Session,
        actor_type: ActorType,
        actor_name: str,
        action: AuditAction,
        target_type: Optional[str] = None,
        target_id: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> AuditLog:
        """Record an audit entry without committing — caller controls transaction."""
        entry = AuditLog(
            actor_type=actor_type,
            actor_name=actor_name,
            action=action,
            target_type=target_type,
            target_id=target_id,
            details=details or {},
            timestamp=datetime.utcnow(),
        )
        db.add(entry)
        return entry

    @staticmethod
    def get_logs(
        db: Session,
        actor_type: Optional[str] = None,
        action: Optional[str] = None,
        target_type: Optional[str] = None,
        target_id: Optional[int] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[AuditLog]:
        """Query audit logs with optional filters."""
        query = db.query(AuditLog)

        if actor_type:
            query = query.filter(AuditLog.actor_type == actor_type)
        if action:
            query = query.filter(AuditLog.action == action)
        if target_type:
            query = query.filter(AuditLog.target_type == target_type)
        if target_id:
            query = query.filter(AuditLog.target_id == target_id)

        return query.order_by(desc(AuditLog.timestamp)).offset(offset).limit(limit).all()

    @staticmethod
    def get_candidate_trail(db: Session, application_id: int) -> List[AuditLog]:
        """Get complete audit trail for a specific candidate application."""
        return (
            db.query(AuditLog)
            .filter(
                AuditLog.target_type == "APPLICATION",
                AuditLog.target_id == application_id,
            )
            .order_by(AuditLog.timestamp)
            .all()
        )

    @staticmethod
    def get_agent_decisions(db: Session, limit: int = 100) -> List[AuditLog]:
        """Get all AI agent decisions."""
        return (
            db.query(AuditLog)
            .filter(AuditLog.actor_type == ActorType.AI_AGENT)
            .order_by(desc(AuditLog.timestamp))
            .limit(limit)
            .all()
        )
