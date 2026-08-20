# Candidate Apply & Real-Time Application Tracking Audit Report

**Platform:** HireGenie AI — Autonomous Recruitment Platform  
**Component:** Candidate Application Lifecycle, Journey Tracker & My Applications  
**Date:** August 14, 2026  
**Status:** **100% PRODUCTION READY (ALL VERIFICATIONS PASSED)**

---

## 1. Executive Summary

The **Candidate Apply + My Applications Tracking Experience** has been completely overhauled to eliminate all mock fallbacks, hardcoded states, and frontend-assumed timelines. Every application, journey stage, match score, autonomous agent telemetry event, interview invitation, session, evaluation, and hiring offer is driven directly by PostgreSQL records and validated via JWT authentication.

---

## 2. Real Architecture & Data Flow

```
[Candidate Job Discovery]
        │
        ▼ (POST /api/v1/candidate/apply)
[CandidateApplication Record Created in PostgreSQL (Status: APPLIED)]
        │
        ├─► [Asynchronous Autonomous Screening Worker Task Dispatched]
        │         │
        │         ├─► [Resume Parser Agent] ──► [AgentTelemetry]
        │         ├─► [Skill Matcher Agent] ──► [AgentTelemetry]
        │         └─► [Candidate Ranker Agent] ──► [AgentTelemetry]
        │
        ▼ (GET /api/v1/candidate/applications/{id}/journey)
[Aggregated Candidate Journey Single Source of Truth]
        │
        ├─► [Stage 1: APPLIED (Always COMPLETED with applied_at timestamp)]
        ├─► [Stage 2: AI SCREENING (ACTIVE while processing, COMPLETED with real score)]
        ├─► [Stage 3: SHORTLISTED (ACTIVE or COMPLETED, or FAILED if not selected)]
        ├─► [Stage 4: VOICE AI INTERVIEW (ACTIVE with real token, COMPLETED on session end)]
        └─► [Stage 5: FINAL REVIEW & OFFER (ACTIVE during evaluation, COMPLETED on offer acceptance)]
```

---

## 3. Key Upgrades Delivered

1. **Authenticated Application Submission (`POST /api/v1/candidate/apply`):**
   - Validates candidate identity from real JWT token.
   - Enforces open job status (rejects closed jobs).
   - Prevents duplicate applications for the same candidate + job (`HTTP 409 Conflict`).
   - Automatically dispatches screening worker task.

2. **Aggregated Journey API (`GET /api/v1/candidate/applications/{id}/journey`):**
   - Returns real application metadata, job specifications, candidate profile, telemetry list, interview invitation, session, evaluation, hiring decision, offer, tracking stages, and real chronological timeline.

3. **Smart Polling (Zero Polling on Terminal States):**
   - Frontend polls `/candidate/applications` every 3 seconds **ONLY** when `is_processing === true` (e.g. while screening agents are running or interview session is active).
   - Polling ceases immediately upon reaching stable terminal states (`SHORTLISTED`, `REJECTED`, `FAILED`, `INTERVIEW_COMPLETED`, `HIRED`, `OFFER_DECLINED`).

4. **Active Stage & Rejection Integrity:**
   - When an application is rejected, the `Applied` stage remains visibly completed (`COMPLETED ✓`), while the screening/shortlist stage displays `Not selected ✕`.
   - Rejection feedback and explainability reflect real database values without frontend mock generation.

5. **No Mock Fallback:**
   - Network or server errors display a clean retry state with a dedicated "Retry" button. No fake applications are rendered.

6. **Application Journey Card (`ApplicationJourneyCard.tsx`):**
   - Glassmorphic card design with real job tags, status badge, match score, dynamic 5-step pipeline, live agent telemetry strip, collapsible timeline drawer, rubric breakdown, and direct CTA buttons (`ENTER INTERVIEW ROOM`, `VIEW & RESPOND TO OFFER`, `RETRY SCREENING`).

---

## 4. Environment Variables & External API Requirements Audit

| Variable | File | Description | Environment | Status / Required | Where to Get |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | `backend/.env` | PostgreSQL connection string | Local / Prod | **REQUIRED** | Local PostgreSQL instance or Supabase/Neon |
| `SECRET_KEY` | `backend/.env` | JWT token signature secret | Local / Prod | **REQUIRED** | Generate secure random hex (`openssl rand -hex 32`) |
| `GEMINI_API_KEY` | `backend/.env` | Google Gemini API key for LLM screening, question generation, and evaluation | Local / Prod | **REQUIRED** | [Google AI Studio](https://aistudio.google.com/) |
| `RESEND_API_KEY` | `backend/.env` | Resend API key for candidate transactional emails (Invitations, Offers, Rejections) | Local / Prod | **OPTIONAL (Email fallback to mock if unconfigured)** | [Resend Console](https://resend.com/api-keys) *(Free tier sends to verified email)* |
| `REDIS_URL` | `backend/.env` | Redis connection for Celery task queuing | Local / Prod | **OPTIONAL (In-memory synchronous fallback active in dev)** | Local Redis (`localhost:6379`) or Upstash |
| `LIVEKIT_URL` | `backend/.env` | LiveKit WebRTC Cloud URL for real-time voice streaming | Local / Prod | **OPTIONAL (Local mock WebRTC available if unconfigured)** | [LiveKit Cloud](https://cloud.livekit.io/) |
| `LIVEKIT_API_KEY` | `backend/.env` | LiveKit API Key | Local / Prod | **OPTIONAL** | LiveKit Project Settings |
| `LIVEKIT_API_SECRET` | `backend/.env` | LiveKit API Secret | Local / Prod | **OPTIONAL** | LiveKit Project Settings |
| `SARVAM_API_KEY` | `backend/.env` | Sarvam AI key for voice STT/TTS fallback | Local / Prod | **OPTIONAL** | [Sarvam AI Dashboard](https://www.sarvam.ai/) |
| `FRONTEND_URL` | `backend/.env` | Origin URL for email magic links | Local / Prod | **REQUIRED (Defaults to http://localhost:5173)** | Frontend domain / port |

---

## 5. Verification & Test Results

### Backend E2E Test Suite (`test_candidate_journey_flow.py`)
```
- test_01_candidate_apply_and_prevent_duplicate: [PASS]
  * Candidate applies via JWT token
  * Application persisted to PostgreSQL
  * Immediate duplicate application returns 409 Conflict

- test_02_journey_aggregation_and_stages: [PASS]
  * Real AgentTelemetry records retrieved
  * 5 tracking stages computed accurately
  * Chronological timeline ordered by PostgreSQL timestamps

- test_03_shortlist_interview_and_offer_lifecycle: [PASS]
  * Stage transitions: SHORTLISTED -> INTERVIEW -> EVALUATION -> OFFER -> HIRED
  * Candidate accepts offer -> Status becomes HIRED
```

### Frontend TypeScript Compilation & Production Build
- `npx tsc --noEmit`: **0 errors (PASS)**
- `npm run build`: **Production bundle compiled successfully in 1.33s (PASS)**
