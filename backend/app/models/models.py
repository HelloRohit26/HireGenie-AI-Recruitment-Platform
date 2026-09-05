import enum
from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Enum as SQLEnum,
    JSON,
)
from sqlalchemy.orm import relationship
from app.db.base import Base


class InterviewMode(str, enum.Enum):
    WEBRTC = "WEBRTC"
    TELEPHONIC_TWILIO = "TELEPHONIC_TWILIO"


class ApplicationStatus(str, enum.Enum):
    RECEIVED = "RECEIVED"
    PARSING = "PARSING"
    MATCHING = "MATCHING"
    RANKING = "RANKING"
    APPLIED = "APPLIED"
    SCREENING = "SCREENING"
    SHORTLISTED = "SHORTLISTED"
    REJECTED = "REJECTED"
    INTERVIEW_INVITED = "INTERVIEW_INVITED"
    INTERVIEW_SCHEDULED = "INTERVIEW_SCHEDULED"
    INTERVIEWING = "INTERVIEWING"
    INTERVIEW_COMPLETED = "INTERVIEW_COMPLETED"
    EVALUATED = "EVALUATED"
    HR_APPROVED = "HR_APPROVED"
    OFFER_SENT = "OFFER_SENT"
    OFFERED = "OFFERED"
    OFFER_DECLINED = "OFFER_DECLINED"
    HIRED = "HIRED"
    FAILED = "FAILED"


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    RECRUITER = "RECRUITER"
    CANDIDATE = "CANDIDATE"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.CANDIDATE)
    is_active = Column(Boolean, default=True)
    phone = Column(String(20), nullable=True)
    last_login = Column(DateTime, nullable=True)
    password_changed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    jobs = relationship("Job", back_populates="creator")
    applications = relationship("CandidateApplication", back_populates="candidate")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=False)
    department = Column(String(100), default="Engineering", nullable=False)
    description = Column(Text, nullable=False)
    responsibilities = Column(Text, nullable=True)
    requirements = Column(Text, nullable=True)
    required_qualifications = Column(Text, nullable=True)
    preferred_qualifications = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    work_mode = Column(String(50), default="REMOTE", nullable=False)
    employment_type = Column(String(50), default="FULL_TIME", nullable=False)
    experience_level = Column(String(50), default="MID_LEVEL", nullable=False)
    min_experience = Column(Float, default=0.0, nullable=False)
    max_experience = Column(Float, default=5.0, nullable=False)
    
    # Salary fields
    salary_range = Column(String(100), nullable=True)
    salary_disclosed = Column(Boolean, default=True, nullable=False)
    salary_type = Column(String(50), default="ANNUAL", nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    min_salary = Column(Float, nullable=True)
    max_salary = Column(Float, nullable=True)

    # Company info
    company_website = Column(String(255), nullable=True)
    company_description = Column(Text, nullable=True)
    company_size = Column(String(50), nullable=True)

    # Status: DRAFT, OPEN, CLOSED, ARCHIVED
    status = Column(String(50), default="OPEN", nullable=False)
    
    # JD Intelligence & Skills
    extracted_skills = Column(JSON, nullable=True)
    must_have_skills = Column(JSON, nullable=True)
    nice_to_have_skills = Column(JSON, nullable=True)
    skill_weights = Column(JSON, nullable=True)
    jd_quality_score = Column(Float, nullable=True)
    
    # Screening configuration
    screening_enabled = Column(Boolean, default=True, nullable=False)
    education_requirements = Column(String(100), nullable=True)
    certifications = Column(JSON, nullable=True)
    resume_required = Column(Boolean, default=True, nullable=False)
    
    # Shortlist configuration
    target_shortlist_count = Column(Integer, default=20, nullable=False)
    shortlist_threshold = Column(Float, default=70.0, nullable=False)
    max_interview_candidates = Column(Integer, default=10, nullable=False)
    auto_shortlist = Column(Boolean, default=True, nullable=False)
    
    # Interview configuration
    interview_mode = Column(SQLEnum(InterviewMode), default=InterviewMode.WEBRTC)
    interview_duration_minutes = Column(Integer, default=15, nullable=False)
    interview_topics = Column(JSON, nullable=True)
    technical_topics = Column(JSON, nullable=True)
    behavioral_topics = Column(JSON, nullable=True)
    interview_difficulty = Column(String(50), default="MEDIUM", nullable=False)
    interview_rubric = Column(JSON, nullable=True)
    
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    @property
    def creator_id(self):
        return self.created_by

    @creator_id.setter
    def creator_id(self, value):
        self.created_by = value

    # Relationships
    creator = relationship("User", back_populates="jobs")
    screening_questions = relationship("ScreeningQuestion", back_populates="job", cascade="all, delete-orphan")
    applications = relationship("CandidateApplication", back_populates="job", cascade="all, delete-orphan")


class ScreeningQuestion(Base):
    __tablename__ = "screening_questions"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    category = Column(String(100), nullable=True)
    weight = Column(Float, default=1.0)
    is_required = Column(Boolean, default=True, nullable=False)

    # Relationships
    job = relationship("Job", back_populates="screening_questions")
    answers = relationship("ScreeningAnswer", back_populates="question", cascade="all, delete-orphan")


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    file_path = Column(String(512), nullable=False)
    raw_text = Column(Text, nullable=True)
    parsed_skills = Column(JSON, nullable=True)
    parsed_experience_years = Column(Float, default=0.0)
    vector_id = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    applications = relationship("CandidateApplication", back_populates="resume")


class CandidateApplication(Base):
    __tablename__ = "candidate_applications"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=True)
    
    status = Column(SQLEnum(ApplicationStatus), default=ApplicationStatus.APPLIED)
    overall_match_score = Column(Float, nullable=True)
    score_breakdown = Column(JSON, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    rank = Column(Integer, nullable=True)
    magic_token = Column(String(255), unique=True, nullable=True)
    
    applied_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    candidate = relationship("User", back_populates="applications")
    job = relationship("Job", back_populates="applications")
    resume = relationship("Resume", back_populates="applications")
    screening_answers = relationship("ScreeningAnswer", back_populates="application", cascade="all, delete-orphan")
    interviews = relationship("Interview", back_populates="application", cascade="all, delete-orphan")
    telemetry = relationship("AgentTelemetry", back_populates="application", cascade="all, delete-orphan")


class AgentTelemetry(Base):
    __tablename__ = "agent_telemetry"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("candidate_applications.id"), nullable=False, index=True)
    agent_name = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    duration_ms = Column(Float, nullable=True)
    error_message = Column(Text, nullable=True)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    application = relationship("CandidateApplication", back_populates="telemetry")


class ScreeningAnswer(Base):
    __tablename__ = "screening_answers"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("candidate_applications.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("screening_questions.id"), nullable=False)
    answer_text = Column(Text, nullable=False)
    ai_score = Column(Float, nullable=True)
    ai_feedback = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    application = relationship("CandidateApplication", back_populates="screening_answers")
    question = relationship("ScreeningQuestion", back_populates="answers")


class InvitationStatus(str, enum.Enum):
    NOT_INVITED = "NOT_INVITED"
    INVITATION_QUEUED = "INVITATION_QUEUED"
    INVITED = "INVITED"
    VIEWED = "VIEWED"
    ACCEPTED = "ACCEPTED"
    DECLINED = "DECLINED"
    EXPIRED = "EXPIRED"
    READY = "READY"


class InterviewInvitation(Base):
    __tablename__ = "interview_invitations"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("candidate_applications.id"), nullable=False, index=True)
    candidate_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False, index=True)
    
    invitation_token = Column(String(255), unique=True, nullable=False, index=True)
    status = Column(SQLEnum(InvitationStatus), default=InvitationStatus.INVITED, nullable=False)
    interview_mode = Column(String(50), default="WEBRTC")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    viewed_at = Column(DateTime, nullable=True)
    accepted_at = Column(DateTime, nullable=True)
    declined_at = Column(DateTime, nullable=True)
    scheduled_at = Column(DateTime, nullable=True)

    # Relationships
    application = relationship("CandidateApplication", backref="invitations")
    candidate = relationship("User")
    job = relationship("Job")


class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("candidate_applications.id"), nullable=False)
    interview_mode = Column(SQLEnum(InterviewMode), nullable=False)
    status = Column(String(50), default="SCHEDULED")
    
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, default=0)
    
    audio_url = Column(String(512), nullable=True)
    transcript = Column(JSON, nullable=True)
    evaluation_data = Column(JSON, nullable=True)
    overall_score = Column(Float, nullable=True)
    code_submissions = Column(JSON, nullable=True)
    proctoring_data = Column(JSON, nullable=True)
    integrity_score = Column(Float, default=100.0)

    # Relationships
    application = relationship("CandidateApplication", back_populates="interviews")


class SessionStatus(str, enum.Enum):
    READY = "READY"
    CONNECTING = "CONNECTING"
    CONNECTED = "CONNECTED"
    IN_PROGRESS = "IN_PROGRESS"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    invitation_id = Column(Integer, ForeignKey("interview_invitations.id"), nullable=False, index=True)
    application_id = Column(Integer, ForeignKey("candidate_applications.id"), nullable=False, index=True)
    candidate_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False, index=True)
    
    session_token = Column(String(255), unique=True, nullable=False, index=True)
    status = Column(SQLEnum(SessionStatus), default=SessionStatus.READY, nullable=False)
    
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    max_duration_seconds = Column(Integer, default=900)  # 15 minutes = 900 seconds
    elapsed_seconds = Column(Integer, default=0)
    
    current_question_index = Column(Integer, default=0)
    transcript = Column(JSON, nullable=True)
    audio_recording_url = Column(String(512), nullable=True)
    code_submissions = Column(JSON, nullable=True)
    proctoring_data = Column(JSON, nullable=True)
    integrity_score = Column(Float, default=100.0)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    invitation = relationship("InterviewInvitation", backref="sessions")
    application = relationship("CandidateApplication")
    candidate = relationship("User")
    job = relationship("Job")


class EvaluationStatus(str, enum.Enum):
    PENDING = "PENDING"
    ANALYZING = "ANALYZING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class EvaluationRecommendation(str, enum.Enum):
    STRONG_HIRE = "STRONG_HIRE"
    HIRE = "HIRE"
    CONSIDER = "CONSIDER"
    NO_HIRE = "NO_HIRE"


class InterviewEvaluation(Base):
    __tablename__ = "interview_evaluations"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("candidate_applications.id"), nullable=False, index=True)
    candidate_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False, index=True)
    interview_session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False, index=True)

    status = Column(SQLEnum(EvaluationStatus), default=EvaluationStatus.PENDING, nullable=False)

    technical_score = Column(Float, nullable=True)
    problem_solving_score = Column(Float, nullable=True)
    communication_score = Column(Float, nullable=True)
    role_fit_score = Column(Float, nullable=True)
    overall_score = Column(Float, nullable=True)

    recommendation = Column(SQLEnum(EvaluationRecommendation), nullable=True)
    strengths = Column(JSON, nullable=True)
    gaps = Column(JSON, nullable=True)
    evidence = Column(JSON, nullable=True)
    explanation = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    application = relationship("CandidateApplication", backref="evaluations")
    candidate = relationship("User")
    job = relationship("Job")
    session = relationship("InterviewSession", backref="evaluations")


class OfferStatus(str, enum.Enum):
    OFFERED = "OFFERED"
    OFFER_ACCEPTED = "OFFER_ACCEPTED"
    OFFER_DECLINED = "OFFER_DECLINED"


class HiringDecision(Base):
    __tablename__ = "hiring_decisions"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("candidate_applications.id"), nullable=False, index=True)
    candidate_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False, index=True)

    decision = Column(String(20), nullable=False)  # "HIRED" or "REJECTED"
    decided_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # recruiter user_id
    decided_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    reason = Column(Text, nullable=True)

    # Relationships
    application = relationship("CandidateApplication", backref="hiring_decisions")
    candidate = relationship("User", foreign_keys=[candidate_id])
    job = relationship("Job")


class JobOffer(Base):
    __tablename__ = "job_offers"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("candidate_applications.id"), nullable=False, unique=True, index=True)
    candidate_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False, index=True)

    offer_token = Column(String(255), unique=True, nullable=False, index=True)
    status = Column(SQLEnum(OfferStatus), default=OfferStatus.OFFERED, nullable=False)

    compensation = Column(String(255), nullable=True)
    role_title = Column(String(255), nullable=False)
    company_name = Column(String(255), nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    accepted_at = Column(DateTime, nullable=True)
    declined_at = Column(DateTime, nullable=True)
    decline_reason = Column(Text, nullable=True)

    # Relationships
    application = relationship("CandidateApplication", backref="offers")
    candidate = relationship("User", foreign_keys=[candidate_id])
    job = relationship("Job")
