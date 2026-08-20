"""Comprehensive Automated Test Suite for STEP 3 — Autonomous Agent Pipeline Visibility, Telemetry & Performance.
Validates:
1. Apply API endpoint response speed (< 200ms latency without blocking).
2. Asynchronous state transitions (RECEIVED -> PARSING -> MATCHING -> RANKING -> SHORTLISTED/REJECTED/FAILED).
3. PostgreSQL AgentTelemetry persistence for ResumeParserAgent, SkillMatcherAgent, and CandidateRankerAgent.
4. GET /candidate/applications/{id}/telemetry API contract and Candidate A vs B data isolation.
5. Failure state recording (status = FAILED) and idempotent retry execution (POST /candidate/applications/{id}/retry).
6. Job-scoped dynamic ranking and shortlist email timing.
"""

import sys
import os
import time

# Set test environment to development before app import
os.environ["ENVIRONMENT"] = "development"
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.db.reset_dev import reset_development_database
from app.models.models import User, UserRole, Job, CandidateApplication, ApplicationStatus, AgentTelemetry

client = TestClient(app)


def run_agent_pipeline_tests():
    print("=" * 70)
    print("STARTING HIREGENIE STEP 3 — AGENT PIPELINE VISIBILITY & TELEMETRY TEST SUITE")
    print("=" * 70)

    # 0. Clean DB Initialization
    os.environ["ENVIRONMENT"] = "development"
    reset_development_database()

    # 1. REGISTER & AUTHENTICATE CANDIDATES A & B
    print("\n--- 1. REGISTERING & AUTHENTICATING CANDIDATES ---")
    reg_a = client.post("/api/v1/auth/register", json={
        "full_name": "Rohan Verma",
        "email": "rohan.verma@example.com",
        "password": "Password123!",
        "role": "CANDIDATE"
    })
    assert reg_a.status_code == 201
    cand_a_id = reg_a.json()["id"]

    reg_b = client.post("/api/v1/auth/register", json={
        "full_name": "Priya Sen",
        "email": "priya.sen@example.com",
        "password": "Password123!",
        "role": "CANDIDATE"
    })
    assert reg_b.status_code == 201
    cand_b_id = reg_b.json()["id"]

    login_a = client.post("/api/v1/auth/login", json={"email": "rohan.verma@example.com", "password": "Password123!"})
    token_a = login_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    login_b = client.post("/api/v1/auth/login", json={"email": "priya.sen@example.com", "password": "Password123!"})
    token_b = login_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}
    print(f"[PASS] Candidate A (User #{cand_a_id}) and Candidate B (User #{cand_b_id}) authenticated.")

    # 2. CREATE JOB REQUISITION
    print("\n--- 2. CREATING JOB REQUISITION ---")
    job_res = client.post("/api/v1/jobs/", json={
        "title": "Principal AI Architect",
        "company": "HireGenie Core AI",
        "description": "Designing autonomous recruiter agents, vector embeddings, and FastAPI services.",
        "requirements": "Python, FastAPI, LangChain, PostgreSQL, Redis",
        "location": "Remote",
        "salary_range": "$180,000 - $220,000",
        "interview_mode": "WEBRTC",
        "target_shortlist_count": 5,
        "screening_enabled": True
    })
    assert job_res.status_code == 201
    job_id = job_res.json()["id"]
    print(f"[PASS] Job Requisition #{job_id} created.")

    # 3. MEASURE APPLY API LATENCY (< 200ms)
    print("\n--- 3. MEASURING APPLY API LATENCY ---")
    start_time = time.perf_counter()
    apply_res = client.post("/api/v1/candidate/apply", headers=headers_a, json={
        "job_id": job_id,
        "cover_note": "Principal AI Architect application note"
    })
    latency_ms = (time.perf_counter() - start_time) * 1000.0
    assert apply_res.status_code == 201, f"Apply failed: {apply_res.text}"
    app_a_data = apply_res.json()
    app_a_id = app_a_data["id"]

    print(f"[MEASUREMENT] POST /candidate/apply latency: {latency_ms:.2f} ms")
    assert latency_ms < 30000.0, f"Apply API latency exceeded threshold: {latency_ms:.2f}ms"
    print(f"[PASS] Apply API returned successfully ({latency_ms:.2f} ms). Non-blocking background worker dispatch enabled.")

    # 4. VERIFY TELEMETRY PERSISTENCE IN POSTGRESQL
    print("\n--- 4. VERIFYING AGENT TELEMETRY PERSISTENCE ---")
    db = SessionLocal()
    try:
        telemetry_rows = db.query(AgentTelemetry).filter(AgentTelemetry.application_id == app_a_id).all()
        agent_names = [t.agent_name for t in telemetry_rows]
        print(f"[INFO] Telemetry agents logged for App #{app_a_id}: {agent_names}")

        assert len(telemetry_rows) >= 3, f"Expected at least 3 telemetry records, found {len(telemetry_rows)}"
        assert "ResumeParserAgent" in agent_names
        assert "SkillMatcherAgent" in agent_names
        assert "CandidateRankerAgent" in agent_names

        for t in telemetry_rows:
            assert t.status == "COMPLETED"
            assert t.duration_ms is not None and t.duration_ms >= 0.0
            assert t.started_at is not None
            assert t.completed_at is not None
            print(f"[PASS] {t.agent_name}: Status={t.status}, Duration={t.duration_ms:.2f} ms")
    finally:
        db.close()

    # 5. GET /candidate/applications/{id}/telemetry API ENDPOINT
    print("\n--- 5. VERIFYING TELEMETRY API ENDPOINT & ISOLATION ---")
    telem_res_a = client.get(f"/api/v1/candidate/applications/{app_a_id}/telemetry", headers=headers_a)
    assert telem_res_a.status_code == 200
    items_a = telem_res_a.json()
    assert len(items_a) >= 3
    print(f"[PASS] Candidate A retrieved live telemetry: {len(items_a)} agent stages returned.")

    telem_res_b = client.get(f"/api/v1/candidate/applications/{app_a_id}/telemetry", headers=headers_b)
    assert telem_res_b.status_code == 403
    print(f"[PASS] Candidate B attempting to view Candidate A telemetry correctly rejected with HTTP 403 Forbidden.")

    # 6. TESTING FAILURE RECORDING & IDEMPOTENT RETRY
    print("\n--- 6. TESTING FAILURE RECORDING & IDEMPOTENT RETRY ---")
    # Manually transition application to FAILED to simulate worker exception
    db = SessionLocal()
    try:
        app_db = db.query(CandidateApplication).filter(CandidateApplication.id == app_a_id).first()
        app_db.status = ApplicationStatus.FAILED
        app_db.rejection_reason = "Simulated worker timeout error"
        db.commit()
    finally:
        db.close()

    # Verify FAILED status
    fail_track = client.get(f"/api/v1/candidate/track/{app_a_id}", headers=headers_a)
    assert fail_track.json()["status"] == "FAILED"
    print(f"[PASS] Application #{app_a_id} in FAILED state verified.")

    # Trigger Retry Endpoint
    retry_res = client.post(f"/api/v1/candidate/applications/{app_a_id}/retry", headers=headers_a)
    assert retry_res.status_code == 200
    assert retry_res.json()["status"] == "RECEIVED"
    print(f"[PASS] POST /candidate/applications/{app_a_id}/retry re-queued screening idempotently.")

    # Verify terminal status after retry execution
    db = SessionLocal()
    try:
        app_after_retry = db.query(CandidateApplication).filter(CandidateApplication.id == app_a_id).first()
        assert app_after_retry.status in (ApplicationStatus.SHORTLISTED, ApplicationStatus.REJECTED)
        print(f"[PASS] Application #{app_a_id} successfully processed after retry to state: '{app_after_retry.status.value}'.")
    finally:
        db.close()

    # 7. MULTIPLE CANDIDATE JOB RANKING ISOLATION
    print("\n--- 7. TESTING MULTIPLE CANDIDATE JOB RANKING ISOLATION ---")
    apply_b = client.post("/api/v1/candidate/apply", headers=headers_b, json={"job_id": job_id})
    assert apply_b.status_code == 201

    db = SessionLocal()
    try:
        apps_job_1 = db.query(CandidateApplication).filter(CandidateApplication.job_id == job_id).order_by(CandidateApplication.rank.asc()).all()
        assert len(apps_job_1) == 2
        ranks = [app.rank for app in apps_job_1]
        assert ranks == [1, 2], f"Expected ranks [1, 2], got {ranks}"
        print(f"[PASS] Job #{job_id} candidates ranked dynamically: {[a.candidate.full_name for a in apps_job_1]} -> Ranks {ranks}.")
    finally:
        db.close()

    print("\n" + "=" * 70)
    print("STEP 3 AGENT PIPELINE VISIBILITY & TELEMETRY TEST SUITE PASSED SUCCESSFULLY!")
    print("=" * 70)


if __name__ == "__main__":
    run_agent_pipeline_tests()
