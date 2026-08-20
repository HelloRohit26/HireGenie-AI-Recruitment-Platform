# HIREGENIE AI — BATCH 3 IMPLEMENTATION PLAN: FASTAPI + DATABASE + APPLICATION DATA

**Target Document**: `docs/BATCH_3_IMPLEMENTATION_PLAN.md`  
**Batch Objective**: Connect the frontend API service layer (`apiClient.ts`, `jobService.ts`, `candidateService.ts`, `screeningService.ts`, `authService.ts`) to the live FastAPI backend server (`http://localhost:8000/api/v1`) backed by SQLite/SQLAlchemy ORM (`hiregenie.db`), ensuring persistent data flows with automatic mock fallback safety.

---

## 1. Existing Backend & Database Architecture Inspection

- **Framework**: FastAPI (`backend/app/main.py`)
- **Database Engine**: SQLite database `backend/hiregenie.db` (SQLAlchemy ORM & Alembic migrations in `backend/alembic/`)
- **CORS Configuration**: `CORSMiddleware` active on `app.add_middleware(CORSMiddleware, allow_origins=["*"])`
- **Audit Middleware**: `AuditMiddleware` active on all `/api/v1` routes
- **API Prefix**: `/api/v1`
- **Core Routers**:
  - `/api/v1/auth`: Dual-portal RBAC authentication & token management
  - `/api/v1/jobs`: Requisitions CRUD, job creation wizard, candidate job feed
  - `/api/v1/candidate`: Candidate application submission & stage tracking
  - `/api/v1/recruiter`: Recruiter command center, screening queue, candidate dossier
  - `/api/v1/interview`: Voice interview scheduling & WebRTC room session initialization
  - `/api/v1/explainability`: Human-in-the-loop recruiter decision overrides
  - `/api/v1/fairness`: Disparate impact ratio & bias compliance monitoring
  - `/api/v1/audit`: System audit logs & certificate export

---

## 2. Core Domain Models & Schemas

The backend SQLAlchemy models in `backend/app/models/models.py` represent:
1. `User` & `UserRole`: Admin, Recruiter, Candidate roles with password hashing & status flags.
2. `Job` & `InterviewMode`: Requisitions with title, department, location, salary range, screening questions, skill weights, target shortlist count, and status (`DRAFT`, `PUBLISHED`, `CLOSED`).
3. `CandidateApplication` & `ApplicationStatus`: Application tracker with match score, skill score, experience score, project score, status (`APPLIED`, `SCREENING`, `SHORTLISTED`, `INTERVIEW_SCHEDULED`, `FINAL_REVIEW`, `OFFERED`, `REJECTED`), and candidate dossier data.
4. `ScreeningQuestion`: Structured questions linked to job requisitions.
5. `AuditLog`, `AIExplanation`, `RecruiterOverride`, `FairnessReport`, `CommunicationLog`, `InterviewSchedule`, `FailedTask`.

---

## 3. Frontend Service Layer Integration Strategy

- **`src/services/apiClient.ts`**: Centralized HTTP client wrapping native `fetch` targeting `VITE_API_BASE_URL` (`http://localhost:8000/api/v1`) with automatic Bearer token injection and mock fallback if backend is offline.
- **`src/services/jobService.ts`**: Wires `getJobs()`, `getJobById()`, `createJob()`, and `updateJobStatus()`.
- **`src/services/candidateService.ts`**: Wires `getCandidates()`, `getCandidateById()`, `updateCandidateStatus()`, and `getCandidateComparison()`.
- **`src/services/screeningService.ts`**: Wires `getScreeningQueue()`, `runBatchScreening()`, and `overrideCandidateDecision()`.
- **`src/services/authService.ts`**: Wires `login()`, `register()`, `getCurrentUser()`, and `logout()`.

---

## 4. End-to-End Workflow Verification Plan

1. **Workflow 1 (Job Management)**: Recruiter creates job via wizard -> saved to SQLite -> appears in Candidate Job Feed.
2. **Workflow 2 (Application Submission)**: Candidate applies -> application saved -> appears in Candidate Applications Tracker & Recruiter Screening Queue.
3. **Workflow 3 (AI Screening & Override)**: Recruiter views screening queue -> triggers batch processing -> applies decision override -> updates candidate dossier.
4. **Workflow 4 (Interview & Finalist)**: Recruiter views scheduled interviews -> reviews evaluation scorecard -> promotes to Final Review / Offer.

---

## 5. Technical Validation Plan

1. **TypeScript Validation**: Run `npx tsc --noEmit` on `frontend/`.
2. **Production Build**: Run `npm run build` on `frontend/`.
3. **Backend Service Health**: Confirm FastAPI server initializes `hiregenie.db` tables cleanly.
