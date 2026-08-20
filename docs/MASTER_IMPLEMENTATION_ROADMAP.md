# HIREGENIE AI — MASTER IMPLEMENTATION ROADMAP (BATCH MODE)

**Target Document**: `docs/MASTER_IMPLEMENTATION_ROADMAP.md`  
**Purpose**: Defines the complete production MVP master roadmap across 5 major development batches.

---

## 1. Executive Summary & Batch Progress Overview

| Batch | Description | Current Status | Completion % | Focus Area |
|---|---|---|---|---|
| **BATCH 1** | **Product UI & Workflows** | **COMPLETE** | **100%** | All 20 UI screens, recruiter/candidate workflows, modals, & drawers |
| **BATCH 2** | **Three.js & Premium Experience** | **COMPLETE** | **100%** | 3D Voice Core, 3D Skill Graph, Talent Constellation, & GLSL Shaders |
| **BATCH 3** | **Backend & Service Layer Integration** | **IN PROGRESS** | **85%** | FastAPI API client, Jobs, Candidates, Screening, & Auth services active |
| **BATCH 4** | **Real Autonomous AI Agent Pipeline** | **PLANNED** | **20%** | Resume Parser, Skill Matcher, Candidate Ranker, & Evaluation Agents |
| **BATCH 5** | **Real-Time WebRTC Voice & Production Hardening** | **IN PROGRESS** | **50%** | WebRTC audio transport socket client, volume analysis, & E2E polish |

---

## 2. Comprehensive Batch Breakdown

### BATCH 1 — PRODUCT UI + WORKFLOWS
- **Current Status**: **100% COMPLETE** (20 / 20 screens implemented & verified).
- **Features Included**:
  - Landing / Hero (`/`)
  - Auth Modals & Login (`/entry`, `/login`)
  - Recruiter Command Center (`/recruiter`)
  - Job Requisition Workspace (`/recruiter/jobs`, `/recruiter/jobs/:id`)
  - AI Screening Command Center (`/recruiter/screening`)
  - Candidate Roster & 3D Dossier (`/recruiter/candidates`)
  - Interview Room Management (`/recruiter/interviews`)
  - Trust, Safety & Bias Compliance Exporter (`/recruiter/trust-safety`)
  - Executive Insights & Analytics (`/recruiter/insights`)
  - Recruiter Onboarding & Settings (`/recruiter/onboarding`, `/recruiter/settings`)
  - Help & Compliance Docs (`/recruiter/help`)
  - Candidate Portal (`/candidate`, `/candidate/jobs`, `/candidate/applications`)
  - Candidate Magic Link Entry (`/interview/:token`)
  - Candidate Tech Check & Prep Workspace (`/interview/:token/prep`)
  - Candidate AI Voice Room (`/interview/:token/room`)
  - Candidate Resume Upload & Parsing Onboarding (`/candidate/onboarding`)
- **Dependencies**: React 18, React Router v6, TailwindCSS, Framer Motion.
- **Definition of Done**: 100% route coverage, zero broken transitions, responsive across 1440px to 390px, full light/dark theme support.

---

### BATCH 2 — THREE.JS + PREMIUM EXPERIENCE
- **Current Status**: **100% COMPLETE** (All 3D/GLSL Stitch export assets natively integrated).
- **Features Included**:
  - `TalentConstellation.tsx` (Stitch `three.js_2` R3F canvas background)
  - `VoiceCore3D.tsx` (Stitch `three.js_1` 3D Torus ring core for voice room)
  - `SkillGraph3D.tsx` (Stitch `three.js_3` 3D candidate competency node graph)
  - `VoiceDepthShader.tsx` (Stitch `shader_3` GLSL volumetric atmosphere)
  - `CandidateFlowShader.tsx` (Stitch `shader_2` GLSL organic flow backdrop)
- **Dependencies**: Three.js, `@react-three/fiber`, native GLSL WebGL shaders.
- **Definition of Done**: Native WebGL rendering, 2D fallback support, `prefers-reduced-motion` compliance, 60 FPS performance.

---

### BATCH 3 — BACKEND + DATA INTEGRATION
- **Current Status**: **85% COMPLETE** (API service layer fully built; ready to bridge to FastAPI backend endpoints).
- **Features Included**:
  - `src/services/apiClient.ts`: Centralized HTTP client wrapping `fetch` with Bearer auth headers, environment configuration (`VITE_API_BASE_URL`), and mock fallback safety.
  - `src/services/jobService.ts`: Requisitions CRUD, single job workspace hydration, and status updates.
  - `src/services/candidateService.ts`: Candidate roster, 3D dossier hydration, status stage updates, and comparison matrix.
  - `src/services/screeningService.ts`: AI screening queue fetching, batch execution simulation, and decision overrides.
  - `src/services/authService.ts`: Dual-portal login, token storage, and session persistence.
- **Dependencies**: FastAPI, Pydantic, HTTP `fetch`.
- **Definition of Done**: All frontend pages consuming centralized service modules with automatic mock fallback if backend is offline.

---

### BATCH 4 — REAL AUTONOMOUS AI AGENTS
- **Current Status**: **20% COMPLETE** (UI simulation and deterministic contracts active; Python LLM pipeline connection planned).
- **Features Included**:
  - `ResumeParserAgent`: Extracts candidate skills, work history, and contact metadata from PDF/DOCX uploads.
  - `SkillMatcherAgent`: Vector embedding cosine similarity match against job requisition requirements.
  - `CandidateRankerAgent`: Deterministic multi-criteria candidate ranking and shortlist scoring.
  - `VoiceInterviewerAgent`: Context-aware dynamic question generation during live WebRTC voice sessions.
  - `EvaluationAgent`: Automated post-interview evaluation report compilation and scorecard generation.
- **Dependencies**: Python 3.11+, LangChain / LlamaIndex / OpenAI API / Ollama.
- **Definition of Done**: UI clearly distinguishes Real AI Execution, Loading States, and Error Fallbacks with sub-2s vector ranking response times.

---

### BATCH 5 — REAL-TIME WEBRTC VOICE + PRODUCTION HARDENING
- **Current Status**: **50% COMPLETE** (WebRTC audio transport client `webrtcService.ts` & volume analyzer built).
- **Features Included**:
  - `WebRTCService` (`src/services/webrtcService.ts`): `RTCPeerConnection`, WebSocket signaling (`ws://localhost:8000/api/v1/voice/stream`), mic input track attachment, real-time volume frequency analysis.
  - Magic Link token validation & interview room setup.
  - Microphone hardware permission modal & diagnostic test.
  - Real-time audio waveform visualization and transcript sync.
  - Post-interview evaluation compilation & recruiter approval workflow.
  - Production build optimization, security audit, accessibility validation, and deployment readiness.
- **Dependencies**: WebRTC API (`RTCPeerConnection`, `MediaStream`, `WebSocket`), Vite, ESLint, TypeScript.
- **Definition of Done**: Full sub-200ms audio stream latency, 0 TypeScript errors, 100% clean production build.
