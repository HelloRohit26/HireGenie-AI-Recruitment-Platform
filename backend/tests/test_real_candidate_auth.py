"""Comprehensive Automated Test Suite for STEP 1 — Real Candidate Authentication, JWT Tokens, and Data Isolation.
Validates:
1. Real candidate registration and JWT token login (POST /auth/register, POST /auth/login)
2. Authenticated user profile lookup (GET /auth/me)
3. Authenticated candidate job application submission (POST /candidate/apply)
4. Application ownership derived strictly from JWT identity (candidate_id)
5. Candidate A vs Candidate B data isolation (GET /candidate/applications)
6. Cross-candidate application protection (GET /candidate/track/{id} returns 403 Forbidden)
7. Unauthenticated request rejection (401 Unauthorized)
"""

import sys
import os

# Set test environment to development before app import
os.environ["ENVIRONMENT"] = "development"
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.db.reset_dev import reset_development_database
from app.models.models import User, UserRole, Job, CandidateApplication, ApplicationStatus

client = TestClient(app)


def run_candidate_auth_tests():
    print("=" * 60)
    print("STARTING HIREGENIE STEP 1 — REAL CANDIDATE AUTHENTICATION TEST SUITE")
    print("=" * 60)

    # 0. Clean DB Initialization
    os.environ["ENVIRONMENT"] = "development"
    reset_development_database()

    # 1. REGISTER CANDIDATE A & CANDIDATE B
    print("\n--- 1. REGISTERING CANDIDATE A & CANDIDATE B ---")
    reg_a = client.post("/api/v1/auth/register", json={
        "full_name": "Candidate A",
        "email": "candidate_a@example.com",
        "password": "SecurePassword123!",
        "role": "CANDIDATE"
    })
    assert reg_a.status_code == 201, f"Candidate A registration failed: {reg_a.text}"
    user_a_id = reg_a.json()["id"]
    print(f"[PASS] Candidate A registered (User ID #{user_a_id})")

    reg_b = client.post("/api/v1/auth/register", json={
        "full_name": "Candidate B",
        "email": "candidate_b@example.com",
        "password": "SecurePassword123!",
        "role": "CANDIDATE"
    })
    assert reg_b.status_code == 201, f"Candidate B registration failed: {reg_b.text}"
    user_b_id = reg_b.json()["id"]
    print(f"[PASS] Candidate B registered (User ID #{user_b_id})")

    # 2. LOGIN CANDIDATE A & CANDIDATE B
    print("\n--- 2. AUTHENTICATING CANDIDATE A & CANDIDATE B ---")
    login_a = client.post("/api/v1/auth/login", json={
        "email": "candidate_a@example.com",
        "password": "SecurePassword123!"
    })
    assert login_a.status_code == 200
    token_a = login_a.json()["access_token"]
    assert token_a is not None
    print(f"[PASS] Candidate A authenticated. Received JWT Bearer Token.")

    login_b = client.post("/api/v1/auth/login", json={
        "email": "candidate_b@example.com",
        "password": "SecurePassword123!"
    })
    assert login_b.status_code == 200
    token_b = login_b.json()["access_token"]
    assert token_b is not None
    print(f"[PASS] Candidate B authenticated. Received JWT Bearer Token.")

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 3. VERIFY AUTHENTICATED PROFILE (GET /auth/me)
    print("\n--- 3. VERIFYING AUTHENTICATED USER PROFILE (GET /auth/me) ---")
    me_a = client.get("/api/v1/auth/me", headers=headers_a)
    assert me_a.status_code == 200
    assert me_a.json()["email"] == "candidate_a@example.com"
    print(f"[PASS] Candidate A token verified: {me_a.json()['full_name']} ({me_a.json()['email']})")

    # 4. CREATE JOB REQUISITION
    print("\n--- 4. CREATING JOB REQUISITION ---")
    job_res = client.post("/api/v1/jobs/", json={
        "title": "Lead Distributed Systems Engineer",
        "company": "HireGenie AI Systems",
        "description": "Building high-performance Python microservices.",
        "requirements": "Python, FastAPI, Redis, Postgres",
        "location": "Remote",
        "salary_range": "$140,000 - $180,000",
        "interview_mode": "WEBRTC",
        "target_shortlist_count": 5,
        "screening_enabled": True
    })
    assert job_res.status_code == 201
    job_id = job_res.json()["id"]
    print(f"[PASS] Job Requisition #{job_id} created.")

    # 5. CANDIDATE A APPLIES TO JOB
    print("\n--- 5. CANDIDATE A APPLIES TO JOB (POST /candidate/apply) ---")
    apply_a = client.post("/api/v1/candidate/apply", headers=headers_a, json={
        "job_id": job_id,
        "candidate_id": 99999,  # Impersonation attempt (should be ignored and overridden by user_a_id)
        "cover_note": "Candidate A application note"
    })
    assert apply_a.status_code == 201
    app_a_data = apply_a.json()
    assert app_a_data["candidate_id"] == user_a_id, f"Expected candidate_id={user_a_id}, got {app_a_data['candidate_id']}"
    app_a_id = app_a_data["id"]
    print(f"[PASS] Candidate A applied. Application #{app_a_id} strictly bound to candidate_id={user_a_id}.")

    # 6. MY APPLICATIONS DATA ISOLATION
    print("\n--- 6. VERIFYING CANDIDATE A & B APPLICATION ISOLATION ---")
    my_apps_a = client.get("/api/v1/candidate/applications", headers=headers_a)
    assert my_apps_a.status_code == 200
    assert len(my_apps_a.json()) == 1
    assert my_apps_a.json()[0]["id"] == app_a_id
    print(f"[PASS] Candidate A sees Candidate A's application #{app_a_id}.")

    my_apps_b = client.get("/api/v1/candidate/applications", headers=headers_b)
    assert my_apps_b.status_code == 200
    assert len(my_apps_b.json()) == 0
    print(f"[PASS] Candidate B sees ZERO applications (Candidate B does NOT see Candidate A's application).")

    # 7. CROSS-CANDIDATE AUTHORIZATION & PRIVACY PROTECTION
    print("\n--- 7. TESTING CROSS-CANDIDATE PRIVACY PROTECTION ---")
    track_b_on_a = client.get(f"/api/v1/candidate/track/{app_a_id}", headers=headers_b)
    assert track_b_on_a.status_code == 403, f"Expected 403 Forbidden, got {track_b_on_a.status_code}"
    print(f"[PASS] Candidate B attempting to track Candidate A's application correctly rejected with HTTP 403 Forbidden.")

    # 8. UNAUTHENTICATED ENDPOINT REJECTION
    print("\n--- 8. TESTING UNAUTHENTICATED ENDPOINT REJECTION (401 UNAUTHORIZED) ---")
    unauth_apps = client.get("/api/v1/candidate/applications")
    assert unauth_apps.status_code == 401, f"Expected 401 Unauthorized, got {unauth_apps.status_code}"
    print(f"[PASS] GET /candidate/applications without token rejected with HTTP 401 Unauthorized.")

    unauth_apply = client.post("/api/v1/candidate/apply", json={"job_id": job_id})
    assert unauth_apply.status_code == 401, f"Expected 401 Unauthorized, got {unauth_apply.status_code}"
    print(f"[PASS] POST /candidate/apply without token rejected with HTTP 401 Unauthorized.")

    print("\n" + "=" * 60)
    print("STEP 1 REAL CANDIDATE AUTHENTICATION TEST SUITE PASSED SUCCESSFULLY!")
    print("=" * 60)


if __name__ == "__main__":
    run_candidate_auth_tests()
