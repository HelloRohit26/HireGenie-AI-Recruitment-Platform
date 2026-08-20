"""Task Dispatcher Interface for HireGenie AI.
Routes asynchronous jobs to Celery workers while enforcing durable queue checks,
environment configuration, and explicit failure reporting if Redis is unavailable in durable mode.
"""
import os
from typing import Dict, Any
from app.core.logger import logger
from app.workers.celery_app import celery_app
from app.workers.tasks import screen_application_task, evaluate_interview_task, send_email_task


def is_durable_queue_enabled() -> bool:
    """Returns True if DURABLE_QUEUE_ENABLED environment setting is active."""
    return os.getenv("DURABLE_QUEUE_ENABLED", "false").lower() in ("true", "1", "yes")


def is_redis_available() -> bool:
    """Tests connection to configured Redis broker."""
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    try:
        import redis
        client = redis.Redis.from_url(redis_url, socket_timeout=0.15)
        return bool(client.ping())
    except Exception as e:
        logger.warning(f"⚠️ [REDIS CHECK] Connection failed for {redis_url}: {e}")
        return False


def dispatch_screening_task(application_id: int) -> Dict[str, Any]:
    """Dispatches candidate screening task to durable Celery worker."""
    durable_enabled = is_durable_queue_enabled()
    is_eager = getattr(celery_app.conf, "task_always_eager", False)

    if durable_enabled and not is_eager and not is_redis_available():
        error_msg = "DURABLE WORKER QUEUE UNAVAILABLE: Redis server is offline or unreachable."
        logger.error(f"❌ {error_msg}")
        raise RuntimeError(error_msg)

    logger.info(f"🚀 [DISPATCHER] Dispatching screen_application_task for App #{application_id}")
    task_res = screen_application_task.delay(application_id)
    return {
        "queued": True,
        "task_id": str(task_res.id) if hasattr(task_res, "id") else "eager",
        "task_name": "screen_application_task",
        "application_id": application_id
    }


def dispatch_evaluation_task(application_id: int, session_id: int) -> Dict[str, Any]:
    """Dispatches post-interview evaluation task to durable Celery worker."""
    durable_enabled = is_durable_queue_enabled()
    is_eager = getattr(celery_app.conf, "task_always_eager", False)

    if durable_enabled and not is_eager and not is_redis_available():
        error_msg = "DURABLE WORKER QUEUE UNAVAILABLE: Redis server is offline or unreachable."
        logger.error(f"❌ {error_msg}")
        raise RuntimeError(error_msg)

    logger.info(f"🚀 [DISPATCHER] Dispatching evaluate_interview_task for App #{application_id}, Session #{session_id}")
    task_res = evaluate_interview_task.delay(application_id, session_id)
    return {
        "queued": True,
        "task_id": str(task_res.id) if hasattr(task_res, "id") else "eager",
        "task_name": "evaluate_interview_task",
        "application_id": application_id,
        "session_id": session_id
    }


def dispatch_email_task(communication_id: int) -> Dict[str, Any]:
    """Dispatches email delivery task to durable Celery worker."""
    durable_enabled = is_durable_queue_enabled()
    is_eager = getattr(celery_app.conf, "task_always_eager", False)

    if durable_enabled and not is_eager and not is_redis_available():
        error_msg = "DURABLE WORKER QUEUE UNAVAILABLE: Redis server is offline or unreachable."
        logger.error(f"❌ {error_msg}")
        raise RuntimeError(error_msg)

    logger.info(f"🚀 [DISPATCHER] Dispatching send_email_task for Communication Log #{communication_id}")
    task_res = send_email_task.delay(communication_id)
    return {
        "queued": True,
        "task_id": str(task_res.id) if hasattr(task_res, "id") else "eager",
        "task_name": "send_email_task",
        "communication_id": communication_id
    }
