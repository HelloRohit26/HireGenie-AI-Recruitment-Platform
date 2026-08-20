import re
from pydantic import BaseModel, EmailStr, model_validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.models.models import InterviewMode, ApplicationStatus, UserRole


def _camel_to_snake(s: str) -> str:
    return re.sub(r'(?<!^)(?=[A-Z])', '_', s).lower()


# --- User Schemas ---
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.CANDIDATE


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: UserRole

    class Config:
        from_attributes = True


# --- Screening Question Schemas ---
class ScreeningQuestionCreate(BaseModel):
    question_text: str
    category: Optional[str] = "General"
    weight: Optional[float] = 1.0
    is_required: Optional[bool] = True


class ScreeningQuestionResponse(ScreeningQuestionCreate):
    id: int

    class Config:
        from_attributes = True


# --- Job Schemas ---
class JobCreate(BaseModel):
    title: str
    company: str
    department: Optional[str] = "Engineering"
    description: str
    responsibilities: Optional[str] = None
    requirements: Optional[str] = None
    required_qualifications: Optional[str] = None
    preferred_qualifications: Optional[str] = None
    location: Optional[str] = None
    work_mode: Optional[str] = "REMOTE"
    employment_type: Optional[str] = "FULL_TIME"
    experience_level: Optional[str] = "MID_LEVEL"
    min_experience: Optional[float] = 0.0
    max_experience: Optional[float] = 5.0
    
    # Salary fields
    salary_disclosed: Optional[bool] = True
    salary_type: Optional[str] = "ANNUAL"
    currency: Optional[str] = "INR"
    min_salary: Optional[float] = None
    max_salary: Optional[float] = None
    salary_range: Optional[str] = None

    # Company info
    company_website: Optional[str] = None
    company_description: Optional[str] = None
    company_size: Optional[str] = None

    # Status: DRAFT, OPEN, CLOSED, ARCHIVED
    status: Optional[str] = "OPEN"
    
    # Skills
    must_have_skills: Optional[List[str]] = []
    nice_to_have_skills: Optional[List[str]] = []
    extracted_skills: Optional[List[str]] = []
    skill_weights: Optional[Dict[str, float]] = {}
    jd_quality_score: Optional[float] = None

    # Screening
    screening_enabled: Optional[bool] = True
    education_requirements: Optional[str] = None
    certifications: Optional[List[str]] = []
    resume_required: Optional[bool] = True
    screening_questions: Optional[List[ScreeningQuestionCreate]] = []

    # Shortlisting
    target_shortlist_count: Optional[int] = 20
    shortlist_threshold: Optional[float] = 70.0
    max_interview_candidates: Optional[int] = 10
    auto_shortlist: Optional[bool] = True

    # Interview
    interview_mode: Optional[InterviewMode] = InterviewMode.WEBRTC
    interview_duration_minutes: Optional[int] = 15
    interview_topics: Optional[List[str]] = []
    technical_topics: Optional[List[str]] = []
    behavioral_topics: Optional[List[str]] = []
    interview_difficulty: Optional[str] = "MEDIUM"
    interview_rubric: Optional[Dict[str, float]] = None

    @model_validator(mode='before')
    @classmethod
    def normalize_keys(cls, data: Any) -> Any:
        if isinstance(data, dict):
            new_data = {}
            for k, v in data.items():
                snake_k = _camel_to_snake(k)
                if snake_k not in new_data or new_data[snake_k] is None:
                    new_data[snake_k] = v
            return new_data
        return data


class JobStatusUpdate(BaseModel):
    status: str


class JobUpdate(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    department: Optional[str] = None
    description: Optional[str] = None
    responsibilities: Optional[str] = None
    requirements: Optional[str] = None
    required_qualifications: Optional[str] = None
    preferred_qualifications: Optional[str] = None
    location: Optional[str] = None
    work_mode: Optional[str] = None
    employment_type: Optional[str] = None
    experience_level: Optional[str] = None
    min_experience: Optional[float] = None
    max_experience: Optional[float] = None
    salary_disclosed: Optional[bool] = None
    salary_type: Optional[str] = None
    currency: Optional[str] = None
    min_salary: Optional[float] = None
    max_salary: Optional[float] = None
    salary_range: Optional[str] = None
    company_website: Optional[str] = None
    company_description: Optional[str] = None
    company_size: Optional[str] = None
    status: Optional[str] = None
    must_have_skills: Optional[List[str]] = None
    nice_to_have_skills: Optional[List[str]] = None
    screening_enabled: Optional[bool] = None
    education_requirements: Optional[str] = None
    certifications: Optional[List[str]] = None
    resume_required: Optional[bool] = None
    target_shortlist_count: Optional[int] = None
    shortlist_threshold: Optional[float] = None
    max_interview_candidates: Optional[int] = None
    auto_shortlist: Optional[bool] = None
    interview_mode: Optional[InterviewMode] = None
    interview_duration_minutes: Optional[int] = None
    technical_topics: Optional[List[str]] = None
    behavioral_topics: Optional[List[str]] = None
    interview_difficulty: Optional[str] = None
    interview_rubric: Optional[Dict[str, float]] = None

    @model_validator(mode='before')
    @classmethod
    def normalize_keys(cls, data: Any) -> Any:
        if isinstance(data, dict):
            new_data = {}
            for k, v in data.items():
                snake_k = _camel_to_snake(k)
                if snake_k not in new_data or new_data[snake_k] is None:
                    new_data[snake_k] = v
            return new_data
        return data


class JobResponse(BaseModel):
    id: int
    title: str
    company: str
    department: str = "Engineering"
    description: str
    responsibilities: Optional[str] = None
    requirements: Optional[str] = None
    required_qualifications: Optional[str] = None
    preferred_qualifications: Optional[str] = None
    location: Optional[str] = None
    work_mode: str = "REMOTE"
    employment_type: str = "FULL_TIME"
    experience_level: str = "MID_LEVEL"
    min_experience: float = 0.0
    max_experience: float = 5.0
    salary_disclosed: bool = True
    salary_type: str = "ANNUAL"
    currency: str = "INR"
    min_salary: Optional[float] = None
    max_salary: Optional[float] = None
    salary_range: Optional[str] = None
    company_website: Optional[str] = None
    company_description: Optional[str] = None
    company_size: Optional[str] = None
    status: str = "OPEN"
    must_have_skills: Optional[List[str]] = []
    nice_to_have_skills: Optional[List[str]] = []
    extracted_skills: Optional[List[str]] = []
    screening_enabled: bool = True
    education_requirements: Optional[str] = None
    certifications: Optional[List[str]] = []
    resume_required: bool = True
    target_shortlist_count: int = 20
    shortlist_threshold: float = 70.0
    max_interview_candidates: int = 10
    auto_shortlist: bool = True
    interview_mode: InterviewMode = InterviewMode.WEBRTC
    interview_duration_minutes: int = 15
    technical_topics: Optional[List[str]] = []
    behavioral_topics: Optional[List[str]] = []
    interview_difficulty: str = "MEDIUM"
    interview_rubric: Optional[Dict[str, float]] = None
    created_at: datetime
    screening_questions: List[ScreeningQuestionResponse] = []
    applicants_count: int = 0
    shortlisted_count: int = 0
    interviews_count: int = 0
    offers_count: int = 0
    hired_count: int = 0

    class Config:
        from_attributes = True


# --- Application & Screening Answer Schemas ---
class ScreeningAnswerSubmit(BaseModel):
    question_id: int
    answer_text: str


class ApplicationSubmit(BaseModel):
    job_id: int
    candidate_id: Optional[int] = 1
    resume_id: Optional[int] = None
    cover_note: Optional[str] = None
    answers: List[ScreeningAnswerSubmit] = []


class ApplicationStatusResponse(BaseModel):
    id: int
    job_id: int
    candidate_id: int
    status: ApplicationStatus
    overall_match_score: Optional[float] = None
    rank: Optional[int] = None
    magic_token: Optional[str] = None
    applied_at: datetime
    job: Optional[JobResponse] = None

    class Config:
        from_attributes = True


# --- Mass Screening Request Schema ---
class MassScreeningRequest(BaseModel):
    job_id: int
    min_score_threshold: Optional[float] = 60.0
    override_top_n: Optional[int] = None