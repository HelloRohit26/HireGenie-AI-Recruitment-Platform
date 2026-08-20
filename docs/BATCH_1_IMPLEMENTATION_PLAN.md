# HIREGENIE AI — BATCH 1 IMPLEMENTATION PLAN: PRODUCT UI & CORE WORKFLOWS

**Target Document**: `docs/BATCH_1_IMPLEMENTATION_PLAN.md`  
**Batch Objective**: Verify, polish, and ensure 100% end-to-end interactive workflow completeness across all 20 Recruiter and Candidate Portal screens, modals, drawers, and status transitions with responsive design, theme consistency, and fluid motion.

---

## 1. Scope & Component Architecture

### PART 1: RECRUITER PORTAL WORKFLOWS (10 Screens)
1. **Recruiter Command Center (`/recruiter`)**: Key performance metrics (Applicants, Active Jobs, Shortlisted, Interviews, Offers, Time-to-Hire), candidate pipeline visualizer, recent activity stream.
2. **Job Management & Workspace (`/recruiter/jobs`, `/recruiter/jobs/:id`)**: Search, status filtering, requisitions list, single job workspace view with applicant breakdowns and stage updates.
3. **Create Job Wizard (`CreateJobModal.tsx`)**: 6-step interactive workflow (Basic details -> Screening questions -> Skill weights -> Target shortlist -> Interview mode -> Review & Publish).
4. **AI Screening Command Center (`/recruiter/screening`)**: Live batch screening queue, real-time stage processing simulation, candidate match ranking, and decision override modal (`ScreeningOverrideModal.tsx`).
5. **Candidate Roster & 3D Dossier (`/recruiter/candidates`)**: Searchable candidate table, stage pills, side-by-side candidate comparison matrix (`CandidateComparisonDrawer.tsx`), and 3D candidate competency dossier (`CandidateDossierModal.tsx`).
6. **Interview Management & Scorecards (`/recruiter/interviews`)**: Scheduled/completed voice interview roster, WebAudio scrubber player (`AudioWaveformPlayer.tsx`), and evaluation breakdown.
7. **Trust, Safety & Bias Compliance (`/recruiter/trust-safety`)**: Disparate impact ratio, EEOC compliance metrics, and interactive audit log exporter (`AuditExportModal.tsx`).
8. **Executive Insights & Analytics (`/recruiter/insights`)**: Pipeline conversion funnels, time-to-fill trends, and AI agent accuracy charts.
9. **Recruiter Settings & Onboarding (`/recruiter/settings`, `/recruiter/onboarding`)**: Workspace setup, team permissions, notification preferences, and AI agent threshold controls.
10. **Help & Compliance Docs (`/recruiter/help`)**: System documentation, API references, and compliance guidelines.

### PART 2: CANDIDATE PORTAL WORKFLOWS (10 Screens)
1. **Candidate Dashboard (`/candidate`)**: Active application status tracker, upcoming voice interviews, recommended jobs.
2. **Browse Jobs (`/candidate/jobs`)**: Search, role filters, location, salary range, remote/onsite badges, and job detail drawer.
3. **Job Details & Application Modal (`/candidate/jobs/:id`, `ApplyModal.tsx`)**: Role description, required skills, interactive resume upload & parsing simulation, screening questions, and application submit flow.
4. **My Applications & Tracker (`/candidate/applications`)**: Multi-stage progress tracker (Applied -> AI Screening -> Shortlisted -> Scheduled -> Interview -> Final Review -> Offer).
5. **Candidate Magic Link Entry (`/interview/:token`)**: Secure token validation, candidate identity confirmation, and interview room launcher.
6. **Candidate Tech Check & Prep Workspace (`/interview/:token/prep`)**: System diagnostic checks (Microphone permission, audio loopback test, speaker volume meter) and prep guidelines.
7. **Candidate AI Voice Room (`/interview/:token/room`)**: 3D Voice Core visualizer, GLSL volumetric atmosphere shader, live question timer, mic mute controls, and live dialogue transcript.
8. **Candidate Resume Upload Onboarding (`/candidate/onboarding`)**: Interactive drag-and-drop resume upload, skill extraction checklist, and candidate profile setup wizard.

---

## 2. Implementation Execution Plan

1. **Verify All Component Imports & Routes**: Ensure `App.tsx` routes, navigation headers (`Header.tsx`, `CandidateShell.tsx`), and sidebars (`RecruiterSidebar.tsx`) have zero dead buttons or fake navigation links.
2. **Refine Responsive Layouts**: Ensure grid cards, tables, drawers, and modals adjust seamlessly for 1440px desktop, 1024px/768px tablet, and 390px mobile screens.
3. **Theme & Contrast Check**: Audit Warm Graphite (`#11110F`), Warm Pearl (`#FAF8F2`), Muted Brass (`#D6A85F`), and Dusty Sage (`#79A89A`) color palette consistency.
4. **Motion Polish**: Verify Framer Motion modal transitions, drawer slide-ins, and tab switching.
5. **Run Comprehensive Validation**: Execute `npx tsc --noEmit` and `npm run build` to confirm zero build or lint issues.
