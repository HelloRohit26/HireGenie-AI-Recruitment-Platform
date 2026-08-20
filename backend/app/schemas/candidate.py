from pydantic import BaseModel, EmailStr


class CandidateProfile(BaseModel):

    full_name: str

    email: EmailStr | None = None

    phone: str | None = None

    skills: list[str] = []

    experience_years: float = 0

    highest_education: str | None = None

    project_count: int = 0

    certification_count: int = 0

    github: str | None = None

    linkedin: str | None = None