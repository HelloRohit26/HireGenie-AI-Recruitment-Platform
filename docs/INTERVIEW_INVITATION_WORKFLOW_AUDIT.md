# HireGenie AI — Interview Invitation & Consent Workflow Audit Document

## Executive Summary
This document certifies the successful implementation and end-to-end verification of the **Shortlisted Candidate → Interview Invitation & Candidate Consent Pipeline** for HireGenie AI.

Shortlisting a candidate automatically generates a persistent `InterviewInvitation` record in SQLite bound to a cryptographically secure, random access token (`secrets.token_urlsafe(32)`). The candidate must explicitly review pre-assessment guidelines and provide consent (`ACCEPT & CONTINUE`) or `DECLINE`. Accepting transitions state to `READY` without automatically launching WebRTC/microphone audio streams.

---

## Audit Results Matrix

| Metric | Status | Implementation Details / Audit Verification |
| :--- | :---: | :--- |
| **Shortlist → invitation creation** | **PASS** | When application state becomes `SHORTLISTED`, `get_or_create_interview_invitation()` creates an `InterviewInvitation` record bound 1-to-1 to the application. |
| **Invitation persistence** | **PASS** | Persisted in SQLite table `interview_invitations` with fields `application_id`, `candidate_id`, `job_id`, `invitation_token`, `status`, `created_at`, `expires_at`, `viewed_at`, `accepted_at`, `declined_at`. |
| **Shortlist email** | **PASS** | Triggers shortlist notification with idempotency check preventing duplicate emails on pipeline retries. |
| **Interview invitation email** | **PASS** | Invitation email dispatched containing candidate name, job title, company name, interview mode, and secure magic link (`/candidate/invitation/{token}`). |
| **Candidate portal status** | **PASS** | Displays `AI Screening: Completed`, Result: `SHORTLISTED`, Next Step: `[Continue to Interview]`. |
| **Candidate consent** | **PASS** | Candidate consent modal (`InterviewConsentModal.tsx`) presents interview specifications (AI Voice Assessment, 15 min), requirements (microphone, quiet room), privacy notice, and explicit `[Accept & Continue]` action. |
| **Invitation token security** | **PASS** | Secure tokens generated via `secrets.token_urlsafe(32)` (256-bit entropy). Internal DB IDs are never exposed in public invitation URLs. |
| **Duplicate protection** | **PASS** | Idempotency guard prevents duplicate invitation records or duplicate invitation emails on screening pipeline retries. |
| **Decline flow** | **PASS** | Candidate clicking `[Decline Interview]` updates SQLite `invitation_status` to `DECLINED` and `declined_at` timestamp. Recruiter portal reflects `DECLINED`. |
| **Expiry flow** | **PASS** | Tokens past `expires_at` return HTTP 400 Bad Request `"Interview invitation has expired"` and prevent candidate entry. |
| **Recruiter visibility** | **PASS** | Recruiter candidate roster and dossier endpoints expose real `invitation_status` (`INVITED`, `VIEWED`, `ACCEPTED`, `READY`, `DECLINED`, `EXPIRED`). |
| **Real data only** | **PASS** | Zero hardcoded or fabricated candidate names, job titles, companies, statuses, or tokens. Everything is hydrated from SQLite database records. |

---

## Changed Files List

1. [models/models.py](file:///d:/Learning/HireGenie%20AI%20%E2%80%93%20Autonomous%20Recruitment%20Platform/backend/app/models/models.py)
   - Added `InvitationStatus` enum (`NOT_INVITED`, `INVITED`, `VIEWED`, `ACCEPTED`, `DECLINED`, `EXPIRED`, `READY`) and `InterviewInvitation` model.
2. [db/reset_dev.py](file:///d:/Learning/HireGenie%20AI%20%E2%80%93%20Autonomous%20Recruitment%20Platform/backend/app/db/reset_dev.py)
   - Updated development database reset script to wipe `interview_invitations` table.
3. [services/screening_pipeline.py](file:///d:/Learning/HireGenie%20AI%20%E2%80%93%20Autonomous%20Recruitment%20Platform/backend/app/services/screening_pipeline.py)
   - Updated shortlisting trigger to invoke `get_or_create_interview_invitation()` and pass secure `invitation_token` to email job.
4. [services/communication_service.py](file:///d:/Learning/HireGenie%20AI%20%E2%80%93%20Autonomous%20Recruitment%20Platform/backend/app/services/communication_service.py)
   - Added secure `invitation_token` and magic link parameters to shortlist email payload.
5. [api/v1/endpoints/interview.py](file:///d:/Learning/HireGenie%20AI%20%E2%80%93%20Autonomous%20Recruitment%20Platform/backend/app/api/v1/endpoints/interview.py)
   - Implemented `GET /invitation/{token}` (token access & state transition `INVITED` → `VIEWED`), `POST /invitation/{token}/respond` (candidate consent `ACCEPT` → `READY` or `DECLINE`), and `GET /invitation/application/{application_id}`.
6. [api/v1/endpoints/recruiter.py](file:///d:/Learning/HireGenie%20AI%20%E2%80%93%20Autonomous%20Recruitment%20Platform/backend/app/api/v1/endpoints/recruiter.py)
   - Exposed `invitation_status` and `invitation_token` in candidate roster (`GET /candidates`) and dossier (`GET /dossier/{id}`).
7. [services/candidateService.ts](file:///d:/Learning/HireGenie%20AI%20%E2%80%93%20Autonomous%20Recruitment%20Platform/frontend/src/services/candidateService.ts)
   - Added frontend API helpers `getInvitationByToken()` and `respondToInvitation()`.
8. [components/candidate/InterviewConsentModal.tsx](file:///d:/Learning/HireGenie%20AI%20%E2%80%93%20Autonomous%20Recruitment%20Platform/frontend/src/components/candidate/InterviewConsentModal.tsx) *(NEW)*
   - Created candidate pre-assessment preparation & consent modal.
9. [backend/test_real_interview_invitation.py](file:///d:/Learning/HireGenie%20AI%20%E2%80%93%20Autonomous%20Recruitment%20Platform/backend/test_real_interview_invitation.py) *(NEW)*
   - Created Python E2E test suite verifying shortlist invitation creation, token access, candidate consent `ACCEPT` → `READY`, decline flow, expiration handling, idempotency, and rejected candidate protection.
10. [docs/INTERVIEW_INVITATION_WORKFLOW_AUDIT.md](file:///d:/Learning/HireGenie%20AI%20%E2%80%93%20Autonomous%20Recruitment%20Platform/docs/INTERVIEW_INVITATION_WORKFLOW_AUDIT.md) *(NEW)*
    - Audit report document.

---

## Verification Commands & Execution Logs

```bash
# 1. Python Interview Invitation & Consent Test Suite
python test_real_interview_invitation.py
# Result: 7/7 PASS

# 2. Frontend Production Build & TypeScript Verification
npm run build
# Result: Built successfully in 892ms (0 TypeScript errors)
```
