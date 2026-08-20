"""
End-to-End Test Suite for Candidate Application, Real-Time Journey Tracking,
and Complete PostgreSQL Lifecycle (STEP 3C / CANDIDATE JOURNEY).
"""

import os
import sys
import uuid
import unittest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.db.session import SessionLocal
from app.core.auth import create_access_token
from app.models.models import (
    User, UserRole, Job, CandidateApplication, ApplicationStatus, Resume,
    AgentTelemetry, InterviewInvitation, InvitationStatus, InterviewSession, SessionStatus,
    InterviewEvaluation, EvaluationStatus, EvaluationRecommendation, HiringDecision, JobOffer, OfferStatus
)

client = TestClient(app)


class TestCandidateJourneyE2E(unittest.TestCase):
    def setUp(self):
        self.db = SessionLocal()

        # 1. Recruiter user
        self.recruiter = self.db.query(User).filter(User.email == "recruiter_test_journey@hiregenie.ai").first()
        if not self.recruiter:
            self.recruiter = User(
                full_name="Lead Recruiter",
                email="recruiter_test_journey@hiregenie.ai",
                hashed_password="pw",
                role=UserRole.RECRUITER
            )
            self.db.add(self.recruiter)
            self.db.commit()
            self.db.refresh(self.recruiter)

        # 2. Candidate user
        self.candidate = self.db.query(User).filter(User.email == "candidate_test_journey@hiregenie.ai").first()
        if not self.candidate:
            self.candidate = User(
                full_name="Alex Rivera",
                email="candidate_test_journey@hiregenie.ai",
                hashed_password="pw",
                role=UserRole.CANDIDATE
            )
            self.db.add(self.candidate)
            self.db.commit()
            self.db.refresh(self.candidate)

        # 3. Create tokens
        self.cand_token = create_access_token({
            "sub": self.candidate.email,
            "role": "candidate",
            "user_id": self.candidate.id
        })
        self.cand_headers = {"Authorization": f"Bearer {self.cand_token}"}

        self.recruiter_token = create_access_token({
            "sub": self.recruiter.email,
            "role": "recruiter",
            "user_id": self.recruiter.id
        })
        self.recruiter_headers = {"Authorization": f"Bearer {self.recruiter_token}"}

        # 4. Create Requisition in PostgreSQL
        self.test_job = Job(
            title="Senior Autonomous AI Engineer",
            company="HireGenie AI Labs",
            department="AI Research & Engineering",
            location="San Francisco, CA",
            work_mode="HYBRID",
            employment_type="FULL_TIME",
            min_experience=4.0,
            max_experience=8.0,
            salary_disclosed=True,
            salary_range="USD 150,000 - 210,000 / Annual",
            description="Build real-time autonomous voice agents and deep neural models.",
            status="OPEN",
            created_by=self.recruiter.id
        )
        self.db.add(self.test_job)
        self.db.commit()
        self.db.refresh(self.test_job)

        self.created_app_id = None

    def tearDown(self):
        try:
            if self.created_app_id:
                app_record = self.db.query(CandidateApplication).filter(CandidateApplication.id == self.created_app_id).first()
                if app_record:
                    # Clean child records
                    self.db.query(JobOffer).filter(JobOffer.application_id == self.created_app_id).delete()
                    self.db.query(HiringDecision).filter(HiringDecision.application_id == self.created_app_id).delete()
                    self.db.query(InterviewEvaluation).filter(InterviewEvaluation.application_id == self.created_app_id).delete()
                    self.db.query(InterviewSession).filter(InterviewSession.application_id == self.created_app_id).delete()
                    self.db.query(InterviewInvitation).filter(InterviewInvitation.application_id == self.created_app_id).delete()
                    self.db.query(AgentTelemetry).filter(AgentTelemetry.application_id == self.created_app_id).delete()
                    self.db.delete(app_record)
                    self.db.commit()

            if self.test_job:
                job_record = self.db.query(Job).filter(Job.id == self.test_job.id).first()
                if job_record:
                    self.db.delete(job_record)
                    self.db.commit()
        except Exception:
            self.db.rollback()
        finally:
            self.db.close()

    def test_01_candidate_apply_and_prevent_duplicate(self):
        """Candidate applies -> Application created in PostgreSQL -> Duplicate application is rejected."""
        # 1. Apply
        apply_payload = {
            "job_id": self.test_job.id,
            "cover_note": "Experienced AI engineer passionate about autonomous agents."
        }
        res = client.post("/api/v1/candidate/apply", json=apply_payload, headers=self.cand_headers)
        self.assertEqual(res.status_code, 201, f"Apply failed: {res.text}")
        data = res.json()
        self.created_app_id = data["id"]
        self.assertEqual(data["job_id"], self.test_job.id)

        # 2. Prevent Duplicate Application
        dup_res = client.post("/api/v1/candidate/apply", json=apply_payload, headers=self.cand_headers)
        self.assertEqual(dup_res.status_code, 409, "Duplicate application should return 409 Conflict")

    def test_02_journey_aggregation_and_stages(self):
        """Verify GET /api/v1/candidate/applications/{id}/journey returns complete real lifecycle data."""
        # 1. Create Application
        app_rec = CandidateApplication(
            candidate_id=self.candidate.id,
            job_id=self.test_job.id,
            status=ApplicationStatus.APPLIED,
            applied_at=datetime.utcnow() - timedelta(seconds=10)
        )
        self.db.add(app_rec)
        self.db.commit()
        self.db.refresh(app_rec)
        self.created_app_id = app_rec.id

        # 2. Add Real AgentTelemetry
        t1 = AgentTelemetry(
            application_id=app_rec.id,
            agent_name="Resume Parser Agent",
            status="COMPLETED",
            started_at=datetime.utcnow() - timedelta(seconds=5),
            completed_at=datetime.utcnow() - timedelta(seconds=4),
            duration_ms=120.0
        )
        t2 = AgentTelemetry(
            application_id=app_rec.id,
            agent_name="Skill Matcher Agent",
            status="COMPLETED",
            started_at=datetime.utcnow() - timedelta(seconds=4),
            completed_at=datetime.utcnow() - timedelta(seconds=3),
            duration_ms=150.0
        )
        self.db.add_all([t1, t2])
        self.db.commit()

        # 3. Fetch Journey
        res = client.get(f"/api/v1/candidate/applications/{app_rec.id}/journey", headers=self.cand_headers)
        self.assertEqual(res.status_code, 200, f"Journey endpoint failed: {res.text}")
        journey = res.json()

        # Verify structures
        self.assertEqual(journey["application"]["id"], app_rec.id)
        self.assertEqual(journey["job"]["title"], "Senior Autonomous AI Engineer")
        self.assertEqual(journey["job"]["company"], "HireGenie AI Labs")
        self.assertEqual(journey["candidate"]["full_name"], "Alex Rivera")
        self.assertEqual(len(journey["agent_telemetry"]), 2)
        self.assertEqual(len(journey["tracking_stages"]), 5)
        self.assertEqual(journey["tracking_stages"][0]["status"], "COMPLETED")  # Applied stage is always COMPLETED

        # Verify Timeline
        self.assertTrue(len(journey["timeline"]) >= 3)
        self.assertEqual(journey["timeline"][0]["key"], "APPLICATION_SUBMITTED")

    def test_03_shortlist_interview_and_offer_lifecycle(self):
        """Verify stage transitions: SHORTLISTED -> INTERVIEW -> EVALUATION -> OFFER -> HIRED."""
        # 1. Create Application
        app_rec = CandidateApplication(
            candidate_id=self.candidate.id,
            job_id=self.test_job.id,
            status=ApplicationStatus.SHORTLISTED,
            overall_match_score=92.5,
            rank=1,
            applied_at=datetime.utcnow() - timedelta(hours=2)
        )
        self.db.add(app_rec)
        self.db.commit()
        self.db.refresh(app_rec)
        self.created_app_id = app_rec.id

        # 2. Create Interview Invitation
        inv_token = f"inv_{uuid.uuid4().hex[:12]}"
        invitation = InterviewInvitation(
            application_id=app_rec.id,
            candidate_id=self.candidate.id,
            job_id=self.test_job.id,
            invitation_token=inv_token,
            status=InvitationStatus.INVITED,
            interview_mode="WEBRTC",
            created_at=datetime.utcnow() - timedelta(hours=1),
            expires_at=datetime.utcnow() + timedelta(days=3)
        )
        self.db.add(invitation)
        self.db.commit()

        # Check journey reflects SHORTLISTED + INTERVIEW READY
        res = client.get(f"/api/v1/candidate/applications/{app_rec.id}/journey", headers=self.cand_headers)
        journey = res.json()
        self.assertEqual(journey["interview_invitation"]["invitation_token"], inv_token)
        self.assertEqual(journey["tracking_stages"][2]["status"], "COMPLETED")  # Shortlisted
        self.assertEqual(journey["tracking_stages"][3]["status"], "ACTIVE")     # Interview Ready

        # 3. Create Completed Session & Evaluation
        sess_token = f"sess_{uuid.uuid4().hex[:12]}"
        session = InterviewSession(
            invitation_id=invitation.id,
            application_id=app_rec.id,
            candidate_id=self.candidate.id,
            job_id=self.test_job.id,
            session_token=sess_token,
            status=SessionStatus.COMPLETED,
            started_at=datetime.utcnow() - timedelta(minutes=30),
            ended_at=datetime.utcnow() - timedelta(minutes=15),
            elapsed_seconds=900
        )
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)

        evaluation = InterviewEvaluation(
            application_id=app_rec.id,
            candidate_id=self.candidate.id,
            job_id=self.test_job.id,
            interview_session_id=session.id,
            status=EvaluationStatus.COMPLETED,
            overall_score=94.0,
            technical_score=95.0,
            recommendation=EvaluationRecommendation.STRONG_HIRE,
            strengths=["Deep understanding of LLM agent architectures", "Strong Python fundamentals"],
            gaps=[],
            completed_at=datetime.utcnow() - timedelta(minutes=10)
        )
        self.db.add(evaluation)
        self.db.commit()

        # 4. Recruiter Hires Candidate (creates Offer)
        hire_res = client.post(f"/api/v1/hiring/recruiter/applications/{app_rec.id}/hire", json={
            "reason": "Outstanding technical performance and culture fit."
        }, headers=self.recruiter_headers)
        self.assertEqual(hire_res.status_code, 200)
        offer_token = hire_res.json()["offer_token"]

        # 5. Candidate Accepts Offer
        accept_res = client.post(f"/api/v1/hiring/candidate/offer/{offer_token}/respond", json={
            "action": "ACCEPT"
        })
        self.assertEqual(accept_res.status_code, 200)
        self.assertEqual(accept_res.json()["status"], "OFFER_ACCEPTED")

        # 6. Verify My Applications / Journey shows HIRED
        journey_res = client.get(f"/api/v1/candidate/applications/{app_rec.id}/journey", headers=self.cand_headers)
        final_journey = journey_res.json()
        self.assertEqual(final_journey["application"]["status"], "HIRED")
        self.assertEqual(final_journey["job_offer"]["status"], "OFFER_ACCEPTED")
        self.assertEqual(final_journey["tracking_stages"][4]["status"], "COMPLETED")


if __name__ == "__main__":
    unittest.main()
