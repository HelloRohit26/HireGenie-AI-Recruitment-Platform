# HIREGENIE AI — BATCH 4 IMPLEMENTATION PLAN: REAL AI RECRUITMENT AGENT PIPELINE

**Target Document**: `docs/BATCH_4_IMPLEMENTATION_PLAN.md`  
**Batch Objective**: Execute, wire, and validate the 5-stage autonomous AI recruitment pipeline (`ResumeParserAgent` -> `SkillMatcherAgent` -> `CandidateRankerAgent` -> `VoiceInterviewerAgent` -> `EvaluationAgent`) backed by structured Pydantic schemas, explainable AI score breakdowns, and progress tracking.

---

## 1. Agent Architecture & Pipeline Workflow

```
Candidate Resume PDF/DOCX
          ↓
[1. ResumeParserAgent] ────► Parsed JSON (Skills, Work History, Education)
          ↓
[2. SkillMatcherAgent] ───► Cosine Vector Similarity & Skill Match Scores
          ↓
[3. CandidateRankerAgent] ──► Weighted Deterministic Scoring & Top-N Shortlist
          ↓
[4. VoiceInterviewerAgent] ─► Interview Plan & Structured Adaptive Questions
          ↓
[5. EvaluationAgent] ─────► Post-Interview Scorecards & Recruiter Recommendation
```

---

## 2. Itemized Agent Breakdown

### Agent 1 — Resume Parsing (`ResumeParserAgent`)
- **Module**: `backend/app/agents/resume_agent.py` & `src/services/aiAgentService.ts`
- **Output Schema**: Pydantic `ResumeSchema` (skills, education, total_experience, work_history, certifications).
- **Validation**: Strict schema validation with graceful error handling and document reference preservation.

### Agent 2 — Skill Matching (`SkillMatcherAgent`)
- **Module**: `backend/app/agents/matching_agent.py`
- **Output Schema**: `SkillMatchResult` (skill_match, experience_relevance, project_alignment, required_skill_coverage, missing_skills).
- **Matching Logic**: Cosine vector similarity calculation against Job Requisition requirements.

### Agent 3 — Candidate Ranking (`CandidateRankerAgent`)
- **Module**: `backend/app/agents/scoring_agent.py`
- **Scoring Strategy**: Deterministic weighted scoring formula:
  $$\text{Final Score} = w_s \cdot \text{SkillMatch} + w_e \cdot \text{ExpRelevance} + w_p \cdot \text{ProjectAlign} + w_c \cdot \text{CommScore}$$
  where weights $w_s, w_e, w_p, w_c$ originate from the recruiter's Job Requisition configuration.
- **Explainability**: Persists score breakdown and explainable AI reasoning for recruiter inspection (`Explainable AI Drawer`).

### Agent 4 — Voice Interview Intelligence (`VoiceInterviewerAgent`)
- **Module**: `backend/app/agents/interview_agent.py`
- **Output Schema**: `InterviewPlan` generating structured technical, role-specific, behavioral, and adaptive follow-up questions.
- **Note**: WebRTC audio transport is isolated to Batch 5.

### Agent 5 — Evaluation Agent (`EvaluationAgent`)
- **Module**: `backend/app/agents/evaluation_agent.py`
- **Output Schema**: `InterviewEvaluation` (technical_score, communication_score, problem_solving_score, overall_score, strengths, concerns, recommendation).
- **Recommendation**: `STRONGLY_RECOMMEND`, `RECOMMEND`, `MANUAL_REVIEW`, `DO_NOT_RECOMMEND`.

---

## 3. Frontend AI Integration Strategy

- **`src/services/aiAgentService.ts`**: Frontend client wrapper triggering AI screening jobs, polling progress metrics, fetching explainable AI score breakdowns, and loading candidate dossier evaluations.
- **AI Screening Workspace (`AIScreeningPage.tsx`)**: Displays real-time progress (Parsing -> Matching -> Ranking -> Shortlisting) and agent activity feeds.
- **Candidate Dossier (`CandidateDossierModal.tsx`)**: Displays explainable AI reasoning, vector skill match radar, and evaluation scorecards.

---

## 4. Technical Validation Plan

1. **TypeScript Validation**: `npx tsc --noEmit` on `frontend/`.
2. **Production Build**: `npm run build` on `frontend/`.
3. **Pipeline Determinism Check**: Confirm identical candidate input data produces identical ranking scores.
