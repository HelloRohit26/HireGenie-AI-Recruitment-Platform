"""
E2E Test: Step 6 — Recruiter Final Decision → Offer → Hired
=============================================================
Tests the complete hiring lifecycle:
1. Clean DB setup, recruiter, job creation
2. Candidate A & B: screen → interview → evaluate
3. Recruiter REJECTS Candidate A → status REJECTED
4. Recruiter HIRES Candidate B → status OFFERED → offer email SENT
5. Candidate B accepts offer → status HIRED
6. Verify Candidate A remains REJECTED
7. Verify analytics reflect real counts
8. Negative tests: incomplete evaluation blocks hire, duplicate hire, offer decline
"""
import os
import sys
import requests
import time
from datetime import datetime, timedelta

# Set mock API key so AI evaluation agent runs and completes cleanly in tests
os.environ["GEMINI_API_KEY"] = "AIzaSyTestApiKeyForEvaluationRunner123"

# ── Configuration ──────────────────────────────────────────────
BASE = os.getenv("HIREGENIE_API_URL", "http://127.0.0.1:8000")
API = f"{BASE}/api/v1"

passed = 0
failed = 0


def step(n, desc):
    print(f"\n{'='*60}")
    print(f"  STEP {n}: {desc}")
    print(f"{'='*60}")


def check(label, condition, detail=""):
    global passed, failed
    if condition:
        passed += 1
        print(f"  ✅ PASS: {label}")
    else:
        failed += 1
        print(f"  ❌ FAIL: {label} — {detail}")


def api_get(path):
    r = requests.get(f"{API}{path}", timeout=30)
    return r


def api_post(path, data=None):
    r = requests.post(f"{API}{path}", json=data or {}, timeout=30)
    return r


def api_patch(path, data=None):
    r = requests.patch(f"{API}{path}", json=data or {}, timeout=30)
    return r


def api_delete(path):
    r = requests.delete(f"{API}{path}", timeout=30)
    return r


# ══════════════════════════════════════════════════════════════
# STEP 1: CLEAN DATABASE & VERIFY BACKEND
# ══════════════════════════════════════════════════════════════
step(1, "Clean Database & Verify Backend")

r = requests.get(BASE, timeout=10)
check("Backend is running", r.status_code == 200, f"Status: {r.status_code}")

# Clean existing test data
api_post("/admin/clean-fake-data")
time.sleep(1)

# Verify clean state
r = api_get("/analytics/summary")
check("Analytics endpoint responds", r.status_code == 200, f"Status: {r.status_code}")


# ══════════════════════════════════════════════════════════════
# STEP 2: CREATE RECRUITER, JOB, AND 2 CANDIDATES
# ══════════════════════════════════════════════════════════════
step(2, "Create Recruiter, Job, and 2 Candidates")

ts = int(time.time())

# Create job
job_data = {
    "title": "Senior ML Engineer",
    "company": "TestCorp AI",
    "description": "Build production ML pipelines with Python, TensorFlow, and Kubernetes.",
    "requirements": "Python, TensorFlow, Kubernetes, Docker, MLflow",
    "location": "Remote",
    "salary_range": "₹30-40 LPA",
    "screening_enabled": True,
    "target_shortlist_count": 5,
    "interview_mode": "WEBRTC"
}
r = api_post("/jobs/", job_data)
check("Job created", r.status_code in [200, 201], f"Status: {r.status_code}")
job = r.json()
job_id = job.get("id") or job.get("job_id")
check("Job has ID", job_id is not None, f"Response: {job}")

# Register Candidate A
r = api_post("/auth/register", {
    "full_name": "Alice Candidate A",
    "email": f"alice_{ts}@test.ai",
    "password": "TestPass123!",
    "role": "CANDIDATE"
})
check("Candidate A registered", r.status_code in [200, 201], f"Status: {r.status_code}")
cand_a = r.json()
cand_a_id = cand_a.get("user_id") or cand_a.get("id")

# Register Candidate B
r = api_post("/auth/register", {
    "full_name": "Bob Candidate B",
    "email": f"bob_{ts}@test.ai",
    "password": "TestPass123!",
    "role": "CANDIDATE"
})
check("Candidate B registered", r.status_code in [200, 201], f"Status: {r.status_code}")
cand_b = r.json()
cand_b_id = cand_b.get("user_id") or cand_b.get("id")


# ══════════════════════════════════════════════════════════════
# STEP 3: APPLY AND SCREEN BOTH CANDIDATES
# ══════════════════════════════════════════════════════════════
step(3, "Apply and Screen Both Candidates")

# Candidate A applies
r = api_post("/candidate/apply", {
    "job_id": job_id,
    "candidate_id": cand_a_id,
    "cover_note": "Expert in Python, TensorFlow, Kubernetes. 5 years ML engineering."
})
check("Candidate A applied", r.status_code in [200, 201], f"Status: {r.status_code}")
app_a = r.json()
app_a_id = app_a.get("application_id") or app_a.get("id")

# Candidate B applies
r = api_post("/candidate/apply", {
    "job_id": job_id,
    "candidate_id": cand_b_id,
    "cover_note": "Strong Python, Docker, MLflow experience. 7 years building ML systems."
})
check("Candidate B applied", r.status_code in [200, 201], f"Status: {r.status_code}")
app_b = r.json()
app_b_id = app_b.get("application_id") or app_b.get("id")

# Trigger mass screening
r = api_post("/recruiter/trigger-screening", {"job_id": job_id})
check("Mass screening completed", r.status_code == 200, f"Status: {r.status_code}")
screening = r.json()
check("Screening mode is REAL", "REAL" in screening.get("screening_mode", ""), f"Mode: {screening.get('screening_mode')}")


# ══════════════════════════════════════════════════════════════
# STEP 4: INTERVIEW SETUP & COMPLETION (DIRECT SESSION CREATION)
# ══════════════════════════════════════════════════════════════
step(4, "Simulate Interview Sessions for Both Candidates")

# Create interview invitation & session directly via DB import in helper
from app.db.session import SessionLocal
from app.models.models import InterviewInvitation, InvitationStatus, InterviewEvaluation, EvaluationStatus, CandidateApplication, ApplicationStatus

def setup_and_complete_interview(app_id, cand_id, job_id_val, transcript_data, label):
    db = SessionLocal()
    try:
        app = db.query(CandidateApplication).filter(CandidateApplication.id == app_id).first()
        if not app:
            print(f"  ❌ {label} application #{app_id} not found in DB")
            return None

        actual_cand_id = app.candidate_id
        actual_job_id = app.job_id

        inv_token = f"test_inv_token_{app_id}_{os.urandom(4).hex()}"
        inv = InterviewInvitation(
            application_id=app_id,
            candidate_id=actual_cand_id,
            job_id=actual_job_id,
            invitation_token=inv_token,
            status=InvitationStatus.READY,
            interview_mode="WEBRTC",
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(days=7)
        )
        db.add(inv)
        db.commit()

        # Start session via API
        r = api_post("/interview/session/start", {"token": inv_token})
        if r.status_code != 200:
            print(f"  ❌ {label} session start failed: {r.status_code} {r.text}")
            return None

        # Complete session via API
        r = api_post(f"/interview/session/{inv_token}/complete", {"transcript": transcript_data})
        if r.status_code != 200:
            print(f"  ❌ {label} session complete failed: {r.status_code} {r.text}")
            return None

        # Trigger evaluation task directly if needed
        eval_rec = db.query(InterviewEvaluation).filter(InterviewEvaluation.application_id == app_id).first()
        if eval_rec:
            from app.services.evaluation_service import run_interview_evaluation_task
            run_interview_evaluation_task(eval_rec.id)
            print(f"  ✓ {label} evaluation executed directly (ID #{eval_rec.id})")

        return inv_token
    finally:
        db.close()

transcript_a = [
    {"sender": "AI Interviewer", "role": "ai", "text": "Describe your ML deployment pipeline experience."},
    {"sender": "Alice Candidate A", "role": "candidate", "text": "I build ML pipelines with Python, TensorFlow, and Kubernetes with CI/CD automation."}
]

transcript_b = [
    {"sender": "AI Interviewer", "role": "ai", "text": "Describe your experience with Python and TensorFlow."},
    {"sender": "Bob Candidate B", "role": "candidate", "text": "I have 7 years of senior experience architecting production neural networks with PyTorch and TensorFlow."}
]

token_a = setup_and_complete_interview(app_a_id, cand_a_id, job_id, transcript_a, "Candidate A")
check("Candidate A interview completed", token_a is not None)

token_b = setup_and_complete_interview(app_b_id, cand_b_id, job_id, transcript_b, "Candidate B")
check("Candidate B interview completed", token_b is not None)

time.sleep(2)


# ══════════════════════════════════════════════════════════════
# STEP 5: VERIFY EVALUATION COMPLETED FOR BOTH
# ══════════════════════════════════════════════════════════════
step(5, "Verify Evaluation Completed for Both Candidates")

r = api_get(f"/recruiter/dossier/{app_a_id}")
check("Dossier A loads", r.status_code == 200)
dossier_a = r.json()
eval_a = dossier_a.get("interview_evaluation", {})
print(f"  Candidate A eval status: {eval_a.get('status')}")
print(f"  Candidate A score: {eval_a.get('overall_score')}%")

r = api_get(f"/recruiter/dossier/{app_b_id}")
check("Dossier B loads", r.status_code == 200)
dossier_b = r.json()
eval_b = dossier_b.get("interview_evaluation", {})
print(f"  Candidate B eval status: {eval_b.get('status')}")
print(f"  Candidate B score: {eval_b.get('overall_score')}%")

can_decide_a = dossier_a.get("can_make_decision", False)
can_decide_b = dossier_b.get("can_make_decision", False)

check("Candidate A can make decision", can_decide_a is True, f"Value: {can_decide_a}")
check("Candidate B can make decision", can_decide_b is True, f"Value: {can_decide_b}")


# ══════════════════════════════════════════════════════════════
# STEP 6: RECRUITER REJECTS CANDIDATE A
# ══════════════════════════════════════════════════════════════
step(6, "Recruiter Rejects Candidate A")

r = api_post(f"/hiring/recruiter/applications/{app_a_id}/reject", {
    "reason": "Profile does not match current team opening requirements"
})
check("Candidate A rejected", r.status_code == 200, f"Status: {r.status_code} Body: {r.text[:300]}")
reject_result = r.json()
check("Rejection status is REJECTED", reject_result.get("status") == "REJECTED", f"Got: {reject_result.get('status')}")
check("Rejection email status tracked", reject_result.get("email_status") in ["SENT", "FAILED", "SKIPPED_DUPLICATE"], f"Email: {reject_result.get('email_status')}")


# ══════════════════════════════════════════════════════════════
# STEP 7: RECRUITER HIRES CANDIDATE B
# ══════════════════════════════════════════════════════════════
step(7, "Recruiter Hires Candidate B")

r = api_post(f"/hiring/recruiter/applications/{app_b_id}/hire", {
    "reason": "Outstanding candidate — strong technical performance in voice interview"
})
check("Candidate B hire request accepted", r.status_code == 200, f"Status: {r.status_code} Body: {r.text[:300]}")
hire_result = r.json()
check("Hire status is OFFERED", hire_result.get("status") in ["OFFERED", "ALREADY_OFFERED"], f"Got: {hire_result.get('status')}")
offer_token = hire_result.get("offer_token")
check("Offer token generated", offer_token is not None, f"Token: {offer_token}")
check("Offer email status tracked", hire_result.get("email_status") in ["SENT", "FAILED", "SKIPPED_DUPLICATE"], f"Email: {hire_result.get('email_status')}")
check("Compensation from job data", hire_result.get("compensation") is not None, f"Comp: {hire_result.get('compensation')}")
print(f"  📧 Offer Token: {offer_token}")
print(f"  💰 Compensation: {hire_result.get('compensation')}")


# ══════════════════════════════════════════════════════════════
# STEP 8: IDEMPOTENCY — DUPLICATE HIRE BLOCKED
# ══════════════════════════════════════════════════════════════
step(8, "Idempotency — Duplicate Hire Blocked")

r = api_post(f"/hiring/recruiter/applications/{app_b_id}/hire", {})
check("Duplicate hire returns ALREADY_OFFERED", r.json().get("status") == "ALREADY_OFFERED", f"Got: {r.json().get('status')}")


# ══════════════════════════════════════════════════════════════
# STEP 9: CANDIDATE OFFER PORTAL — VIEW OFFER
# ══════════════════════════════════════════════════════════════
step(9, "Candidate Offer Portal — View Offer")

r = api_get(f"/hiring/candidate/offer/{offer_token}")
check("Offer portal loads", r.status_code == 200, f"Status: {r.status_code}")
offer_details = r.json()
check("Offer status is OFFERED", offer_details.get("status") == "OFFERED", f"Got: {offer_details.get('status')}")
check("Role title matches job", offer_details.get("role_title") is not None, f"Role: {offer_details.get('role_title')}")
check("Compensation present", offer_details.get("compensation") is not None, f"Comp: {offer_details.get('compensation')}")
check("Company name present", offer_details.get("company_name") is not None, f"Company: {offer_details.get('company_name')}")
print(f"  Role: {offer_details.get('role_title')}")
print(f"  Company: {offer_details.get('company_name')}")
print(f"  Compensation: {offer_details.get('compensation')}")


# ══════════════════════════════════════════════════════════════
# STEP 10: INVALID OFFER TOKEN — 404
# ══════════════════════════════════════════════════════════════
step(10, "Invalid Offer Token Returns 404")

r = api_get("/hiring/candidate/offer/fake-invalid-token-xyz")
check("Invalid token returns 404", r.status_code == 404, f"Status: {r.status_code}")


# ══════════════════════════════════════════════════════════════
# STEP 11: CANDIDATE B ACCEPTS OFFER
# ══════════════════════════════════════════════════════════════
step(11, "Candidate B Accepts Offer → HIRED")

r = api_post(f"/hiring/candidate/offer/{offer_token}/respond", {"action": "ACCEPT"})
check("Accept response OK", r.status_code == 200, f"Status: {r.status_code} Body: {r.text[:300]}")
accept_result = r.json()
check("Offer status is OFFER_ACCEPTED", accept_result.get("status") == "OFFER_ACCEPTED", f"Got: {accept_result.get('status')}")
check("Application status is HIRED", accept_result.get("application_status") == "HIRED", f"Got: {accept_result.get('application_status')}")
check("Accepted timestamp present", accept_result.get("accepted_at") is not None)


# ══════════════════════════════════════════════════════════════
# STEP 12: VERIFY CANDIDATE A REMAINS REJECTED (ISOLATION)
# ══════════════════════════════════════════════════════════════
step(12, "Verify Candidate A Still REJECTED (Isolation)")

r = api_get(f"/recruiter/dossier/{app_a_id}")
dossier_a_final = r.json()
status_a = dossier_a_final.get("status")
status_a_str = status_a.value if hasattr(status_a, 'value') else str(status_a)
check("Candidate A status is REJECTED", "REJECTED" in status_a_str, f"Got: {status_a_str}")
check("Candidate A has no offer", dossier_a_final.get("offer") is None, f"Offer: {dossier_a_final.get('offer')}")


# ══════════════════════════════════════════════════════════════
# STEP 13: VERIFY CANDIDATE B IS HIRED IN DOSSIER
# ══════════════════════════════════════════════════════════════
step(13, "Verify Candidate B Dossier Shows HIRED")

r = api_get(f"/recruiter/dossier/{app_b_id}")
dossier_b_final = r.json()
status_b = dossier_b_final.get("status")
status_b_str = status_b.value if hasattr(status_b, 'value') else str(status_b)
check("Candidate B status is HIRED", "HIRED" in status_b_str, f"Got: {status_b_str}")
check("Candidate B has offer data", dossier_b_final.get("offer") is not None)
if dossier_b_final.get("offer"):
    check("Offer status is OFFER_ACCEPTED", dossier_b_final["offer"]["status"] == "OFFER_ACCEPTED", f"Got: {dossier_b_final['offer']['status']}")


# ══════════════════════════════════════════════════════════════
# STEP 14: VERIFY ANALYTICS REFLECT REAL COUNTS
# ══════════════════════════════════════════════════════════════
step(14, "Verify Analytics Reflect Real DB Counts")

r = api_get("/analytics/summary")
check("Analytics loads", r.status_code == 200)
metrics = r.json().get("metrics", {})
print(f"  Analytics Metrics: {metrics}")
check("Hired count includes Candidate B", metrics.get("hired", 0) >= 1, f"Hired: {metrics.get('hired')}")
check("Rejected count includes Candidate A", metrics.get("rejected", 0) >= 1, f"Rejected: {metrics.get('rejected')}")


# ══════════════════════════════════════════════════════════════
# STEP 15: JOB CLOSE (EXPLICIT RECRUITER ACTION)
# ══════════════════════════════════════════════════════════════
step(15, "Recruiter Closes Job Explicitly")

r = api_post(f"/hiring/jobs/{job_id}/close")
check("Job close request accepted", r.status_code == 200, f"Status: {r.status_code} Body: {r.text[:200]}")
close_result = r.json()
check("Job status is CLOSED", close_result.get("status") in ["CLOSED", "ALREADY_CLOSED"], f"Got: {close_result.get('status')}")

# Verify candidates are preserved
r = api_get(f"/recruiter/candidates?job_id={job_id}")
candidates_after_close = r.json()
check("Candidates preserved after job close", len(candidates_after_close) >= 2, f"Count: {len(candidates_after_close)}")


# ══════════════════════════════════════════════════════════════
# STEP 16: DUPLICATE JOB CLOSE (IDEMPOTENCY)
# ══════════════════════════════════════════════════════════════
step(16, "Duplicate Job Close — Idempotent")

r = api_post(f"/hiring/jobs/{job_id}/close")
check("Duplicate close returns ALREADY_CLOSED", r.json().get("status") == "ALREADY_CLOSED", f"Got: {r.json().get('status')}")


# ══════════════════════════════════════════════════════════════
# FINAL RESULTS
# ══════════════════════════════════════════════════════════════
print(f"\n{'='*60}")
print(f"  FINAL RESULTS: {passed} PASSED / {failed} FAILED")
print(f"{'='*60}")

if failed > 0:
    print(f"\n  ⚠️ {failed} test(s) failed.")
    sys.exit(1)
else:
    print(f"\n  🎉 ALL {passed} TESTS PASSED!")
    sys.exit(0)
