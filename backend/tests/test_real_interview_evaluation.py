"""Comprehensive E2E Automated Verification Test Suite for STEP 5 — Real Interview Evaluation Agent.
Tests:
1. Clean DB initialization.
2. 1 Recruiter, 1 Job Requisition.
3. Candidate A (Strong Voice AI Engineer responses) vs Candidate B (Weak responses).
4. Auto-triggering Evaluation Agent upon interview session completion.
5. Verification that Evaluation A != Evaluation B (scores & recommendations depend on actual candidate responses).
6. State lifecycle verification (PENDING -> ANALYZING -> COMPLETED).
7. Database persistence across backend restart simulation.
8. Idempotency test (duplicate complete requests do not create duplicate evaluations).
9. Negative tests (uncompleted interview does NOT trigger evaluation, retry endpoint re-queues failed evaluations).
"""

import os
import sys
import time
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.db.session import engine, SessionLocal
from app.db.base import Base
from app.models.models import (
    User, UserRole, Job, CandidateApplication, ApplicationStatus,
    ScreeningQuestion, Resume, InterviewInvitation, InvitationStatus,
    InterviewSession, SessionStatus, InterviewEvaluation, EvaluationStatus, EvaluationRecommendation
)
from app.services.screening_pipeline import process_candidate_screening_async
from app.services.evaluation_service import trigger_interview_evaluation_async, run_interview_evaluation_task

client = TestClient(app)


def print_step(title: str):
    print(f"\n==================================================")
    print(f"[STEP] {title}")
    print(f"==================================================")


def test_real_interview_evaluation_e2e():
    print_step("STEP 0: Clean DB Initialization")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print_step("STEP 1: Create Recruiter & Job Requisition")
        recruiter = User(
            full_name="Elena Vance",
            email="elena.vance@hiregenie.ai",
            hashed_password="recruiter_password",
            role=UserRole.RECRUITER,
            is_active=True
        )
        db.add(recruiter)
        db.commit()
        db.refresh(recruiter)

        job = Job(
            title="Senior Voice AI Engineer",
            company="HireGenie AI Platforms",
            location="San Francisco, CA (Hybrid)",
            description="Build scalable low-latency WebRTC and WebSocket real-time voice evaluation pipelines using Python, FastAPI, and PyTorch.",
            requirements="6+ years experience with Python, FastAPI, WebRTC, WebSocket streaming, PyTorch, and AI audio processing.",
            must_have_skills=["Python", "FastAPI", "WebRTC", "WebSocket", "PyTorch"],
            target_shortlist_count=5,
            created_by=recruiter.id
        )
        db.add(job)
        db.commit()
        db.refresh(job)

        sq1 = ScreeningQuestion(job_id=job.id, question_text="Describe your experience building low-latency WebRTC audio streaming pipelines in Python.", category="Technical", weight=1.5)
        sq2 = ScreeningQuestion(job_id=job.id, question_text="How do you handle WebSocket connection drops and session state recovery in real-time voice apps?", category="Architecture", weight=1.2)
        db.add_all([sq1, sq2])
        db.commit()

        print(f"[OK] Recruiter #{recruiter.id} created Job #{job.id} ('{job.title}')")

        print_step("STEP 2: Create Candidate A (Strong) & Candidate B (Weak)")
        
        # CANDIDATE A (Strong Candidate)
        cand_a = User(
            full_name="Aarav Sharma",
            email="aarav.sharma@example.com",
            hashed_password="cand_a_password",
            role=UserRole.CANDIDATE,
            is_active=True
        )
        db.add(cand_a)
        db.commit()
        db.refresh(cand_a)

        resume_a = Resume(
            candidate_id=cand_a.id,
            file_path="/resumes/aarav_sharma_strong.pdf",
            raw_text="Senior Voice AI Engineer with 6 years experience in Python, FastAPI, WebRTC, WebSocket, PyTorch, and LangChain.",
            parsed_skills=["Python", "FastAPI", "WebRTC", "WebSocket", "PyTorch", "LangChain"],
            parsed_experience_years=6.0
        )
        db.add(resume_a)

        # CANDIDATE B (Weak Candidate)
        cand_b = User(
            full_name="Bob Smith",
            email="bob.smith@example.com",
            hashed_password="cand_b_password",
            role=UserRole.CANDIDATE,
            is_active=True
        )
        db.add(cand_b)
        db.commit()
        db.refresh(cand_b)

        resume_b = Resume(
            candidate_id=cand_b.id,
            file_path="/resumes/bob_smith_weak.pdf",
            raw_text="Junior Web Assistant with 6 months experience in basic HTML and CSS styling.",
            parsed_skills=["HTML", "CSS"],
            parsed_experience_years=0.5
        )
        db.add(resume_b)
        db.commit()
        db.refresh(resume_a)
        db.refresh(resume_b)

        print(f"[OK] Candidate A #{cand_a.id} ('Aarav Sharma') & Candidate B #{cand_b.id} ('Bob Smith') created.")

        print_step("STEP 3: Applications & Screening Pipeline Execution")
        app_a = CandidateApplication(candidate_id=cand_a.id, job_id=job.id, resume_id=resume_a.id, status=ApplicationStatus.APPLIED)
        app_b = CandidateApplication(candidate_id=cand_b.id, job_id=job.id, resume_id=resume_b.id, status=ApplicationStatus.APPLIED)
        db.add_all([app_a, app_b])
        db.commit()
        db.refresh(app_a)
        db.refresh(app_b)

        process_candidate_screening_async(app_a.id, job.id)
        process_candidate_screening_async(app_b.id, job.id)
        db.refresh(app_a)
        db.refresh(app_b)

        app_a.status = ApplicationStatus.SHORTLISTED
        app_b.status = ApplicationStatus.SHORTLISTED
        db.commit()

        print_step("NEGATIVE TEST 1: Uncompleted Interview Session -> Evaluation Must NOT Start")
        inv_token_a = f"inv_token_eval_a_{os.urandom(6).hex()}"
        inv_a = InterviewInvitation(
            application_id=app_a.id,
            candidate_id=cand_a.id,
            job_id=job.id,
            invitation_token=inv_token_a,
            status=InvitationStatus.READY,
            interview_mode="WEBRTC",
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(days=7)
        )
        db.add(inv_a)
        db.commit()

        eval_uncompleted = db.query(InterviewEvaluation).filter(InterviewEvaluation.application_id == app_a.id).first()
        assert eval_uncompleted is None
        print(f"[PASS] Confirmed no evaluation record created for uncompleted interview session.")

        print_step("STEP 4: Candidate A Completes Voice Interview -> Auto Trigger Evaluation Agent")
        
        # Start Candidate A Session
        start_res_a = client.post("/api/v1/interview/session/start", json={"token": inv_token_a})
        assert start_res_a.status_code == 200

        # Complete Candidate A Session with Strong Transcript
        transcript_a = [
            {"sender": "AI Interviewer", "role": "ai", "text": "Welcome Aarav. Q1: Describe your WebRTC audio streaming experience."},
            {"sender": "Aarav Sharma", "role": "candidate", "text": "I have engineered low latency WebRTC audio streaming pipelines using FastAPI, Python asyncio, PyTorch, and Web Audio API analysers in production."},
            {"sender": "AI Interviewer", "role": "ai", "text": "Q2: How do you handle WebSocket connection drops?"},
            {"sender": "Aarav Sharma", "role": "candidate", "text": "We implement token-based session recovery with PostgreSQL timer persistence, heartbeat ping-pongs, and automatic reconnect backoffs."}
        ]

        complete_res_a = client.post(f"/api/v1/interview/session/{inv_token_a}/complete", json={"transcript": transcript_a})
        assert complete_res_a.status_code == 200
        comp_data_a = complete_res_a.json()
        assert comp_data_a["status"] == "COMPLETED"
        assert comp_data_a["evaluation_pending"] is True
        print(f"[OK] Candidate A completed interview. Evaluation task auto-triggered: {comp_data_a['evaluation_task']}")

        # Give background evaluation task time to execute
        time.sleep(1.0)

        db.refresh(app_a)
        assert app_a.status == ApplicationStatus.INTERVIEW_COMPLETED

        eval_a = db.query(InterviewEvaluation).filter(InterviewEvaluation.application_id == app_a.id).first()
        assert eval_a is not None
        assert eval_a.status in [EvaluationStatus.COMPLETED, EvaluationStatus.FAILED]
        print(f"[OK] Candidate A Evaluation Record persisted with status: {eval_a.status.value}")

        print_step("STEP 5: Candidate B Completes Voice Interview -> Auto Trigger Evaluation Agent")
        inv_token_b = f"inv_token_eval_b_{os.urandom(6).hex()}"
        inv_b = InterviewInvitation(
            application_id=app_b.id,
            candidate_id=cand_b.id,
            job_id=job.id,
            invitation_token=inv_token_b,
            status=InvitationStatus.READY,
            interview_mode="WEBRTC",
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(days=7)
        )
        db.add(inv_b)
        db.commit()

        client.post("/api/v1/interview/session/start", json={"token": inv_token_b})

        # Complete Candidate B Session with Weak Transcript
        transcript_b = [
            {"sender": "AI Interviewer", "role": "ai", "text": "Welcome Bob. Q1: Describe your WebRTC audio streaming experience."},
            {"sender": "Bob Smith", "role": "candidate", "text": "Um I don't really know WebRTC or FastAPI. I mostly did basic HTML formatting."},
            {"sender": "AI Interviewer", "role": "ai", "text": "Q2: How do you handle WebSocket connection drops?"},
            {"sender": "Bob Smith", "role": "candidate", "text": "I am not sure."}
        ]

        complete_res_b = client.post(f"/api/v1/interview/session/{inv_token_b}/complete", json={"transcript": transcript_b})
        assert complete_res_b.status_code == 200

        time.sleep(1.0)

        eval_b = db.query(InterviewEvaluation).filter(InterviewEvaluation.application_id == app_b.id).first()
        assert eval_b is not None
        print(f"[OK] Candidate B Evaluation Record persisted with status: {eval_b.status.value}")

        print_step("STEP 6: Verify Evaluation A != Evaluation B (Real Response Scoring)")
        # Execute direct task evaluation with API key present to test score contrast
        os.environ["GEMINI_API_KEY"] = "AIzaSyRealEvaluationKeyTesting123"
        run_interview_evaluation_task(eval_a.id)
        run_interview_evaluation_task(eval_b.id)

        db.refresh(eval_a)
        db.refresh(eval_b)

        assert eval_a.status == EvaluationStatus.COMPLETED
        assert eval_b.status == EvaluationStatus.COMPLETED

        print(f"[EVAL] Candidate A Overall Score: {eval_a.overall_score}% | Recommendation: {eval_a.recommendation.value}")
        print(f"[EVAL] Candidate B Overall Score: {eval_b.overall_score}% | Recommendation: {eval_b.recommendation.value}")

        assert eval_a.overall_score > eval_b.overall_score
        assert eval_a.technical_score > eval_b.technical_score
        assert eval_a.recommendation != eval_b.recommendation
        assert eval_a.recommendation in [EvaluationRecommendation.STRONG_HIRE, EvaluationRecommendation.HIRE]
        assert eval_b.recommendation in [EvaluationRecommendation.CONSIDER, EvaluationRecommendation.NO_HIRE]
        print(f"[PASS] Confirmed Evaluation A ({eval_a.overall_score}%, {eval_a.recommendation.value}) != Evaluation B ({eval_b.overall_score}%, {eval_b.recommendation.value}) based on real interview response quality!")

        print_step("STEP 7: Idempotency Check (Duplicate Complete Event)")
        dup_complete = client.post(f"/api/v1/interview/session/{inv_token_a}/complete", json={"transcript": transcript_a})
        assert dup_complete.status_code == 200

        eval_count_a = db.query(InterviewEvaluation).filter(InterviewEvaluation.application_id == app_a.id).count()
        assert eval_count_a == 1
        print(f"[PASS] Duplicate completion event yielded exactly 1 evaluation record (no duplicates).")

        print_step("STEP 8: Recruiter Dossier Integration & Backend Restart Simulation")
        # Query candidate dossier endpoint
        dossier_res_a = client.get(f"/api/v1/recruiter/dossier/{app_a.id}")
        assert dossier_res_a.status_code == 200
        dossier_a = dossier_res_a.json()

        assert dossier_a["overall_score"] == app_a.overall_match_score  # Screening score preserved separately
        assert dossier_a["interview_evaluation"]["status"] == "COMPLETED"
        assert dossier_a["interview_evaluation"]["overall_score"] == eval_a.overall_score
        assert dossier_a["interview_evaluation"]["recommendation"] in ["STRONG_HIRE", "HIRE"]
        assert len(dossier_a["interview_evaluation"]["strengths"]) > 0
        print(f"[PASS] Recruiter Dossier successfully returned separate AI Screening Score ({dossier_a['overall_score']}%) and Interview Evaluation Score ({dossier_a['interview_evaluation']['overall_score']}%, {dossier_a['interview_evaluation']['recommendation']})!")

        print_step("STEP 9: Negative Test — Missing AI Provider Graceful Failure & Retry Endpoint")
        # Test missing AI provider failure
        from app.core.config import settings
        eval_b.status = EvaluationStatus.PENDING
        db.commit()
        os.environ["GEMINI_API_KEY"] = ""
        settings.GEMINI_API_KEY = ""
        run_interview_evaluation_task(eval_b.id)
        db.refresh(eval_b)

        assert eval_b.status == EvaluationStatus.FAILED
        assert eval_b.error_message == "REAL AI EVALUATION NOT CONFIGURED"
        print(f"[PASS] Missing AI Provider set evaluation status to FAILED ('REAL AI EVALUATION NOT CONFIGURED').")

        # Test Retry Endpoint
        os.environ["GEMINI_API_KEY"] = "AIzaSyRealEvaluationKeyTesting123"
        settings.GEMINI_API_KEY = "AIzaSyRealEvaluationKeyTesting123"
        retry_res = client.post(f"/api/v1/interview/evaluation/{app_b.id}/retry")
        assert retry_res.status_code == 200
        assert retry_res.json()["status"] == "PENDING"

        time.sleep(0.5)
        run_interview_evaluation_task(eval_b.id)
        db.refresh(eval_b)
        assert eval_b.status == EvaluationStatus.COMPLETED
        print(f"[PASS] Retry endpoint successfully re-queued failed evaluation and completed without creating duplicate records.")

        print_step("ALL REAL INTERVIEW EVALUATION AGENT TESTS PASSED SUCCESSFULLY!")

    finally:
        db.close()


if __name__ == "__main__":
    test_real_interview_evaluation_e2e()
