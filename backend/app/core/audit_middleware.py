"""Audit Middleware — auto-logs all API requests with user context."""
import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response
from app.core.logger import logger


class AuditMiddleware(BaseHTTPMiddleware):
    """Middleware that logs all API requests with timing and user context."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        start_time = time.time()

        # Extract client IP
        client_ip = request.client.host if request.client else "unknown"

        # Extract user info from authorization header if present
        auth_header = request.headers.get("authorization", "")
        user_hint = "anonymous"
        if auth_header.startswith("Bearer ") or auth_header.startswith("bearer "):
            token = auth_header.split(" ", 1)[1]
            # Just log token presence, don't decode here to avoid DB access in middleware
            user_hint = f"token:{token[:20]}..."

        # Process request
        response = await call_next(request)

        # Calculate duration
        duration_ms = round((time.time() - start_time) * 1000, 2)

        # Log the request
        logger.info(
            f"[AUDIT] {request.method} {request.url.path} | "
            f"Status: {response.status_code} | "
            f"Duration: {duration_ms}ms | "
            f"IP: {client_ip} | "
            f"User: {user_hint}"
        )

        # Add timing header for transparency
        response.headers["X-Process-Time-Ms"] = str(duration_ms)

        return response
