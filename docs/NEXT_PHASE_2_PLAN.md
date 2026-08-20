# HIREGENIE AI — PHASE C: THREE.JS & WEBGL 3D EXPERIENCE PLAN

**Target Document**: `docs/NEXT_PHASE_2_PLAN.md`  
**Phase Objective**: Elevate the visual fidelity of the HireGenie AI platform by converting raw Stitch 3D export snippets (`three.js_1`, `three.js_3`, `shader_2`, `shader_3`) into performant `@react-three/fiber` components and GLSL canvas shaders for the Voice Interview Room and Candidate Intelligence Dossier.

---

## 1. Executive Summary & Phase Recommendation

- **Recommended Phase**: **Phase C: Three.js & WebGL 3D Experience Enhancements**
- **Why This Phase Comes Next**: All 20 application screens and the complete API service layer (`apiClient`, `jobService`, `candidateService`, `screeningService`, `authService`) are **100% complete and verified**. Adding the native `@react-three/fiber` 3D elements will fulfill the complete visual spec from the Stitch export map (`STITCH_TO_FRONTEND_MAP.md`).
- **Dependencies Required**: `@react-three/fiber`, `three`, `@react-three/drei`, WebGL 2.0 browser context.
- **What This Phase Unlocks**:
  1. Interactive 3D Voice Ring Torus (`VoiceCore3D.tsx`) reacting in real time to candidate audio frequency levels in `/interview/:token/room`.
  2. Interactive 3D Candidate Skill Knowledge Graph (`SkillGraph3D.tsx`) mapping skill nodes and vector relationships in `CandidateDossierModal.tsx`.
  3. GLSL volumetric depth and organic flow background shaders (`VoiceDepthShader.tsx`, `CandidateFlowShader.tsx`).
- **What Should NOT Be Implemented Yet**: Real WebRTC socket connections or backend LLM servers (reserved for Phase D).

---

## 2. Itemized Task List for Phase C

- [ ] **Task 1: 3D Voice Core Torus Ring Component (`VoiceCore3D.tsx`)**
  - Converts `three.js_1` export into an interactive R3F pulsing torus component with audio reactivity and SVG fallback.
- [ ] **Task 2: Interactive 3D Candidate Skill Knowledge Graph (`SkillGraph3D.tsx`)**
  - Converts `three.js_3` export into an interactive 3D node graph mapping candidate competencies in the candidate dossier.
- [ ] **Task 3: GLSL Volumetric Depth Shader for Voice Interview Room (`VoiceDepthShader.tsx`)**
  - Integrates `shader_3` fragment shader for dynamic ambient depth in `/interview/:token/room`.
- [ ] **Task 4: GLSL Organic Flow Shader for Candidate Portal (`CandidateFlowShader.tsx`)**
  - Integrates `shader_2` fragment shader for fluid background aesthetics across `/candidate/*` routes.

---

## 3. Definition of Done for Phase C

1. 3D WebGL experiences render smoothly at 60 FPS on desktop and 30+ FPS on mobile.
2. WebGL context loss handlers and 2D fallback components render seamlessly if WebGL is unavailable or `prefers-reduced-motion` is enabled.
3. Zero breaking changes to existing UI layouts, API services, or theme tokens.
4. `npx tsc --noEmit` returns **0 errors** and `npm run build` succeeds cleanly.
