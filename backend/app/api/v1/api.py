from fastapi import APIRouter
from app.api.v1.endpoints import (
    jobs, candidate, recruiter, interview, voice_ws, auth, admin,
    audit, explainability, fairness, jd_intelligence,
    scheduling, communication, failures, integrations, analytics,
    hiring,
)

api_router = APIRouter()

# Core Features
api_router.include_router(auth.router, prefix="/auth", tags=["🔐 Role-Based Authentication (RBAC)"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["📋 Jobs (Recruiter Wizard & Candidate Feed)"])
api_router.include_router(candidate.router, prefix="/candidate", tags=["👤 Candidate Portal (Applications & Tracking)"])
api_router.include_router(recruiter.router, prefix="/recruiter", tags=["📊 Recruiter Dashboard (Mass Screening & Dossier)"])
api_router.include_router(interview.router, prefix="/interview", tags=["🎙️ Voice Interview Engine (WebRTC / Twilio)"])
api_router.include_router(voice_ws.router, prefix="/interview", tags=["🎙️ Voice AI WebSocket Stream"])
api_router.include_router(admin.router, prefix="/admin", tags=["⚙️ System Admin & Data Cleaning"])

# New Feature Routers
api_router.include_router(explainability.router, prefix="/explainability", tags=["🧠 Explainable AI & Human-in-the-Loop"])
api_router.include_router(fairness.router, prefix="/fairness", tags=["⚖️ Bias & Fairness Monitoring"])
api_router.include_router(jd_intelligence.router, prefix="/jd", tags=["📄 JD Intelligence (AI Analysis)"])
api_router.include_router(scheduling.router, prefix="/scheduling", tags=["📅 Interview Scheduling Agent"])
api_router.include_router(communication.router, prefix="/communication", tags=["📧 Communication Agent"])
api_router.include_router(failures.router, prefix="/failures", tags=["🔄 Failure & Retry System"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["📊 Recruitment Analytics"])
api_router.include_router(integrations.router, prefix="/integrations", tags=["🔌 External Integrations"])
api_router.include_router(audit.router, prefix="/audit", tags=["🛡️ Audit Log"])
api_router.include_router(hiring.router, prefix="/hiring", tags=["🤝 Final Hiring Lifecycle"])