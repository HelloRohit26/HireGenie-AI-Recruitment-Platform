import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.models.models import Job

client = TestClient(app)


class TestJobSalaryPersistence(unittest.TestCase):
    def setUp(self):
        self.db = SessionLocal()
        self.created_job_ids = []

    def tearDown(self):
        for jid in self.created_job_ids:
            job = self.db.query(Job).filter(Job.id == jid).first()
            if job:
                self.db.delete(job)
        self.db.commit()
        self.db.close()

    def test_01_create_job_with_salary_inr_snake_case(self):
        """Verify job creation with min_salary = 800000, max_salary = 1200000 in INR (snake_case)."""
        payload = {
            "title": "Senior AI Backend Engineer",
            "company": "HireGenie AI Test Corp",
            "department": "Engineering",
            "description": "Building high scale autonomous AI agents and workflows.",
            "location": "Bengaluru, India",
            "work_mode": "HYBRID",
            "employment_type": "FULL_TIME",
            "experience_level": "SENIOR",
            "min_experience": 4.0,
            "max_experience": 8.0,
            "salary_disclosed": True,
            "salary_type": "ANNUAL",
            "currency": "INR",
            "min_salary": 800000,
            "max_salary": 1200000,
        }

        response = client.post("/api/v1/jobs/", json=payload)
        self.assertEqual(response.status_code, 201, f"API Error: {response.text}")
        data = response.json()
        job_id = data["id"]
        self.created_job_ids.append(job_id)

        # 1. Verify API Response
        self.assertEqual(data["min_salary"], 800000.0)
        self.assertEqual(data["max_salary"], 1200000.0)
        self.assertEqual(data["currency"], "INR")
        self.assertEqual(data["salary_disclosed"], True)
        self.assertEqual(data["salary_range"], "INR 800,000 - 1,200,000 / Annual")

        # 2. Verify PostgreSQL Database Record directly
        db_job = self.db.query(Job).filter(Job.id == job_id).first()
        self.assertIsNotNone(db_job)
        self.assertEqual(db_job.min_salary, 800000.0)
        self.assertEqual(db_job.max_salary, 1200000.0)
        self.assertEqual(db_job.currency, "INR")
        self.assertEqual(db_job.salary_disclosed, True)
        self.assertEqual(db_job.salary_type, "ANNUAL")
        self.assertEqual(db_job.salary_range, "INR 800,000 - 1,200,000 / Annual")

        # 3. Verify GET /api/v1/jobs/{id}
        get_res = client.get(f"/api/v1/jobs/{job_id}")
        self.assertEqual(get_res.status_code, 200)
        get_data = get_res.json()
        self.assertEqual(get_data["min_salary"], 800000.0)
        self.assertEqual(get_data["max_salary"], 1200000.0)
        self.assertEqual(get_data["currency"], "INR")
        self.assertEqual(get_data["salary_range"], "INR 800,000 - 1,200,000 / Annual")

    def test_02_create_job_with_camel_case_salary_fields(self):
        """Verify camelCase payload normalization (minSalary/maxSalary) commonly sent by frontend/clients."""
        payload = {
            "title": "Fullstack Platform Engineer",
            "company": "HireGenie AI Test Corp",
            "department": "Platform",
            "description": "Fullstack platform development with React and FastAPI.",
            "location": "Remote - India",
            "workMode": "REMOTE",
            "employmentType": "FULL_TIME",
            "experienceLevel": "MID_LEVEL",
            "minExperience": 3.0,
            "maxExperience": 6.0,
            "salaryDisclosed": True,
            "salaryType": "ANNUAL",
            "currency": "INR",
            "minSalary": 800000,
            "maxSalary": 1200000,
        }

        response = client.post("/api/v1/jobs/", json=payload)
        self.assertEqual(response.status_code, 201, f"API Error: {response.text}")
        data = response.json()
        job_id = data["id"]
        self.created_job_ids.append(job_id)

        # 1. Verify API Response
        self.assertEqual(data["min_salary"], 800000.0)
        self.assertEqual(data["max_salary"], 1200000.0)
        self.assertEqual(data["currency"], "INR")
        self.assertEqual(data["salary_range"], "INR 800,000 - 1,200,000 / Annual")

        # 2. Verify PostgreSQL Database Record
        db_job = self.db.query(Job).filter(Job.id == job_id).first()
        self.assertIsNotNone(db_job)
        self.assertEqual(db_job.min_salary, 800000.0)
        self.assertEqual(db_job.max_salary, 1200000.0)
        self.assertEqual(db_job.currency, "INR")
        self.assertEqual(db_job.salary_range, "INR 800,000 - 1,200,000 / Annual")

    def test_03_create_job_undisclosed_salary(self):
        """Verify salary_disclosed = False behaves truthfully without showing amounts."""
        payload = {
            "title": "Confidential Staff Lead",
            "company": "HireGenie AI Test Corp",
            "department": "Executive",
            "description": "Leadership position with undisclosed salary band.",
            "location": "Mumbai, India",
            "salary_disclosed": False,
            "min_salary": 2500000,
            "max_salary": 4000000,
        }

        response = client.post("/api/v1/jobs/", json=payload)
        self.assertEqual(response.status_code, 201, f"API Error: {response.text}")
        data = response.json()
        job_id = data["id"]
        self.created_job_ids.append(job_id)

        self.assertEqual(data["salary_disclosed"], False)
        self.assertEqual(data["salary_range"], "Salary not disclosed")

        # Database keeps min_salary and max_salary for internal budgeting but salary_range is undisclosed
        db_job = self.db.query(Job).filter(Job.id == job_id).first()
        self.assertEqual(db_job.salary_disclosed, False)
        self.assertEqual(db_job.salary_range, "Salary not disclosed")


if __name__ == "__main__":
    unittest.main()
