"""Celery Application Instance for HireGenie AI Durable Job Queue."""
import os
from celery import Celery

# Fetch Redis URLs from environment or fallback defaults
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", REDIS_URL)
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", REDIS_URL)

# Check if durable queue is explicitly enabled or if eager mode is requested
DURABLE_ENABLED = os.getenv("DURABLE_QUEUE_ENABLED", "false").lower() in ("true", "1", "yes")
EAGER_SETTING = os.getenv("CELERY_TASK_ALWAYS_EAGER", None)

if EAGER_SETTING is not None:
    CELERY_TASK_ALWAYS_EAGER = EAGER_SETTING.lower() in ("true", "1", "yes")
else:
    CELERY_TASK_ALWAYS_EAGER = not DURABLE_ENABLED

CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", REDIS_URL)
if CELERY_TASK_ALWAYS_EAGER:
    CELERY_RESULT_BACKEND = "cache+memory://"
else:
    CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", REDIS_URL)

celery_app = Celery(
    "hiregenie_workers",
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND,
    include=["app.workers.tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,       # 5 min hard limit
    task_soft_time_limit=240,  # 4 min soft limit
    task_always_eager=CELERY_TASK_ALWAYS_EAGER,
    task_eager_propagates=True,
    result_expires=3600,       # Expire task results after 1 hour
)
