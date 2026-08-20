# HIREGENIE AI — PHASE 3: REAL-TIME WEBRTC VOICE & AI AGENT STREAMING PLAN

**Target Document**: `docs/PHASE_3_PLAN.md`  
**Phase Objective**: Wire live WebRTC audio transport sockets (`/api/v1/voice/stream`) and autonomous Python AI Agent LLM pipelines (`ResumeParserAgent`, `SkillMatcherAgent`, `CandidateRankerAgent`, `VoiceInterviewerAgent`, `EvaluationAgent`) to replace frontend mock data hooks with real-time autonomous voice interaction.

---

## 1. Executive Summary & Phase Recommendation

- **Recommended Phase**: **Phase 3: Real-Time WebRTC Voice & AI Agent Streaming**
- **Why This Phase Comes Next**: 
  - **P0**: Core candidate portal & recruiter workflows — **100% COMPLETE** (7/7 items).
  - **P1**: Additional screens, magic link entry, prep workspace, comparison matrix, compliance audit exporter, & onboarding wizards — **100% COMPLETE** (7/7 items).
  - **Phase B (Phase 1)**: FastAPI Backend Integration & Service Layer Wiring — **100% COMPLETE** (5/5 tasks).
  - **Phase C (Phase 2)**: Three.js & WebGL 3D Experience Enhancements — **100% COMPLETE** (4/4 tasks).
  - The entire frontend UI (20/20 screens), API service layer, and 3D WebGL atmosphere are **100% built and verified**. Connecting real-time WebRTC audio streaming and AI agents is the natural next step.
- **Dependencies Required**: Browser `RTCPeerConnection` WebRTC API, WebSockets (`ws://localhost:8000/api/v1/voice/stream`), Web Audio API, and FastAPI backend WebRTC server.
- **What This Phase Unlocks**:
  1. Real-time bi-directional voice-to-voice interviews between candidates and the AI Voice Interviewer Agent in `/interview/:token/room`.
  2. Autonomous LLM resume parsing, skill vector extraction, and deterministic candidate ranking.
  3. Real-time post-interview evaluation report generation and recruiter candidate dossier updates.
- **What Should Wait Until Later**: Final production server deployment and TLS domain SSL setup (Phase 4).

---

## 2. Itemized Task List for Phase 3

- [ ] **Task 1: Real-Time WebRTC Audio Transport Client (`src/services/webrtcService.ts`)**
  - Manages `RTCPeerConnection`, ICE candidate exchange, audio track streaming, and WebSocket signaling for `/interview/:token/room`.
- [ ] **Task 2: Autonomous AI Voice Interviewer Agent Integration (`src/services/voiceAgentService.ts`)**
  - Manages real-time AI speech synthesis events, turn-taking state, and dynamic question progression.
- [ ] **Task 3: Real-Time AI Resume Parsing & Vector Skill Matcher Engine (`src/services/aiAgentService.ts`)**
  - Connects candidate resume PDF/DOCX uploads to LLM parser endpoints for live extraction checklist updating in `/candidate/onboarding`.
- [ ] **Task 4: End-to-End Autonomous Interview Evaluation & Offer Engine (`src/services/evaluationService.ts`)**
  - Automatically compiles post-interview transcript evaluations and generates candidate dossier scorecards in `/recruiter/candidates`.

---

## 3. Definition of Done for Phase 3

1. WebRTC audio stream connects cleanly with sub-200ms latency during candidate voice interviews.
2. AI Voice Core visualizer (`VoiceCore3D.tsx`) scales in real time according to WebRTC audio frequency levels.
3. Candidate resume upload triggers real LLM parsing and vector skill match scoring.
4. Zero breaking changes to existing UI components, 3D WebGL shaders, or theme design tokens.
5. `npx tsc --noEmit` returns **0 errors** and `npm run build` succeeds cleanly.
