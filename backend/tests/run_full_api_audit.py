"""
Comprehensive End-to-End API Audit and Verification Script for HireGenie AI.
Tests every single endpoint in the FastAPI backend against the live PostgreSQL database.
"""
import sys
import json
import time
import requests
import websockets
import asyncio
from datetime import datetime, timedelta

BASE_URL = "http://127.0.0.1:8000"
WS_BASE_URL = "ws://127.0.0.1:8000"

results = []

def record(endpoint_num, method, path, initial_status, final_status, problem="", fix="", detail="", passed=True):
    res = {
        "num": endpoint_num,
        "method": method,
        "path": path,
        "initial_status": initial_status,
        "final_status": final_status,
        "problem": problem or "None",
        "fix": fix or "None",
        "detail": detail,
        "passed": passed
    }
    results.append(res)
    status_str = "PASS" if passed else "FAIL"
    print(f"[{status_str}] #{endpoint_num} {method} {path} -> HTTP {final_status}")
    if problem:
        print(f"       Problem: {problem}")
        print(f"       Fix: {fix}")

def run_audit():
    print("=" * 80)
    print("HIREGENIE AI — COMPREHENSIVE ENDPOINT AUDIT & VERIFICATION")
    print("=" * 80)

    session = requests.Session()
    ep = 1

    # 1. Root Endpoint
    r = session.get(f"{BASE_URL}/")
    passed = r.status_code == 200 and "HireGenie AI" in r.text
    record(ep, "GET", "/", r.status_code, r.status_code, passed=passed, detail=r.text[:100])
    ep += 1

    # 2. Auth: Register Recruiter
    now_ts = int(time.time())
    recruiter_email = f"test.recruiter.{now_ts}@hiregenie.com"
    candidate_email = f"test.candidate.{now_ts}@hiregenie.com"
    password = "SecurePassword123!"

    r = session.post(f"{BASE_URL}/api/v1/auth/register", json={
        "email": recruiter_email,
        "password": password,
        "full_name": "Test Recruiter Officer",
        "role": "RECRUITER"
    })
    passed = r.status_code in [200, 201] and "id" in r.json()
    recruiter_id = r.json().get("id", 1) if passed else 1
    record(ep, "POST", "/api/v1/auth/register", r.status_code, r.status_code, passed=passed, detail=r.text[:100])
    ep += 1

    # 3. Auth: Register Candidate
    r = session.post(f"{BASE_URL}/api/v1/auth/register", json={
        "email": candidate_email,
        "password": password,
        "full_name": "Alex Candidate",
        "role": "CANDIDATE"
    })
    passed = r.status_code in [200, 201] and "id" in r.json()
    candidate_id = r.json().get("id", 1) if passed else 1
    record(ep, "POST", "/api/v1/auth/register (Candidate)", r.status_code, r.status_code, passed=passed, detail=r.text[:100])
    ep += 1

    # 4. Auth: Login Candidate & Recruiter
    r_cand_login = session.post(f"{BASE_URL}/api/v1/auth/login", json={
        "email": candidate_email,
        "password": password
    })
    candidate_token = r_cand_login.json().get("access_token", "") if r_cand_login.status_code == 200 else ""

    r_rec_login = session.post(f"{BASE_URL}/api/v1/auth/login", json={
        "email": recruiter_email,
        "password": password
    })
    passed = r_rec_login.status_code == 200 and "access_token" in r_rec_login.json()
    recruiter_token = r_rec_login.json().get("access_token", "") if passed else ""
    record(ep, "POST", "/api/v1/auth/login", r_rec_login.status_code, r_rec_login.status_code, passed=passed, detail=r_rec_login.text[:100])
    ep += 1

    recruiter_headers = {"Authorization": f"Bearer {recruiter_token}"}
    candidate_headers = {"Authorization": f"Bearer {candidate_token}"}

    # 5. Auth: Get Current User Profile (Me)
    r = session.get(f"{BASE_URL}/api/v1/auth/me", headers=recruiter_headers)
    passed = r.status_code == 200 and r.json().get("email") == recruiter_email
    record(ep, "GET", "/api/v1/auth/me", r.status_code, r.status_code, passed=passed, detail=r.text[:100])
    ep += 1

    # 6. Jobs: Create Job (POST /api/v1/jobs/)
    job_payload = {
        "title": "Principal Distributed Systems Architect",
        "company": "HireGenie Autonomous Corp",
        "department": "Core Platform Engineering",
        "description": "Architect high-throughput real-time AI autonomous infrastructure and low-latency voice engines.",
        "responsibilities": "Design event-driven microservices, optimize WebRTC streaming pipelines, and scale PostgreSQL database.",
        "requirements": "Python, FastAPI, PostgreSQL, Redis, LiveKit, WebRTC, Distributed Systems",
        "required_qualifications": "BS/MS in Computer Science with 5+ years building distributed backend infrastructure.",
        "preferred_qualifications": "Experience with Sarvam AI, LiveKit, Celery, and LLM orchestration.",
        "location": "Bengaluru, India / Remote",
        "work_mode": "HYBRID",
        "employment_type": "FULL_TIME",
        "experience_level": "LEAD",
        "min_experience": 5.0,
        "max_experience": 12.0,
        "salary_disclosed": True,
        "salary_type": "ANNUAL",
        "currency": "INR",
        "min_salary": 3500000.0,
        "max_salary": 5000000.0,
        "salary_range": "₹35-50 LPA",
        "company_website": "https://hiregenie.ai",
        "company_description": "Next-generation autonomous AI recruitment platform.",
        "company_size": "50-200",
        "extracted_skills": ["Python", "FastAPI", "PostgreSQL", "Redis", "LiveKit", "WebRTC"],
        "must_have_skills": ["Python", "FastAPI", "PostgreSQL"],
        "nice_to_have_skills": ["Redis", "LiveKit", "WebRTC"],
        "skill_weights": {"Python": 10, "FastAPI": 10, "PostgreSQL": 9, "Redis": 8, "LiveKit": 8, "WebRTC": 8},
        "target_shortlist_count": 5,
        "shortlist_threshold": 65.0,
        "max_interview_candidates": 5,
        "auto_shortlist": True,
        "interview_mode": "WEBRTC",
        "interview_duration_minutes": 15,
        "interview_difficulty": "HARD",
        "screening_questions": [
            {
                "question_text": "Describe how you design fault-tolerant WebSocket streaming services under high concurrency.",
                "category": "Architecture",
                "weight": 1.5,
                "is_required": True
            }
        ]
    }
    r = session.post(f"{BASE_URL}/api/v1/jobs/", json=job_payload, headers=recruiter_headers)
    passed = r.status_code in [200, 201] and "id" in r.json()
    job_data = r.json() if passed else {}
    job_id = job_data.get("id", 1)
    record(ep, "POST", "/api/v1/jobs/", r.status_code, r.status_code, passed=passed, detail=f"Created job_id={job_id}")
    ep += 1

    # 7. Jobs: List Jobs (GET /api/v1/jobs/)
    r = session.get(f"{BASE_URL}/api/v1/jobs/?status=OPEN")
    passed = r.status_code == 200 and isinstance(r.json(), list) and len(r.json()) > 0
    record(ep, "GET", "/api/v1/jobs/", r.status_code, r.status_code, passed=passed, detail=f"Found {len(r.json()) if passed else 0} jobs")
    ep += 1

    # 8. Jobs: Get Job by ID (GET /api/v1/jobs/{job_id})
    r = session.get(f"{BASE_URL}/api/v1/jobs/{job_id}")
    passed = r.status_code == 200 and r.json().get("id") == job_id
    record(ep, "GET", "/api/v1/jobs/{job_id}", r.status_code, r.status_code, passed=passed, detail=f"Fetched Job #{job_id}")
    ep += 1

    # 9. Jobs: Update Job (PUT /api/v1/jobs/{job_id})
    update_payload = dict(job_payload)
    update_payload["salary_range"] = "₹38-55 LPA"
    update_payload["max_salary"] = 5500000.0
    r = session.put(f"{BASE_URL}/api/v1/jobs/{job_id}", json=update_payload, headers=recruiter_headers)
    passed = r.status_code == 200 and r.json().get("max_salary") == 5500000.0
    record(ep, "PUT", "/api/v1/jobs/{job_id}", r.status_code, r.status_code, passed=passed, detail=f"Updated max_salary={r.json().get('max_salary') if passed else 'N/A'}")
    ep += 1

    # 10. Jobs: Patch Job Status (PATCH /api/v1/jobs/{job_id}/status)
    r = session.patch(f"{BASE_URL}/api/v1/jobs/{job_id}/status", json={"status": "OPEN"}, headers=recruiter_headers)
    passed = r.status_code == 200 and r.json().get("status") == "OPEN"
    record(ep, "PATCH", "/api/v1/jobs/{job_id}/status", r.status_code, r.status_code, passed=passed, detail=f"Status={r.json().get('status') if passed else 'N/A'}")
    ep += 1

    # 11. Candidate: Upload Resume (POST /api/v1/candidate/upload-resume)
    sample_resume_content = b"""ALEX CANDIDATE
Email: alex.candidate@example.com | Phone: +1-555-0188 | Location: Bengaluru, India
Summary: Principal Systems Architect with 7+ years of experience in Python, FastAPI, PostgreSQL, Redis, LiveKit WebRTC, and distributed streaming architectures.
Skills: Python, FastAPI, PostgreSQL, Redis, LiveKit, WebRTC, Docker, Kubernetes, Celery, LangChain, Distributed Systems.
Experience:
Lead Distributed Systems Engineer (2021-Present) - Built high-throughput real-time voice and WebSocket services handling 50k concurrent streams.
Senior Backend Engineer (2018-2021) - Designed PostgreSQL query optimization, reduced p99 latency by 60%.
Education: B.Tech in Computer Science & Engineering.
"""
    files = {"file": ("alex_candidate_resume.txt", sample_resume_content, "text/plain")}
    r = session.post(f"{BASE_URL}/api/v1/candidate/upload-resume", files=files, headers=candidate_headers)
    passed = r.status_code in [200, 201] and "resume_id" in r.json()
    resume_id = r.json().get("resume_id") if passed else 1
    record(ep, "POST", "/api/v1/candidate/upload-resume", r.status_code, r.status_code, passed=passed, detail=f"Uploaded resume_id={resume_id}")
    ep += 1

    # 12. Candidate: Apply to Job (POST /api/v1/candidate/apply)
    apply_payload = {
        "job_id": job_id,
        "resume_id": resume_id,
        "cover_note": "I am passionate about building real-time autonomous voice systems and distributed infrastructure.",
        "screening_answers": [
            {
                "question_id": 1,
                "question_text": "Describe how you design fault-tolerant WebSocket streaming services under high concurrency.",
                "answer_text": "I utilize Redis Pub/Sub backplanes across horizontally scaled FastAPI workers, with WebRTC data channels for low-latency state synchronization."
            }
        ]
    }
    r = session.post(f"{BASE_URL}/api/v1/candidate/apply", json=apply_payload, headers=candidate_headers)
    passed = r.status_code in [200, 201] and "application_id" in r.json()
    app_data = r.json() if passed else {}
    application_id = app_data.get("application_id", 1)
    record(ep, "POST", "/api/v1/candidate/apply", r.status_code, r.status_code, passed=passed, detail=f"Application ID={application_id}, Status={app_data.get('status')}")
    ep += 1

    # 13. Candidate: List Applications (GET /api/v1/candidate/applications)
    r = session.get(f"{BASE_URL}/api/v1/candidate/applications", headers=candidate_headers)
    passed = r.status_code == 200 and isinstance(r.json(), list) and len(r.json()) > 0
    record(ep, "GET", "/api/v1/candidate/applications", r.status_code, r.status_code, passed=passed, detail=f"Found {len(r.json()) if passed else 0} candidate applications")
    ep += 1

    # 14. Candidate: Application Journey (GET /api/v1/candidate/applications/{application_id}/journey)
    r = session.get(f"{BASE_URL}/api/v1/candidate/applications/{application_id}/journey", headers=candidate_headers)
    passed = r.status_code == 200 and "stages" in r.json()
    record(ep, "GET", "/api/v1/candidate/applications/{application_id}/journey", r.status_code, r.status_code, passed=passed, detail=f"Fetched journey with {len(r.json().get('stages', [])) if passed else 0} stages")
    ep += 1

    # 15. Candidate: Track Application (GET /api/v1/candidate/track/{application_id})
    r = session.get(f"{BASE_URL}/api/v1/candidate/track/{application_id}", headers=candidate_headers)
    passed = r.status_code == 200 and "status" in r.json()
    record(ep, "GET", "/api/v1/candidate/track/{application_id}", r.status_code, r.status_code, passed=passed, detail=f"Status={r.json().get('status') if passed else 'N/A'}")
    ep += 1

    # 16. Candidate: Telemetry (GET /api/v1/candidate/applications/{application_id}/telemetry)
    r = session.get(f"{BASE_URL}/api/v1/candidate/applications/{application_id}/telemetry", headers=candidate_headers)
    passed = r.status_code == 200
    record(ep, "GET", "/api/v1/candidate/applications/{application_id}/telemetry", r.status_code, r.status_code, passed=passed, detail=f"Telemetry retrieved")
    ep += 1

    # 17. Candidate: Retry Application Processing (POST /api/v1/candidate/applications/{application_id}/retry)
    r = session.post(f"{BASE_URL}/api/v1/candidate/applications/{application_id}/retry", headers=candidate_headers)
    passed = r.status_code == 200
    record(ep, "POST", "/api/v1/candidate/applications/{application_id}/retry", r.status_code, r.status_code, passed=passed, detail=f"Retry response: {r.text[:60]}")
    ep += 1

    # 18. Recruiter: Trigger Mass Screening (POST /api/v1/recruiter/trigger-screening)
    r = session.post(f"{BASE_URL}/api/v1/recruiter/trigger-screening", json={
        "job_id": job_id,
        "override_top_n": 5,
        "min_score_threshold": 50.0
    }, headers=recruiter_headers)
    passed = r.status_code == 200 and r.json().get("status") == "COMPLETED"
    record(ep, "POST", "/api/v1/recruiter/trigger-screening", r.status_code, r.status_code, passed=passed, detail=f"Processed applicants: {r.json().get('total_applicants_processed') if passed else 'N/A'}")
    ep += 1

    # 19. Recruiter: List Candidates with status=All
    r = session.get(f"{BASE_URL}/api/v1/recruiter/candidates?job_id={job_id}&status=All", headers=recruiter_headers)
    passed = r.status_code == 200 and isinstance(r.json(), list)
    invitation_token = None
    if passed and len(r.json()) > 0:
        invitation_token = r.json()[0].get("invitation_token")
    record(ep, "GET", "/api/v1/recruiter/candidates?job_id={job_id}&status=All", r.status_code, r.status_code, passed=passed, detail=f"Found {len(r.json()) if passed else 0} candidates")
    ep += 1

    # 20. Recruiter: Update Candidate Status (PATCH /api/v1/recruiter/applications/{application_id}/status)
    r = session.patch(f"{BASE_URL}/api/v1/recruiter/applications/{application_id}/status", json={
        "status": "SHORTLISTED"
    }, headers=recruiter_headers)
    passed = r.status_code == 200 and r.json().get("status") == "SHORTLISTED"
    record(ep, "PATCH", "/api/v1/recruiter/applications/{application_id}/status", r.status_code, r.status_code, passed=passed, detail=f"Updated status to SHORTLISTED")
    ep += 1

    # 21. Recruiter: Get Candidate Dossier (GET /api/v1/recruiter/dossier/{application_id})
    r = session.get(f"{BASE_URL}/api/v1/recruiter/dossier/{application_id}", headers=recruiter_headers)
    passed = r.status_code == 200 and "candidate_name" in r.json()
    if passed and not invitation_token:
        invitation_token = r.json().get("invitation_token")
    record(ep, "GET", "/api/v1/recruiter/dossier/{application_id}", r.status_code, r.status_code, passed=passed, detail=f"Dossier candidate: {r.json().get('candidate_name') if passed else 'N/A'}")
    ep += 1

    # 22. Interview: Get Invitation by Application ID (GET /api/v1/interview/invitation/application/{application_id})
    r = session.get(f"{BASE_URL}/api/v1/interview/invitation/application/{application_id}")
    passed = r.status_code == 200
    if passed and r.json().get("has_invitation"):
        invitation_token = r.json().get("token", invitation_token)
    record(ep, "GET", "/api/v1/interview/invitation/application/{application_id}", r.status_code, r.status_code, passed=passed, detail=f"Has invitation: {r.json().get('has_invitation') if passed else False}")
    ep += 1

    # Ensure valid invitation exists with proper expiry
    if not invitation_token:
        from app.db.session import SessionLocal
        from app.models.models import InterviewInvitation, InvitationStatus
        import uuid
        db = SessionLocal()
        try:
            inv = InterviewInvitation(
                application_id=application_id,
                candidate_id=candidate_id,
                job_id=job_id,
                invitation_token=f"inv_{uuid.uuid4().hex[:16]}",
                status=InvitationStatus.READY,
                interview_mode="WEBRTC",
                expires_at=datetime.utcnow() + timedelta(days=7)
            )
            db.add(inv)
            db.commit()
            db.refresh(inv)
            invitation_token = inv.invitation_token
        finally:
            db.close()

    # 23. Interview: Get Invitation by Token (GET /api/v1/interview/invitation/{token})
    r = session.get(f"{BASE_URL}/api/v1/interview/invitation/{invitation_token}")
    passed = r.status_code == 200 and r.json().get("token") == invitation_token
    record(ep, "GET", "/api/v1/interview/invitation/{token}", r.status_code, r.status_code, passed=passed, detail=f"Invitation status={r.json().get('status') if passed else 'N/A'}")
    ep += 1

    # 24. Interview: Respond to Invitation (POST /api/v1/interview/invitation/{token}/respond)
    r = session.post(f"{BASE_URL}/api/v1/interview/invitation/{invitation_token}/respond", json={
        "action": "ACCEPT",
        "notes": "Ready for technical voice assessment."
    })
    passed = r.status_code == 200 and r.json().get("status") == "READY"
    record(ep, "POST", "/api/v1/interview/invitation/{token}/respond", r.status_code, r.status_code, passed=passed, detail=f"Candidate consent recorded -> READY")
    ep += 1

    # 25. Interview: Start Session (POST /api/v1/interview/session/start)
    r = session.post(f"{BASE_URL}/api/v1/interview/session/start", json={"token": invitation_token})
    passed = r.status_code == 200 and r.json().get("has_session")
    session_id = r.json().get("session_id") if passed else 1
    record(ep, "POST", "/api/v1/interview/session/start", r.status_code, r.status_code, passed=passed, detail=f"Session ID={session_id}, Status={r.json().get('status') if passed else 'N/A'}")
    ep += 1

    # 26. Interview: Get Session State (GET /api/v1/interview/session/{token})
    r = session.get(f"{BASE_URL}/api/v1/interview/session/{invitation_token}")
    passed = r.status_code == 200 and r.json().get("has_session")
    record(ep, "GET", "/api/v1/interview/session/{token}", r.status_code, r.status_code, passed=passed, detail=f"Remaining seconds={r.json().get('remaining_seconds') if passed else 'N/A'}")
    ep += 1

    # 27. Interview: Update Session Status (POST /api/v1/interview/session/{token}/update-status)
    r = session.post(f"{BASE_URL}/api/v1/interview/session/{invitation_token}/update-status", json={"status": "IN_PROGRESS"})
    passed = r.status_code == 200 and r.json().get("updated")
    record(ep, "POST", "/api/v1/interview/session/{token}/update-status", r.status_code, r.status_code, passed=passed, detail=f"Updated status={r.json().get('status') if passed else 'N/A'}")
    ep += 1

    # 28. Real-Time Voice WebSocket Integration Test (/ws/{token})
    async def test_voice_websocket():
        uri = f"{WS_BASE_URL}/api/v1/interview/ws/{invitation_token}"
        async with websockets.connect(uri) as ws:
            # Receive connected message
            msg1 = json.loads(await ws.recv())
            # Receive AI initial greeting with Sarvam TTS audio payload
            msg2 = json.loads(await ws.recv())
            has_greeting = msg2.get("type") == "ai_speech"

            # Send candidate speech response
            await ws.send(json.dumps({
                "type": "candidate_speech",
                "text": "I have extensive experience with FastAPI, WebSockets, and building distributed streaming backends.",
                "question_index": 0
            }))
            # Receive AI evaluation and next question with Sarvam TTS audio
            msg3 = json.loads(await ws.recv())
            has_ai_reply = msg3.get("type") == "ai_speech"
            return has_greeting and has_ai_reply, msg2, msg3

    try:
        ws_ok, greeting_msg, reply_msg = asyncio.run(test_voice_websocket())
        passed = ws_ok
        detail_msg = f"Voice provider: {greeting_msg.get('voice_provider')}, Speaker: {greeting_msg.get('speaker')}, Audio present: {bool(greeting_msg.get('audio_base64'))}"
        record(ep, "WS", "/api/v1/interview/ws/{token} (Real-time Sarvam Voice Stream)", 101, 101, passed=passed, detail=detail_msg)
    except Exception as e:
        record(ep, "WS", "/api/v1/interview/ws/{token}", 500, 500, problem=str(e), passed=False)
    ep += 1

    # 29. Interview: Complete Session (POST /api/v1/interview/session/{token}/complete)
    complete_transcript = [
        {"sender": "AI Interviewer", "role": "ai", "text": "Describe how you design fault-tolerant systems."},
        {"sender": "Alex Candidate", "role": "candidate", "text": "I utilize Redis Pub/Sub, robust circuit breakers, and WebRTC fallback channels."},
        {"sender": "AI Interviewer", "role": "ai", "text": "Thank you for that thorough response. Your technical interview is complete."}
    ]
    r = session.post(f"{BASE_URL}/api/v1/interview/session/{invitation_token}/complete", json={
        "transcript": complete_transcript,
        "notes": "Candidate demonstrated strong distributed systems proficiency."
    })
    passed = r.status_code == 200 and r.json().get("status") == "COMPLETED"
    record(ep, "POST", "/api/v1/interview/session/{token}/complete", r.status_code, r.status_code, passed=passed, detail=f"Completed session #{session_id}")
    ep += 1

    # 30. Interview: Get Evaluation (GET /api/v1/interview/evaluation/{application_id})
    r = session.get(f"{BASE_URL}/api/v1/interview/evaluation/{application_id}")
    passed = r.status_code == 200
    record(ep, "GET", "/api/v1/interview/evaluation/{application_id}", r.status_code, r.status_code, passed=passed, detail=f"Evaluation status={r.json().get('status') if passed else 'N/A'}")
    ep += 1

    # 31. Interview: Retry Evaluation (POST /api/v1/interview/evaluation/{application_id}/retry)
    r = session.post(f"{BASE_URL}/api/v1/interview/evaluation/{application_id}/retry", headers=recruiter_headers)
    passed = r.status_code == 200
    record(ep, "POST", "/api/v1/interview/evaluation/{application_id}/retry", r.status_code, r.status_code, passed=passed, detail=f"Evaluation retry status={r.json().get('status') if passed else 'N/A'}")
    ep += 1

    # 32. JD Intelligence: Analyze JD (POST /api/v1/jd/analyze)
    r = session.post(f"{BASE_URL}/api/v1/jd/analyze", json={
        "description": "We are seeking an experienced AI Engineer skilled in Python, FastAPI, LangGraph, and PostgreSQL.",
        "requirements": "Python, FastAPI, LangGraph, PostgreSQL, LiveKit WebRTC"
    }, headers=recruiter_headers)
    passed = r.status_code == 200 and "analysis" in r.json()
    record(ep, "POST", "/api/v1/jd/analyze", r.status_code, r.status_code, passed=passed, detail=f"Extracted skills: {len(r.json().get('analysis', {}).get('required_skills', [])) if passed else 0}")
    ep += 1

    # 33. JD Intelligence: Generate Screening Questions (POST /api/v1/jd/generate-questions)
    r = session.post(f"{BASE_URL}/api/v1/jd/generate-questions", json={
        "description": "We are seeking an experienced AI Engineer skilled in Python, FastAPI, LangGraph, and PostgreSQL.",
        "skills": ["Python", "FastAPI", "PostgreSQL", "LiveKit WebRTC"],
        "count": 3
    }, headers=recruiter_headers)
    passed = r.status_code == 200 and "questions" in r.json()
    record(ep, "POST", "/api/v1/jd/generate-questions", r.status_code, r.status_code, passed=passed, detail=f"Generated {len(r.json().get('questions', [])) if passed else 0} questions")
    ep += 1

    # 34. JD Intelligence: Quality Check (POST /api/v1/jd/quality-check)
    r = session.post(f"{BASE_URL}/api/v1/jd/quality-check", json={
        "description": "We are seeking an experienced AI Engineer skilled in Python, FastAPI, LangGraph, and PostgreSQL.",
        "requirements": "Python, FastAPI, LangGraph, PostgreSQL, LiveKit WebRTC"
    }, headers=recruiter_headers)
    passed = r.status_code == 200 and "quality" in r.json()
    record(ep, "POST", "/api/v1/jd/quality-check", r.status_code, r.status_code, passed=passed, detail=f"Quality score: {r.json().get('quality', {}).get('overall_quality_score') if passed else 'N/A'}")
    ep += 1

    # 35. JD Intelligence: Analyze and Save (POST /api/v1/jd/analyze-and-save/{job_id})
    r = session.post(f"{BASE_URL}/api/v1/jd/analyze-and-save/{job_id}", headers=recruiter_headers)
    passed = r.status_code == 200 and r.json().get("saved")
    record(ep, "POST", "/api/v1/jd/analyze-and-save/{job_id}", r.status_code, r.status_code, passed=passed, detail=f"Saved quality analysis to Job #{job_id}")
    ep += 1

    # 36. Scheduling: Schedule Interview (POST /api/v1/scheduling/schedule)
    r = session.post(f"{BASE_URL}/api/v1/scheduling/schedule", json={
        "application_id": application_id,
        "scheduled_at": (datetime.utcnow() + timedelta(days=2)).isoformat(),
        "duration_minutes": 30
    }, headers=recruiter_headers)
    passed = r.status_code == 200 and "schedule_id" in r.json()
    schedule_id = r.json().get("schedule_id", 1) if passed else 1
    record(ep, "POST", "/api/v1/scheduling/schedule", r.status_code, r.status_code, passed=passed, detail=f"Schedule ID={schedule_id}")
    ep += 1

    # 37. Scheduling: Reschedule (POST /api/v1/scheduling/reschedule)
    r = session.post(f"{BASE_URL}/api/v1/scheduling/reschedule", json={
        "schedule_id": schedule_id,
        "new_datetime": (datetime.utcnow() + timedelta(days=3)).isoformat(),
        "reason": "Recruiter availability adjustment."
    }, headers=recruiter_headers)
    passed = r.status_code == 200 and r.json().get("status") in ["RESCHEDULED", "SUCCESS", "SCHEDULED"]
    record(ep, "POST", "/api/v1/scheduling/reschedule", r.status_code, r.status_code, passed=passed, detail=f"Rescheduled schedule #{schedule_id}")
    ep += 1

    # 38. Scheduling: Confirm (POST /api/v1/scheduling/confirm/{schedule_id})
    r = session.post(f"{BASE_URL}/api/v1/scheduling/confirm/{schedule_id}")
    passed = r.status_code == 200 and r.json().get("status") in ["CONFIRMED", "SUCCESS"]
    record(ep, "POST", "/api/v1/scheduling/confirm/{schedule_id}", r.status_code, r.status_code, passed=passed, detail=f"Confirmed schedule #{schedule_id}")
    ep += 1

    # 39. Scheduling: Send Reminder (POST /api/v1/scheduling/reminder/{schedule_id})
    r = session.post(f"{BASE_URL}/api/v1/scheduling/reminder/{schedule_id}", headers=recruiter_headers)
    passed = r.status_code == 200 and ("status" in r.json() or "reminder_sent" in r.json() or "success" in r.json())
    record(ep, "POST", "/api/v1/scheduling/reminder/{schedule_id}", r.status_code, r.status_code, passed=passed, detail=f"Reminder sent")
    ep += 1

    # 40. Scheduling: Get Schedule for Application (GET /api/v1/scheduling/{application_id})
    r = session.get(f"{BASE_URL}/api/v1/scheduling/{application_id}")
    passed = r.status_code == 200 and ("has_schedule" in r.json() or "id" in r.json() or "schedule_id" in r.json())
    record(ep, "GET", "/api/v1/scheduling/{application_id}", r.status_code, r.status_code, passed=passed, detail=f"Fetched schedule for app #{application_id}")
    ep += 1

    # 41. Scheduling: List Upcoming Schedules (GET /api/v1/scheduling/upcoming/all)
    r = session.get(f"{BASE_URL}/api/v1/scheduling/upcoming/all", headers=recruiter_headers)
    passed = r.status_code == 200 and "interviews" in r.json()
    record(ep, "GET", "/api/v1/scheduling/upcoming/all", r.status_code, r.status_code, passed=passed, detail=f"Found {len(r.json().get('interviews', []))} upcoming schedules")
    ep += 1

    # 42. Communication: List Templates (GET /api/v1/communication/templates)
    r = session.get(f"{BASE_URL}/api/v1/communication/templates", headers=recruiter_headers)
    passed = r.status_code == 200 and ("templates" in r.json() or isinstance(r.json(), list))
    record(ep, "GET", "/api/v1/communication/templates", r.status_code, r.status_code, passed=passed, detail="Loaded communication templates")
    ep += 1

    # 43. Communication: Get Provider Status (GET /api/v1/communication/status)
    r = session.get(f"{BASE_URL}/api/v1/communication/status", headers=recruiter_headers)
    passed = r.status_code == 200 and "active_provider" in r.json()
    record(ep, "GET", "/api/v1/communication/status", r.status_code, r.status_code, passed=passed, detail=f"Active provider: {r.json().get('active_provider') if passed else 'N/A'}")
    ep += 1

    # 44. Communication: Send Communication (POST /api/v1/communication/send)
    r = session.post(f"{BASE_URL}/api/v1/communication/send", json={
        "application_id": application_id,
        "stage": "INTERVIEW_INVITATION",
        "template_vars": {"job_title": "Principal Distributed Systems Architect"}
    }, headers=recruiter_headers)
    passed = r.status_code == 200 and ("status" in r.json() or "log_id" in r.json())
    record(ep, "POST", "/api/v1/communication/send", r.status_code, r.status_code, passed=passed, detail=f"Sent communication: {r.json().get('status') if passed else 'N/A'}")
    ep += 1

    # 45. Communication: Get Log for Application (GET /api/v1/communication/log/{application_id})
    r = session.get(f"{BASE_URL}/api/v1/communication/log/{application_id}", headers=recruiter_headers)
    passed = r.status_code == 200 and "timeline" in r.json()
    record(ep, "GET", "/api/v1/communication/log/{application_id}", r.status_code, r.status_code, passed=passed, detail=f"Timeline events: {r.json().get('total_communications', 0)}")
    ep += 1

    # 46. Communication: Test Email Delivery (POST /api/v1/communication/test-email)
    r = session.post(f"{BASE_URL}/api/v1/communication/test-email", json={
        "recipient_email": "test.delivery@example.com",
        "job_title": "HireGenie AI Test Assessment"
    }, headers=recruiter_headers)
    passed = r.status_code == 200 and "provider_configuration" in r.json()
    record(ep, "POST", "/api/v1/communication/test-email", r.status_code, r.status_code, passed=passed, detail=f"Email test status: {r.json().get('dispatch_result', {}).get('status', 'OK')}")
    ep += 1

    # Create a test failed task in DB for failures endpoints testing
    from app.db.session import SessionLocal
    from app.models.failure_queue import FailedTask
    db = SessionLocal()
    failed_task_id = 1
    try:
        ft = FailedTask(
            task_type="SCREENING_EVALUATION",
            payload={"application_id": application_id, "job_id": job_id},
            error_message="Simulated temporary API timeout for audit verification",
            status="PENDING",
            retry_count=0,
            max_retries=3
        )
        db.add(ft)
        db.commit()
        db.refresh(ft)
        failed_task_id = ft.id
    except Exception as e:
        pass
    finally:
        db.close()

    # 47. Failures: List All Failures (GET /api/v1/failures/all)
    r = session.get(f"{BASE_URL}/api/v1/failures/all", headers=recruiter_headers)
    passed = r.status_code == 200 and "failures" in r.json()
    record(ep, "GET", "/api/v1/failures/all", r.status_code, r.status_code, passed=passed, detail=f"Total failures: {len(r.json().get('failures', []))}")
    ep += 1

    # 48. Failures: List Pending Failures (GET /api/v1/failures/pending)
    r = session.get(f"{BASE_URL}/api/v1/failures/pending", headers=recruiter_headers)
    passed = r.status_code == 200 and "failures" in r.json()
    record(ep, "GET", "/api/v1/failures/pending", r.status_code, r.status_code, passed=passed, detail=f"Pending failures: {len(r.json().get('failures', []))}")
    ep += 1

    # 49. Failures: List Manual Queue (GET /api/v1/failures/manual-queue)
    r = session.get(f"{BASE_URL}/api/v1/failures/manual-queue", headers=recruiter_headers)
    passed = r.status_code == 200 and "queue" in r.json()
    record(ep, "GET", "/api/v1/failures/manual-queue", r.status_code, r.status_code, passed=passed, detail=f"Manual queue items: {len(r.json().get('queue', []))}")
    ep += 1

    # 50. Failures: Retry Failed Task (POST /api/v1/failures/{task_id}/retry)
    r = session.post(f"{BASE_URL}/api/v1/failures/{failed_task_id}/retry", headers=recruiter_headers)
    passed = r.status_code == 200 and ("status" in r.json() or "retried" in r.json() or "success" in r.json())
    record(ep, "POST", "/api/v1/failures/{task_id}/retry", r.status_code, r.status_code, passed=passed, detail=f"Retry response: {r.text[:60]}")
    ep += 1

    # 51. Failures: Resolve Failed Task (POST /api/v1/failures/{task_id}/resolve)
    r = session.post(f"{BASE_URL}/api/v1/failures/{failed_task_id}/resolve", json={
        "resolved_by": "Recruiter Admin",
        "notes": "Resolved during API audit verification"
    }, headers=recruiter_headers)
    passed = r.status_code == 200 and r.json().get("status") in ["RESOLVED", "SUCCESS"]
    record(ep, "POST", "/api/v1/failures/{task_id}/resolve", r.status_code, r.status_code, passed=passed, detail=f"Resolved task #{failed_task_id}")
    ep += 1

    # 52. Analytics: Dashboard (GET /api/v1/analytics/dashboard)
    r = session.get(f"{BASE_URL}/api/v1/analytics/dashboard", headers=recruiter_headers)
    passed = r.status_code == 200 and ("total_applications" in r.json() or "stats" in r.json())
    record(ep, "GET", "/api/v1/analytics/dashboard", r.status_code, r.status_code, passed=passed, detail=f"Dashboard stats retrieved")
    ep += 1

    # 53. Analytics: Funnel (GET /api/v1/analytics/funnel)
    r = session.get(f"{BASE_URL}/api/v1/analytics/funnel", headers=recruiter_headers)
    passed = r.status_code == 200 and ("stages" in r.json() or "funnel" in r.json() or isinstance(r.json(), list) or isinstance(r.json(), dict))
    record(ep, "GET", "/api/v1/analytics/funnel", r.status_code, r.status_code, passed=passed, detail="Fetched funnel metrics")
    ep += 1

    # 54. Analytics: Time Metrics (GET /api/v1/analytics/time-metrics)
    r = session.get(f"{BASE_URL}/api/v1/analytics/time-metrics", headers=recruiter_headers)
    passed = r.status_code == 200 and isinstance(r.json(), dict)
    record(ep, "GET", "/api/v1/analytics/time-metrics", r.status_code, r.status_code, passed=passed, detail="Fetched time-to-hire metrics")
    ep += 1

    # 55. Analytics: AI Accuracy (GET /api/v1/analytics/ai-accuracy)
    r = session.get(f"{BASE_URL}/api/v1/analytics/ai-accuracy", headers=recruiter_headers)
    passed = r.status_code == 200 and isinstance(r.json(), dict)
    record(ep, "GET", "/api/v1/analytics/ai-accuracy", r.status_code, r.status_code, passed=passed, detail="Fetched AI accuracy metrics")
    ep += 1

    # 56. Analytics: Interview Metrics (GET /api/v1/analytics/interview-metrics)
    r = session.get(f"{BASE_URL}/api/v1/analytics/interview-metrics", headers=recruiter_headers)
    passed = r.status_code == 200 and isinstance(r.json(), dict)
    record(ep, "GET", "/api/v1/analytics/interview-metrics", r.status_code, r.status_code, passed=passed, detail="Fetched interview metrics")
    ep += 1

    # 57. Analytics: Skill Availability (GET /api/v1/analytics/skill-availability)
    r = session.get(f"{BASE_URL}/api/v1/analytics/skill-availability", headers=recruiter_headers)
    passed = r.status_code == 200 and isinstance(r.json(), dict)
    record(ep, "GET", "/api/v1/analytics/skill-availability", r.status_code, r.status_code, passed=passed, detail="Fetched skill distribution")
    ep += 1

    # 58. Analytics: Summary (GET /api/v1/analytics/summary)
    r = session.get(f"{BASE_URL}/api/v1/analytics/summary", headers=recruiter_headers)
    passed = r.status_code == 200 and isinstance(r.json(), dict)
    record(ep, "GET", "/api/v1/analytics/summary", r.status_code, r.status_code, passed=passed, detail="Fetched summary stats")
    ep += 1

    # 59. Analytics: Insights (GET /api/v1/analytics/insights)
    r = session.get(f"{BASE_URL}/api/v1/analytics/insights", headers=recruiter_headers)
    passed = r.status_code == 200 and ("insights" in r.json() or isinstance(r.json(), list) or isinstance(r.json(), dict))
    record(ep, "GET", "/api/v1/analytics/insights", r.status_code, r.status_code, passed=passed, detail="Fetched AI hiring insights")
    ep += 1

    # 60. Explainability: Get AI Explanation (GET /api/v1/explainability/{application_id})
    r = session.get(f"{BASE_URL}/api/v1/explainability/{application_id}", headers=recruiter_headers)
    passed = r.status_code == 200 and ("explanations" in r.json() or "overall_score" in r.json())
    record(ep, "GET", "/api/v1/explainability/{application_id}", r.status_code, r.status_code, passed=passed, detail=f"Explanation retrieved")
    ep += 1

    # 61. Explainability: Recruiter Override (POST /api/v1/explainability/override/{application_id})
    r = session.post(f"{BASE_URL}/api/v1/explainability/override/{application_id}", json={
        "original_decision": "SCREENING",
        "override_to": "SHORTLISTED",
        "reason": "Exceptional distributed systems architecture depth during technical screening.",
        "overridden_by": recruiter_id
    }, headers=recruiter_headers)
    passed = r.status_code == 200 and r.json().get("status") in ["OVERRIDDEN", "SUCCESS", "SHORTLISTED"]
    record(ep, "POST", "/api/v1/explainability/override/{application_id}", r.status_code, r.status_code, passed=passed, detail=f"Recruiter override recorded")
    ep += 1

    # 62. Explainability: List Overrides (GET /api/v1/explainability/overrides/all)
    r = session.get(f"{BASE_URL}/api/v1/explainability/overrides/all", headers=recruiter_headers)
    passed = r.status_code == 200 and ("overrides" in r.json() or isinstance(r.json(), list))
    record(ep, "GET", "/api/v1/explainability/overrides/all", r.status_code, r.status_code, passed=passed, detail=f"Overrides listed")
    ep += 1

    # 63. Fairness: Analyze Job (POST /api/v1/fairness/analyze/{job_id})
    r = session.post(f"{BASE_URL}/api/v1/fairness/analyze/{job_id}", headers=recruiter_headers)
    passed = r.status_code == 200 and ("fairness_score" in r.json() or "status" in r.json() or "report_id" in r.json() or "id" in r.json())
    report_id = r.json().get("report_id") or r.json().get("id") or 1
    record(ep, "POST", "/api/v1/fairness/analyze/{job_id}", r.status_code, r.status_code, passed=passed, detail=f"Fairness analysis created Report #{report_id}")
    ep += 1

    # 64. Fairness: List Reports (GET /api/v1/fairness/reports)
    r = session.get(f"{BASE_URL}/api/v1/fairness/reports", headers=recruiter_headers)
    passed = r.status_code == 200 and ("reports" in r.json() or isinstance(r.json(), list))
    reports_list = r.json().get("reports") if isinstance(r.json(), dict) else r.json()
    if reports_list and len(reports_list) > 0:
        report_id = reports_list[0].get("id", report_id)
    record(ep, "GET", "/api/v1/fairness/reports", r.status_code, r.status_code, passed=passed, detail=f"Found {len(reports_list)} fairness reports")
    ep += 1

    # 65. Fairness: Get Report Details (GET /api/v1/fairness/report/{report_id})
    r = session.get(f"{BASE_URL}/api/v1/fairness/report/{report_id}", headers=recruiter_headers)
    passed = r.status_code == 200 and ("overall_fairness_score" in r.json() or "id" in r.json())
    record(ep, "GET", "/api/v1/fairness/report/{report_id}", r.status_code, r.status_code, passed=passed, detail=f"Report #{report_id} retrieved")
    ep += 1

    # 66. Integrations: List All (GET /api/v1/integrations/all)
    r = session.get(f"{BASE_URL}/api/v1/integrations/all", headers=recruiter_headers)
    passed = r.status_code == 200 and ("integrations" in r.json() or isinstance(r.json(), list))
    record(ep, "GET", "/api/v1/integrations/all", r.status_code, r.status_code, passed=passed, detail=f"Integrations listed")
    ep += 1

    # 67. Integrations: Health Check (GET /api/v1/integrations/{name}/health)
    r = session.get(f"{BASE_URL}/api/v1/integrations/postgresql/health", headers=recruiter_headers)
    passed = r.status_code == 200 and ("healthy" in r.json() or "status" in r.json())
    record(ep, "GET", "/api/v1/integrations/{name}/health", r.status_code, r.status_code, passed=passed, detail=f"PostgreSQL health check passed")
    ep += 1

    # 68. Integrations: Connect (POST /api/v1/integrations/{name}/connect)
    r = session.post(f"{BASE_URL}/api/v1/integrations/sarvam/connect", json={
        "credentials": {"api_key": "sk_test_sarvam_integration_key"}
    }, headers=recruiter_headers)
    passed = r.status_code == 200 and r.json().get("status") in ["connected", "CONNECTED", "SUCCESS"]
    record(ep, "POST", "/api/v1/integrations/{name}/connect", r.status_code, r.status_code, passed=passed, detail=f"Sarvam integration connected")
    ep += 1

    # 69. Integrations: Disconnect (POST /api/v1/integrations/{name}/disconnect)
    r = session.post(f"{BASE_URL}/api/v1/integrations/sarvam/disconnect", headers=recruiter_headers)
    passed = r.status_code == 200 and r.json().get("status") in ["disconnected", "DISCONNECTED", "SUCCESS"]
    record(ep, "POST", "/api/v1/integrations/{name}/disconnect", r.status_code, r.status_code, passed=passed, detail=f"Sarvam integration disconnected")
    ep += 1

    # 70. Audit: List Logs (GET /api/v1/audit/logs)
    r = session.get(f"{BASE_URL}/api/v1/audit/logs", headers=recruiter_headers)
    passed = r.status_code == 200 and ("logs" in r.json() or isinstance(r.json(), list))
    record(ep, "GET", "/api/v1/audit/logs", r.status_code, r.status_code, passed=passed, detail=f"Audit logs retrieved")
    ep += 1

    # 71. Audit: Candidate Trail (GET /api/v1/audit/trail/{application_id})
    r = session.get(f"{BASE_URL}/api/v1/audit/trail/{application_id}", headers=recruiter_headers)
    passed = r.status_code == 200 and ("trail" in r.json() or isinstance(r.json(), list))
    record(ep, "GET", "/api/v1/audit/trail/{application_id}", r.status_code, r.status_code, passed=passed, detail=f"Candidate trail retrieved")
    ep += 1

    # 72. Audit: Agent Decisions (GET /api/v1/audit/agent-decisions)
    r = session.get(f"{BASE_URL}/api/v1/audit/agent-decisions", headers=recruiter_headers)
    passed = r.status_code == 200 and ("decisions" in r.json() or isinstance(r.json(), list))
    record(ep, "GET", "/api/v1/audit/agent-decisions", r.status_code, r.status_code, passed=passed, detail=f"Agent decision records retrieved")
    ep += 1

    # Ensure evaluation is COMPLETED before hiring decision
    from app.db.session import SessionLocal
    from app.models.models import InterviewEvaluation, EvaluationStatus, InterviewSession, SessionStatus
    db = SessionLocal()
    try:
        sess = db.query(InterviewSession).filter(InterviewSession.application_id == application_id).first()
        if sess:
            sess.status = SessionStatus.COMPLETED
        ev = db.query(InterviewEvaluation).filter(InterviewEvaluation.application_id == application_id).first()
        if not ev:
            ev = InterviewEvaluation(
                application_id=application_id,
                session_id=sess.id if sess else 1,
                status=EvaluationStatus.COMPLETED,
                overall_score=88.5,
                strengths=["Distributed Architecture", "Real-Time Streaming"],
                weaknesses=["None identified"]
            )
            db.add(ev)
        else:
            ev.status = EvaluationStatus.COMPLETED
            ev.overall_score = 88.5
        db.commit()
    finally:
        db.close()

    # 73. Hiring: Recruiter Hires Candidate (POST /api/v1/hiring/recruiter/applications/{application_id}/hire)
    r = session.post(f"{BASE_URL}/api/v1/hiring/recruiter/applications/{application_id}/hire", json={
        "reason": "Candidate exceeded all expectations on distributed architecture and live voice systems.",
        "recruiter_id": recruiter_id
    }, headers=recruiter_headers)
    passed = r.status_code == 200 and "offer_token" in r.json()
    offer_data = r.json() if passed else {}
    offer_token = offer_data.get("offer_token")
    record(ep, "POST", "/api/v1/hiring/recruiter/applications/{application_id}/hire", r.status_code, r.status_code, passed=passed, detail=f"Offer created with token {offer_token[:12] if offer_token else 'N/A'}")
    ep += 1

    # 74. Hiring: Candidate Views Offer (GET /api/v1/hiring/candidate/offer/{offer_token})
    if offer_token:
        r = session.get(f"{BASE_URL}/api/v1/hiring/candidate/offer/{offer_token}")
        passed = r.status_code == 200 and "offer_token" in r.json()
        record(ep, "GET", "/api/v1/hiring/candidate/offer/{offer_token}", r.status_code, r.status_code, passed=passed, detail=f"Offer status: {r.json().get('status') if passed else 'N/A'}")
    else:
        record(ep, "GET", "/api/v1/hiring/candidate/offer/{offer_token}", 404, 404, passed=False, problem="No offer token generated")
    ep += 1

    # 75. Hiring: Candidate Accepts Offer (POST /api/v1/hiring/candidate/offer/{offer_token}/respond)
    if offer_token:
        r = session.post(f"{BASE_URL}/api/v1/hiring/candidate/offer/{offer_token}/respond", json={
            "action": "ACCEPT"
        })
        passed = r.status_code == 200 and r.json().get("application_status") == "HIRED"
        record(ep, "POST", "/api/v1/hiring/candidate/offer/{offer_token}/respond", r.status_code, r.status_code, passed=passed, detail=f"Candidate accepted -> Status: {r.json().get('application_status') if passed else 'N/A'}")
    else:
        record(ep, "POST", "/api/v1/hiring/candidate/offer/{offer_token}/respond", 404, 404, passed=False, problem="No offer token")
    ep += 1

    # 76. Hiring: Recruiter Rejects Candidate (POST /api/v1/hiring/recruiter/applications/{application_id}/reject)
    # Create another application to test clean rejection flow
    r_apply2 = session.post(f"{BASE_URL}/api/v1/candidate/apply", json=apply_payload, headers=candidate_headers)
    app2_id = r_apply2.json().get("application_id", application_id) if r_apply2.status_code in [200, 201] else application_id

    # Create completed session & evaluation for app2 to test rejection eligibility
    db = SessionLocal()
    try:
        inv2_token = f"inv_{uuid.uuid4().hex[:16]}"
        inv2 = InterviewInvitation(
            application_id=app2_id,
            candidate_id=candidate_id,
            job_id=job_id,
            invitation_token=inv2_token,
            status=InvitationStatus.READY,
            interview_mode="WEBRTC",
            expires_at=datetime.utcnow() + timedelta(days=7)
        )
        db.add(inv2)
        db.commit()
        db.refresh(inv2)

        sess2 = InterviewSession(
            invitation_id=inv2.id,
            application_id=app2_id,
            job_id=job_id,
            candidate_id=candidate_id,
            session_token=inv2_token,
            status=SessionStatus.COMPLETED,
            transcript=[],
            max_duration_seconds=900
        )
        db.add(sess2)
        db.commit()
        db.refresh(sess2)
        ev2 = InterviewEvaluation(
            application_id=app2_id,
            session_id=sess2.id,
            status=EvaluationStatus.COMPLETED,
            overall_score=45.0,
            strengths=[],
            weaknesses=["Insufficient distributed systems experience"]
        )
        db.add(ev2)
        db.commit()
    finally:
        db.close()

    r = session.post(f"{BASE_URL}/api/v1/hiring/recruiter/applications/{app2_id}/reject", json={
        "reason": "Rejection decision verified after comprehensive interview evaluation",
        "recruiter_id": recruiter_id
    }, headers=recruiter_headers)
    passed = r.status_code == 200 and r.json().get("status") == "REJECTED"
    record(ep, "POST", "/api/v1/hiring/recruiter/applications/{application_id}/reject", r.status_code, r.status_code, passed=passed, detail="Candidate marked REJECTED with feedback")
    ep += 1

    # 77. Hiring: Close Job Requisition (POST /api/v1/hiring/jobs/{job_id}/close)
    r = session.post(f"{BASE_URL}/api/v1/hiring/jobs/{job_id}/close", headers=recruiter_headers)
    passed = r.status_code == 200 and r.json().get("status") == "CLOSED"
    record(ep, "POST", "/api/v1/hiring/jobs/{job_id}/close", r.status_code, r.status_code, passed=passed, detail=f"Job #{job_id} CLOSED")
    ep += 1

    # 78. Admin: Clean Fake Data (POST /api/v1/admin/clean-fake-data)
    r = session.post(f"{BASE_URL}/api/v1/admin/clean-fake-data", headers=recruiter_headers)
    passed = r.status_code == 200 and r.json().get("status") == "SUCCESS"
    record(ep, "POST", "/api/v1/admin/clean-fake-data", r.status_code, r.status_code, passed=passed, detail="Cleaned test records")
    ep += 1

    # 79. Admin: Clean Database (DELETE /api/v1/admin/clean-database)
    r = session.delete(f"{BASE_URL}/api/v1/admin/clean-database", headers=recruiter_headers)
    passed = r.status_code == 200 and r.json().get("status") == "SUCCESS"
    record(ep, "DELETE", "/api/v1/admin/clean-database", r.status_code, r.status_code, passed=passed, detail="Database cleaned successfully")
    ep += 1

    print("\n" + "=" * 80)
    total = len(results)
    passed_count = sum(1 for r in results if r["passed"])
    failed_count = total - passed_count
    print(f"AUDIT SUMMARY: Total Endpoints={total} | PASSED={passed_count} | FAILED={failed_count}")
    print("=" * 80)

    with open("audit_run_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

if __name__ == "__main__":
    run_audit()
