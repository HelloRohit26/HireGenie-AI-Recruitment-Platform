from app.schemas.base import BaseSchema, TimestampSchema


class JobCreate(BaseSchema):
    title: str
    company: str
    description: str
    salary_disclosed: bool | None = True
    salary_type: str | None = "ANNUAL"
    currency: str | None = "INR"
    min_salary: float | None = None
    max_salary: float | None = None
    salary_range: str | None = None


class JobResponse(TimestampSchema):
    id: int
    title: str
    company: str
    description: str
    status: str
    salary_disclosed: bool | None = True
    salary_type: str | None = "ANNUAL"
    currency: str | None = "INR"
    min_salary: float | None = None
    max_salary: float | None = None
    salary_range: str | None = None


class JobData(BaseSchema):
    required_skills: list[str] = []
    optional_skills: list[str] = []

    experience: str | None = None
    education: str | None = None

    job_type: str | None = None

    location: str | None = None