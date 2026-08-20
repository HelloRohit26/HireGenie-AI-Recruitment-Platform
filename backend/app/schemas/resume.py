from typing import List, Optional, Any, Dict
from pydantic import BaseModel, EmailStr


class ExperienceEntry(BaseModel):
    company: str = ""
    role: str = ""
    start_date: str = ""
    end_date: str = ""
    duration_months: int = 0
    employment_type: str = "FULL_TIME"  # FULL_TIME, INTERNSHIP, CONTRACT, SIMULATION, PROJECT
    description: str = ""


class EducationEntry(BaseModel):
    institution: str = ""
    degree: str = ""
    field_of_study: str = ""
    start_date: str = ""
    end_date: str = ""
    grade: str = ""


class ProjectEntry(BaseModel):
    title: str = ""
    description: str = ""
    technologies: List[str] = []
    github_link: Optional[str] = None


class ResumeData(BaseModel):
    # Basic Info
    full_name: str = ""
    email: Optional[str] = None
    phone: Optional[str] = None

    # Professional & Experience
    skills: List[str] = []
    experience: List[Any] = []
    experience_years: float = 0.0
    education: List[Any] = []

    # Career & Projects
    projects: List[Any] = []
    certifications: List[str] = []

    # Profiles & Links
    github: Optional[str] = None
    linkedin: Optional[str] = None
    portfolio: Optional[str] = None

    # Extras
    achievements: List[str] = []
    raw_text: Optional[str] = None