"""Celery Worker Tasks for HireGenie AI.
All tasks delegate business logic directly to existing service layers:
- screening_pipeline.py
- evaluation_service.py
- communication_agent.py / email_provider.py
No business logic is duplicated. Secrets are isolated from task payloads.
"""
import os
from datetime import datetime
from celery.utils.log import get_task_logger
from app.workers.celery_app import celery_app
from app.db.session import SessionLocal
from app.models.models import CandidateApplication, ApplicationStatus, InterviewEvaluation, EvaluationStatus
from app.models.communication import CommunicationLog, DeliveryStatus
from app.services.screening_pipeline import process_candidate_screening_async
from app.services.evaluation_service import run_interview_evaluation_task
from app.services.email_provider import send_real_email, get_email_provider_status

logger = get_task_logger(__name__)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=5)
def screen_application_task(self, application_id: int):
    """Durable Celery task for candidate application AI screening & ranking.
    Idempotent & calls existing screening_pipeline service.
    """
    db = SessionLocal()
    task_id = self.request.id or "local"
    retry_num = self.request.retries
    logger.info(f"⚙️ [CELERY SCREENING TASK] Start | TaskID: {task_id} | App #{application_id} | Attempt: {retry_num + 1}")

    try:
        app = db.query(CandidateApplication).filter(CandidateApplication.id == application_id).first()
        if not app:
            logger.error(f"❌ [CELERY SCREENING TASK] Application #{application_id} not found.")
            return {"status": "FAILED", "reason": "Application not found"}

        # Idempotency check: Skip if already evaluated
        if app.status in [ApplicationStatus.SHORTLISTED, ApplicationStatus.REJECTED]:
            logger.info(f"ℹ️ [CELERY SCREENING TASK] App #{application_id} already in terminal state '{app.status}'. Skipping.")
            return {"status": "SKIPPED", "app_status": app.status.value}

        job_id = app.job_id
        db.close()

        # Delegate business logic execution to existing service
        process_candidate_screening_async(application_id, job_id)

        # Re-fetch app to verify completed state
        db = SessionLocal()
        app_after = db.query(CandidateApplication).filter(CandidateApplication.id == application_id).first()
        final_status = app_after.status.value if app_after else "UNKNOWN"
        logger.info(f"✅ [CELERY SCREENING TASK] Completed | App #{application_id} | Final State: {final_status}")

        return {"status": "COMPLETED", "application_id": application_id, "final_state": final_status}

    except Exception as exc:
        logger.error(f"⚠️ [CELERY SCREENING TASK] Exception for App #{application_id}: {str(exc)}")
        db_err = SessionLocal()
        try:
            app_err = db_err.query(CandidateApplication).filter(CandidateApplication.id == application_id).first()
            if app_err:
                app_err.rejection_reason = f"Screening worker error (attempt {retry_num + 1}): {str(exc)}"
                db_err.commit()
        except Exception:
            pass
        finally:
            db_err.close()

        if retry_num < self.max_retries:
            countdown = 2 ** retry_num * 5
            raise self.retry(exc=exc, countdown=countdown)
        else:
            db_fail = SessionLocal()
            try:
                app_fail = db_fail.query(CandidateApplication).filter(CandidateApplication.id == application_id).first()
                if app_fail and app_fail.status not in [ApplicationStatus.SHORTLISTED, ApplicationStatus.REJECTED]:
                    app_fail.status = ApplicationStatus.FAILED
                    db_fail.commit()
            except Exception:
                pass
            finally:
                db_fail.close()
            return {"status": "FAILED", "error": str(exc), "retries_exhausted": True}
    finally:
        db.close()


@celery_app.task(bind=True, max_retries=3, default_retry_delay=5)
def evaluate_interview_task(self, application_id: int, session_id: int):
    """Durable Celery task for post-interview evaluation agent execution.
    Idempotent & calls existing evaluation_service.
    """
    db = SessionLocal()
    task_id = self.request.id or "local"
    retry_num = self.request.retries
    logger.info(f"⚙️ [CELERY EVALUATION TASK] Start | TaskID: {task_id} | App #{application_id} | Session #{session_id} | Attempt: {retry_num + 1}")

    try:
        eval_rec = db.query(InterviewEvaluation).filter(
            InterviewEvaluation.application_id == application_id,
            InterviewEvaluation.interview_session_id == session_id
        ).first()

        if not eval_rec:
            # Create pending evaluation record if missing
            session_rec = db.query(CandidateApplication).filter(CandidateApplication.id == application_id).first()
            candidate_id = session_rec.candidate_id if session_rec else 1
            job_id = session_rec.job_id if session_rec else 1

            eval_rec = InterviewEvaluation(
                application_id=application_id,
                candidate_id=candidate_id,
                job_id=job_id,
                interview_session_id=session_id,
                status=EvaluationStatus.PENDING,
                created_at=datetime.utcnow()
            )
            db.add(eval_rec)
            db.commit()
            db.refresh(eval_rec)

        # Idempotency check: Skip if already completed successfully
        if eval_rec.status == EvaluationStatus.COMPLETED:
            logger.info(f"ℹ️ [CELERY EVALUATION TASK] Evaluation #{eval_rec.id} already COMPLETED. Skipping.")
            return {"status": "SKIPPED", "eval_id": eval_rec.id}

        eval_id = eval_rec.id
        db.close()

        # Delegate business logic execution to existing service
        run_interview_evaluation_task(eval_id)

        # Verify output state
        db = SessionLocal()
        eval_after = db.query(InterviewEvaluation).filter(InterviewEvaluation.id == eval_id).first()
        final_status = eval_after.status.value if eval_after else "UNKNOWN"
        logger.info(f"✅ [CELERY EVALUATION TASK] Completed | Eval #{eval_id} | Final State: {final_status}")

        return {"status": "COMPLETED", "eval_id": eval_id, "final_state": final_status}

    except Exception as exc:
        logger.error(f"⚠️ [CELERY EVALUATION TASK] Exception for App #{application_id}, Session #{session_id}: {str(exc)}")
        db_err = SessionLocal()
        try:
            eval_err = db_err.query(InterviewEvaluation).filter(
                InterviewEvaluation.application_id == application_id,
                InterviewEvaluation.interview_session_id == session_id
            ).first()
            if eval_err:
                eval_err.error_message = f"Worker evaluation error (attempt {retry_num + 1}): {str(exc)}"
                db_err.commit()
        except Exception:
            pass
        finally:
            db_err.close()

        if retry_num < self.max_retries:
            countdown = 2 ** retry_num * 5
            raise self.retry(exc=exc, countdown=countdown)
        else:
            db_fail = SessionLocal()
            try:
                eval_fail = db_fail.query(InterviewEvaluation).filter(
                    InterviewEvaluation.application_id == application_id,
                    InterviewEvaluation.interview_session_id == session_id
                ).first()
                if eval_fail and eval_fail.status != EvaluationStatus.COMPLETED:
                    eval_fail.status = EvaluationStatus.FAILED
                    db_fail.commit()
            except Exception:
                pass
            finally:
                db_fail.close()
            return {"status": "FAILED", "error": str(exc), "retries_exhausted": True}
    finally:
        db.close()


@celery_app.task(bind=True, max_retries=3, default_retry_delay=5)
def send_email_task(self, communication_id: int):
    """Durable Celery task for email delivery.
    Reads persisted CommunicationLog record (QUEUED) -> SENDING -> SENT/FAILED.
    """
    db = SessionLocal()
    task_id = self.request.id or "local"
    retry_num = self.request.retries
    logger.info(f"⚙️ [CELERY EMAIL TASK] Start | TaskID: {task_id} | Log #{communication_id} | Attempt: {retry_num + 1}")

    try:
        comm_log = db.query(CommunicationLog).filter(CommunicationLog.id == communication_id).first()
        if not comm_log:
            logger.error(f"❌ [CELERY EMAIL TASK] Communication log #{communication_id} not found.")
            return {"status": "FAILED", "reason": "Communication log not found"}

        # Idempotency check: Skip if already SENT or DELIVERED
        if comm_log.delivery_status in [DeliveryStatus.SENT, DeliveryStatus.DELIVERED]:
            logger.info(f"ℹ️ [CELERY EMAIL TASK] Communication #{communication_id} already {comm_log.delivery_status.value}. Skipping.")
            return {"status": "SKIPPED", "delivery_status": comm_log.delivery_status.value}

        # Transition state: QUEUED -> SENDING
        comm_log.delivery_status = DeliveryStatus.SENDING
        comm_log.retry_count = retry_num
        db.commit()

        recipient_email = comm_log.recipient_email
        subject = comm_log.subject
        body = comm_log.body

        provider_status_dict = get_email_provider_status()

        if not provider_status_dict["configured"]:
            error_msg = provider_status_dict["unconfigured_reason"] or "EMAIL NOT CONFIGURED"
            comm_log.delivery_status = DeliveryStatus.FAILED
            comm_log.error_message = error_msg
            db.commit()
            logger.warning(f"⚠️ [CELERY EMAIL TASK] Provider unconfigured for Log #{communication_id}: {error_msg}")
            return {"status": "FAILED", "error": error_msg, "provider_status": "EMAIL NOT CONFIGURED"}

        # Attempt delivery via active provider with rich HTML body
        html_body = comm_log.extra_metadata.get("body_html") if (comm_log.extra_metadata and isinstance(comm_log.extra_metadata, dict)) else None

        success, error_msg, provider_msg_id = send_real_email(
            to_email=recipient_email,
            subject=subject,
            body_text=body,
            body_html=html_body
        )

        if success:
            comm_log.delivery_status = DeliveryStatus.SENT
            comm_log.sent_at = datetime.utcnow()
            comm_log.error_message = None
            db.commit()
            logger.info(f"📧 [CELERY EMAIL TASK] Stage: {comm_log.stage.value} | SENT to: {recipient_email} | Provider ID: {provider_msg_id}")
            return {"status": "SENT", "communication_id": communication_id, "provider_msg_id": provider_msg_id}
        else:
            comm_log.delivery_status = DeliveryStatus.FAILED
            comm_log.error_message = error_msg or "Delivery failed via email provider"
            db.commit()

            is_eager = getattr(celery_app.conf, "task_always_eager", False)
            if not is_eager and retry_num < self.max_retries:
                countdown = 2 ** retry_num * 5
                raise self.retry(exc=RuntimeError(error_msg), countdown=countdown)
            return {"status": "FAILED", "error": error_msg, "retries_exhausted": True}

    except Exception as exc:
        if "Retry" in type(exc).__name__:
            raise exc
        logger.error(f"⚠️ [CELERY EMAIL TASK] Exception for Log #{communication_id}: {str(exc)}")
        db_err = SessionLocal()
        try:
            comm_err = db_err.query(CommunicationLog).filter(CommunicationLog.id == communication_id).first()
            if comm_err:
                comm_err.delivery_status = DeliveryStatus.FAILED
                comm_err.error_message = f"Email worker error (attempt {retry_num + 1}): {str(exc)}"
                comm_err.retry_count = retry_num + 1
                db_err.commit()
        except Exception:
            pass
        finally:
            db_err.close()

        is_eager = getattr(celery_app.conf, "task_always_eager", False)
        if not is_eager and retry_num < self.max_retries:
            countdown = 2 ** retry_num * 5
            raise self.retry(exc=exc, countdown=countdown)
        return {"status": "FAILED", "error": str(exc), "retries_exhausted": True}
    finally:
        db.close()
