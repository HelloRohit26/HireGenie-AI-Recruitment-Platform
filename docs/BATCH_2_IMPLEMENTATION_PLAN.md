# HIREGENIE AI — BATCH 2 IMPLEMENTATION PLAN: THREE.JS & PREMIUM 3D EXPERIENCE

**Target Document**: `docs/BATCH_2_IMPLEMENTATION_PLAN.md`  
**Batch Objective**: Execute, audit, and polish all 4 core interactive 3D WebGL and GLSL shader experiences across the Recruiter and Candidate Portals using Stitch design exports (`three.js_1`, `three.js_2`, `three.js_3`, `shader_1`, `shader_2`, `shader_3`) with 2D fallbacks, mobile optimization, theme adaptability, and accessibility.

---

## 1. Scope & 3D Component Architecture

### 1. AI Screening Funnel (`ScreeningFunnel3D.tsx` & `TalentConstellation.tsx`)
- **Route**: `/recruiter`, `/recruiter/screening`
- **Concept**: Interactive 3D particle funnel mapping applicant counts (10,000 Applicants -> 7,842 Parsed -> 2,431 Matched -> 420 Ranked -> 20 Shortlisted).
- **Interactions**: Stage hover reveals candidate counts, processing %, and agent responsibility; clicking a stage filters the screening workspace.
- **Fallback**: 2D CSS stage progress bar and accessible HTML table.

### 2. Candidate Intelligence Space (`SkillGraph3D.tsx`)
- **Route**: `CandidateDossierModal.tsx` (`/recruiter/candidates`, `/recruiter/jobs/:id`, `/recruiter/screening`)
- **Concept**: Interactive 3D candidate-to-skill knowledge graph (Stitch `three.js_3`) mapping central candidate core nodes, satellite skill/project spheres, and vector connecting lines.
- **Interactions**: Node hover highlights skills/match percentages; node click triggers candidate dossier view.
- **Fallback**: 2D SVG skill network matrix pill cards.

### 3. Voice Field (`VoiceCore3D.tsx` & `VoiceDepthShader.tsx`)
- **Route**: `/interview/:token/room` (`VoiceInterviewRoomPage`)
- **Concept**: Sophisticated 3D voice core (Stitch `three.js_1`) & GLSL volumetric atmosphere (Stitch `shader_3`) reacting to interview states (IDLE, CONNECTING, AI_SPEAKING, LISTENING, THINKING, CANDIDATE_SPEAKING).
- **Interactions**: Audio frequency amplitude scaling, wireframe rotation, mouse parallax light propagation.
- **Fallback**: 2D SVG concentric rings with pulse animations.

### 4. Career / Application Flow (`CandidateFlowShader.tsx`)
- **Route**: `/candidate`, `/candidate/applications` (`CandidateShell`)
- **Concept**: Organic GLSL flow curves (Stitch `shader_2`) and dynamic multi-stage application tracker reacting to candidate journey milestones (Applied -> Screening -> Shortlisted -> Scheduled -> Interview -> Evaluation -> Offer).
- **Interactions**: Hover application stage reveals status metrics; click stage navigates to detail view.
- **Fallback**: 2D CSS organic gradient mesh with accessible text timeline.

---

## 2. Implementation Execution Plan

1. **Audit & Create Component Files**: Ensure `ScreeningFunnel3D.tsx`, `SkillGraph3D.tsx`, `VoiceCore3D.tsx`, `VoiceDepthShader.tsx`, and `CandidateFlowShader.tsx` are modularly organized in `src/components/3d/`.
2. **Wire 3D Experiences to Pages**:
   - `ScreeningFunnel3D` -> `AIScreeningPage.tsx`
   - `SkillGraph3D` -> `CandidateDossierModal.tsx`
   - `VoiceCore3D` & `VoiceDepthShader` -> `VoiceInterviewRoomPage.tsx`
   - `CandidateFlowShader` -> `CandidateShell.tsx`
3. **Refine Fallbacks & Motion**: Ensure `prefers-reduced-motion` and mobile touch optimization (390px, 768px, 1024px, 1440px) gracefully reduce particle complexity.
4. **Theme Adaptability**: Verify Warm Graphite (`#11110F`) and Warm Pearl (`#FAF8F2`) lighting materials.
5. **Run Technical Validation**: Execute `npx tsc --noEmit` and `npm run build`.
