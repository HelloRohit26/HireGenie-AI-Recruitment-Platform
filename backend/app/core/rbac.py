"""Role-Based Access Control (RBAC) — dependency injection for endpoint protection."""
from typing import List
from functools import wraps
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.auth import decode_access_token
from app.db.session import get_db
from app.models.models import User, UserRole

security = HTTPBearer()
security_optional = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Extract and validate current user from JWT token."""
    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
        )

    user = db.query(User).filter(User.email == payload.get("sub")).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated.",
        )

    return user


def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(security_optional),
    db: Session = Depends(get_db),
):
    """Optionally extract user without throwing HTTP 401 if unauthenticated."""
    if not credentials or not credentials.credentials:
        return None
    payload = decode_access_token(credentials.credentials)
    if not payload:
        return None
    return db.query(User).filter(User.email == payload.get("sub")).first()


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Ensures user is active."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated.",
        )
    return current_user


def require_role(*allowed_roles: UserRole):
    """Dependency factory — restricts endpoint access to specific roles.
    
    Usage:
        @router.get("/admin-only", dependencies=[Depends(require_role(UserRole.ADMIN))])
        def admin_endpoint():
            ...
    """
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[r.value for r in allowed_roles]}",
            )
        return current_user
    return role_checker


def require_recruiter_or_admin(current_user: User = Depends(get_current_user)) -> User:
    """Shortcut dependency for recruiter or admin access."""
    if current_user.role not in (UserRole.RECRUITER, UserRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Recruiter or Admin access required.",
        )
    return current_user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Shortcut dependency for admin-only access."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )
    return current_user


def require_candidate_ownership(application_candidate_id: int):
    """Ensures the current user is the candidate who owns the application."""
    def checker(current_user: User = Depends(get_current_user)):
        if current_user.role == UserRole.CANDIDATE and current_user.id != application_candidate_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only access your own application data.",
            )
        return current_user
    return checker
