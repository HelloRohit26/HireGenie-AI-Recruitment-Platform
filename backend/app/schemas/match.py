from pydantic import BaseModel


class MatchResult(BaseModel):

    matched_skills: list[str] = []

    missing_skills: list[str] = []

    strengths: list[str] = []

    weaknesses: list[str] = []

    reasoning: str