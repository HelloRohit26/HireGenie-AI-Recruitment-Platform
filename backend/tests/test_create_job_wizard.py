"""
HireGenie AI - Create Job Campaign Wizard Automated Verification Suite
Tests all 5 steps of the wizard backend contract, validations, status lifecycles, and database persistence.
"""

import os
import sys
import unittest
from fastapi.testclient import TestClient

# Ensure backend root is on path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.db.session import SessionLocal
from app.models.models import Job, ScreeningQuestion, InterviewMode

client = TestClient(app)


class TestCreateJobWizardSuite(unittest.TestCase):
    def setUp(self):
        self.db = SessionLocal()
        self.created_job_ids = []

    def tearDown(self):
        if self.created_job_ids:
            for jid in self.created_job_ids:
                try:
                    job = self.db.query(Job).filter(Job.id == jid).first()
                    if job:
                        self.db.delete(job)
                except Exception:
                    pass
            self.db.commit()
        self.db.close()

    def test_01_create_complete_job_campaign(self):
        """Verify complete job creation with all 5-step parameters."""
        payload = {
            "title": "Lead Autonomous Systems Architect",
            "company": "DeepMind Nexus Labs",
            "department": "AI Research & Engineering",
            "description": "Lead the development of next-generation autonomous AI multi-agent recruitment swarms.",
            "responsibilities": "• Architect distributed agent orchestration\\n• Implement real-time WebRTC audio processing",
            "required_qualifications": "• MS/PhD in CS or AI\\n• 5+ years building distributed AI services",
            "preferred_qualifications": "• Experience with PostgreSQL vector embeddings and PyTorch",
            "location": "San Francisco, CA / Hybrid",
            "work_mode": "HYBRID",
            "employment_type": "FULL_TIME",
            "experience_level": "LEAD",
            "min_experience": 5.0,
            "max_experience": 10.0,
            "salary_disclosed": True,
            "salary_type": "ANNUAL",
            "currency": "USD",
            "min_salary": 180000.0,
            "max_salary": 250000.0,
            "company_website": "https://deepmind-nexus.example.com",
            "company_description": "Pioneering state of the art autonomous intelligence platforms.",
            "company_size": "201-500",
            "status": "OPEN",
            "must_have_skills": ["Python", "FastAPI", "PyTorch", "Distributed Systems"],
            "nice_to_have_skills": ["WebRTC", "PostgreSQL", "Docker", "Kubernetes"],
            "screening_enabled": True,
            "education_requirements": "Master's Degree",
            "certifications": ["AWS Certified Machine Learning", "CKA"],
            "resume_required": True,
            "target_shortlist_count": 15,
            "shortlist_threshold": 80.0,
            "max_interview_candidates": 10,
            "auto_shortlist": True,
            "interview_mode": "WEBRTC",
            "interview_duration_minutes": 20,
            "technical_topics": ["Agent Swarm Architecture", "Vector Search Optimization"],
            "behavioral_topics": ["Technical Leadership", "Cross-Functional Vision"],
            "interview_difficulty": "EXPERT",
            "interview_rubric": {
                "Communication": 20.0,
                "Technical Knowledge": 40.0,
                "Problem Solving": 25.0,
                "Role Fit": 15.0
            },
            "screening_questions": [
                {
                    "question_text": "How many years of experience do you have with real-time distributed AI systems?",
                    "category": "Experience",
                    "weight": 1.5,
                    "is_required": True
                },
                {
                    "question_text": "Describe your architectural approach to multi-agent state coordination.",
                    "category": "Technical",
                    "weight": 2.0,
                    "is_required": True
                }
            ]
        }

        response = client.post("/api/v1/jobs/", json=payload)
        self.assertEqual(response.status_code, 201, f"Error: {response.text}")
        data = response.json()
        self.created_job_ids.append(data["id"])

        # Check returned fields
        self.assertEqual(data["title"], payload["title"])
        self.assertEqual(data["company"], payload["company"])
        self.assertEqual(data["department"], payload["department"])
        self.assertEqual(data["work_mode"], "HYBRID")
        self.assertEqual(data["experience_level"], "LEAD")
        self.assertEqual(data["min_experience"], 5.0)
        self.assertEqual(data["max_experience"], 10.0)
        self.assertEqual(data["salary_disclosed"], True)
        self.assertEqual(data["min_salary"], 180000.0)
        self.assertEqual(data["max_salary"], 250000.0)
        self.assertIn("USD 180,000 - 250,000 / Annual", data["salary_range"])
        self.assertEqual(data["target_shortlist_count"], 15)
        self.assertEqual(data["shortlist_threshold"], 80.0)
        self.assertEqual(data["interview_duration_minutes"], 20)
        self.assertEqual(data["interview_difficulty"], "EXPERT")
        self.assertEqual(len(data["screening_questions"]), 2)
        self.assertEqual(data["screening_questions"][0]["is_required"], True)

    def test_02_validation_bounds(self):
        """Verify server-side validation error handling."""
        # 1. Missing title
        res = client.post("/api/v1/jobs/", json={
            "title": "",
            "company": "Acme",
            "description": "Test"
        })
        self.assertEqual(res.status_code, 400)

        # 2. Min experience > Max experience
        res = client.post("/api/v1/jobs/", json={
            "title": "Invalid Exp Job",
            "company": "Acme",
            "description": "Test",
            "min_experience": 8.0,
            "max_experience": 3.0
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("Minimum experience cannot be greater", res.text)

        # 3. Min salary > Max salary
        res = client.post("/api/v1/jobs/", json={
            "title": "Invalid Salary Job",
            "company": "Acme",
            "description": "Test",
            "salary_disclosed": True,
            "min_salary": 200000.0,
            "max_salary": 100000.0
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("Minimum salary cannot be greater", res.text)

    def test_03_save_draft_and_publish_lifecycle(self):
        """Verify draft saving, status switching, and editing."""
        draft_payload = {
            "title": "Draft Staff Engineer Requisition",
            "company": "HireGenie AI",
            "department": "Software Engineering",
            "description": "Draft job description in progress.",
            "status": "DRAFT",
            "salary_disclosed": False
        }
        res = client.post("/api/v1/jobs/", json=draft_payload)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.created_job_ids.append(data["id"])
        self.assertEqual(data["status"], "DRAFT")
        self.assertEqual(data["salary_range"], "Salary not disclosed")

        # Publish the job via status PATCH
        res_patch = client.patch(f"/api/v1/jobs/{data['id']}/status", json={"status": "OPEN"})
        self.assertEqual(res_patch.status_code, 200)
        self.assertEqual(res_patch.json()["status"], "OPEN")

        # Update the job specifications via PUT
        res_put = client.put(f"/api/v1/jobs/{data['id']}", json={
            "title": "Published Staff Engineer Requisition",
            "salary_disclosed": True,
            "min_salary": 140000.0,
            "max_salary": 190000.0,
            "currency": "USD",
            "salary_type": "ANNUAL"
        })
        self.assertEqual(res_put.status_code, 200)
        updated = res_put.json()
        self.assertEqual(updated["title"], "Published Staff Engineer Requisition")
        self.assertEqual(updated["min_salary"], 140000.0)
        self.assertIn("USD 140,000 - 190,000 / Annual", updated["salary_range"])

    def test_04_single_record_consistency(self):
        """Verify consistency between list and detail endpoints."""
        payload = {
            "title": "Consistent AI Engineer",
            "company": "HireGenie Enterprise",
            "department": "AI Research & Engineering",
            "description": "Ensuring single source of truth across all views.",
            "location": "New York, NY",
            "work_mode": "REMOTE",
            "employment_type": "CONTRACT",
            "experience_level": "MID_LEVEL",
            "min_experience": 2.0,
            "max_experience": 4.0,
            "must_have_skills": ["Python", "FastAPI"]
        }
        res = client.post("/api/v1/jobs/", json=payload)
        self.assertEqual(res.status_code, 201)
        created = res.json()
        job_id = created["id"]
        self.created_job_ids.append(job_id)

        # Detail GET
        detail_res = client.get(f"/api/v1/jobs/{job_id}")
        self.assertEqual(detail_res.status_code, 200)
        detail = detail_res.json()
        self.assertEqual(detail["title"], payload["title"])
        self.assertEqual(detail["company"], payload["company"])
        self.assertEqual(detail["work_mode"], "REMOTE")

        # List GET
        list_res = client.get("/api/v1/jobs/")
        self.assertEqual(list_res.status_code, 200)
        all_jobs = list_res.json()
        matching = [j for j in all_jobs if j["id"] == job_id]
        self.assertEqual(len(matching), 1)
        self.assertEqual(matching[0]["title"], payload["title"])
        self.assertEqual(matching[0]["company"], payload["company"])


if __name__ == "__main__":
    unittest.main()
