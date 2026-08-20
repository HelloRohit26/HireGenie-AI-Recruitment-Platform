"""End-to-End Automated Test Suite for Shortlisted Candidate to Interview Invitation & Consent Workflow."""
import sys
import os
import time
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

# Ensure backend root is on Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.main import app
from app.db.session import SessionLocal
from app.db.reset_dev import reset_development_database
from app.models.models import CandidateApplication, Job, Resume, User, UserRole, ApplicationStatus, InterviewInvitation, InvitationStatus
from app.models.communication import CommunicationLog, CommunicationStage


def run_interview_invitation_tests():
    print("==================================================")
    print("STARTING HIREGENIE INTERVIEW INVITATION & CONSENT TEST SUITE")
    print("==================================================")

    # 1. RESET DEV DB
    os.environ["ENVIRONMENT"] = "development"
    reset_development_database()

    db = SessionLocal()
    try:
        with TestClient(app) as client:
            # 2. CREATE JOB REQUISITION
            job_payload = {
                "title": "Lead AI Systems Engineer",
                "company": "HireGenie Enterprise",
                "description": "Building production Python, FastAPI, and LangChain agents.",
                "requirements": "Python, FastAPI, LangChain, Machine Learning, SQL, 4+ years experience",
                "must_have_skills": ["Python", "FastAPI", "LangChain"],
                "location": "Bengaluru",
                "salary_range": "INR 20-30 LPA",
                "interview_mode": "WEBRTC",
                "target_shortlist_count": 5,
                "screening_enabled": True,
                "min_score_threshold": 70.0
            }
            resp = client.post("/api/v1/jobs/", json=job_payload)
            assert resp.status_code == 201
            job_id = resp.json()["id"]

            print(f"[PASS] 1. REQUISITION SETUP: Created Job #{job_id} ('Lead AI Systems Engineer')")

            # 3. CANDIDATE A (STRONG MATCH -> SHORTLISTED)
            user_a = User(full_name="Candidate A (Shortlisted)", email="cand_a_inv@hiregenie.ai", hashed_password="mockhashedpassword", role=UserRole.CANDIDATE)
            db.add(user_a)
            db.commit()
            db.refresh(user_a)

            resume_a = Resume(
                candidate_id=user_a.id,
                file_path="/resumes/cand_a.pdf",
                raw_text="Lead AI Engineer with 5 years experience. Skills: Python, FastAPI, LangChain, SQL. Built multi-agent architectures.",
                parsed_skills=["Python", "FastAPI", "LangChain", "SQL"],
                parsed_experience_years=5.0
            )
            db.add(resume_a)
            db.commit()

            # Apply & Trigger Screening
            resp_app = client.post("/api/v1/candidate/apply", json={"job_id": job_id, "candidate_id": user_a.id})
            assert resp_app.status_code == 201
            app_a_id = resp_app.json()["id"]

            time.sleep(1.5)

            # 4. VERIFY AUTOMATIC INVITATION CREATION ON SHORTLISTING
            db.expire_all()
            app_a = db.query(CandidateApplication).filter(CandidateApplication.id == app_a_id).first()
            assert app_a.status == ApplicationStatus.SHORTLISTED

            invitation_a = db.query(InterviewInvitation).filter(InterviewInvitation.application_id == app_a_id).first()
            assert invitation_a is not None, "InterviewInvitation must be created automatically upon shortlisting"
            assert invitation_a.status == InvitationStatus.INVITED, f"Expected status INVITED, got {invitation_a.status}"
            assert len(invitation_a.invitation_token) >= 20, "Invitation token must be a secure random token"

            print(f"[PASS] 2. SHORTLIST EVENT: App #{app_a_id} Shortlisted -> Created InterviewInvitation #{invitation_a.id} with secure token '{invitation_a.invitation_token[:12]}...' (Status: INVITED)")

            # 5. TEST GET INVITATION ENDPOINT (INVITED -> VIEWED)
            token_a = invitation_a.invitation_token
            resp_inv = client.get(f"/api/v1/interview/invitation/{token_a}")
            assert resp_inv.status_code == 200
            inv_data = resp_inv.json()
            assert inv_data["status"] == "VIEWED"
            assert inv_data["job_title"] == "Lead AI Systems Engineer"

            db.expire_all()
            invitation_a_reloaded = db.query(InterviewInvitation).filter(InterviewInvitation.id == invitation_a.id).first()
            assert invitation_a_reloaded.status == InvitationStatus.VIEWED, "SQLite status must be updated to VIEWED"
            assert invitation_a_reloaded.viewed_at is not None

            print(f"[PASS] 3. CANDIDATE ACCESS: Token GET transition INVITED -> VIEWED verified.")

            # 6. TEST CANDIDATE CONSENT ACCEPTANCE (VIEWED -> ACCEPTED -> READY)
            resp_accept = client.post(f"/api/v1/interview/invitation/{token_a}/respond", json={"action": "ACCEPT"})
            assert resp_accept.status_code == 200
            accept_data = resp_accept.json()
            assert accept_data["status"] == "READY"
            assert accept_data["invitation_status"] == "ACCEPTED"

            db.expire_all()
            invitation_a_accepted = db.query(InterviewInvitation).filter(InterviewInvitation.id == invitation_a.id).first()
            assert invitation_a_accepted.status == InvitationStatus.READY
            assert invitation_a_accepted.accepted_at is not None

            print(f"[PASS] 4. CANDIDATE CONSENT: Respond ACCEPT -> Invitation status ACCEPTED/READY persisted in SQLite.")

            # 7. TEST DECLINE FLOW (CANDIDATE B - SHORTLISTED MATCH)
            user_b = User(full_name="Candidate B (Declined)", email="cand_b_inv@hiregenie.ai", hashed_password="mockhashedpassword", role=UserRole.CANDIDATE)
            db.add(user_b)
            db.commit()

            resume_b = Resume(
                candidate_id=user_b.id,
                file_path="/resumes/cand_b.pdf",
                raw_text="Lead AI Engineer with 5 years experience. Skills: Python, FastAPI, LangChain, Machine Learning, SQL. Computer Science degree.",
                parsed_skills=["Python", "FastAPI", "LangChain", "Machine Learning", "SQL"],
                parsed_experience_years=5.0
            )
            db.add(resume_b)
            db.commit()

            resp_app_b = client.post("/api/v1/candidate/apply", json={"job_id": job_id, "candidate_id": user_b.id})
            assert resp_app_b.status_code == 201
            app_b_id = resp_app_b.json()["id"]

            time.sleep(1.5)

            db.expire_all()
            invitation_b = db.query(InterviewInvitation).filter(InterviewInvitation.application_id == app_b_id).first()
            token_b = invitation_b.invitation_token

            resp_decline = client.post(f"/api/v1/interview/invitation/{token_b}/respond", json={"action": "DECLINE"})
            assert resp_decline.status_code == 200
            assert resp_decline.json()["status"] == "DECLINED"

            db.expire_all()
            invitation_b_declined = db.query(InterviewInvitation).filter(InterviewInvitation.id == invitation_b.id).first()
            assert invitation_b_declined.status == InvitationStatus.DECLINED

            print(f"[PASS] 5. DECLINE FLOW: Respond DECLINE -> Invitation status DECLINED persisted in SQLite.")

            # 8. TEST EXPIRATION FLOW
            user_c = User(full_name="Candidate C (Expired)", email="cand_c_inv@hiregenie.ai", hashed_password="mockhashedpassword", role=UserRole.CANDIDATE)
            db.add(user_c)
            db.commit()

            resume_c = Resume(
                candidate_id=user_c.id,
                file_path="/resumes/cand_c.pdf",
                raw_text="Expired test resume.",
                parsed_skills=["Python"],
                parsed_experience_years=1.0
            )
            db.add(resume_c)
            db.commit()

            app_c = CandidateApplication(candidate_id=user_c.id, job_id=job_id, resume_id=resume_c.id, status=ApplicationStatus.SHORTLISTED)
            db.add(app_c)
            db.commit()

            expired_invitation = InterviewInvitation(
                application_id=app_c.id,
                candidate_id=user_c.id,
                job_id=job_id,
                invitation_token="expired_test_token_12345",
                status=InvitationStatus.INVITED,
                created_at=datetime.utcnow() - timedelta(days=10),
                expires_at=datetime.utcnow() - timedelta(days=3)
            )
            db.add(expired_invitation)
            db.commit()

            resp_exp = client.get("/api/v1/interview/invitation/expired_test_token_12345")
            assert resp_exp.status_code == 200
            assert resp_exp.json()["expired"] is True

            resp_exp_respond = client.post("/api/v1/interview/invitation/expired_test_token_12345/respond", json={"action": "ACCEPT"})
            assert resp_exp_respond.status_code == 400
            assert "expired" in resp_exp_respond.json()["detail"].lower()

            print(f"[PASS] 6. EXPIRATION FLOW: Expired token correctly rejected with HTTP 400.")

            # 9. TEST IDEMPOTENCY & REJECTED CANDIDATE PROTECTION
            # Candidate D (Weak Match)
            user_d = User(full_name="Candidate D (Weak Match)", email="cand_d_inv@hiregenie.ai", hashed_password="mockhashedpassword", role=UserRole.CANDIDATE)
            db.add(user_d)
            db.commit()

            resume_d = Resume(
                candidate_id=user_d.id,
                file_path="/resumes/cand_d.pdf",
                raw_text="No relevant skills.",
                parsed_skills=[],
                parsed_experience_years=0.0
            )
            db.add(resume_d)
            db.commit()

            resp_app_d = client.post("/api/v1/candidate/apply", json={"job_id": job_id, "candidate_id": user_d.id})
            assert resp_app_d.status_code == 201
            app_d_id = resp_app_d.json()["id"]

            time.sleep(1.5)

            invitation_d = db.query(InterviewInvitation).filter(InterviewInvitation.application_id == app_d_id).first()
            assert invitation_d is None, "Rejected candidate MUST NOT receive an InterviewInvitation"

            # Re-count total invitations for App A
            app_a_inv_count = db.query(InterviewInvitation).filter(InterviewInvitation.application_id == app_a_id).count()
            assert app_a_inv_count == 1, "Idempotency check: Exactly 1 invitation record must exist per application"

            print(f"[PASS] 7. IDEMPOTENCY & REJECTED PROTECTION: Rejected candidate received zero invitations. App A has exactly 1 invitation record.")

    finally:
        db.close()

    print("==================================================")
    print("INTERVIEW INVITATION & CONSENT TEST SUITE PASSED SUCCESSFULLY!")
    print("==================================================")


if __name__ == "__main__":
    run_interview_invitation_tests()
