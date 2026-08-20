"""HireGenie AI Worker Package — Celery + Redis Durable Job Queue."""
from app.workers.celery_app import celery_app

__all__ = ["celery_app"]
