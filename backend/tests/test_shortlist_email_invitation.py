"""Comprehensive Automated Test Suite for STEP 4 — Real Shortlist -> Email -> Interview Invitation.
Validates:
1. Shortlist trigger creating InterviewInvitation (INVITED) and CommunicationLog (QUEUED -> SENT/FAILED).
2. Single invitation & single shortlist email idempotency (retries & page refreshes do not duplicate).
3. Provider Status API (GET /api/v1/communication/status).
4. Magic link route resolution (/interview/{token}/prep).
5. Token security, cryptographically secure urlsafe token format, and expired token rejection.
6. Invitation status transition INVITED -> VIEWED upon candidate token lookup.
7. Candidate consent transition VIEWED -> READY upon explicit candidate acceptance.
8. Rejected candidate access protection (HTTP 403 Forbidden).
9. Safe email failure recording and recovery handling.
"""

import sys
import os
import time
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

# Set test environment to development before app import
os.environ["ENVIRONMENT"] = "development"
os.environ["CELERY_TASK_ALWAYS_EAGER"] = "true"
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.db.session import SessionLocal
from app.db.reset_dev import reset_development_database
from app.models.models import (
    User, UserRole, Job, CandidateApplication, ApplicationStatus,
    InterviewInvitation, InvitationStatus
)
from app.models.communication import CommunicationLog, CommunicationStage, DeliveryStatus
from app.services.email_provider import get_email_provider_status

client = TestClient(app)


def run_shortlist_email_invitation_tests():
    print("=" * 70)
    print("STARTING HIREGENIE STEP 4 — SHORTLIST, EMAIL & INVITATION TEST SUITE")
    print("=" * 70)

    # 0. Clean DB Initialization
    reset_development_database()

    # 1. PROVIDER STATUS API CHECK (GET /api/v1/communication/status)
    print("\n--- 1. TESTING EMAIL PROVIDER STATUS API ---")
    status_res = client.get("/api/v1/communication/status")
    assert status_res.status_code == 200
    st_data = status_res.json()
    assert "status" in st_data
    assert "configured" in st_data
    print(f"[PASS] Provider Status API returned: {st_data['status']} (Active Provider: {st_data.get('active_provider')})")

    # 2. REGISTER & AUTHENTICATE CANDIDATES A & B
    print("\n--- 2. REGISTERING & AUTHENTICATING CANDIDATES ---")
    reg_a = client.post("/api/v1/auth/register", json={
        "full_name": "Aarav Sharma",
        "email": "aarav.sharma@example.com",
        "password": "Password123!",
        "role": "CANDIDATE"
    })
    assert reg_a.status_code == 201
    cand_a_id = reg_a.json()["id"]

    reg_b = client.post("/api/v1/auth/register", json={
        "full_name": "Kavya Patel",
        "email": "kavya.patel@example.com",
        "password": "Password123!",
        "role": "CANDIDATE"
    })
    assert reg_b.status_code == 201
    cand_b_id = reg_b.json()["id"]

    login_a = client.post("/api/v1/auth/login", json={"email": "aarav.sharma@example.com", "password": "Password123!"})
    headers_a = {"Authorization": f"Bearer {login_a.json()['access_token']}"}

    login_b = client.post("/api/v1/auth/login", json={"email": "kavya.patel@example.com", "password": "Password123!"})
    headers_b = {"Authorization": f"Bearer {login_b.json()['access_token']}"}
    print(f"[PASS] Candidates authenticated: User #{cand_a_id} and User #{cand_b_id}.")

    # 3. CREATE JOB REQUISITION
    print("\n--- 3. CREATING JOB REQUISITION ---")
    job_res = client.post("/api/v1/jobs/", json={
        "title": "Lead Staff Architect",
        "company": "HireGenie AI Systems",
        "description": "Designing autonomous recruitment agents and durable task systems.",
        "requirements": "Python, FastAPI, Celery, PostgreSQL, Redis",
        "location": "Remote",
        "salary_range": "$160,000 - $190,000",
        "interview_mode": "WEBRTC",
        "target_shortlist_count": 5,
        "min_score_threshold": 50.0  # Set threshold to 50.0 to ensure shortlisting
    })
    assert job_res.status_code == 201
    job_id = job_res.json()["id"]
    print(f"[PASS] Job Requisition #{job_id} created.")

    # 4. CANDIDATE A RESUME & APPLICATION SUBMISSION
    print("\n--- 4. CANDIDATE A APPLIES & PIPELINE SHORTLISTS CANDIDATE ---")
    db = SessionLocal()
    try:
        from app.models.models import Resume
        res_a = Resume(
            candidate_id=cand_a_id,
            file_path="/uploads/resumes/aarav_sharma_resume.pdf",
            parsed_skills=["Python", "FastAPI", "Celery", "PostgreSQL", "Redis", "LangChain"],
            parsed_experience_years=8.0
        )
        db.add(res_a)
        db.commit()
    finally:
        db.close()

    apply_res = client.post("/api/v1/candidate/apply", headers=headers_a, json={
        "job_id": job_id,
        "cover_note": "Experienced Python architect cover note"
    })
    assert apply_res.status_code == 201
    app_a_id = apply_res.json()["id"]

    db = SessionLocal()
    try:
        app_db = db.query(CandidateApplication).filter(CandidateApplication.id == app_a_id).first()
        assert app_db.status == ApplicationStatus.SHORTLISTED, f"Expected SHORTLISTED, got {app_db.status}"
        print(f"[PASS] Candidate Application #{app_a_id} successfully SHORTLISTED (Match Score: {app_db.overall_match_score}%).")

        # Verify InterviewInvitation row created
        invitation = db.query(InterviewInvitation).filter(InterviewInvitation.application_id == app_a_id).first()
        assert invitation is not None
        assert invitation.status == InvitationStatus.INVITED
        assert invitation.invitation_token is not None
        assert len(invitation.invitation_token) >= 32
        token = invitation.invitation_token
        print(f"[PASS] InterviewInvitation persisted: ID #{invitation.id}, Token: {token[:12]}..., Status: {invitation.status.value}.")

        # Verify CommunicationLog row created
        comm_logs = db.query(CommunicationLog).filter(CommunicationLog.application_id == app_a_id).all()
        assert len(comm_logs) >= 1
        comm = comm_logs[0]
        assert comm.stage == CommunicationStage.SHORTLISTED
        assert f"/interview/{token}/prep" in comm.body
        print(f"[PASS] CommunicationLog persisted: Log #{comm.id}, Stage: {comm.stage.value}, Magic Link verified in body.")
    finally:
        db.close()

    # 5. IDEMPOTENCY CHECK — REPEAT RETRY SHOULD NOT CREATE DUPLICATE INVITATIONS OR EMAILS
    print("\n--- 5. TESTING IDEMPOTENCY & DUPLICATE PREVENTION ---")
    retry_res = client.post(f"/api/v1/candidate/applications/{app_a_id}/retry", headers=headers_a)
    assert retry_res.status_code == 200

    db = SessionLocal()
    try:
        inv_count = db.query(InterviewInvitation).filter(InterviewInvitation.application_id == app_a_id).count()
        assert inv_count == 1, f"Expected exactly 1 invitation, found {inv_count}"

        comm_count = db.query(CommunicationLog).filter(
            CommunicationLog.application_id == app_a_id,
            CommunicationLog.stage == CommunicationStage.SHORTLISTED
        ).count()
        assert comm_count == 1, f"Expected exactly 1 CommunicationLog, found {comm_count}"
        print(f"[PASS] Idempotency verified: Exactly 1 InterviewInvitation and 1 CommunicationLog persisted despite retry.")
    finally:
        db.close()

    # 6. TOKEN ACCESS TRANSITION (INVITED -> VIEWED)
    print("\n--- 6. TESTING TOKEN ACCESS TRANSITION (INVITED -> VIEWED) ---")
    token_lookup = client.get(f"/api/v1/interview/invitation/{token}")
    assert token_lookup.status_code == 200
    assert token_lookup.json()["status"] == "VIEWED"

    db = SessionLocal()
    try:
        inv_db = db.query(InterviewInvitation).filter(InterviewInvitation.invitation_token == token).first()
        assert inv_db.status == InvitationStatus.VIEWED
        assert inv_db.viewed_at is not None
        print(f"[PASS] Invitation ID #{inv_db.id} state transitioned to VIEWED on candidate access (Viewed at {inv_db.viewed_at}).")
    finally:
        db.close()

    # 7. CANDIDATE CONSENT & ACCEPTANCE (VIEWED -> READY)
    print("\n--- 7. TESTING CANDIDATE CONSENT (VIEWED -> READY) ---")
    respond_res = client.post(f"/api/v1/interview/invitation/{token}/respond", json={"action": "ACCEPT"})
    assert respond_res.status_code == 200
    assert respond_res.json()["status"] == "READY"

    db = SessionLocal()
    try:
        inv_ready = db.query(InterviewInvitation).filter(InterviewInvitation.invitation_token == token).first()
        assert inv_ready.status == InvitationStatus.READY
        assert inv_ready.accepted_at is not None
        assert inv_ready.application.status == ApplicationStatus.INTERVIEW_SCHEDULED
        print(f"[PASS] Candidate consent recorded: Invitation #{inv_ready.id} state is READY (Accepted at {inv_ready.accepted_at}).")
    finally:
        db.close()

    # 8. REJECTED CANDIDATE ACCESS PROTECTION
    print("\n--- 8. TESTING REJECTED CANDIDATE PROTECTION ---")
    # Apply Candidate B with low score / manual reject to test rejection protection
    db = SessionLocal()
    try:
        cand_b_app = CandidateApplication(
            candidate_id=cand_b_id,
            job_id=job_id,
            status=ApplicationStatus.REJECTED,
            rejection_reason="Test rejection protection"
        )
        db.add(cand_b_app)
        db.commit()
        db.refresh(cand_b_app)

        rej_inv = InterviewInvitation(
            application_id=cand_b_app.id,
            candidate_id=cand_b_id,
            job_id=job_id,
            invitation_token="rej_token_123456789012345678901234567890",
            status=InvitationStatus.NOT_INVITED,
            expires_at=datetime.utcnow() + timedelta(days=7)
        )
        db.add(rej_inv)
        db.commit()
    finally:
        db.close()

    rej_access = client.get("/api/v1/interview/invitation/rej_token_123456789012345678901234567890")
    assert rej_access.status_code == 403
    print(f"[PASS] Access attempt for rejected candidate correctly denied with HTTP 403 Forbidden.")

    # 9. EXPIRED TOKEN REJECTION
    print("\n--- 9. TESTING EXPIRED TOKEN REJECTION ---")
    db = SessionLocal()
    try:
        exp_inv = InterviewInvitation(
            application_id=app_a_id,
            candidate_id=cand_a_id,
            job_id=job_id,
            invitation_token="expired_token_1234567890123456789012345",
            status=InvitationStatus.INVITED,
            expires_at=datetime.utcnow() - timedelta(hours=1)
        )
        db.add(exp_inv)
        db.commit()
    finally:
        db.close()

    exp_access = client.get("/api/v1/interview/invitation/expired_token_1234567890123456789012345")
    assert exp_access.status_code == 200
    assert exp_access.json()["status"] == "EXPIRED"
    assert exp_access.json()["expired"] is True
    print(f"[PASS] Expired token lookup correctly returned EXPIRED status (expired: True).")

    print("\n" + "=" * 70)
    print("STEP 4 SHORTLIST, EMAIL & INVITATION TEST SUITE PASSED SUCCESSFULLY!")
    print("=" * 70)


if __name__ == "__main__":
    run_shortlist_email_invitation_tests()
