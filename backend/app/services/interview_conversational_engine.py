"""Intelligent Conversational AI Interviewer Engine for HireGenie AI.
Powered by Gemini LLM with structured resume/job context, dynamic adaptive questioning,
project-specific deep dives, skill verification, certification validation, behavioral assessments,
dynamic difficulty scaling (EASY / MEDIUM / HARD), conversational turn pacing (~15 mins),
and fairness/safety guardrails.
"""
import os
import json
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from app.core.logger import logger
from app.core.config import settings
from app.core.gemini import client


class InterviewTurnDecision(BaseModel):
    interviewer_utterance: str = Field(
        description="The natural spoken response and next question/follow-up from the interviewer. Concise, conversational, engaging, no robotic boilerplate."
    )
    competency_focus: str = Field(
        description="The specific competency evaluated: Technical Deep-Dive, Project Architecture, System Design, Problem Solving, Behavioral (STAR), Skill Verification, or Concluding."
    )
    question_type: str = Field(
        description="Type of question: PROJECT_DEEP_DIVE, SKILL_VERIFICATION, ARCHITECTURE_TRADEOFF, BEHAVIORAL, FOLLOW_UP, CLARIFICATION, or CONCLUSION."
    )
    adapted_difficulty: str = Field(
        description="Current difficulty assessment: EASY, MEDIUM, or HARD."
    )
    evaluation_notes: str = Field(
        description="Brief assessment of candidate's previous response quality, technical correctness, depth, or gaps."
    )
    is_concluding: bool = Field(
        description="True if the interview has reached its target duration (~15 mins) or covered all essential competencies and should conclude."
    )


class ConversationalInterviewEngine:
    """Manages conversational dialogue turns, dynamic question generation,
    and adaptive difficulty for live voice interviews.
    """

    @staticmethod
    def build_structured_context(
        candidate_name: str,
        job_title: str,
        company: str,
        job_description: str,
        must_have_skills: List[str],
        nice_to_have_skills: List[str],
        experience_level: str,
        interview_difficulty: str,
        rubric: Dict[str, Any],
        candidate_skills: List[str],
        candidate_experience_years: float,
        candidate_projects: List[Dict[str, Any]],
        candidate_certifications: List[str],
        candidate_education: Optional[str] = None
    ) -> Dict[str, Any]:
        """Constructs an optimized structured context payload for LLM prompts."""
        return {
            "candidate_profile": {
                "name": candidate_name or "Candidate",
                "skills": candidate_skills or [],
                "experience_years": candidate_experience_years or 0.0,
                "projects": candidate_projects or [],
                "certifications": candidate_certifications or [],
                "education": candidate_education or "Not specified"
            },
            "job_profile": {
                "title": job_title or "Software Engineer",
                "company": company or "HireGenie AI",
                "description": (job_description or "")[:500],
                "must_have_skills": must_have_skills or [],
                "nice_to_have_skills": nice_to_have_skills or [],
                "experience_level": experience_level or "MID_LEVEL",
                "initial_difficulty": interview_difficulty or "MEDIUM",
                "rubric": rubric or {
                    "Technical Knowledge": 35.0,
                    "Problem Solving": 25.0,
                    "Communication": 20.0,
                    "Role Fit": 20.0
                }
            }
        }

    @staticmethod
    def generate_initial_greeting(
        context: Dict[str, Any],
        initial_difficulty: str = "MEDIUM"
    ) -> Dict[str, Any]:
        """Generates a dynamic, contextual opening question specifically tailored to candidate background and job."""
        c_profile = context.get("candidate_profile", {})
        j_profile = context.get("job_profile", {})
        candidate_name = c_profile.get("name", "there")
        job_title = j_profile.get("title", "this role")
        company = j_profile.get("company", "HireGenie AI")
        
        # Identify top matching project or skill
        skills = c_profile.get("skills", [])
        projects = c_profile.get("projects", [])
        
        project_ref = ""
        if projects and isinstance(projects, list) and len(projects) > 0:
            first_p = projects[0]
            p_name = first_p.get("title") or first_p.get("name") or str(first_p)
            project_ref = f" I see you've worked on {p_name}."

        top_skill = skills[0] if skills else "your domain"
        
        greeting = (
            f"Hello {candidate_name}, welcome to your AI technical interview for the {job_title} role at {company}. "
            f"I'm excited to learn more about your hands-on background.{project_ref} "
            f"To start off, could you walk me through the architecture of a production system or major project you've built using {top_skill}?"
        )

        return {
            "response_id": str(uuid.uuid4()),
            "text": greeting,
            "competency_focus": "Technical Architecture & Experience",
            "question_type": "PROJECT_DEEP_DIVE",
            "difficulty": initial_difficulty,
            "is_concluding": False,
            "evaluation_notes": "Initial introductory question delivered."
        }

    @staticmethod
    def generate_next_turn(
        context: Dict[str, Any],
        transcript_history: List[Dict[str, Any]],
        elapsed_seconds: int = 0,
        max_duration_seconds: int = 900,
        current_difficulty: str = "MEDIUM"
    ) -> Dict[str, Any]:
        """Dynamically evaluates candidate answers and generates the next conversational question or conclusion."""
        time_remaining = max(0, max_duration_seconds - elapsed_seconds)
        should_conclude_soon = (time_remaining <= 90) or (len(transcript_history) >= 14)

        # Build recent conversation history summary (keep token budget tight)
        recent_turns = transcript_history[-8:] if len(transcript_history) > 8 else transcript_history
        formatted_history = []
        for t in recent_turns:
            role = "Interviewer" if t.get("role") == "ai" or t.get("sender") == "AI Interviewer" else "Candidate"
            formatted_history.append(f"{role}: {t.get('text', '')}")

        history_str = "\n".join(formatted_history) if formatted_history else "No previous dialogue."

        c_profile = context.get("candidate_profile", {})
        j_profile = context.get("job_profile", {})

        system_instruction = (
            "You are an expert, empathetic Technical Hiring Lead conducting a real-time 15-minute voice interview for HireGenie AI.\n"
            "Your speech will be converted to audio and spoken aloud to the candidate. Keep your speech concise (2-4 sentences max), natural, conversational, and focused.\n\n"
            "STRICT RULES:\n"
            "1. NO ROBOTIC FORMALISMS: Never say 'Thank you for your answer. Question 3:' or 'Moving to the next competency'. Respond naturally to what the candidate just said.\n"
            "2. RESUME & PROJECT AWARENESS: Ask about actual projects, technologies, and skills listed in the candidate profile. Never hallucinate projects or certifications not in their profile.\n"
            "3. ADAPTIVE DIFFICULTY: If candidate answered with deep architectural clarity, increase difficulty to HARD. If candidate was shallow or struggled, keep at MEDIUM or clarify.\n"
            "4. QUESTION CATEGORIES TO ROTATE ACROSS TURNS:\n"
            "   - Project Architecture & Technical Decisions (tradeoffs, scalability, failure modes, exact contribution)\n"
            "   - Skill Deep-Dives (practical production usage, concurrency, debugging, optimization)\n"
            "   - Relevant Certifications (if candidate has them, ask about practical production application)\n"
            "   - Behavioral / Problem Solving (handling technical failures, cross-functional conflicts, ownership using STAR)\n"
            "5. FAIRNESS & SAFETY: NEVER ask about age, gender, marital status, religion, medical conditions, or protected traits.\n"
            "6. PACING: If time remaining is low (< 90 seconds) or all core competencies are covered, provide a warm, professional closing statement and set is_concluding=True."
        )

        prompt = f"""
{system_instruction}

INTERVIEW CONTEXT:
Job: {j_profile.get('title')} at {j_profile.get('company')}
Must-Have Skills: {', '.join(j_profile.get('must_have_skills', []))}
Nice-To-Have Skills: {', '.join(j_profile.get('nice_to_have_skills', []))}
Candidate Name: {c_profile.get('name')}
Candidate Skills: {', '.join(c_profile.get('skills', []))}
Candidate Experience: {c_profile.get('experience_years')} years
Candidate Projects: {json.dumps(c_profile.get('projects', []))}
Candidate Certifications: {json.dumps(c_profile.get('certifications', []))}

INTERVIEW STATE:
Elapsed Time: {elapsed_seconds}s / {max_duration_seconds}s (Remaining: {time_remaining}s)
Current Difficulty: {current_difficulty}
Should Conclude: {should_conclude_soon}

RECENT CONVERSATION TRANSCRIPT:
{history_str}

Analyze the candidate's last answer and generate the next turn. Return valid JSON adhering to the schema:
- interviewer_utterance: string (the spoken response & question)
- competency_focus: string
- question_type: string
- adapted_difficulty: "EASY" | "MEDIUM" | "HARD"
- evaluation_notes: string
- is_concluding: boolean
"""

        try:
            # Invoke Gemini LLM for structured dynamic decision
            gemini_key = getattr(settings, "GEMINI_API_KEY", None) or os.getenv("GEMINI_API_KEY", "")
            if gemini_key and len(gemini_key) > 10 and not gemini_key.startswith("mock"):
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt,
                    config={
                        "response_mime_type": "application/json",
                        "response_schema": InterviewTurnDecision,
                        "temperature": 0.4
                    }
                )
                if response and response.text:
                    parsed_json = json.loads(response.text)
                    decision = InterviewTurnDecision.model_validate(parsed_json)
                    return {
                        "response_id": str(uuid.uuid4()),
                        "text": decision.interviewer_utterance,
                        "competency_focus": decision.competency_focus,
                        "question_type": decision.question_type,
                        "difficulty": decision.adapted_difficulty,
                        "evaluation_notes": decision.evaluation_notes,
                        "is_concluding": decision.is_concluding or should_conclude_soon
                    }
        except Exception as e:
            logger.warning(f"⚠️ [Conversational Engine] Gemini generation note: {str(e)} — generating robust fallback turn.")

        # Robust contextual fallback turn if LLM call is temporarily interrupted
        return ConversationalInterviewEngine._generate_contextual_fallback_turn(
            context=context,
            transcript_history=transcript_history,
            should_conclude=should_conclude_soon,
            current_difficulty=current_difficulty
        )

    @staticmethod
    def _generate_contextual_fallback_turn(
        context: Dict[str, Any],
        transcript_history: List[Dict[str, Any]],
        should_conclude: bool,
        current_difficulty: str
    ) -> Dict[str, Any]:
        """Deterministic context-aware fallback turn generation."""
        c_profile = context.get("candidate_profile", {})
        j_profile = context.get("job_profile", {})
        candidate_name = c_profile.get("name", "there")
        
        if should_conclude:
            closing = (
                f"Thank you {candidate_name}. You've provided great insight into your technical background and experience. "
                f"That wraps up our interview session today. Our recruiting team will review the evaluation and follow up with you soon."
            )
            return {
                "response_id": str(uuid.uuid4()),
                "text": closing,
                "competency_focus": "Conclusion",
                "question_type": "CONCLUSION",
                "difficulty": current_difficulty,
                "evaluation_notes": "Interview concluded.",
                "is_concluding": True
            }

        # Select unexplored candidate skills or projects
        skills = c_profile.get("skills", [])
        must_haves = j_profile.get("must_have_skills", [])
        shared_skills = [s for s in skills if s in must_haves] or skills or ["Python"]
        
        turn_count = len([t for t in transcript_history if t.get("role") == "ai"])
        
        if turn_count % 3 == 0 and c_profile.get("projects"):
            proj = c_profile["projects"][0]
            proj_name = proj.get("title") or proj.get("name") or "your key project"
            text = f"Speaking of practical implementations, what was the most difficult production bottleneck you encountered in {proj_name}, and how did you resolve it?"
            q_type = "PROJECT_DEEP_DIVE"
            focus = "Problem Solving & Architecture"
        elif turn_count % 3 == 1 and shared_skills:
            skill = shared_skills[min(turn_count // 3, len(shared_skills) - 1)]
            text = f"When designing high-throughput services with {skill}, what caching or concurrency patterns do you rely on to keep latency low?"
            q_type = "SKILL_VERIFICATION"
            focus = f"Technical Depth ({skill})"
        else:
            text = "Could you describe a situation where a technical deployment didn't go as planned, and what steps you took to diagnose and remediate the issue?"
            q_type = "BEHAVIORAL"
            focus = "Behavioral & Incident Management"

        return {
            "response_id": str(uuid.uuid4()),
            "text": text,
            "competency_focus": focus,
            "question_type": q_type,
            "difficulty": current_difficulty,
            "evaluation_notes": "Contextual adaptive turn evaluated.",
            "is_concluding": False
        }
