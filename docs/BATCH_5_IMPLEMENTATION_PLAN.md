# HIREGENIE AI — BATCH 5 IMPLEMENTATION PLAN: REAL-TIME VOICE & PRODUCTION HARDENING

**Target Document**: `docs/BATCH_5_IMPLEMENTATION_PLAN.md`  
**Batch Objective**: Execute, wire, and validate the real-time AI voice interview room session (`/interview/:token/room`), WebRTC audio transport stream (`webrtcService.ts`), microphone hardware diagnostic test (`/interview/:token/prep`), 15-minute real session timer, transcript persistence, post-interview evaluation report triggers, and production hardening.

---

## 1. Voice Architecture & State Machine

```
Candidate Magic Link (/interview/:token)
          ↓
Microphone & Device Tech Check (/interview/:token/prep)
          ↓
WebRTC Connection & Socket Signaling (/interview/:token/room)
          ↓
┌─────────────────────────────────────────────────────────────┐
│                 Interview State Machine                     │
│ PREPARING → MIC_PERMISSION → DEVICE_CHECK → CONNECTING       │
│     → CONNECTED → AI_SPEAKING ⇄ CANDIDATE_SPEAKING        │
│     → THINKING → COMPLETED → EVALUATION_PROCESSING          │
└─────────────────────────────────────────────────────────────┘
          ↓
Transcript & Audio Recording Reference Persisted to SQLite
          ↓
EvaluationAgent Generates Scorecard & Candidate Dossier Updated
```

---

## 2. Itemized Implementation Modules

### Module 1 — Secure Magic Link & Token Validation (`InterviewEntryPage.tsx`)
- Validates interview token via `/api/v1/interview/session`, confirming candidate identity, job title, company name, and single-use link status.

### Module 2 — Microphone & Device Hardware Check (`InterviewPrepPage.tsx`)
- Interrogates `navigator.mediaDevices.getUserMedia()`, renders live Web Audio frequency volume meter, and validates browser audio loopback before entering interview room.

### Module 3 — WebRTC Real-Time Voice Room (`VoiceInterviewRoomPage.tsx` & `webrtcService.ts`)
- Manages bi-directional audio streaming, ICE candidates, Web Audio volume frequency analysis, real audio scaling on `VoiceCore3D.tsx`, GLSL volumetric depth backdrop (`VoiceDepthShader.tsx`), real 15-minute countdown timer, mic mute controls, and dialogue transcript synchronization.

### Module 4 — Post-Interview Evaluation & Dossier Update (`EvaluationAgent` & `CandidateDossierModal.tsx`)
- Compiles transcript into `InterviewEvaluation` scorecard, updates SQLite database application status to `FINAL_REVIEW`, and refreshes candidate dossier recommendations.

### Module 5 — Production Hardening & Security Audit
- Confirms zero exposed API keys or secrets in client bundles.
- Validates full light/dark theme contrast (`#11110F` Warm Graphite & `#FAF8F2` Warm Pearl).
- Ensures `prefers-reduced-motion` compliance across 3D WebGL canvases.
- Verifies responsive design across 1440px desktop, 1024px/768px tablet, and 390px mobile screens.

---

## 3. Technical Validation Plan

1. **TypeScript Validation**: `npx tsc --noEmit` on `frontend/`.
2. **Production Build**: `npm run build` on `frontend/`.
3. **End-to-End Workflow Verification**: Magic Link -> Tech Check -> 15-Min Voice Room -> Post-Interview Evaluation -> Recruiter Dossier.
