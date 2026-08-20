"""JD Intelligence Service — AI-powered Job Description analysis using Gemini."""
import json
from typing import Dict, Any, List, Optional
from app.core.gemini import client
from google.genai import types


class JDIntelligenceService:
    """Analyzes job descriptions to extract skills, generate questions, and check quality."""

    @staticmethod
    def analyze_jd(description: str, requirements: Optional[str] = None) -> Dict[str, Any]:
        """Extract structured data from a free-text job description."""
        full_text = description
        if requirements:
            full_text += f"\n\nRequirements:\n{requirements}"

        prompt = f"""
You are an expert Technical Recruiter and JD Analyst.

Analyze this Job Description and extract:

1. **required_skills**: All technical and soft skills mentioned (list of strings)
2. **must_have_skills**: Skills that are absolutely required (list of strings)
3. **nice_to_have_skills**: Skills that are preferred but not required (list of strings)
4. **skill_weights**: Suggested importance weights for each skill (dict: skill -> weight 1-10)
5. **experience_required**: Years of experience mentioned (string like "3-5 years")
6. **education_required**: Education requirements (string)
7. **role_level**: Junior / Mid / Senior / Lead / Principal (string)

Return ONLY valid JSON with these exact keys.

Job Description:
{full_text}
"""
        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )

        try:
            return json.loads(response.text)
        except (json.JSONDecodeError, AttributeError):
            return {
                "required_skills": [],
                "must_have_skills": [],
                "nice_to_have_skills": [],
                "skill_weights": {},
                "experience_required": "Not specified",
                "education_required": "Not specified",
                "role_level": "Mid",
            }

    @staticmethod
    def generate_screening_questions(description: str, skills: List[str], count: int = 5) -> List[Dict[str, Any]]:
        """Auto-generate screening questions from JD and extracted skills."""
        prompt = f"""
You are a Senior Technical Interviewer.

Based on this job description and required skills, generate {count} screening questions.

For each question, provide:
- "question_text": The question (string)
- "category": One of Technical / Behavioral / Architecture / Problem-Solving (string)
- "weight": Importance weight 1.0 to 2.0 (float)
- "expected_focus": What the answer should demonstrate (string)

Return ONLY a JSON array of question objects.

Job Description: {description}
Required Skills: {', '.join(skills)}
"""
        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )

        try:
            return json.loads(response.text)
        except (json.JSONDecodeError, AttributeError):
            return [
                {
                    "question_text": f"Describe your experience with {skills[0] if skills else 'this role'}.",
                    "category": "Technical",
                    "weight": 1.5,
                    "expected_focus": "Practical experience and depth",
                }
            ]

    @staticmethod
    def quality_check(description: str, requirements: Optional[str] = None) -> Dict[str, Any]:
        """Run a JD quality check — completeness, clarity, bias in language."""
        full_text = description
        if requirements:
            full_text += f"\n\nRequirements:\n{requirements}"

        prompt = f"""
You are a JD Quality Auditor. Evaluate this Job Description on these criteria:

1. **completeness_score** (0-100): Does it cover role, responsibilities, requirements, benefits?
2. **clarity_score** (0-100): Is it clear, specific, and unambiguous?
3. **bias_score** (0-100): Higher = less biased. Check for gendered language, age bias, etc.
4. **overall_quality_score** (0-100): Weighted average
5. **issues**: List of specific issues found (array of strings)
6. **improvements**: List of specific improvement suggestions (array of strings)
7. **missing_sections**: What's missing from the JD (array of strings)

Return ONLY valid JSON with these exact keys.

Job Description:
{full_text}
"""
        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )

        try:
            return json.loads(response.text)
        except (json.JSONDecodeError, AttributeError):
            return {
                "completeness_score": 50,
                "clarity_score": 50,
                "bias_score": 80,
                "overall_quality_score": 55,
                "issues": ["Could not analyze JD"],
                "improvements": ["Please provide a more detailed JD"],
                "missing_sections": [],
            }
