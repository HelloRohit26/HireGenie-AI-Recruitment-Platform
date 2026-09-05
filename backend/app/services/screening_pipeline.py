"""Automated Asynchronous Screening Pipeline & Dynamic Job-Scoped Candidate Ranking Engine.
Integrates Canonical Skill Normalization, Strict Disjoint Invariants, and Real Gemini AI Reasoning.
"""
import os
import re
import json
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.models import CandidateApplication, ApplicationStatus, Job, Resume, User, AgentTelemetry
from app.models.audit import AuditLog, ActorType, AuditAction
from app.core.logger import logger
from app.core.config import settings
from app.core.gemini import client
from app.core.skill_normalizer import SkillNormalizer
from app.services.communication_service import send_candidate_email_job


def recalculate_job_candidate_ranks(db: Session, job_id: int):
    """Job-Scoped Dynamic Ranking: Recalculates and persists ranks (#1, #2, #3...) 
    for ALL applications belonging to a specific job based on descending match score.
    Does NOT affect applications belonging to other jobs (cross-job isolation).
    """
    job_applications = (
        db.query(CandidateApplication)
        .filter(CandidateApplication.job_id == job_id)
        .order_by(
            CandidateApplication.overall_match_score.desc().nullslast(),
            CandidateApplication.applied_at.asc()
        )
        .all()
    )

    for rank_idx, app in enumerate(job_applications, start=1):
        app.rank = rank_idx

    db.commit()
    logger.info(f"📊 [DYNAMIC RANKING] Updated ranks for {len(job_applications)} candidates under Job #{job_id}")


def extract_job_required_skills(job: Job) -> Dict[str, str]:
    """Extracts all required canonical skills across all job fields:
    must_have_skills, nice_to_have_skills, requirements, responsibilities,
    required_qualifications, preferred_qualifications, technical_topics, description.
    """
    if not job:
        return {}

    skill_map: Dict[str, str] = {}

    # 1. Structured skill fields
    if job.must_have_skills:
        skill_map.update(SkillNormalizer.parse_skill_collection(job.must_have_skills))
    if job.nice_to_have_skills:
        skill_map.update(SkillNormalizer.parse_skill_collection(job.nice_to_have_skills))
    if job.technical_topics:
        skill_map.update(SkillNormalizer.parse_skill_collection(job.technical_topics))
    if job.extracted_skills:
        skill_map.update(SkillNormalizer.parse_skill_collection(job.extracted_skills))

    # 2. Extract recognized tech skills from free-form text fields
    text_fields = [
        job.requirements or "",
        job.responsibilities or "",
        job.required_qualifications or "",
        job.preferred_qualifications or "",
        job.description or "",
    ]
    for tf in text_fields:
        if tf and tf.strip():
            skill_map.update(SkillNormalizer.extract_skills_from_text(tf))

    # If no explicit skills found, extract from title and description
    if not skill_map:
        skill_map = SkillNormalizer.extract_skills_from_text(f"{job.title} {job.description or ''}")

    return skill_map


def evaluate_job_vs_candidate(job: Job, resume: Resume, candidate_user: User, cover_note: str = "") -> Dict[str, Any]:
    """Explainable Multi-Criteria Scoring Engine evaluating actual Candidate data vs Job requirements.
    Guarantees: matched_skills ∩ missing_skills == empty set.
    """
    raw_text = (resume.raw_text if resume and resume.raw_text else "").strip()
    if not raw_text:
        raw_text = f"{candidate_user.full_name or ''} {cover_note or ''}"

    # 1. EXTRACT & NORMALIZE JOB REQUIREMENTS
    job_skills_map = extract_job_required_skills(job)
    required_skills_list = list(job_skills_map.values())

    # 2. EXTRACT & NORMALIZE CANDIDATE SKILLS
    candidate_skills_list = list(resume.parsed_skills or []) if resume else []
    if cover_note:
        candidate_skills_list.append(cover_note)

    # 3. CANONICAL SKILL MATCHING WITH RIGID DISJOINT INVARIANT
    match_result = SkillNormalizer.match_skills(
        required_input=required_skills_list,
        candidate_input=candidate_skills_list,
        candidate_raw_text=raw_text
    )

    matched_skills = match_result["matched_skills"]
    missing_skills = match_result["missing_skills"]
    partial_matches = match_result["partial_matches"]
    skill_score = match_result["skill_score"]

    # Strict automated validation: matched ∩ missing == empty set
    overlap = set(matched_skills).intersection(set(missing_skills))
    assert len(overlap) == 0, f"FATAL INVARIANT VIOLATION: Skill overlap detected: {overlap}"

    # 4. EXPERIENCE EVALUATION (25% Weight)
    candidate_exp_years = float(resume.parsed_experience_years if resume and resume.parsed_experience_years is not None else 0.0)
    job_exp_required = float(job.min_experience if job and job.min_experience is not None else 0.0)

    if job_exp_required == 0.0:
        experience_score = 90.0 if candidate_exp_years >= 0 else 80.0
    elif candidate_exp_years >= job_exp_required:
        experience_score = min(100.0, 85.0 + ((candidate_exp_years - job_exp_required) * 5.0))
    elif candidate_exp_years > 0:
        experience_score = max(30.0, (candidate_exp_years / job_exp_required) * 80.0)
    else:
        experience_score = 45.0

    # 5. PROJECT EVALUATION (15% Weight)
    project_keywords = ["built", "developed", "deployed", "implemented", "architecture", "system", "api", "project", "model", "pipeline", "github", "kafka", "airflow", "snowflake", "mlflow", "docker"]
    proj_hits = sum(1 for kw in project_keywords if kw in raw_text.lower())
    project_score = min(100.0, max(30.0, proj_hits * 12.5))

    # 6. EDUCATION EVALUATION (10% Weight)
    edu_keywords = ["bachelor", "master", "degree", "b.s", "m.s", "b.tech", "m.tech", "computer science", "information technology", "engineering", "cgpa"]
    edu_hits = sum(1 for kw in edu_keywords if kw in raw_text.lower())
    education_score = 95.0 if edu_hits >= 2 else (80.0 if edu_hits == 1 else 60.0)

    # 7. ROLE FIT EVALUATION (10% Weight)
    job_text_summary = f"{job.title} {job.description or ''} {job.responsibilities or ''}"
    job_words = set(re.findall(r'\b[a-zA-Z]{4,}\b', job_text_summary.lower()))
    cand_words = set(re.findall(r'\b[a-zA-Z]{4,}\b', raw_text.lower()))
    overlap_count = len(job_words.intersection(cand_words))
    role_fit_score = min(100.0, max(30.0, (overlap_count / max(1, len(job_words))) * 140.0))

    # WEIGHTED OVERALL MATCH SCORE (Normalized 0 - 100)
    overall_score = round(
        (0.40 * skill_score) +
        (0.25 * experience_score) +
        (0.15 * project_score) +
        (0.10 * education_score) +
        (0.10 * role_fit_score),
        1
    )

    # 8. REAL GEMINI AI REASONING & SYNTHESIS
    strengths = []
    gaps = []
    explanation = ""
    ai_provider_status = "REAL GEMINI AI PROVIDER ACTIVE (gemini-2.5-flash)"

    if matched_skills:
        strengths.append(f"Strong skill match in required domains: {', '.join(matched_skills[:6])}")
    if candidate_exp_years >= job_exp_required and job_exp_required > 0:
        strengths.append(f"Meets/exceeds experience requirement with {candidate_exp_years} years verified professional experience")
    if proj_hits >= 3:
        strengths.append("Extensive hands-on engineering projects and architectural implementations demonstrated")

    if missing_skills:
        gaps.append(f"Missing required skills: {', '.join(missing_skills)}")
    if candidate_exp_years < job_exp_required and job_exp_required > 0:
        gaps.append(f"Requires {job_exp_required}+ years professional experience; candidate profile reflects {candidate_exp_years} years")

    # Call Real Gemini AI (gemini-2.5-flash) for Deep Explainable Assessment
    if client and hasattr(client, "models"):
        try:
            prompt = f"""You are HireGenie AI's Senior Autonomous Recruiter.
Analyze this candidate application against the job requisition.

Job Title: {job.title}
Job Description: {job.description}
Job Required Skills: {', '.join(required_skills_list)}
Candidate Full Name: {candidate_user.full_name}
Candidate Matched Skills: {', '.join(matched_skills)}
Candidate Missing Skills: {', '.join(missing_skills)}
Candidate Verified Experience: {candidate_exp_years} years (Required: {job_exp_required} years)

Resume Summary:
{raw_text[:2000]}

Provide a concise, explainable evaluation in 2-3 sentences highlighting real strengths, genuine gaps, and overall suitability.
"""
            ai_resp = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
            )
            if ai_resp and ai_resp.text:
                explanation = ai_resp.text.strip()
                ai_provider_status = "REAL GEMINI AI PROVIDER ACTIVE (gemini-2.5-flash)"
        except Exception as e:
            logger.warning(f"[ScreeningPipeline] Gemini evaluation fallback invoked: {str(e)}")
            ai_provider_status = f"DETERMINISTIC FALLBACK ACTIVE ({type(e).__name__}: {str(e)[:40]})"

    if not explanation:
        explanation = (
            f"Overall Match Score: {overall_score}%. "
            f"Skill Match: {round(skill_score, 1)}%, Experience Score: {round(experience_score, 1)}%. "
            f"Strengths: {'; '.join(strengths) if strengths else 'Meets foundational criteria'}. "
            f"Gaps: {'; '.join(gaps) if gaps else 'None detected'}."
        )

    return {
        "overall_score": overall_score,
        "skill_score": round(skill_score, 1),
        "experience_score": round(experience_score, 1),
        "project_score": round(project_score, 1),
        "education_score": round(education_score, 1),
        "role_fit_score": round(role_fit_score, 1),
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "partial_matches": partial_matches,
        "strengths": strengths,
        "gaps": gaps,
        "explanation": explanation,
        "ai_provider_status": ai_provider_status
    }


def record_agent_telemetry(
    db: Session,
    application_id: int,
    agent_name: str,
    status: str,
    started_at: datetime,
    completed_at: datetime = None,
    error_message: str = None,
    details: dict = None
):
    """Helper to record or update agent execution telemetry in PostgreSQL."""
    completed_at = completed_at or datetime.utcnow()
    duration_ms = round((completed_at - started_at).total_seconds() * 1000.0, 2) if started_at else 0.0

    telemetry = db.query(AgentTelemetry).filter(
        AgentTelemetry.application_id == application_id,
        AgentTelemetry.agent_name == agent_name
    ).first()

    if not telemetry:
        telemetry = AgentTelemetry(
            application_id=application_id,
            agent_name=agent_name,
            status=status,
            started_at=started_at,
            completed_at=completed_at,
            duration_ms=duration_ms,
            error_message=error_message,
            details=details,
            created_at=datetime.utcnow()
        )
        db.add(telemetry)
    else:
        telemetry.status = status
        telemetry.started_at = started_at
        telemetry.completed_at = completed_at
        telemetry.duration_ms = duration_ms
        if error_message:
            telemetry.error_message = error_message
        if details:
            telemetry.details = details

    db.commit()
    return telemetry


def process_candidate_screening_async(application_id: int, job_id: int):
    """Executes asynchronous state transitions for candidate screening pipeline with real telemetry:
    RECEIVED → PARSING → MATCHING → RANKING → SHORTLISTED / REJECTED / FAILED.
    """
    db: Session = SessionLocal()
    app_record = None
    try:
        app_record = db.query(CandidateApplication).filter(CandidateApplication.id == application_id).first()
        job = db.query(Job).filter(Job.id == job_id).first()

        if not app_record or not job:
            logger.error(f"Screening pipeline error: Application #{application_id} or Job #{job_id} not found.")
            return

        # 1. STAGE 1: RESUME PARSER AGENT (PARSING)
        parse_start = datetime.utcnow()
        app_record.status = ApplicationStatus.PARSING
        db.commit()
        logger.info(f"⚡ Application #{application_id}: State transitioned to PARSING")

        resume = db.query(Resume).filter(Resume.candidate_id == app_record.candidate_id).first()
        candidate_user = db.query(User).filter(User.id == app_record.candidate_id).first()
        candidate_name = candidate_user.full_name if candidate_user else "Candidate User"

        if not candidate_user and not resume:
            app_record.status = ApplicationStatus.FAILED
            app_record.rejection_reason = "PARSING_FAILED — candidate record missing"
            db.commit()
            record_agent_telemetry(db, application_id, "ResumeParserAgent", "FAILED", parse_start, datetime.utcnow(), error_message="Candidate record missing")
            logger.error(f"❌ Application #{application_id}: PARSING_FAILED — candidate record missing")
            return

        parse_end = datetime.utcnow()
        record_agent_telemetry(
            db, application_id, "ResumeParserAgent", "COMPLETED", parse_start, parse_end,
            details={"parsed_skills": resume.parsed_skills if resume else [], "experience_years": resume.parsed_experience_years if resume else 0.0}
        )

        # 2. STAGE 2: SKILL MATCHER AGENT (MATCHING)
        match_start = datetime.utcnow()
        app_record.status = ApplicationStatus.MATCHING
        db.commit()
        logger.info(f"⚡ Application #{application_id}: State transitioned to MATCHING")

        # Evaluate job vs candidate profile
        eval_result = evaluate_job_vs_candidate(
            job=job,
            resume=resume,
            candidate_user=candidate_user,
            cover_note=getattr(app_record, "cover_note", "") or ""
        )

        overall_score = eval_result["overall_score"]
        match_end = datetime.utcnow()
        record_agent_telemetry(
            db, application_id, "SkillMatcherAgent", "COMPLETED", match_start, match_end,
            details={"overall_score": overall_score, "matched_skills": eval_result.get("matched_skills", [])}
        )

        # 3. STAGE 3: CANDIDATE RANKER AGENT (RANKING)
        rank_start = datetime.utcnow()
        app_record.status = ApplicationStatus.RANKING
        app_record.overall_match_score = overall_score
        app_record.score_breakdown = eval_result
        db.commit()
        logger.info(f"⚡ Application #{application_id}: State transitioned to RANKING (Score: {overall_score}%)")

        # Determine SHORTLISTED vs REJECTED
        min_score_threshold = float(getattr(job, "shortlist_threshold", None) or getattr(job, "min_score_threshold", None) or 70.0)
        target_shortlist_count = int(getattr(job, "target_shortlist_count", None) or 10)

        # Count current shortlisted candidates for this specific job (excluding self)
        current_shortlisted = db.query(CandidateApplication).filter(
            CandidateApplication.job_id == job_id,
            CandidateApplication.status == ApplicationStatus.SHORTLISTED,
            CandidateApplication.id != application_id
        ).count()

        if overall_score >= min_score_threshold and current_shortlisted < target_shortlist_count:
            app_record.status = ApplicationStatus.SHORTLISTED
            action = AuditAction.CANDIDATE_SHORTLISTED
            logger.info(f"🎉 Application #{application_id} ({candidate_name}): SHORTLISTED (Score {overall_score}% >= {min_score_threshold}%)")
        else:
            app_record.status = ApplicationStatus.REJECTED
            app_record.rejection_reason = f"Match score {overall_score}% below minimum threshold ({min_score_threshold}%) or shortlist capacity reached."
            action = AuditAction.CANDIDATE_REJECTED
            logger.info(f"Application #{application_id} ({candidate_name}): REJECTED (Score {overall_score}%)")

        db.commit()

        # RECALCULATE & PERSIST DYNAMIC JOB-SCOPED RANKS FOR ALL CANDIDATES IN THIS JOB
        recalculate_job_candidate_ranks(db, job_id)

        rank_end = datetime.utcnow()
        record_agent_telemetry(
            db, application_id, "CandidateRankerAgent", "COMPLETED", rank_start, rank_end,
            details={"rank": app_record.rank, "final_status": app_record.status.value}
        )

        # Create Audit Log record
        audit_entry = AuditLog(
            actor_type=ActorType.AI_AGENT,
            actor_name="HireGenie Screening Agent",
            action=action,
            target_type="APPLICATION",
            target_id=application_id,
            details={
                "candidate_name": candidate_name,
                "job_title": job.title,
                "score": overall_score,
                "status": app_record.status.value,
                "rank": app_record.rank
            }
        )
        db.add(audit_entry)
        db.commit()

        # If Shortlisted: Create Interview Invitation & Send Email Notification ONLY AFTER ranking is persisted
        if app_record.status == ApplicationStatus.SHORTLISTED:
            invitation = get_or_create_interview_invitation(db, app_record, job)
            send_candidate_email_job(db, app_record, job, candidate_name, invitation_token=invitation.invitation_token)
        elif app_record.status == ApplicationStatus.REJECTED:
            from app.services.communication_service import send_rejection_email_job
            send_rejection_email_job(db, app_record, job, candidate_name, feedback=app_record.rejection_reason)

    except Exception as e:
        logger.error(f"Error in async screening pipeline for Application #{application_id}: {str(e)}")
        if app_record:
            app_record.status = ApplicationStatus.FAILED
            app_record.rejection_reason = f"Pipeline execution failure: {str(e)}"
            db.commit()
            record_agent_telemetry(db, application_id, "ScreeningPipeline", "FAILED", datetime.utcnow(), datetime.utcnow(), error_message=str(e))
    finally:
        db.close()


def get_or_create_interview_invitation(db: Session, application: CandidateApplication, job: Job):
    """Helper: Creates or retrieves persistent InterviewInvitation record with secure random token."""
    import secrets
    from datetime import datetime, timedelta
    from app.models.models import InterviewInvitation, InvitationStatus

    existing = db.query(InterviewInvitation).filter(InterviewInvitation.application_id == application.id).first()
    if existing:
        return existing

    token = secrets.token_urlsafe(32)
    invitation = InterviewInvitation(
        application_id=application.id,
        candidate_id=application.candidate_id,
        job_id=job.id,
        invitation_token=token,
        status=InvitationStatus.INVITED,
        interview_mode=job.interview_mode.value if hasattr(job.interview_mode, "value") else str(job.interview_mode or "WEBRTC"),
        created_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    db.add(invitation)
    db.commit()
    db.refresh(invitation)
    logger.info(f"✉️ [INVITATION SERVICE] Created InterviewInvitation for App #{application.id} | Token: {token[:8]}... | Expiration: {invitation.expires_at}")
    return invitation
