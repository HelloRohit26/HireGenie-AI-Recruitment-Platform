"""JD Intelligence API — AI-powered Job Description analysis."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from app.db.session import get_db
from app.services.jd_intelligence_service import JDIntelligenceService
from app.models.models import Job

router = APIRouter()


class JDAnalyzeRequest(BaseModel):
    description: str
    requirements: Optional[str] = None


class JDQualityCheckRequest(BaseModel):
    description: str
    requirements: Optional[str] = None


class JDGenerateQuestionsRequest(BaseModel):
    description: str
    skills: List[str] = []
    count: int = 5


@router.post("/analyze")
def analyze_jd(payload: JDAnalyzeRequest):
    """Analyze a job description — extract skills, separate must-have vs nice-to-have."""
    result = JDIntelligenceService.analyze_jd(payload.description, payload.requirements)
    return {"analysis": result}


@router.post("/generate-questions")
def generate_screening_questions(payload: JDGenerateQuestionsRequest):
    """Auto-generate screening questions from JD and skills."""
    questions = JDIntelligenceService.generate_screening_questions(
        payload.description, payload.skills, payload.count
    )
    return {"questions": questions}


@router.post("/quality-check")
def quality_check_jd(payload: JDQualityCheckRequest):
    """Run a JD quality check — completeness, clarity, bias in language."""
    result = JDIntelligenceService.quality_check(payload.description, payload.requirements)
    return {"quality": result}


@router.post("/analyze-and-save/{job_id}")
def analyze_and_save_to_job(job_id: int, db: Session = Depends(get_db)):
    """Analyze JD for an existing job and save extracted data back to the job record."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    analysis = JDIntelligenceService.analyze_jd(job.description, job.requirements)

    # Save to job model
    job.extracted_skills = analysis.get("required_skills", [])
    job.must_have_skills = analysis.get("must_have_skills", [])
    job.nice_to_have_skills = analysis.get("nice_to_have_skills", [])
    job.skill_weights = analysis.get("skill_weights", {})

    quality = JDIntelligenceService.quality_check(job.description, job.requirements)
    job.jd_quality_score = quality.get("overall_quality_score", 0)

    db.commit()

    return {
        "job_id": job_id,
        "analysis": analysis,
        "quality": quality,
        "saved": True,
    }
