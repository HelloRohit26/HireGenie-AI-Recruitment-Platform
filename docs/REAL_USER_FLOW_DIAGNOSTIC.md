# HireGenie AI — Real User-Flow Diagnostic Audit Report

## Executive Summary
This document records a **read-only diagnostic audit** of the end-to-end user flows in HireGenie AI based strictly on source code inspection of the frontend React components (`frontend/src/`) and backend FastAPI endpoints (`backend/app/`).

---

## Part 1: Candidate Flow Diagnostic Audit

### Step 1: Candidate Login / Access
1. **Frontend File**: [`EntryLandingPage.tsx`](file:///d:/Learning/HireGenie%20AI%20%E2%80%93%20Autonomous%20Recruitment%20Platform/frontend/src/pages/EntryLandingPage.tsx), [`App.tsx`](file:///d:/Learning/HireGenie%20AI%20%E2%80%93%20Autonomous%20Recruitment%20Platform/frontend/src/App.tsx)
2. **API Endpoint**: None (Mock client-side login)
3. **HTTP Method**: N/A
4. **Request Payload**: N/A
5. **Response Payload**: N/A
6. **Database Table**: `users` (not queried)
7. **Database Record Created**: None
8. **Status after Stage**: Client-side state set (`authRole = 'candidate'`, `localStorage.getItem('hg_user_name')`)
9. **Possible Failure**: No real backend authentication token (JWT/Session) is issued or stored.
10. **Race Condition**: None
11. **Mismatch Between Frontend and Backend**: Frontend assumes user is logged in via `localStorage`, but backend has no session or current user context for the candidate.

---

### Step 2: Job Discovery & Job Details
1. **Frontend File**: [`CandidateJobDetailPage.tsx`](file:///d:/Learning/HireGenie%20AI%20%E2%80%93%20Autonomous%20Recruitment%20Platform/frontend/src/pages/CandidateJobDetailPage.tsx), [`jobService.ts`](file:///d:/Learning/HireGenie%20AI%20%E2%80%93%20Autonomous%20Recruitment%20Platform/frontend/src/services/jobService.ts)
2. **API Endpoint**: `/api/v1/jobs/{id}`
3. **HTTP Method**: `GET`
4. **Request Payload**: None (Path param `jobId`)
5. **Response Payload**: `JobResponse` object (`id`, `title`, `company`, `description`, `requirements`, `location`, `status`, `interview_mode`, `target_shortlist_count`, `screening_enabled`, `created_at`)
6. **Database Table**: `jobs`
7. **Database Record Created**: None
8. **Status after Stage**: Job details displayed on UI
9. **Possible Failure**: If job ID does not exist, frontend falls back to mock job data.
10. **Race Condition**: None
11. **Mismatch Between Frontend and Backend**: Frontend line 87 displays a hardcoded `"94% AI Vector Match"` badge on the job details page *before* candidate uploads a resume or applies.

---

### Step 3: Apply Click & Resume Upload
1. **Frontend File**: [`ApplyModal.tsx`](file:///d:/Learning/HireGenie%20AI%20%E2%80%93%20Autonomous%20Recruitment%20Platform/frontend/src/components/candidate/ApplyModal.tsx), [`candidateService.ts`](file:///d:/Learning/HireGenie%20AI%20%E2%80%93%20Autonomous%20Recruitment%20Platform/frontend/src/services/candidateService.ts)
2. **API Endpoint**: `/api/v1/candidate/upload-resume?candidate_id=1`
3. **HTTP Method**: `POST` (`multipart/form-data`)
4. **Request Payload**: `FormData` containing file attachment
5. **Response Payload**: `{"resume_id": 1, "filename": "resume.pdf", "file_path": "/uploads/resumes/uuid.pdf", "parsed_skills": [...], "parsed_experience_years": 4.0}`
6. **Database Table**: `resumes`, `users`
7. **Database Record Created**: `Resume` row created with `candidate_id=1`. Inserts fallback candidate `User` (ID 1) if missing.
8. **Status after Stage**: `uploadedResumeId` stored in modal local state.
9. **Possible Failure**: If file write fails or disk is full, HTTP 500 error.
10. **Race Condition**: Multiple concurrent resume uploads for same candidate overwrites file reference.
11. **Mismatch Between Frontend and Backend**: `candidate_id` query parameter is hardcoded to `1` in `candidateService.ts` line 184 (`uploadResume(file, candidateId = 1)`). Backend `candidate.py` line 55 returns static mock `parsed_skills` during upload.

---

### Step 4: Application Submission (POST /candidate/apply)
1. **Frontend File**: [`ApplyModal.tsx`](file:///d:/Learning/HireGenie%20AI%20%E2%80%93%20Autonomous%20Recruitment%20Platform/frontend/src/components/candidate/ApplyModal.tsx), [`candidateService.ts`](file:///d:/Learning/HireGenie%20AI%20%E2%80%93%20Autonomous%20Recruitment%20Platform/frontend/src/services/candidateService.ts)
2. **API Endpoint**: `/api/v1/candidate/apply`
3. **HTTP Method**: `POST`
4. **Request Payload**: `{"job_id": 1, "candidate_id": 1, "resume_id": 1, "cover_note": "", "answers": []}`
5. **Response Payload**: `ApplicationStatusResponse` (`id`, `job_id`, `candidate_id`, `status`: `"RECEIVED"`, `overall_match_score`: `0.0`, `magic_token`, `applied_at`)
6. **Database Table**: `candidate_applications`
7. **Database Record Created**: `CandidateApplication` row created with `candidate_id=1`, `job_id=1`, `status=RECEIVED`, `magic_token=uuid`.
8. **Status after Stage**: `RECEIVED`
9. **Possible Failure**:
   - **CRITICAL FAILURE**: `candidate_id: 1` IS HARDCODED in `candidateService.ts` line 210 (`candidate_id: 1`).
   - `candidate.py` line 103 checks:
     `existing = db.query(CandidateApplication).filter(CandidateApplication.candidate_id == candidate_id, CandidateApplication.job_id == payload.job_id).first()`
     Because `candidate_id` is always `1`, any subsequent application by a second user to the same job fails with **HTTP 400 Bad Request: `"Candidate has already applied for this job"`**.
10. **Race Condition**: If user double-clicks submit, duplicate requests hit backend simultaneously before DB commit finishes.
11. **Mismatch Between Frontend and Backend**: Frontend assumes logged-in user is submitting application under their own identity, but backend assigns every application to `candidate_id = 1`.

---

### Step 5: Database Insert & Background Screening Task Trigger
1. **Frontend File**: N/A (Backend asynchronous process)
2. **API Endpoint**: Internal worker task trigger (`dispatch_screening_task(application.id)`)
3. **HTTP Method**: N/A
4. **Request Payload**: `application_id: 1`
5. **Response Payload**: N/A
6. **Database Table**: `candidate_applications`
7. **Database Record Created**: Record created in Step 4.
8. **Status after Stage**: Transitions `RECEIVED` → `PARSING` → `MATCHING` → `RANKING` → `SHORTLISTED` / `REJECTED`.
9. **Possible Failure**: If Gemini API key is missing or invalid, evaluation falls back or sets score.
10. **Race Condition**: If recruiter triggers batch screening concurrently with candidate application submission, both processes mutate status of application record simultaneously.
11. **Mismatch Between Frontend and Backend**: Background screening updates DB asynchronously over 1-3 seconds, but frontend `ApplyModal.tsx` immediately closes without waiting for screening completion or giving live agent progress feedback.

---

### Step 6: GET /candidate/applications
1. **Frontend File**: [`MyApplicationsPage.tsx`](file:///d:/Learning/HireGenie%20AI%20%E2%80%93%20Autonomous%20Recruitment%20Platform/frontend/src/pages/MyApplicationsPage.tsx), [`candidateService.ts`](file:///d:/Learning/HireGenie%20AI%20%E2%80%93%20Autonomous%20Recruitment%20Platform/frontend/src/services/candidateService.ts)
2. **API Endpoint**: `/api/v1/candidate/applications`
3. **HTTP Method**: `GET`
4. **Request Payload**: None (No query parameters)
5. **Response Payload**: Array of `ApplicationStatusResponse` objects
6. **Database Table**: `candidate_applications`
7. **Database Record Created**: None
8. **Status after Stage**: Applications array fetched from DB
9. **Possible Failure**:
   - `candidateService.ts` line 222 sends `GET /candidate/applications` with **no `candidate_id` query parameter**.
   - `candidate.py` line 164 returns ALL candidate applications in the entire database when `candidate_id` parameter is absent.
10. **Race Condition**: None
11. **Mismatch Between Frontend and Backend**:
    - Frontend line 48 in `MyApplicationsPage.tsx` evaluates `aiScore: appItem.overall_match_score || 90`. If `overall_match_score` is `0.0` or `null` while screening is in progress, the UI forcibly overrides it to display a fake `90% AI Score`!

---

### Step 7: My Applications / Application Tracking UI Display
1. **Frontend File**: [`MyApplicationsPage.tsx`](file:///d:/Learning/HireGenie%20AI%20%E2%80%93%20Autonomous%20Recruitment%20Platform/frontend/src/pages/MyApplicationsPage.tsx), [`ApplicationTimeline.tsx`](file:///d:/Learning/HireGenie%20AI%20%E2%80%93%20Autonomous%20Recruitment%20Platform/frontend/src/components/candidate/ApplicationTimeline.tsx)
2. **API Endpoint**: N/A
3. **HTTP Method**: N/A
4. **Request Payload**: N/A
5. **Response Payload**: N/A
6. **Database Table**: N/A
7. **Database Record Created**: None
8. **Status after Stage**: Application card rendered in list
9. **Possible Failure**:
   - **ZERO LIVE POLLING**: `MyApplicationsPage.tsx` calls `getMyApplications()` ONCE when the component mounts. It NEVER polls `/candidate/track/{id}` or subscribes to WebSocket updates. As agents transition status from `RECEIVED` → `PARSING` → `MATCHING` → `RANKING` → `SHORTLISTED`, the Candidate UI NEVER updates automatically.
10. **Race Condition**: Candidate opens My Applications page while background task is midway in `MATCHING` stage. Card renders `MATCHING` and stays stuck forever until manual browser reload.
11. **Mismatch Between Frontend and Backend (CRITICAL ACTION BUTTON BLOCKER)**:
    - In `MyApplicationsPage.tsx` lines 130-144:
      ```typescript
      {(app.status === 'Shortlisted' || app.status === 'Interview' || String(app.status) === 'INTERVIEW_SCHEDULED' || String(app.status) === 'INTERVIEWING') && (
        <button onClick={() => onNavigate?.(`/interview/${(app as any).invitationToken || 'demo-token'}/prep`)}>
          START AI INTERVIEW
        </button>
      )}
      ```
      Backend returns UPPERCASE string `"SHORTLISTED"`. `app.status === 'Shortlisted'` evaluates to `FALSE` because `"SHORTLISTED" !== "Shortlisted"`.
      As a result, even when a candidate is successfully shortlisted in the database, the **"START AI INTERVIEW" button NEVER renders on the Candidate My Applications UI**!

---

## Part 2: Recruiter Flow Diagnostic Audit

### Flow: Recruiter → Candidate Application → Screening → Ranking → Shortlist → Email

1. **Candidate Application Listing**:
   - **Frontend File**: [`AIScreeningPage.tsx`](file:///d:/Learning/HireGenie%20AI%20%E2%80%93%20Autonomous%20Recruitment%20Platform/frontend/src/pages/AIScreeningPage.tsx), [`screeningService.ts`](file:///d:/Learning/HireGenie%20AI%20%E2%80%93%20Autonomous%20Recruitment%20Platform/frontend/src/services/screeningService.ts)
   - **API Endpoint**: `GET /api/v1/recruiter/candidates`
   - **HTTP Method**: `GET`
   - **Backend File**: [`recruiter.py`](file:///d:/Learning/HireGenie%20AI%20%E2%80%93%20Autonomous%20Recruitment%20Platform/backend/app/api/v1/endpoints/recruiter.py) (`list_candidates`)
   - **Behavior**: Retrieves `CandidateApplication` rows ordered by `rank` and `overall_match_score`.
   - **Visibility Issue**: `screeningService.ts` line 19 maps both `SHORTLISTED` and `REJECTED` into a single UI stage label `'Complete'`. There is no visual distinction in stage tabs between candidate applications undergoing screening vs completed screening unless the page is re-fetched.

2. **Screening & Ranking Execution**:
   - **Frontend File**: [`AIScreeningPage.tsx`](file:///d:/Learning/HireGenie%20AI%20%E2%80%93%20Autonomous%20Recruitment%20Platform/frontend/src/pages/AIScreeningPage.tsx) (`handleSimulateBatch`)
   - **API Endpoint**: `POST /api/v1/recruiter/trigger-screening`
   - **HTTP Method**: `POST`
   - **Request Payload**: `{"job_id": 1, "override_top_n": 5}`
   - **Backend File**: [`recruiter.py`](file:///d:/Learning/HireGenie%20AI%20%E2%80%93%20Autonomous%20Recruitment%20Platform/backend/app/api/v1/endpoints/recruiter.py) (`run_mass_screening`)
   - **Where Agent Runs**: Runs **SYNCHRONOUSLY** inside the HTTP request handler loop in `recruiter.py` lines 68-92. It calls `evaluate_job_vs_candidate(...)` for every application sequentially in the request thread.
   - **Performance Bottleneck**: For 10+ candidate applications, executing multi-criteria LLM evaluation sequentially inside a single POST endpoint blocks the web server thread for 15–30 seconds.

3. **Shortlist & Transactional Email**:
   - **Backend Service**: `recruiter.py` line 87 calls `send_candidate_email_job(db, app, job, candidate_name)` for candidates meeting the shortlist threshold.
   - **Outbox Persistence**: `communication_agent.py` inserts a `CommunicationLog` row with status `QUEUED` and dispatches `send_email_task`.
   - **Visibility to Recruiter**: Exposed via `GET /recruiter/dossier/{application_id}` and `GET /communication/status`.

---

## Part 3: Final Diagnostic Summary

### FIRST BROKEN STEP:
`ApplyModal.tsx` & `candidateService.applyForJob` (Step 4: Application Submission)

### ROOT CAUSE:
1. In `candidateService.ts` line 210, `candidate_id` is hardcoded to `1` (`candidate_id: 1`). Every candidate application submitted through the Candidate Portal is assigned to Candidate ID `1`.
2. Because `candidate.py` enforces a unique constraint (`CandidateApplication.candidate_id == candidate_id, CandidateApplication.job_id == job_id`), any second application to the same job gets rejected with HTTP 400 (`"Candidate has already applied for this job"`).
3. In `MyApplicationsPage.tsx` line 130, the UI checks `app.status === 'Shortlisted'` (Title Case) instead of matching the backend enum string `"SHORTLISTED"` (Upper Case). This causes the "START AI INTERVIEW" CTA button to never render on the Candidate My Applications page even after successful shortlisting.

### SECONDARY ISSUES:
1. `candidateService.ts` line 184 hardcodes `candidate_id=1` on `/candidate/upload-resume?candidate_id=1`.
2. `candidateService.ts` line 222 calls `GET /candidate/applications` without a `candidate_id` parameter, causing the backend to return applications belonging to ALL candidates in the database.
3. `MyApplicationsPage.tsx` line 48 contains fallback logic `appItem.overall_match_score || 90`, which displays a fake 90% score whenever `overall_match_score` is 0.
4. `CandidateJobDetailPage.tsx` line 87 displays a static `"94% AI Vector Match"` badge before the user attaches a resume or applies.
5. `candidate.py` line 55 returns static mock parsed skills `["Python", "FastAPI", "Machine Learning", "React", "TypeScript"]` on file upload instead of triggering real document text parsing.

### PERFORMANCE BOTTLENECKS:
1. `POST /api/v1/recruiter/trigger-screening` runs candidate vector evaluation and LLM scoring **synchronously in a sequential loop** inside the FastAPI endpoint thread, blocking the server for 15–30 seconds when screening large candidate batches.
2. `send_real_email` in `tasks.py` incurs a 15-second HTTP network timeout when attempting to connect to external email provider APIs (Resend/SMTP) with unconfigured keys, blocking synchronous task execution threads.

### AGENT VISIBILITY PROBLEMS:
1. **Zero Real-Time Polling on Candidate UI**: `MyApplicationsPage.tsx` fetches application data ONCE when mounted. It does not poll `/candidate/track/{id}` or listen to live events. Background screening status transitions (`PARSING` → `MATCHING` → `RANKING` → `SHORTLISTED`) are completely invisible to the candidate unless they manually refresh the page.
2. **Missing Live Agent Status Telemetry on Recruiter UI**: `AIScreeningPage.tsx` fetches queue data once on load. When batch screening runs in the background, there is no real-time status feed showing which candidate is currently being parsed, matched, or ranked by the AI agent.

### RECOMMENDED FIX ORDER:
1. **Fix Candidate Identity & Application Submission**:
   - Pass real logged-in `candidate_id` (from session/auth or localStorage user state) in `candidateService.applyForJob` and `candidateService.uploadResume` instead of hardcoding `candidate_id: 1`.
   - Update `candidateService.getMyApplications` to pass `?candidate_id={current_user_id}` to `/candidate/applications`.
2. **Fix Status Case Mismatch & Fake Fallbacks**:
   - Fix status comparison in `MyApplicationsPage.tsx` line 130 to compare uppercase `app.status === 'SHORTLISTED'` so the "START AI INTERVIEW" button appears when shortlisted.
   - Remove fake fallback values (`|| 90` score fallback, `94% AI Vector Match` pre-application badge).
3. **Add Real-Time Polling & Live Agent Progress Telemetry**:
   - Implement periodic polling (every 2–3 seconds) in `MyApplicationsPage.tsx` using `/candidate/track/{application_id}` while application status is in active screening stages (`RECEIVED`, `PARSING`, `MATCHING`, `RANKING`).
   - Expose active agent execution stage in `AIScreeningPage.tsx` queue items.
4. **Optimize Recruiter Batch Screening Execution**:
   - Offload `POST /recruiter/trigger-screening` to background execution or parallel worker dispatch to prevent blocking the HTTP response thread.
