from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.models import Job, ScreeningQuestion, CandidateApplication, ApplicationStatus, UserRole
from app.schemas.schemas import JobCreate, JobResponse, JobStatusUpdate, JobUpdate, ScreeningQuestionResponse
from app.core.skill_normalizer import SkillNormalizer

from app.core.rbac import get_current_user_optional

router = APIRouter()


def format_salary_display(
    salary_disclosed: bool,
    currency: str,
    min_sal: float,
    max_sal: float,
    salary_type: str,
    explicit_range: str = None
) -> str:
    if not salary_disclosed:
        return "Salary not disclosed"
    curr = currency or "INR"
    if min_sal is not None and max_sal is not None:
        type_str = f" / {salary_type.capitalize()}" if salary_type else ""
        return f"{curr} {min_sal:,.0f} - {max_sal:,.0f}{type_str}"
    if min_sal is not None:
        type_str = f" / {salary_type.capitalize()}" if salary_type else ""
        return f"From {curr} {min_sal:,.0f}{type_str}"
    if max_sal is not None:
        type_str = f" / {salary_type.capitalize()}" if salary_type else ""
        return f"Up to {curr} {max_sal:,.0f}{type_str}"
    if explicit_range and explicit_range != "Salary not disclosed":
        return explicit_range
    return "Salary not disclosed"


def build_job_response(job: Job, db: Session) -> JobResponse:
    apps = db.query(CandidateApplication).filter(CandidateApplication.job_id == job.id).all()
    applicants_count = len(apps)
    shortlisted_count = len([a for a in apps if a.status in (ApplicationStatus.SHORTLISTED, ApplicationStatus.INTERVIEW_SCHEDULED, ApplicationStatus.INTERVIEW_COMPLETED, ApplicationStatus.HR_APPROVED, ApplicationStatus.OFFER_SENT, ApplicationStatus.HIRED)])
    interviews_count = len([a for a in apps if a.status in (ApplicationStatus.INTERVIEW_SCHEDULED, ApplicationStatus.INTERVIEW_COMPLETED)])
    offers_count = len([a for a in apps if a.status in (ApplicationStatus.OFFER_SENT, ApplicationStatus.HIRED)])
    hired_count = len([a for a in apps if a.status == ApplicationStatus.HIRED])

    sq_responses = [
        ScreeningQuestionResponse(
            id=sq.id,
            question_text=sq.question_text,
            category=sq.category or "General",
            weight=sq.weight if sq.weight is not None else 1.0,
            is_required=sq.is_required if sq.is_required is not None else True,
        ) for sq in (job.screening_questions or [])
    ]

    formatted_salary = format_salary_display(
        salary_disclosed=job.salary_disclosed if job.salary_disclosed is not None else True,
        currency=job.currency or "INR",
        min_sal=job.min_salary,
        max_sal=job.max_salary,
        salary_type=job.salary_type or "ANNUAL",
        explicit_range=job.salary_range
    )

    return JobResponse(
        id=job.id,
        title=job.title,
        company=job.company,
        department=job.department or "Engineering",
        description=job.description,
        responsibilities=job.responsibilities,
        requirements=job.requirements,
        required_qualifications=job.required_qualifications,
        preferred_qualifications=job.preferred_qualifications,
        location=job.location,
        work_mode=job.work_mode or "REMOTE",
        employment_type=job.employment_type or "FULL_TIME",
        experience_level=job.experience_level or "MID_LEVEL",
        min_experience=job.min_experience if job.min_experience is not None else 0.0,
        max_experience=job.max_experience if job.max_experience is not None else 5.0,
        salary_disclosed=job.salary_disclosed if job.salary_disclosed is not None else True,
        salary_type=job.salary_type or "ANNUAL",
        currency=job.currency or "INR",
        min_salary=job.min_salary,
        max_salary=job.max_salary,
        salary_range=formatted_salary,
        company_website=job.company_website,
        company_description=job.company_description,
        company_size=job.company_size,
        status=job.status or "OPEN",
        must_have_skills=job.must_have_skills or [],
        nice_to_have_skills=job.nice_to_have_skills or [],
        extracted_skills=job.extracted_skills or [],
        screening_enabled=job.screening_enabled if job.screening_enabled is not None else True,
        education_requirements=job.education_requirements,
        certifications=job.certifications or [],
        resume_required=job.resume_required if job.resume_required is not None else True,
        target_shortlist_count=job.target_shortlist_count or 20,
        shortlist_threshold=job.shortlist_threshold if job.shortlist_threshold is not None else 70.0,
        max_interview_candidates=job.max_interview_candidates or 10,
        auto_shortlist=job.auto_shortlist if job.auto_shortlist is not None else True,
        interview_mode=job.interview_mode,
        interview_duration_minutes=job.interview_duration_minutes or 15,
        technical_topics=job.technical_topics or [],
        behavioral_topics=job.behavioral_topics or [],
        interview_difficulty=job.interview_difficulty or "MEDIUM",
        interview_rubric=job.interview_rubric,
        created_at=job.created_at,
        screening_questions=sq_responses,
        applicants_count=applicants_count,
        shortlisted_count=shortlisted_count,
        interviews_count=interviews_count,
        offers_count=offers_count,
        hired_count=hired_count,
    )


@router.post("/", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job_opening(job_in: JobCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user_optional)):
    """Recruiter Job Creation Wizard: Creates a complete job campaign with custom screening, shortlist, and interview rules."""
    
    # Validations
    if not job_in.title or not job_in.title.strip():
        raise HTTPException(status_code=400, detail="Job title is required.")
    if not job_in.company or not job_in.company.strip():
        raise HTTPException(status_code=400, detail="Company name is required.")
    if not job_in.description or not job_in.description.strip():
        raise HTTPException(status_code=400, detail="Job description is required.")
    if job_in.min_experience is not None and job_in.max_experience is not None:
        if job_in.min_experience > job_in.max_experience:
            raise HTTPException(status_code=400, detail="Minimum experience cannot be greater than maximum experience.")
    if job_in.salary_disclosed and job_in.min_salary is not None and job_in.max_salary is not None:
        if job_in.min_salary > job_in.max_salary:
            raise HTTPException(status_code=400, detail="Minimum salary cannot be greater than maximum salary.")

    # Format salary range string
    formatted_salary = format_salary_display(
        salary_disclosed=job_in.salary_disclosed if job_in.salary_disclosed is not None else True,
        currency=job_in.currency or "INR",
        min_sal=job_in.min_salary,
        max_sal=job_in.max_salary,
        salary_type=job_in.salary_type or "ANNUAL",
        explicit_range=job_in.salary_range
    )

    # Normalize must-have, nice-to-have, and extracted skills
    must_have = list(SkillNormalizer.parse_skill_collection(job_in.must_have_skills or []).values())
    nice_to_have = list(SkillNormalizer.parse_skill_collection(job_in.nice_to_have_skills or []).values())
    extracted = list(SkillNormalizer.parse_skill_collection(job_in.extracted_skills or job_in.must_have_skills or []).values())

    creator_id = current_user.id if current_user else None

    db_job = Job(
        created_by=creator_id,
        title=job_in.title.strip(),
        company=job_in.company.strip(),
        department=job_in.department or "Engineering",
        description=job_in.description.strip(),
        responsibilities=job_in.responsibilities,
        requirements=job_in.requirements,
        required_qualifications=job_in.required_qualifications,
        preferred_qualifications=job_in.preferred_qualifications,
        location=job_in.location or "Remote",
        work_mode=job_in.work_mode or "REMOTE",
        employment_type=job_in.employment_type or "FULL_TIME",
        experience_level=job_in.experience_level or "MID_LEVEL",
        min_experience=job_in.min_experience if job_in.min_experience is not None else 0.0,
        max_experience=job_in.max_experience if job_in.max_experience is not None else 5.0,
        salary_disclosed=job_in.salary_disclosed if job_in.salary_disclosed is not None else True,
        salary_type=job_in.salary_type or "ANNUAL",
        currency=job_in.currency or "INR",
        min_salary=job_in.min_salary,
        max_salary=job_in.max_salary,
        salary_range=formatted_salary,
        company_website=job_in.company_website,
        company_description=job_in.company_description,
        company_size=job_in.company_size,
        status=job_in.status or "OPEN",
        must_have_skills=must_have,
        nice_to_have_skills=nice_to_have,
        extracted_skills=extracted,
        skill_weights=job_in.skill_weights or {},
        jd_quality_score=job_in.jd_quality_score or 85.0,
        screening_enabled=job_in.screening_enabled if job_in.screening_enabled is not None else True,
        education_requirements=job_in.education_requirements,
        certifications=job_in.certifications or [],
        resume_required=job_in.resume_required if job_in.resume_required is not None else True,
        target_shortlist_count=job_in.target_shortlist_count or 20,
        shortlist_threshold=job_in.shortlist_threshold if job_in.shortlist_threshold is not None else 70.0,
        max_interview_candidates=job_in.max_interview_candidates or 10,
        auto_shortlist=job_in.auto_shortlist if job_in.auto_shortlist is not None else True,
        interview_mode=job_in.interview_mode or "WEBRTC",
        interview_duration_minutes=job_in.interview_duration_minutes or 15,
        interview_topics=job_in.interview_topics or [],
        technical_topics=list(SkillNormalizer.parse_skill_collection(job_in.technical_topics or []).values()) if job_in.technical_topics else [],
        behavioral_topics=job_in.behavioral_topics or [],
        interview_difficulty=job_in.interview_difficulty or "MEDIUM",
        interview_rubric=job_in.interview_rubric or {
            "Communication": 25.0,
            "Technical Knowledge": 35.0,
            "Problem Solving": 25.0,
            "Cultural Alignment": 15.0
        }
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)

    # Attach custom screening questions if present
    if job_in.screening_enabled and job_in.screening_questions:
        for q in job_in.screening_questions:
            if q.question_text and q.question_text.strip():
                sq = ScreeningQuestion(
                    job_id=db_job.id,
                    question_text=q.question_text.strip(),
                    category=q.category or "General",
                    weight=q.weight if q.weight is not None else 1.0,
                    is_required=q.is_required if q.is_required is not None else True,
                )
                db.add(sq)
        db.commit()
        db.refresh(db_job)

    return build_job_response(db_job, db)


@router.get("/", response_model=List[JobResponse])
def list_all_jobs(
    skip: int = 0,
    limit: int = 50,
    my_jobs_only: bool = False,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_optional)
):
    """Retrieves jobs. For Candidate portal: returns all open jobs. For Recruiter portal (my_jobs_only=True): returns creator's jobs."""
    query = db.query(Job)
    if my_jobs_only and current_user:
        # In recruiter portal: if the user is a recruiter or admin, allow viewing all active workspace requisitions
        if current_user.role not in (UserRole.RECRUITER, UserRole.ADMIN):
            query = query.filter(Job.created_by == current_user.id)

    jobs = query.order_by(Job.created_at.desc()).offset(skip).limit(limit).all()
    return [build_job_response(j, db) for j in jobs]


@router.get("/{job_id}", response_model=JobResponse)
def get_job_by_id(job_id: int, db: Session = Depends(get_db)):
    """Retrieves single job details along with required screening questions."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job opening not found")
    return build_job_response(job, db)


@router.patch("/{job_id}/status", response_model=JobResponse)
def update_job_status(job_id: int, payload: JobStatusUpdate, db: Session = Depends(get_db)):
    """Updates job requisition lifecycle status (OPEN, DRAFT, CLOSED, ARCHIVED, etc.)."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job opening not found")
    job.status = payload.status
    db.commit()
    db.refresh(job)
    return build_job_response(job, db)


@router.put("/{job_id}", response_model=JobResponse)
def update_job(job_id: int, payload: JobUpdate, db: Session = Depends(get_db)):
    """Edits an existing job requisition."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job opening not found")
    
    # Validations on update
    new_min_exp = payload.min_experience if payload.min_experience is not None else job.min_experience
    new_max_exp = payload.max_experience if payload.max_experience is not None else job.max_experience
    if new_min_exp is not None and new_max_exp is not None and new_min_exp > new_max_exp:
        raise HTTPException(status_code=400, detail="Minimum experience cannot be greater than maximum experience.")

    new_disclosed = payload.salary_disclosed if payload.salary_disclosed is not None else job.salary_disclosed
    new_min_sal = payload.min_salary if payload.min_salary is not None else job.min_salary
    new_max_sal = payload.max_salary if payload.max_salary is not None else job.max_salary
    if new_disclosed and new_min_sal is not None and new_max_sal is not None and new_min_sal > new_max_sal:
        raise HTTPException(status_code=400, detail="Minimum salary cannot be greater than maximum salary.")

    for field, val in payload.model_dump(exclude_unset=True).items():
        if field in ["must_have_skills", "nice_to_have_skills", "extracted_skills", "technical_topics"] and val:
            val = list(SkillNormalizer.parse_skill_collection(val).values())
        setattr(job, field, val)

    # Re-calculate formatted salary range
    job.salary_range = format_salary_display(
        salary_disclosed=job.salary_disclosed if job.salary_disclosed is not None else True,
        currency=job.currency or "INR",
        min_sal=job.min_salary,
        max_sal=job.max_salary,
        salary_type=job.salary_type or "ANNUAL",
        explicit_range=job.salary_range
    )

    db.commit()
    db.refresh(job)
    return build_job_response(job, db)