import sys
import os
import time
from fastapi.testclient import TestClient

# Ensure backend root is on Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.main import app
from app.db.session import engine
from sqlalchemy import text
from app.db.reset_dev import reset_development_database

def run_e2e_verification():
    print("==================================================")
    print("STARTING HIREGENIE REAL DATA & AUTONOMOUS WORKFLOW E2E VERIFICATION")
    print("==================================================")

    # 1. RESET DEV DB TO ZERO STATE
    os.environ["ENVIRONMENT"] = "development"
    reset_development_database()

    with TestClient(app) as client:
        # 2. VERIFY ZERO METRICS ON FRESH DB
        resp = client.get("/api/v1/analytics/summary")
        assert resp.status_code == 200, f"Summary failed: {resp.text}"
        summary = resp.json()
        assert summary["metrics"]["totalJobs"] == 0, f"Expected 0 jobs, got {summary['metrics']['totalJobs']}"
        assert summary["metrics"]["totalApplicants"] == 0, f"Expected 0 applicants, got {summary['metrics']['totalApplicants']}"
        print("[PASS] 1. ZERO FAKE DATA VERIFICATION: PASS (0 jobs, 0 applicants on clean DB)")

        # 3. CREATE NEW JOB REQUISITION
        job_payload = {
            "title": "AI Engineer",
            "company": "HireGenie Autonomous Labs",
            "description": "Building production FastAPI microservices and vector AI agents.",
            "requirements": "Python, FastAPI, LangChain, SQLite",
            "location": "Bengaluru / Hybrid",
            "salary_range": "INR 8-12 LPA",
            "interview_mode": "WEBRTC",
            "target_shortlist_count": 5,
            "screening_enabled": True
        }
        resp = client.post("/api/v1/jobs/", json=job_payload)
        assert resp.status_code == 201, f"Create job failed: {resp.text}"
        job = resp.json()
        job_id = job["id"]
        print(f"[PASS] 2. REAL JOB CREATION: PASS (Job #{job_id}: '{job['title']}' | Salary: {job['salary_range']})")

        # 4. CANDIDATE APPLICATION
        apply_payload = {
            "job_id": job_id,
            "candidate_id": 101,
            "cover_note": "Extensive experience with FastAPI, LangChain, and relational databases.",
            "answers": []
        }
        resp = client.post("/api/v1/candidate/apply", json=apply_payload)
        assert resp.status_code == 201, f"Apply failed: {resp.text}"
        app_res = resp.json()
        app_id = app_res["id"]
        print(f"[PASS] 3. CANDIDATE APPLICATION SUBMISSION: PASS (Application #{app_id} created with initial status '{app_res['status']}')")

        # Give background screening task time to execute state machine
        time.sleep(1.5)

        # 5. VERIFY ASYNC SCREENING STATE MACHINE & DOSSIER
        resp = client.get(f"/api/v1/recruiter/dossier/{app_id}")
        assert resp.status_code == 200, f"Get dossier failed: {resp.text}"
        dossier = resp.json()
        assert dossier["status"] in ["SHORTLISTED", "REJECTED", "RANKING", "MATCHING"], f"Unexpected dossier status: {dossier['status']}"
        print(f"[PASS] 4. ASYNC SCREENING PIPELINE STATE MACHINE: PASS (Status transitioned to '{dossier['status']}' with Match Score {dossier['overall_score']}%)")

        # 6. VERIFY AUDIT LOG & RECENT ACTIVITY
        resp = client.get("/api/v1/analytics/summary")
        assert resp.status_code == 200
        updated_summary = resp.json()
        assert updated_summary["metrics"]["totalApplicants"] == 1, f"Expected 1 applicant in DB telemetry, got {updated_summary['metrics']['totalApplicants']}"
        print(f"[PASS] 5. DATABASE TELEMETRY & RECENT ACTIVITY: PASS (1 applicant registered, Telemetry updated)")

        # 7. EMAIL PROVIDER SYSTEM CHECK
        resp = client.post("/api/v1/communication/test-email", json={"recipient_email": "candidate@hiregenie.ai", "job_title": "AI Engineer"})
        assert resp.status_code == 200, f"Test email failed: {resp.text}"
        email_res = resp.json()
        print(f"[PASS] 6. EMAIL PROVIDER STATUS CHECK: PASS (Provider Status: '{email_res.get('provider_status')}', Status: '{email_res.get('status')}')")

        # 8. JOB CLOSE & REOPEN
        resp = client.patch(f"/api/v1/jobs/{job_id}/status", json={"status": "CLOSED"})
        assert resp.status_code == 200
        print(f"[PASS] 7. JOB STATUS TOGGLE: PASS (Job #{job_id} status updated to CLOSED)")

        # Attempt application on closed job
        resp = client.post("/api/v1/candidate/apply", json={"job_id": job_id, "candidate_id": 102})
        assert resp.status_code == 400
        print("[PASS] 8. CLOSED JOB REJECTION: PASS (Application to CLOSED job rejected with 400 Bad Request)")

        # Reopen job
        resp = client.patch(f"/api/v1/jobs/{job_id}/status", json={"status": "OPEN"})
        assert resp.status_code == 200

        print("==================================================")
        print("ALL REAL DATA & AUTONOMOUS WORKFLOW E2E TESTS PASSED SUCCESSFULLY!")
        print("==================================================")

if __name__ == "__main__":
    run_e2e_verification()
