# HIREGENIE AI — PHASE B: FASTAPI BACKEND INTEGRATION PLAN

**Target Document**: `docs/NEXT_PHASE_PLAN.md`  
**Phase Objective**: Wire the 100% complete HireGenie AI Frontend to the FastAPI backend API service layer with typed endpoints, centralized HTTP client, bearer authentication, automatic mock fallback, and environment configuration.

---

## 1. Executive Summary & Phase Recommendation

- **Recommended Phase**: **Phase B: FastAPI Backend Integration**
- **Why This Phase Comes Next**: All 20 standalone frontend application screens (10 Recruiter Portal screens + 10 Candidate Portal & Voice Interview screens) are **100% complete and visually validated**. Decoupled service layer architecture allows wiring FastAPI REST & WebSocket endpoints directly to frontend React components without modifying any UI or layout code.
- **Dependencies Required**: Environment variable `VITE_API_BASE_URL` (`http://localhost:8000/api/v1`), centralized HTTP client with bearer token support, typed REST schemas, and error boundary fallbacks.
- **What This Phase Unlocks**: Real database persistence (PostgreSQL + pgvector), real candidate profile parsing, candidate vector match scoring, real-time stage transitions, recruiter decision overrides, and compliance audit trail logging.
- **What Should NOT Be Implemented Yet**: Real-time WebRTC audio socket streaming, 3D R3F shaders, or custom LLM fine-tuning scripts (reserved for Phase C & D).

---

## 2. API Contract & Service Layer Architecture

```
Frontend React UI Components
  ↳ API Services Layer (src/services/*.ts)
      ↳ Centralized API Client (src/services/apiClient.ts)
          ↳ Fetch / REST Client with Mock Fallback
              ↳ FastAPI Backend (http://localhost:8000/api/v1)
```

### Endpoints Contract Specification:
1. **Authentication**: `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`
2. **Requisitions**: `GET /api/v1/jobs`, `GET /api/v1/jobs/{id}`, `POST /api/v1/jobs`, `PATCH /api/v1/jobs/{id}/status`
3. **Candidates**: `GET /api/v1/candidates`, `GET /api/v1/candidates/{id}`, `PATCH /api/v1/candidates/{id}/status`
4. **AI Screening**: `GET /api/v1/screening/queue`, `POST /api/v1/screening/batch`, `POST /api/v1/screening/{id}/override`
5. **Compliance & Audit**: `GET /api/v1/compliance/logs`, `POST /api/v1/compliance/certificate`

---

## 3. Itemized Task List for Phase B

- [x] **Task 1: Centralized API Client & Mock Fallback Layer (`src/services/apiClient.ts`)**
- [ ] **Task 2: Job Requisitions Service Integration (`src/services/jobService.ts`)**
- [ ] **Task 3: Candidates Intelligence & Dossier Service (`src/services/candidateService.ts`)**
- [ ] **Task 4: Live AI Screening Queue & Decision Override Service (`src/services/screeningService.ts`)**
- [ ] **Task 5: Authentication & Portal Session Service (`src/services/authService.ts`)**

---

## 4. Definition of Done for Phase B

1. Centralized API client handles all GET, POST, PUT, PATCH, DELETE operations.
2. Standard HTTP headers (`Authorization: Bearer <token>`, `Content-Type: application/json`) attached automatically.
3. Automatic fallback to local typed mock data when FastAPI backend server is offline.
4. Zero breaking changes to existing UI components or Stitch design fidelity.
5. `npx tsc --noEmit` returns **0 errors** and `npm run build` succeeds cleanly.
