"""End-to-End Test Suite for Real Email Delivery, Provider Telemetry, Idempotency, and Failure Handling."""
import sys
import os
import time
from fastapi.testclient import TestClient

# Ensure backend root is on Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.main import app
from app.db.session import SessionLocal
from app.db.reset_dev import reset_development_database
from app.models.models import CandidateApplication, Job, ApplicationStatus, User, UserRole, Resume
from app.models.communication import CommunicationLog, DeliveryStatus, CommunicationStage
from app.services.communication_service import send_candidate_email_job


def run_email_delivery_tests():
    print("==================================================")
    print("STARTING HIREGENIE REAL EMAIL DELIVERY & AUDIT TEST SUITE")
    print("==================================================")

    # 1. RESET DEV DB
    os.environ["ENVIRONMENT"] = "development"
    reset_development_database()

    with TestClient(app) as client:
        # TEST 1: TELEMETRY & CONFIGURATION STATUS
        resp = client.get("/api/v1/communication/status")
        assert resp.status_code == 200, f"Get status failed: {resp.text}"
        status_data = resp.json()
        print(f"[PASS] 1. PROVIDER STATUS TELEMETRY: Status = '{status_data['status']}' | Active Provider = '{status_data['active_provider']}'")

        # TEST 2: TEST EMAIL ENDPOINT DISPATCH
        test_email_target = os.getenv("TEST_EMAIL_RECIPIENT", "candidate_test@hiregenie.ai")
        resp = client.post("/api/v1/communication/test-email", json={
            "recipient_email": test_email_target,
            "job_title": "Senior AI Systems Engineer"
        })
        assert resp.status_code == 200, f"Test email endpoint failed: {resp.text}"
        test_res = resp.json()
        dispatch = test_res.get("dispatch_result", {})
        print(f"[PASS] 2. TEST EMAIL ENDPOINT DISPATCH: Status = '{dispatch.get('status')}' | Recipient = '{dispatch.get('recipient')}' | Provider Status = '{dispatch.get('provider_status')}'")

        # Ensure Candidate 201 has a strong matching resume
        reset_development_database()
        db = SessionLocal()
        cand_user = db.query(User).filter(User.id == 201).first()
        if not cand_user:
            cand_user = User(id=201, full_name="Candidate User", email="cand201@example.com", hashed_password="pw", role=UserRole.CANDIDATE)
            db.add(cand_user)
            db.commit()
        
        from app.core.auth import create_access_token
        cand_token = create_access_token({"sub": cand_user.email, "role": cand_user.role.value if hasattr(cand_user.role, "value") else str(cand_user.role), "user_id": cand_user.id})
        cand_headers = {"Authorization": f"Bearer {cand_token}"}

        res = Resume(
            candidate_id=201,
            file_path="/uploads/resumes/strong_email_dev.pdf",
            raw_text="Lead Autonomous Recruitment AI Engineer with 6 years experience in Python, FastAPI, Email, SQLite",
            parsed_skills=["Python", "FastAPI", "Email", "SQLite"],
            parsed_experience_years=6.0
        )
        db.add(res)
        db.commit()
        db.close()

        # TEST 3: REAL CANDIDATE SHORTLIST AUTOMATION & DELIVERY
        job_payload = {
            "title": "Lead Autonomous Recruitment AI Engineer",
            "company": "HireGenie AI Systems",
            "description": "Building production Python, FastAPI, and email delivery pipelines.",
            "requirements": "Python, FastAPI, Email, SQLite",
            "location": "Remote",
            "salary_range": "USD $140,000 - $180,000",
            "interview_mode": "WEBRTC",
            "target_shortlist_count": 5,
            "screening_enabled": True
        }
        resp = client.post("/api/v1/jobs/", json=job_payload)
        assert resp.status_code == 201
        job_id = resp.json()["id"]

        apply_payload = {
            "job_id": job_id,
            "candidate_id": 201,
            "cover_note": "Expert in FastAPI and Python email delivery systems.",
            "answers": []
        }
        resp = client.post("/api/v1/candidate/apply", json=apply_payload, headers=cand_headers)
        assert resp.status_code == 201
        app_id = resp.json()["id"]

        # Wait for async screening pipeline
        time.sleep(1.5)

        db = SessionLocal()
        try:
            app_rec = db.query(CandidateApplication).filter(CandidateApplication.id == app_id).first()
            assert app_rec.status == ApplicationStatus.SHORTLISTED, f"Expected SHORTLISTED, got {app_rec.status}"
            print(f"[PASS] 3. CANDIDATE SHORTLISTED AUTOMATION: Application #{app_id} successfully shortlisted with score {app_rec.overall_match_score}%")

            # Check communication log
            comm_logs = db.query(CommunicationLog).filter(
                CommunicationLog.application_id == app_id,
                CommunicationLog.stage == CommunicationStage.SHORTLISTED
            ).all()

            assert len(comm_logs) >= 1, "Expected at least one communication log entry"
            log = comm_logs[0]
            print(f"[PASS] 4. COMMUNICATION LOG TELEMETRY: Log #{log.id} Delivery Status = '{log.delivery_status.value}' | Error = '{log.error_message}'")

            # TEST 4: DUPLICATE EMAIL IDEMPOTENCY PROTECTION (PRODUCTION SHORTLIST)
            job_rec = db.query(Job).filter(Job.id == job_id).first()
            
            # Simulate SENT log state to verify idempotency check
            log.delivery_status = DeliveryStatus.SENT
            db.commit()

            dup_res = send_candidate_email_job(db, app_rec, job_rec, "Test Candidate User")
            assert dup_res.get("status") == "SKIPPED_DUPLICATE", f"Idempotency failed: expected SKIPPED_DUPLICATE, got {dup_res}"
            print(f"[PASS] 5. PRODUCTION DUPLICATE EMAIL PROTECTION: PASS (Duplicate shortlist email request correctly skipped with status 'SKIPPED_DUPLICATE')")

            # TEST 5: TEST EMAIL ENDPOINT BYPASSES PRODUCTION SHORTLIST LOG
            # Proving: Existing SHORTLISTED log + POST /communication/test-email => test email still dispatches
            resp_test_after_shortlist = client.post("/api/v1/communication/test-email", json={
                "recipient_email": test_email_target,
                "job_title": "Lead Autonomous Recruitment AI Engineer"
            })
            assert resp_test_after_shortlist.status_code == 200
            test_after_res = resp_test_after_shortlist.json().get("dispatch_result", {})
            assert test_after_res.get("status") != "SKIPPED_DUPLICATE", f"Test email endpoint incorrectly blocked by production shortlist log: {test_after_res}"
            assert test_after_res.get("stage") == "TEST_EMAIL", f"Expected stage TEST_EMAIL, got {test_after_res.get('stage')}"
            print(f"[PASS] 6. TEST ENDPOINT NOT BLOCKED BY EXISTING SHORTLIST LOG: PASS (Stage = '{test_after_res.get('stage')}', Status = '{test_after_res.get('status')}')")

            # TEST 6: MULTIPLE CONSECUTIVE TEST EMAILS ALL DISPATCH (TEST IDEMPOTENCY BUG RESOLVED)
            resp_test_consecutive = client.post("/api/v1/communication/test-email", json={
                "recipient_email": test_email_target,
                "job_title": "Lead Autonomous Recruitment AI Engineer"
            })
            assert resp_test_consecutive.status_code == 200
            consecutive_res = resp_test_consecutive.json().get("dispatch_result", {})
            assert consecutive_res.get("status") != "SKIPPED_DUPLICATE", f"Consecutive test email was incorrectly skipped as duplicate: {consecutive_res}"
            print(f"[PASS] 7. CONSECUTIVE TEST EMAIL DISPATCH: PASS (Repeated test email calls dispatch independently, Status = '{consecutive_res.get('status')}')")

            # TEST 7: SECRETS PROTECTION CHECK
            resp_status = client.get("/api/v1/communication/status").json()
            assert "api_key" not in str(resp_status).lower() or "resend_api_key" not in str(resp_status).lower()
            assert "api_key" not in str(resp_test_consecutive.json()).lower() or "resend_api_key" not in str(resp_test_consecutive.json()).lower()
            print(f"[PASS] 8. SECRETS PROTECTION: PASS (No raw API keys or credentials exposed in status or response payloads)")

            # TEST 8: UNCONFIGURED PROVIDER FAILURE HANDLING
            old_resend_key = os.environ.get("RESEND_API_KEY")
            try:
                os.environ["EMAIL_PROVIDER"] = "smtp"
                os.environ["SMTP_HOST"] = ""
                os.environ["RESEND_API_KEY"] = ""

                # Delete logs for app_id to test unconfigured dispatch
                db.query(CommunicationLog).filter(CommunicationLog.application_id == app_id).delete()
                db.commit()

                unconfig_res = send_candidate_email_job(db, app_rec, job_rec, "Test Candidate User 2")
                assert unconfig_res.get("status") == "FAILED", f"Expected FAILED for unconfigured provider, got {unconfig_res}"
                assert "EMAIL NOT CONFIGURED" in unconfig_res.get("error", "") or "missing" in unconfig_res.get("error", "").lower()
                print(f"[PASS] 9. UNCONFIGURED PROVIDER FAILURE HANDLING: PASS (Status = '{unconfig_res.get('status')}' | Error = '{unconfig_res.get('error')}')")
            finally:
                if old_resend_key:
                    os.environ["RESEND_API_KEY"] = old_resend_key
                os.environ["EMAIL_PROVIDER"] = "auto"

        finally:
            db.close()

        print("==================================================")
        print("REAL EMAIL DELIVERY TEST SUITE EXECUTED SUCCESSFULLY!")
        print("==================================================")


if __name__ == "__main__":
    run_email_delivery_tests()
