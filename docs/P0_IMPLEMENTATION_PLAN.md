# P0 IMPLEMENTATION PLAN — HIREGENIE AI

This plan outlines the systematic execution order for all **P0 Critical Features and Missing Screens** identified in [`docs/STITCH_TO_FRONTEND_MAP.md`](file:///d:/Learning/HireGenie%20AI%20–%20Autonomous%20Recruitment%20Platform/docs/STITCH_TO_FRONTEND_MAP.md).

---

## P0 Item Inventory & Order

### P0 #1 — Authentication & Dual-Portal Routing Entry
- **Screen / Feature**: Entry Experience Landing (`/entry` or `/`) & Role Sign In Modal/Page (`/login`)
- **Stitch Source**: `hiregenie_ai_entry_experience` & `hiregenie_ai_sign_in`
- **Current Route**: `/login` / `/entry` (currently defaults directly to `/recruiter` with no entry or auth view)
- **Current Status**: NOT IMPLEMENTED (0%)
- **Missing Functionality**: Hero landing page with dual candidate/recruiter entry buttons, role selection (Recruiter vs Candidate), login/signup modal with persistence, and header role switcher.
- **Required Components**: `EntryLandingPage.tsx`, `SignInModal.tsx`, `AuthContext.tsx` / `RoleSwitcher.tsx`
- **Required Interaction**: Click "Enter as Recruiter" → Recruiter Portal; click "Enter as Candidate" → Candidate Portal; Sign in switch roles seamlessly.
- **Dependencies**: None.

---

### P0 #2 — Recruiter Command Center Gaps & Role Switcher Handoff
- **Screen / Feature**: Recruiter Command Center Header Role Handoff & Quick Actions
- **Stitch Source**: `hiregenie_ai_command_center_1`
- **Current Route**: `/recruiter`
- **Current Status**: FULLY IMPLEMENTED (95%)
- **Missing Functionality**: Top header role switcher to hop to Candidate Portal view, candidate dossier trigger from live activity feed, quick applicant view routing.
- **Required Components**: Extended `RecruiterHeader.tsx`, `RecentActivityFeed.tsx` link wiring.
- **Required Interaction**: Click candidate in activity feed → opens Candidate Dossier Modal directly; Role dropdown → candidate portal view.
- **Dependencies**: P0 #1.

---

### P0 #3 — Recruiter Jobs & Job Workspace Action Gaps
- **Screen / Feature**: Job Workspace Candidate Stage Actions & Job Requisition Manager
- **Stitch Source**: `hiregenie_ai_job_workspace_ai_engineer_1` & `2`
- **Current Route**: `/recruiter/jobs/:id`
- **Current Status**: IMPLEMENTED (88%)
- **Missing Functionality**: Candidate stage progression (drag/move candidate between stages), candidate bulk actions, and direct interview scheduling from job workspace.
- **Required Components**: Extended `JobWorkspacePage.tsx`, `CandidateCard.tsx` stage dropdown action.
- **Required Interaction**: Change candidate status dropdown on candidate card → candidate updates stage live in pipeline metrics.
- **Dependencies**: P0 #1.

---

### P0 #4 — Candidate Portal Home & Job Discovery
- **Screen / Feature**: Candidate Home Dashboard (`/candidate`) & Job Discovery (`/candidate/jobs`)
- **Stitch Source**: `hiregenie_ai_candidate_home` & `hiregenie_ai_jobs_discovery`
- **Current Route**: `/candidate`, `/candidate/jobs`
- **Current Status**: NOT IMPLEMENTED (0%)
- **Missing Functionality**: Candidate portal dashboard (active applications status summary, interview invites, recommended AI jobs) & Job search/browse catalog with skill matching badges.
- **Required Components**: `CandidateShell.tsx`, `CandidateHomePage.tsx`, `CandidateJobsPage.tsx`, `JobDiscoveryCard.tsx`
- **Required Interaction**: Browse jobs, filter by department/type, click job → opens Job Detail & Apply view.
- **Dependencies**: P0 #1.

---

### P0 #5 — Candidate Job Detail, Application & Tracking Flow
- **Screen / Feature**: Job Detail & Apply Modal (`/candidate/jobs/:id`) & My Applications Tracker (`/candidate/applications`)
- **Stitch Source**: `hiregenie_ai_job_detail_apply` & `hiregenie_ai_my_applications`
- **Current Route**: `/candidate/jobs/:id`, `/candidate/applications`
- **Current Status**: NOT IMPLEMENTED (0%)
- **Missing Functionality**: Rich job description view with AI Match score indicator, 1-click apply with resume upload, and application status timeline tracker (Applied → Screening → Shortlisted → Interview → Offer).
- **Required Components**: `CandidateJobDetailPage.tsx`, `ApplyModal.tsx`, `MyApplicationsPage.tsx`, `ApplicationTimeline.tsx`
- **Required Interaction**: Click Apply → submit resume → application appears in My Applications with status "Applied" & triggers Recruiter AI Screening queue.
- **Dependencies**: P0 #4.

---

### P0 #6 — AI Screening Workflow & Recruiter Override
- **Screen / Feature**: Live AI Screening Queue & Recruiter Decision Override
- **Stitch Source**: `hiregenie_ai_ai_screening_command_center`
- **Current Route**: `/recruiter/screening`
- **Current Status**: IMPLEMENTED (90%)
- **Missing Functionality**: Live simulation button to trigger screening on new candidates, manual recruiter override toggle (Shortlist / Reject override with reason input).
- **Required Components**: Extended `AIScreeningPage.tsx`, `ScreeningOverrideModal.tsx`
- **Required Interaction**: Recruiter clicks "Override AI Decision" → selects outcome + reason → candidate state updates to "Shortlisted" or "Rejected" with audit log entry.
- **Dependencies**: P0 #5.

---

### P0 #7 — Candidate Dossier Audio & Finalist Tagging
- **Screen / Feature**: Candidate Dossier Audio Scrubber & Finalist Action Bar
- **Stitch Source**: `hiregenie_ai_candidate_dossier_rohit_sharma`
- **Current Route**: Component (`CandidateDossierModal`)
- **Current Status**: IMPLEMENTED (90%)
- **Missing Functionality**: Mock WebRTC audio wave scrubber for interview playback, "Move to Finalists" decision bar button.
- **Required Components**: Extended `CandidateDossierModal.tsx`, `AudioWaveformPlayer.tsx`
- **Required Interaction**: Click play on audio waveform → plays mock interview audio with scrubbing; click "Promote to Finalist" → updates status.
- **Dependencies**: P0 #6.

---

### P0 #8 — Interview Preparation & Magic Link Entry
- **Screen / Feature**: Candidate Magic Link Landing (`/interview/:token`) & Preparation Tech Check (`/interview/:token/prep`)
- **Stitch Source**: `hiregenie_ai_interview_entry` & `hiregenie_ai_interview_preparation`
- **Current Route**: `/interview/:token`, `/interview/:token/prep`
- **Current Status**: NOT IMPLEMENTED (0%)
- **Missing Functionality**: Candidate magic link landing page, identity verification, microphone/speaker test check, and interview guidelines.
- **Required Components**: `InterviewEntryPage.tsx`, `InterviewPrepPage.tsx`, `DeviceCheckCard.tsx`
- **Required Interaction**: Enter via magic link → complete mic test → click "Enter AI Voice Interview Room" → opens Voice Interview Room.
- **Dependencies**: P0 #5.

---

### P0 #9 — Candidate AI Voice Interview Room
- **Screen / Feature**: Autonomous AI Voice Interview Room (`/interview/:token/room`)
- **Stitch Source**: `hiregenie_ai_voice_interview_room`
- **Current Route**: `/interview/:token/room`
- **Current Status**: NOT IMPLEMENTED (0%)
- **Missing Functionality**: Live voice interview interface with dynamic speech-to-text transcript feed, AI prompt question queue, mic mute/unmute, live audio wave animation, and complete interview button.
- **Required Components**: `VoiceInterviewRoomPage.tsx`, `TranscriptFeed.tsx`, `InterviewControls.tsx`
- **Required Interaction**: Speak/answer questions → live transcript updates → finish interview → generates interview score & notifies recruiter.
- **Dependencies**: P0 #8.

---

### P0 #10 — Post-Interview Evaluation & Scorecard
- **Screen / Feature**: AI Interview Evaluation Synthesizer & Recruiter Review
- **Stitch Source**: `hiregenie_ai_candidate_dossier_rohit_sharma` / `hiregenie_ai_interviews_intelligence`
- **Current Route**: `/recruiter/interviews`, Dossier Modal
- **Current Status**: IMPLEMENTED (88%)
- **Missing Functionality**: Complete AI interview scorecard view with sentiment analysis, topic breakdown, and technical evaluation summary.
- **Required Components**: `InterviewScorecardModal.tsx`, extended `InterviewsPage.tsx`
- **Required Interaction**: Click completed interview → view full transcript, AI evaluation radar chart, and interviewer notes.
- **Dependencies**: P0 #9.

---

### P0 #11 — Finalist Comparison & Human Decision Bar
- **Screen / Feature**: Recruiter Finalist Review & Decision Bar
- **Stitch Source**: `hiregenie_ai_candidate_dossier_rohit_sharma`
- **Current Route**: `/recruiter/candidates`, Dossier Modal
- **Current Status**: PARTIAL (70%)
- **Missing Functionality**: Finalist decision bar (Approve for Offer, Keep on Hold, Reject) with requirement sign-off checklist.
- **Required Components**: `HumanDecisionBar.tsx`, extended `CandidateDossierModal.tsx`
- **Required Interaction**: Recruiter clicks "Approve for Offer" → opens Offer Generation Workflow.
- **Dependencies**: P0 #10.

---

### P0 #12 — Autonomous Offer Generation & Tracking Workflow
- **Screen / Feature**: Offer Preparation, Preview & Candidate Acceptance Flow
- **Stitch Source**: `hiregenie_ai_job_detail_apply` / Recruiter Workspace
- **Current Route**: `/recruiter/offers`, `/candidate/applications`
- **Current Status**: NOT IMPLEMENTED (0%)
- **Missing Functionality**: Recruiter offer letter generator (salary, equity, start date), candidate offer view in Candidate Portal with Accept/Decline actions.
- **Required Components**: `OfferGeneratorModal.tsx`, `CandidateOfferCard.tsx`
- **Required Interaction**: Recruiter generates offer → candidate sees "Offer Received" banner in Candidate Portal → clicks "Accept Offer" → status updates to "Hired"!
- **Dependencies**: P0 #11.
