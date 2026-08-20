"""End-to-End Automated Test Suite for Real AI Screening, Explainable Scoring, and Dynamic Job-Scoped Ranking."""
import sys
import os
import time
from fastapi.testclient import TestClient

# Ensure backend root is on Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.main import app
from app.db.session import SessionLocal
from app.db.reset_dev import reset_development_database
from app.models.models import CandidateApplication, Job, Resume, User, UserRole, ApplicationStatus
from app.models.communication import CommunicationLog


def run_screening_and_ranking_tests():
    print("==================================================")
    print("STARTING HIREGENIE REAL AI SCREENING & DYNAMIC RANKING TEST SUITE")
    print("==================================================")

    # 1. RESET DEV DB
    os.environ["ENVIRONMENT"] = "development"
    reset_development_database()

    db = SessionLocal()
    try:
        with TestClient(app) as client:
            # 2. CREATE JOB A (AI ENGINEER) AND JOB B (MOBILE DEVELOPER) FOR CROSS-JOB ISOLATION
            job_a_payload = {
                "title": "Senior AI Systems Engineer",
                "company": "HireGenie Autonomous Labs",
                "description": "Building production Python, FastAPI, LangChain, and Machine Learning microservices.",
                "requirements": "Python, FastAPI, LangChain, Machine Learning, SQL, 3+ years experience",
                "must_have_skills": ["Python", "FastAPI", "LangChain", "Machine Learning", "SQL"],
                "location": "Bengaluru / Hybrid",
                "salary_range": "INR 18-25 LPA",
                "interview_mode": "WEBRTC",
                "target_shortlist_count": 5,
                "screening_enabled": True,
                "min_score_threshold": 70.0
            }
            resp = client.post("/api/v1/jobs/", json=job_a_payload)
            assert resp.status_code == 201, f"Job A creation failed: {resp.text}"
            job_a_id = resp.json()["id"]

            job_b_payload = {
                "title": "Mobile Application Developer",
                "company": "HireGenie Mobile",
                "description": "Building Android apps with Java, Spring Boot, and Kotlin.",
                "requirements": "Java, Spring Boot, Android, Kotlin, 2+ years experience",
                "must_have_skills": ["Java", "Spring Boot", "Android"],
                "location": "Remote",
                "salary_range": "INR 12-16 LPA",
                "interview_mode": "WEBRTC",
                "target_shortlist_count": 5,
                "screening_enabled": True,
                "min_score_threshold": 70.0
            }
            resp = client.post("/api/v1/jobs/", json=job_b_payload)
            assert resp.status_code == 201, f"Job B creation failed: {resp.text}"
            job_b_id = resp.json()["id"]

            print(f"[PASS] 1. REQUISITION SETUP: Job A (AI Engineer #{job_a_id}) and Job B (Mobile Developer #{job_b_id}) created.")

            # 3. CREATE CANDIDATE RESUMES IN DB
            # Candidate A: Strong match for Job A
            user_a = User(full_name="Candidate A (Strong AI)", email="candidate_a@hiregenie.ai", hashed_password="mockhashedpassword", role=UserRole.CANDIDATE)
            db.add(user_a)
            db.commit()
            db.refresh(user_a)

            resume_a = Resume(
                candidate_id=user_a.id,
                file_path="/resumes/cand_a.pdf",
                raw_text="Experienced Senior AI Engineer with 4 years experience. Skills: Python, FastAPI, LangChain, Machine Learning, SQL. Built multi-agent LLM systems and production REST APIs. Computer Science degree.",
                parsed_skills=["Python", "FastAPI", "LangChain", "Machine Learning", "SQL"],
                parsed_experience_years=4.0
            )
            db.add(resume_a)

            # Candidate B: Weak match for Job A (Mobile background)
            user_b = User(full_name="Candidate B (Weak Match)", email="candidate_b@hiregenie.ai", hashed_password="mockhashedpassword", role=UserRole.CANDIDATE)
            db.add(user_b)
            db.commit()
            db.refresh(user_b)

            resume_b = Resume(
                candidate_id=user_b.id,
                file_path="/resumes/cand_b.pdf",
                raw_text="Junior Mobile Developer with 1 year experience. Skills: Java, Spring Boot, Android. Built basic mobile applications.",
                parsed_skills=["Java", "Spring Boot", "Android"],
                parsed_experience_years=1.0
            )
            db.add(resume_b)
            db.commit()

            # 4. SUBMIT APPLICATIONS FOR CANDIDATES A & B
            resp_a = client.post("/api/v1/candidate/apply", json={"job_id": job_a_id, "candidate_id": user_a.id})
            assert resp_a.status_code == 201
            app_a_id = resp_a.json()["id"]

            resp_b = client.post("/api/v1/candidate/apply", json={"job_id": job_a_id, "candidate_id": user_b.id})
            assert resp_b.status_code == 201
            app_b_id = resp_b.json()["id"]

            # Give background screening state machine pipeline time to execute
            time.sleep(1.5)

            # 5. VERIFY DIFFERENTIATED EVALUATION & INITIAL RANKING
            app_a = db.query(CandidateApplication).filter(CandidateApplication.id == app_a_id).first()
            app_b = db.query(CandidateApplication).filter(CandidateApplication.id == app_b_id).first()

            assert app_a.overall_match_score > app_b.overall_match_score, f"Expected A ({app_a.overall_match_score}%) > B ({app_b.overall_match_score}%)"
            assert app_a.status == ApplicationStatus.SHORTLISTED, f"Candidate A should be SHORTLISTED, got {app_a.status}"
            assert app_b.status == ApplicationStatus.REJECTED, f"Candidate B should be REJECTED, got {app_b.status}"
            assert app_a.rank == 1, f"Candidate A rank should be #1, got #{app_a.rank}"
            assert app_b.rank == 2, f"Candidate B rank should be #2, got #{app_b.rank}"

            print(f"[PASS] 2. DIFFERENTIATED EVALUATION: Candidate A Score = {app_a.overall_match_score}% (Rank #1, SHORTLISTED) vs Candidate B Score = {app_b.overall_match_score}% (Rank #2, REJECTED)")

            # 6. SUBMIT CANDIDATE C (TOP MATCH FOR JOB A) TO TEST DYNAMIC RE-RANKING
            user_c = User(full_name="Candidate C (Top AI Specialist)", email="candidate_c@hiregenie.ai", hashed_password="mockhashedpassword", role=UserRole.CANDIDATE)
            db.add(user_c)
            db.commit()
            db.refresh(user_c)

            resume_c = Resume(
                candidate_id=user_c.id,
                file_path="/resumes/cand_c.pdf",
                raw_text="Lead AI Systems Architect with 6 years experience. Master of Computer Science degree. Skills: Python, FastAPI, LangChain, Machine Learning, PyTorch, Docker, Kubernetes, SQL. Designed enterprise microservices architecture.",
                parsed_skills=["Python", "FastAPI", "LangChain", "Machine Learning", "PyTorch", "Docker", "Kubernetes", "SQL"],
                parsed_experience_years=6.0
            )
            db.add(resume_c)
            db.commit()

            resp_c = client.post("/api/v1/candidate/apply", json={"job_id": job_a_id, "candidate_id": user_c.id})
            assert resp_c.status_code == 201
            app_c_id = resp_c.json()["id"]

            time.sleep(1.5)

            # Re-fetch records to verify dynamic rank recalculation
            db.expire_all()
            app_a_updated = db.query(CandidateApplication).filter(CandidateApplication.id == app_a_id).first()
            app_b_updated = db.query(CandidateApplication).filter(CandidateApplication.id == app_b_id).first()
            app_c_updated = db.query(CandidateApplication).filter(CandidateApplication.id == app_c_id).first()

            assert app_c_updated.rank == 1, f"Candidate C should become Rank #1, got #{app_c_updated.rank}"
            assert app_a_updated.rank == 2, f"Candidate A should shift to Rank #2, got #{app_a_updated.rank}"
            assert app_b_updated.rank == 3, f"Candidate B should shift to Rank #3, got #{app_b_updated.rank}"

            print(f"[PASS] 3. DYNAMIC RE-RANKING: Candidate C entered with {app_c_updated.overall_match_score}% -> Ranks updated: #1 C ({app_c_updated.overall_match_score}%), #2 A ({app_a_updated.overall_match_score}%), #3 B ({app_b_updated.overall_match_score}%)")

            # 7. CROSS-JOB ISOLATION TEST (CANDIDATE D APPLIES TO JOB B)
            user_d = User(full_name="Candidate D (Mobile Specialist)", email="candidate_d@hiregenie.ai", hashed_password="mockhashedpassword", role=UserRole.CANDIDATE)
            db.add(user_d)
            db.commit()
            db.refresh(user_d)

            resume_d = Resume(
                candidate_id=user_d.id,
                file_path="/resumes/cand_d.pdf",
                raw_text="Android Developer with 3 years experience. Skills: Java, Spring Boot, Android, Kotlin. Computer Science degree.",
                parsed_skills=["Java", "Spring Boot", "Android", "Kotlin"],
                parsed_experience_years=3.0
            )
            db.add(resume_d)
            db.commit()

            resp_d = client.post("/api/v1/candidate/apply", json={"job_id": job_b_id, "candidate_id": user_d.id})
            assert resp_d.status_code == 201
            app_d_id = resp_d.json()["id"]

            time.sleep(1.5)

            db.expire_all()
            app_d_updated = db.query(CandidateApplication).filter(CandidateApplication.id == app_d_id).first()
            app_a_isolated = db.query(CandidateApplication).filter(CandidateApplication.id == app_a_id).first()

            assert app_d_updated.rank == 1, f"Candidate D should be Rank #1 under Job B, got #{app_d_updated.rank}"
            assert app_a_isolated.rank == 2, f"Job A Rank #2 should remain unaffected by Job B, got #{app_a_isolated.rank}"

            print(f"[PASS] 4. CROSS-JOB ISOLATION: Job B Rank #1 is Candidate D ({app_d_updated.overall_match_score}%). Job A ranks remain unaffected.")

            # 8. VERIFY EXPLAINABILITY STRUCTURE
            assert "strengths" in app_c_updated.score_breakdown, "Score breakdown must contain strengths"
            assert "gaps" in app_c_updated.score_breakdown, "Score breakdown must contain gaps"
            assert "explanation" in app_c_updated.score_breakdown, "Score breakdown must contain explanation"
            print(f"[PASS] 5. EXPLAINABILITY: Strengths: {app_c_updated.score_breakdown['strengths']}")

    finally:
        db.close()

    print("==================================================")
    print("REAL AI SCREENING & DYNAMIC RANKING TEST SUITE PASSED SUCCESSFULLY!")
    print("==================================================")


if __name__ == "__main__":
    run_screening_and_ranking_tests()
