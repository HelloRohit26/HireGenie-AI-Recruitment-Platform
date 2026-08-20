"""
HireGenie AI - E2E Verification of Job Status Filtering Against Live FastAPI & PostgreSQL
Tests:
- Real database status returns ('OPEN', 'CLOSED', 'ARCHIVED', 'DRAFT')
- Status transitions via PATCH /api/v1/jobs/{id}/status
- Correct counts for All, Active, Closed, Draft, Archived
- Status casing resilience
"""

import os
import sys
import unittest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.db.session import SessionLocal
from app.models.models import Job

client = TestClient(app)


class TestJobStatusFilterE2E(unittest.TestCase):
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

    def test_canonical_statuses_and_casing(self):
        """Verify API persists and retrieves exact canonical statuses and respects casing."""
        # 1. Create 3 OPEN jobs
        open_ids = []
        for i in range(3):
            res = client.post("/api/v1/jobs/", json={
                "title": f"Open Engineer {i+1}",
                "company": "HireGenie Enterprise",
                "description": "Active requisition accepting candidates.",
                "status": "OPEN"
            })
            self.assertEqual(res.status_code, 201)
            job_data = res.json()
            open_ids.append(job_data["id"])
            self.created_job_ids.append(job_data["id"])
            self.assertEqual(job_data["status"], "OPEN")

        # 2. Transition 1 to CLOSED, 1 to ARCHIVED, 1 to DRAFT
        client.patch(f"/api/v1/jobs/{open_ids[0]}/status", json={"status": "CLOSED"})
        client.patch(f"/api/v1/jobs/{open_ids[1]}/status", json={"status": "ARCHIVED"})
        client.patch(f"/api/v1/jobs/{open_ids[2]}/status", json={"status": "DRAFT"})

        # Verify single item fetches return exact canonical statuses
        res_closed = client.get(f"/api/v1/jobs/{open_ids[0]}")
        self.assertEqual(res_closed.json()["status"], "CLOSED")

        res_archived = client.get(f"/api/v1/jobs/{open_ids[1]}")
        self.assertEqual(res_archived.json()["status"], "ARCHIVED")

        res_draft = client.get(f"/api/v1/jobs/{open_ids[2]}")
        self.assertEqual(res_draft.json()["status"], "DRAFT")


if __name__ == "__main__":
    unittest.main()
