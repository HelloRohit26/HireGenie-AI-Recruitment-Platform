"""Comprehensive Automated Test Suite for STEP 2 — Real Candidate Apply -> Application Tracking.
Validates:
1. Candidate A registration, JWT login, and job application submission.
2. PostgreSQL / SQLAlchemy database row creation (candidate_applications).
3. POST /candidate/apply API response contract and database timestamp (applied_at).
4. GET /candidate/applications returns candidate applications with associated job details.
5. Candidate A vs Candidate B data isolation (Candidate B cannot see Candidate A applications).
6. Controlled duplicate application prevention (HTTP 409 Conflict).
7. Cross-candidate application tracker protection (HTTP 403 Forbidden).
8. Unauthenticated endpoint protection (HTTP 401 Unauthorized).
"""

import sys
import os

# Set test environment to development before app import
os.environ["ENVIRONMENT"] = "development"
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.db.reset_dev import reset_development_database
from app.models.models import User, UserRole, Job, CandidateApplication, ApplicationStatus

client = TestClient(app)


def run_candidate_application_tracking_tests():
    print("=" * 70)
    print("STARTING HIREGENIE STEP 2 — CANDIDATE APPLICATION TRACKING TEST SUITE")
    print("=" * 70)

    # 0. Clean DB Initialization
    os.environ["ENVIRONMENT"] = "development"
    reset_development_database()

    # 1. REGISTER CANDIDATE A & CANDIDATE B
    print("\n--- 1. REGISTERING CANDIDATE A & CANDIDATE B ---")
    reg_a = client.post("/api/v1/auth/register", json={
        "full_name": "Anita Sharma",
        "email": "anita.sharma@example.com",
        "password": "Password123!",
        "role": "CANDIDATE"
    })
    assert reg_a.status_code == 201, f"Candidate A registration failed: {reg_a.text}"
    cand_a_id = reg_a.json()["id"]
    print(f"[PASS] Candidate A registered (User ID #{cand_a_id}).")

    reg_b = client.post("/api/v1/auth/register", json={
        "full_name": "Bikram Patel",
        "email": "bikram.patel@example.com",
        "password": "Password123!",
        "role": "CANDIDATE"
    })
    assert reg_b.status_code == 201, f"Candidate B registration failed: {reg_b.text}"
    cand_b_id = reg_b.json()["id"]
    print(f"[PASS] Candidate B registered (User ID #{cand_b_id}).")

    # 2. AUTHENTICATE CANDIDATE A & CANDIDATE B
    print("\n--- 2. AUTHENTICATING CANDIDATE A & CANDIDATE B ---")
    login_a = client.post("/api/v1/auth/login", json={
        "email": "anita.sharma@example.com",
        "password": "Password123!"
    })
    assert login_a.status_code == 200
    token_a = login_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    login_b = client.post("/api/v1/auth/login", json={
        "email": "bikram.patel@example.com",
        "password": "Password123!"
    })
    assert login_b.status_code == 200
    token_b = login_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}
    print("[PASS] Candidate A & B authenticated with JWT Bearer tokens.")

    # 3. CREATE JOB REQUISITION
    print("\n--- 3. CREATING JOB REQUISITION ---")
    job_res = client.post("/api/v1/jobs/", json={
        "title": "Staff AI Engineer",
        "company": "HireGenie Enterprise",
        "description": "Building production LLM agents and FastAPI services.",
        "requirements": "Python, FastAPI, PostgreSQL, Redis",
        "location": "Bengaluru, India (Hybrid)",
        "salary_range": "₹35,000,000 - ₹45,000,000",
        "interview_mode": "WEBRTC",
        "target_shortlist_count": 5,
        "screening_enabled": True
    })
    assert job_res.status_code == 201
    job_id = job_res.json()["id"]
    print(f"[PASS] Job Requisition #{job_id} ('Staff AI Engineer') created.")

    # 4. CANDIDATE A APPLIES TO JOB A
    print("\n--- 4. CANDIDATE A SUBMITS JOB APPLICATION ---")
    apply_res = client.post("/api/v1/candidate/apply", headers=headers_a, json={
        "job_id": job_id,
        "cover_note": "Experienced Python & AI Engineer ready to contribute."
    })
    assert apply_res.status_code == 201, f"Application failed: {apply_res.text}"
    app_data = apply_res.json()

    assert app_data["job_id"] == job_id
    assert app_data["candidate_id"] == cand_a_id
    assert app_data["status"] in ("APPLIED", "RECEIVED", "SHORTLISTED", "SCREENING")
    assert "applied_at" in app_data and app_data["applied_at"] is not None
    app_id = app_data["id"]
    print(f"[PASS] Application #{app_id} created for Candidate A. Applied date: {app_data['applied_at']}.")

    # 5. DATABASE ROW PERSISTENCE VERIFICATION
    print("\n--- 5. VERIFYING DATABASE ROW PERSISTENCE ---")
    db = SessionLocal()
    try:
        db_app = db.query(CandidateApplication).filter(CandidateApplication.id == app_id).first()
        assert db_app is not None, "Application row not found in database!"
        assert db_app.candidate_id == cand_a_id
        assert db_app.job_id == job_id
        assert db_app.applied_at is not None
        print(f"[PASS] Database row verified: ID #{db_app.id}, Candidate #{db_app.candidate_id}, Job #{db_app.job_id}, Timestamp: {db_app.applied_at}.")
    finally:
        db.close()

    # 6. APPLICATION TRACKING API (GET /candidate/applications)
    print("\n--- 6. VERIFYING APPLICATION TRACKING API ---")
    tracking_res = client.get("/api/v1/candidate/applications", headers=headers_a)
    assert tracking_res.status_code == 200
    apps_list = tracking_res.json()
    assert len(apps_list) == 1
    track_item = apps_list[0]
    assert track_item["id"] == app_id
    assert track_item["job_id"] == job_id
    assert "job" in track_item and track_item["job"] is not None
    assert track_item["job"]["title"] == "Staff AI Engineer"
    assert track_item["job"]["company"] == "HireGenie Enterprise"
    print(f"[PASS] GET /candidate/applications returned Candidate A's application with job details ('{track_item['job']['title']}').")

    # 7. CANDIDATE B ISOLATION
    print("\n--- 7. VERIFYING CANDIDATE B DATA ISOLATION ---")
    cand_b_apps = client.get("/api/v1/candidate/applications", headers=headers_b)
    assert cand_b_apps.status_code == 200
    assert len(cand_b_apps.json()) == 0
    print("[PASS] Candidate B sees ZERO applications (Candidate A's application is isolated).")

    # 8. DUPLICATE APPLICATION PREVENTION (HTTP 409 CONFLICT)
    print("\n--- 8. TESTING DUPLICATE APPLICATION PREVENTION ---")
    dup_apply = client.post("/api/v1/candidate/apply", headers=headers_a, json={
        "job_id": job_id,
        "cover_note": "Duplicate application attempt"
    })
    assert dup_apply.status_code == 409, f"Expected 409 Conflict, got {dup_apply.status_code}"
    print(f"[PASS] Candidate A duplicate application attempt correctly rejected with HTTP 409 Conflict.")

    # 9. CROSS-CANDIDATE ACCESS PROTECTION (HTTP 403 FORBIDDEN)
    print("\n--- 9. TESTING CROSS-CANDIDATE ACCESS PROTECTION ---")
    cross_track = client.get(f"/api/v1/candidate/track/{app_id}", headers=headers_b)
    assert cross_track.status_code == 403
    print(f"[PASS] Candidate B attempting to view Candidate A's application status rejected with HTTP 403 Forbidden.")

    # 10. UNAUTHENTICATED ENDPOINT PROTECTION (HTTP 401 UNAUTHORIZED)
    print("\n--- 10. TESTING UNAUTHENTICATED PROTECTION ---")
    unauth_track = client.get("/api/v1/candidate/applications")
    assert unauth_track.status_code == 401
    print(f"[PASS] Unauthenticated request to /candidate/applications rejected with HTTP 401 Unauthorized.")

    print("\n" + "=" * 70)
    print("STEP 2 CANDIDATE APPLICATION TRACKING TEST SUITE PASSED SUCCESSFULLY!")
    print("=" * 70)


if __name__ == "__main__":
    run_candidate_application_tracking_tests()
