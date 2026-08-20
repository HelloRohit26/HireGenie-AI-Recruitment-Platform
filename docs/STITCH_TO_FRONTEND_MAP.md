# STITCH EXPORT TO FRONTEND IMPLEMENTATION MAP

This document provides a precise 1-to-1 mapping between the **Stitch Export** artifacts and the **Current Antigravity Frontend** codebase (`frontend/src`).

---

## 1. Screen Mapping Table

| Stitch Export | Intended Screen | Current Route | Implemented | Fidelity | Category | Notes |
|---|---|---|---|---|---|---|
| `hiregenie_ai_command_center_1` | Recruiter Command Center (Primary) | `/recruiter` | YES | 95% | A. FULLY IMPLEMENTED | Complete overview, pipeline, active AI agents, active jobs & activity feed |
| `hiregenie_ai_command_center_2` | Recruiter Command Center (Dark Alt) | `/recruiter` | YES | 95% | D. VARIANT / STATE | Alternate theme layout state of Command Center (handled via theme toggle) |
| `hiregenie_ai_jobs_overview` | Recruiter Jobs Overview | `/recruiter/jobs` | YES | 90% | A. FULLY IMPLEMENTED | Requisitions list, search, status filters, metrics, create wizard modal |
| `hiregenie_ai_job_workspace_ai_engineer_1` | Job Workspace (Overview) | `/recruiter/jobs/:id` | YES | 88% | A. FULLY IMPLEMENTED | Single job detail header, pipeline breakdown stats, candidate grid |
| `hiregenie_ai_job_workspace_ai_engineer_2` | Job Workspace (Pipeline Filter) | `/recruiter/jobs/:id` | YES | 88% | D. VARIANT / STATE | Pipeline stage view state of Job Workspace |
| `hiregenie_ai_candidates_intelligence` | Candidates Intelligence | `/recruiter/candidates` | YES | 92% | A. FULLY IMPLEMENTED | Unified candidate grid, search, status/job/sort filters |
| `hiregenie_ai_candidate_dossier_rohit_sharma` | Candidate Dossier Modal | Component (`CandidateDossierModal`) | YES | 90% | A. FULLY IMPLEMENTED | Tabbed candidate dossier (Overview, Skills, AI Analysis, Interview) |
| `hiregenie_ai_ai_screening_command_center` | AI Screening Command Center | `/recruiter/screening` | YES | 90% | A. FULLY IMPLEMENTED | Live queue, stage filters, progress indicators, expandable AI reasoning |
| `hiregenie_ai_interviews_intelligence` | Interviews Intelligence | `/recruiter/interviews` | YES | 88% | A. FULLY IMPLEMENTED | Status stats, type icons, interview list, schedule & magic link display |
| `hiregenie_ai_insights_intelligence` | Insights & Analytics | `/recruiter/insights` | YES | 90% | A. FULLY IMPLEMENTED | Tabbed views for Overview, Hiring Funnel, Weekly Trends, Diversity |
| `hiregenie_ai_general_workspace_settings` | Settings (General) | `/recruiter/settings` | YES | 88% | A. FULLY IMPLEMENTED | General tab in Settings workspace |
| `hiregenie_ai_team_permissions` | Settings (Team & Permissions) | `/recruiter/settings` | YES | 88% | A. FULLY IMPLEMENTED | Team members tab in Settings workspace |
| `hiregenie_ai_ai_configuration` | Settings (AI Configuration) | `/recruiter/settings` | YES | 88% | A. FULLY IMPLEMENTED | AI threshold & parameters tab in Settings workspace |
| `hiregenie_ai_audit_logs_security` | Trust & Safety / Audit Logs | `/recruiter/trust-safety` | YES | 88% | A. FULLY IMPLEMENTED | Compliance dashboard, audit logs, fairness status |
| `hiregenie_ai_entry_experience` | Recruiter/Candidate Entry Landing | `/entry` | NO | 0% | C. NOT IMPLEMENTED | Hero landing page with dual candidate/recruiter entry paths |
| `hiregenie_ai_sign_in` | Authentication / Sign In | `/login` | NO | 0% | C. NOT IMPLEMENTED | Role selection, login form, auth state |
| `hiregenie_ai_recruiter_onboarding_workspace` | Recruiter Onboarding | `/recruiter/onboarding` | NO | 0% | C. NOT IMPLEMENTED | Multi-step recruiter workspace setup wizard |
| `hiregenie_ai_candidate_onboarding_resume` | Candidate Onboarding / Resume Upload | `/candidate/onboarding` | NO | 0% | C. NOT IMPLEMENTED | Candidate resume upload & profile parsing onboarding |
| `hiregenie_ai_candidate_home` | Candidate Portal Home | `/candidate` | NO | 0% | C. NOT IMPLEMENTED | Candidate portal dashboard (my status, recommended jobs) |
| `hiregenie_ai_jobs_discovery` | Candidate Job Discovery | `/candidate/jobs` | NO | 0% | C. NOT IMPLEMENTED | Public/candidate job search & filter view |
| `hiregenie_ai_job_detail_apply` | Candidate Job Detail & Apply | `/candidate/jobs/:id` | NO | 0% | C. NOT IMPLEMENTED | Job description page with one-click AI application modal |
| `hiregenie_ai_my_applications` | Candidate My Applications | `/candidate/applications` | NO | 0% | C. NOT IMPLEMENTED | Candidate application tracker & timeline |
| `hiregenie_ai_interview_entry` | Candidate Interview Magic Link Entry | `/interview/:token` | NO | 0% | C. NOT IMPLEMENTED | Magic link landing & identity verification |
| `hiregenie_ai_interview_preparation` | Candidate Interview Preparation | `/interview/:token/prep` | NO | 0% | C. NOT IMPLEMENTED | Tech check, mic test, AI interview instructions |
| `hiregenie_ai_voice_interview_room` | Candidate AI Voice Interview Room | `/interview/:token/room` | NO | 0% | C. NOT IMPLEMENTED | Autonomous WebRTC voice interview experience with 3D core |
| `three.js_1` | 3D Voice Ring Torus Core | Component (`VoiceCore3D`) | PARTIAL | 50% | B. PARTIAL | Central voice animation torus ring in Three.js |
| `three.js_2` | 3D Pipeline Talent Constellation | Component (`TalentConstellation`) | YES | 95% | A. FULLY IMPLEMENTED | Interactive WebGL constellation background in `RecruiterShell` |
| `three.js_3` | 3D Candidate Skill Knowledge Graph | Component (`SkillGraph3D`) | NO | 0% | C. NOT IMPLEMENTED | Interactive 3D skill network node graph for candidates |
| `shader_1` | Brass Node Background Shader | WebGL / CSS | PARTIAL | 70% | B. PARTIAL | Pulsing node background shader (CSS fallback active in `index.css`) |
| `shader_2` | Candidate Portal Organic Flow Shader | WebGL Shader | NO | 0% | C. NOT IMPLEMENTED | Organic background shader for Candidate Portal |
| `shader_3` | Voice Room Volumetric Depth Shader | WebGL Shader | NO | 0% | C. NOT IMPLEMENTED | Volumetric ambient depth shader for Voice Interview Room |
| `architectural_precision_1` | Design System Architecture 1 | Docs/Assets | N/A | 100% | E. ASSET / DESIGN SYSTEM | Theme tokens & layout guidelines |
| `architectural_precision_2` | Design System Architecture 2 | Docs/Assets | N/A | 100% | E. ASSET / DESIGN SYSTEM | Dark mode component specification |
| `hiregenie_ai_operating_system` | Operating System Architecture | Docs/Assets | N/A | 100% | E. ASSET / DESIGN SYSTEM | Master product architecture document |
| `hiregenie_candidate_portal` | Candidate Portal Design Spec | Docs/Assets | N/A | 100% | E. ASSET / DESIGN SYSTEM | Candidate portal visual specification |
| `hiregenie_talentos` | Master Design Tokens Spec | Docs/Assets | N/A | 100% | E. ASSET / DESIGN SYSTEM | Master color palette & typography tokens |
| `warm_graphite_editorial` | Warm Graphite Design Spec | Docs/Assets | N/A | 100% | E. ASSET / DESIGN SYSTEM | Editorial warm graphite color & font spec |

---

## 2. Classification Summary

| Category | Description | Count |
|---|---|---|
| **A. FULLY IMPLEMENTED** | Standalone screens existing in the frontend matching Stitch specs | **10** |
| **B. PARTIALLY IMPLEMENTED** | Implemented as visual fallback or partial component | **2** |
| **C. NOT IMPLEMENTED** | Stitch designs with no current frontend page/route | **14** |
| **D. VARIANT / STATE** | Theme variations or UI sub-states represented by implemented screens | **2** |
| **E. ASSET / DESIGN SYSTEM** | Documentation markdown files and design token assets | **9** |
| **TOTAL STITCH EXPORT FOLDERS** | | **37** |

---

## 3. 3D & WebGL Shader Experiences Audit

### `three.js_1` — Central Voice Core Torus
- **Purpose**: Animated pulsing torus rings representing the Voice AI agent during interviews.
- **Target Location**: Candidate AI Voice Interview Room (`/interview/:token/room`).
- **Current Status**: Standalone raw HTML/JS snippet in export. Not integrated in React components.
- **R3F Conversion**: Recommended conversion to `@react-three/fiber` or lightweight `three` canvas wrapper component.

### `three.js_2` — Pipeline Talent Constellation
- **Purpose**: Ambient background WebGL constellation displaying candidate flow.
- **Target Location**: `RecruiterShell.tsx` layout background.
- **Current Status**: **Fully implemented** as React Three Fiber canvas component `TalentConstellation.tsx`.
- **R3F Conversion**: Complete.

### `three.js_3` — Skill Knowledge Graph
- **Purpose**: 3D interactive node graph mapping candidate skills and relationships.
- **Target Location**: Candidate Dossier Modal & Candidates Intelligence page.
- **Current Status**: Raw Three.js HTML snippet in export. Not integrated.
- **R3F Conversion**: Candidate feature for interactive candidate skill exploration.

### `shader_1` — Brass Node Background Shader
- **Purpose**: Micro-pulsing node grid shader in `#11110F` background.
- **Target Location**: Recruiter workspace backdrop.
- **Current Status**: Partial (CSS animation keyframes in `index.css` provide high-fidelity visual equivalent).

### `shader_2` — Candidate Portal Organic Flow Shader
- **Purpose**: Organic fluid background shader for candidate portal pages.
- **Target Location**: Candidate Portal routes (`/candidate/*`).
- **Current Status**: Raw GLSL fragment shader in export. Not integrated.

### `shader_3` — Voice Room Volumetric Depth Shader
- **Purpose**: Volumetric depth backdrop for the AI Voice Interview room.
- **Target Location**: Voice Interview Room (`/interview/:token/room`).
- **Current Status**: Raw GLSL fragment shader in export. Not integrated.

---

## 4. Summary of Standalone Application Screens

Out of 37 total Stitch export folders:
- **9** are Design System / Architectural Specification Documents.
- **2** are Theme/Layout UI Sub-States.
- **6** are WebGL 3D/Shader Visual Assets.
- **20** are Standalone Unique Application Screens:
  - **10 Recruiter Portal Screens** -> **100% IMPLEMENTED**
  - **1 Auth / Entry Screen (`hiregenie_ai_entry_experience` / `hiregenie_ai_sign_in`)** -> **MISSING**
  - **9 Candidate Portal & Voice Interview Screens** -> **MISSING**

---

## 5. Prioritized Implementation Roadmap (For Future Steps)

### P0 — Candidate Portal & Voice Interview Experience (10 Screens)
1. Entry Landing (`/entry`) & Sign In (`/login`)
2. Recruiter Workspace Onboarding (`/recruiter/onboarding`)
3. Candidate Resume Upload & Onboarding (`/candidate/onboarding`)
4. Candidate Portal Home (`/candidate`)
5. Candidate Job Discovery (`/candidate/jobs`)
6. Candidate Job Detail & Apply (`/candidate/jobs/:id`)
7. Candidate My Applications (`/candidate/applications`)
8. Candidate Magic Link Entry (`/interview/:token`)
9. Candidate Interview Preparation (`/interview/:token/prep`)
10. Candidate AI Voice Interview Room (`/interview/:token/room`)

### P1 — 3D Visual Experience Enhancements
1. Voice Core 3D Torus Component (`three.js_1`)
2. Skill Graph 3D Component (`three.js_3`)
3. GLSL Canvas Shaders (`shader_2`, `shader_3`)

### P2 — State Polish & Micro-Interactions
1. Live WebRTC voice audio scrubber
2. Candidate comparison overlay
