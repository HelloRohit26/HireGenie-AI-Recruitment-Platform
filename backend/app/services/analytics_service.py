"""Enhanced Analytics Service — full hiring funnel and advanced recruitment metrics."""
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.models import CandidateApplication, ApplicationStatus, Job, User, Interview, Resume
from app.models.communication import CommunicationLog
from app.models.scheduling import InterviewSchedule, ScheduleStatus


class AnalyticsService:
    """Provides comprehensive recruitment analytics and hiring funnel metrics."""

    @staticmethod
    def get_hiring_funnel(db: Session, job_id: Optional[int] = None) -> Dict[str, Any]:
        """Get complete hiring funnel: Applied → Eligible → Shortlisted → ... → Hired."""
        query = db.query(CandidateApplication)
        if job_id:
            query = query.filter(CandidateApplication.job_id == job_id)

        applications = query.all()
        total = len(applications)

        if total == 0:
            return {"total": 0, "funnel": {}, "message": "No applications found"}

        # Count by status
        status_counts = {}
        for app in applications:
            status = app.status.value if app.status else "UNKNOWN"
            status_counts[status] = status_counts.get(status, 0) + 1

        # Build funnel
        applied = total
        screening = status_counts.get("SCREENING", 0)
        shortlisted = sum(status_counts.get(s, 0) for s in ["SHORTLISTED", "INTERVIEW_SCHEDULED", "INTERVIEW_COMPLETED", "HR_APPROVED", "OFFER_SENT", "OFFERED", "OFFER_DECLINED", "HIRED"])
        interview_scheduled = sum(status_counts.get(s, 0) for s in ["INTERVIEW_SCHEDULED", "INTERVIEW_COMPLETED", "HR_APPROVED", "OFFER_SENT", "OFFERED", "OFFER_DECLINED", "HIRED"])
        interview_completed = sum(status_counts.get(s, 0) for s in ["INTERVIEW_COMPLETED", "HR_APPROVED", "OFFER_SENT", "OFFERED", "OFFER_DECLINED", "HIRED"])
        hr_approved = sum(status_counts.get(s, 0) for s in ["HR_APPROVED", "OFFER_SENT", "OFFERED", "OFFER_DECLINED", "HIRED"])
        offers = sum(status_counts.get(s, 0) for s in ["OFFER_SENT", "OFFERED", "OFFER_DECLINED", "HIRED"])
        hired = status_counts.get("HIRED", 0)
        rejected = status_counts.get("REJECTED", 0)
        offer_declined = status_counts.get("OFFER_DECLINED", 0)

        funnel = {
            "applied": applied,
            "screening": screening,
            "ai_shortlisted": shortlisted,
            "interview_scheduled": interview_scheduled,
            "interview_completed": interview_completed,
            "hr_approved": hr_approved,
            "offers_sent": offers,
            "hired": hired,
            "rejected": rejected,
        }

        # Conversion rates
        conversions = {}
        if applied > 0:
            conversions["shortlist_rate"] = round(shortlisted / applied * 100, 1)
        if shortlisted > 0:
            conversions["interview_rate"] = round(interview_scheduled / shortlisted * 100, 1)
        if interview_scheduled > 0:
            conversions["completion_rate"] = round(interview_completed / interview_scheduled * 100, 1)
        if interview_completed > 0:
            conversions["approval_rate"] = round(hr_approved / interview_completed * 100, 1)
        if offers > 0:
            conversions["offer_acceptance_rate"] = round(hired / offers * 100, 1) if offers > 0 else 0

        return {
            "job_id": job_id,
            "total_applications": total,
            "funnel": funnel,
            "conversion_rates": conversions,
            "status_breakdown": status_counts,
        }

    @staticmethod
    def get_time_metrics(db: Session, job_id: Optional[int] = None) -> Dict[str, Any]:
        """Calculate time-based hiring metrics."""
        query = db.query(CandidateApplication)
        if job_id:
            query = query.filter(CandidateApplication.job_id == job_id)

        applications = query.all()

        if not applications:
            return {"message": "No data available"}

        # Average time in pipeline (from applied_at to now or decision)
        total_days = 0
        count = 0
        for app in applications:
            if app.applied_at:
                delta = datetime.utcnow() - app.applied_at
                total_days += delta.days
                count += 1

        avg_time_in_pipeline = round(total_days / count, 1) if count > 0 else 0

        return {
            "avg_time_in_pipeline_days": avg_time_in_pipeline,
            "total_applications_tracked": count,
            "estimated_time_to_hire_days": avg_time_in_pipeline + 5,  # estimate
            "estimated_cost_per_hire": "₹2,500",  # placeholder for AI-driven recruitment
        }

    @staticmethod
    def get_ai_accuracy_metrics(db: Session, job_id: Optional[int] = None) -> Dict[str, Any]:
        """Calculate AI screening accuracy based on recruiter decisions."""
        query = db.query(CandidateApplication)
        if job_id:
            query = query.filter(CandidateApplication.job_id == job_id)

        applications = query.all()
        total = len(applications)

        if total == 0:
            return {"message": "No data available"}

        # AI shortlisted who were later approved by HR
        ai_shortlisted = [a for a in applications if a.overall_match_score and a.overall_match_score >= 80]
        hr_approved = [a for a in applications if a.status.value in ("HR_APPROVED", "OFFER_SENT", "HIRED")]

        ai_accuracy = 0
        if ai_shortlisted:
            correct = len([a for a in ai_shortlisted if a in hr_approved])
            ai_accuracy = round(correct / len(ai_shortlisted) * 100, 1)

        return {
            "total_evaluated": total,
            "ai_shortlisted": len(ai_shortlisted),
            "hr_approved": len(hr_approved),
            "ai_screening_accuracy": ai_accuracy,
        }

    @staticmethod
    def get_interview_metrics(db: Session, job_id: Optional[int] = None) -> Dict[str, Any]:
        """Get interview completion and performance metrics."""
        query = db.query(Interview)
        interviews = query.all()

        total = len(interviews)
        completed = sum(1 for i in interviews if i.status == "COMPLETED")
        scores = [i.overall_score for i in interviews if i.overall_score is not None]

        return {
            "total_interviews": total,
            "completed": completed,
            "completion_rate": round(completed / total * 100, 1) if total > 0 else 0,
            "avg_interview_score": round(sum(scores) / len(scores), 1) if scores else 0,
            "dropout_count": total - completed,
            "dropout_rate": round((total - completed) / total * 100, 1) if total > 0 else 0,
        }

    @staticmethod
    def get_skill_availability(db: Session, job_id: Optional[int] = None) -> Dict[str, Any]:
        """Get skill-wise candidate distribution."""
        query = db.query(CandidateApplication)
        if job_id:
            query = query.filter(CandidateApplication.job_id == job_id)

        applications = query.all()

        skill_counts = {}
        for app in applications:
            if app.score_breakdown and isinstance(app.score_breakdown, dict):
                for key, value in app.score_breakdown.items():
                    skill_name = key.replace("_score", "").replace("_", " ").title()
                    if skill_name not in skill_counts:
                        skill_counts[skill_name] = {"total": 0, "high_score_count": 0}
                    skill_counts[skill_name]["total"] += 1
                    if isinstance(value, (int, float)) and value >= 80:
                        skill_counts[skill_name]["high_score_count"] += 1

        return {
            "skill_distribution": skill_counts,
            "total_candidates_analyzed": len(applications),
        }

    @staticmethod
    def get_comprehensive_dashboard(db: Session, job_id: Optional[int] = None) -> Dict[str, Any]:
        """Get all analytics combined for the dashboard."""
        return {
            "funnel": AnalyticsService.get_hiring_funnel(db, job_id),
            "time_metrics": AnalyticsService.get_time_metrics(db, job_id),
            "ai_accuracy": AnalyticsService.get_ai_accuracy_metrics(db, job_id),
            "interview_metrics": AnalyticsService.get_interview_metrics(db, job_id),
            "skill_availability": AnalyticsService.get_skill_availability(db, job_id),
        }

    @staticmethod
    def get_summary_telemetry(db: Session) -> Dict[str, Any]:
        """Get top-level system telemetry for Recruiter Dashboard from real SQLite data."""
        total_jobs = db.query(Job).count()
        open_jobs = db.query(Job).filter(Job.status == "OPEN").count()
        closed_jobs = db.query(Job).filter(Job.status == "CLOSED").count()

        applications = db.query(CandidateApplication).all()
        total_applications = len(applications)

        status_counts: Dict[str, int] = {}
        for app in applications:
            val = app.status.value if hasattr(app.status, 'value') else str(app.status)
            status_counts[val] = status_counts.get(val, 0) + 1

        screening_count = sum(status_counts.get(s, 0) for s in ["SCREENING", "RECEIVED", "PARSING", "MATCHING", "RANKING"])
        shortlisted_count = status_counts.get("SHORTLISTED", 0)
        interview_count = sum(status_counts.get(s, 0) for s in ["INTERVIEW_INVITED", "INTERVIEW", "INTERVIEWING", "INTERVIEW_SCHEDULED", "INTERVIEW_COMPLETED"])
        offer_count = sum(status_counts.get(s, 0) for s in ["OFFERED", "OFFER_SENT", "OFFER_DECLINED"])
        hired_count = status_counts.get("HIRED", 0)
        rejected_count = status_counts.get("REJECTED", 0)
        offer_declined_count = status_counts.get("OFFER_DECLINED", 0)

        # Calculate real agent activity and telemetry from AgentTelemetry database table
        from app.models.models import AgentTelemetry
        all_telemetry = db.query(AgentTelemetry).order_by(AgentTelemetry.completed_at.desc(), AgentTelemetry.id.desc()).all()
        telemetry_by_agent: Dict[str, Any] = {}
        telemetry_counts: Dict[str, int] = {}

        for t in all_telemetry:
            telemetry_counts[t.agent_name] = telemetry_counts.get(t.agent_name, 0) + 1
            if t.agent_name not in telemetry_by_agent:
                telemetry_by_agent[t.agent_name] = t

        canonical_agents = [
            ("ResumeParserAgent", "Resume Parser", "Document Extraction"),
            ("SkillMatcherAgent", "Skill Matcher", "Vector Embeddings"),
            ("CandidateRankerAgent", "Candidate Ranker", "Deterministic Scoring"),
            ("VoiceInterviewerAgent", "Voice Interviewer", "Autonomous Audio AI"),
            ("EvaluationAgent", "Evaluation Agent", "Synthesis & Scoring")
        ]

        agent_telemetry = []
        for idx, (agent_key, display_name, role_name) in enumerate(canonical_agents, 1):
            t_rec = telemetry_by_agent.get(agent_key)
            processed_n = telemetry_counts.get(agent_key, 0)

            if t_rec:
                duration_sec = f"{t_rec.duration_ms / 1000.0:.2f}s" if t_rec.duration_ms else "0.00s"
                c_status = t_rec.status
                if c_status == "COMPLETED":
                    status_text = "COMPLETED"
                    status_color = "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    task_text = f"Completed in {duration_sec} (App #{t_rec.application_id})"
                elif c_status == "FAILED":
                    status_text = "FAILED"
                    status_color = "bg-red-500/20 text-red-400 border border-red-500/40"
                    task_text = f"Error: {t_rec.error_message or 'Pipeline error'}"
                elif c_status in ("PROCESSING", "QUEUED", "PARSING", "MATCHING", "RANKING"):
                    status_text = "PROCESSING"
                    status_color = "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    task_text = f"Processing App #{t_rec.application_id}..."
                else:
                    status_text = "WAITING"
                    status_color = "bg-neutral-600 text-neutral-300"
                    task_text = "Waiting for incoming applications..."
            else:
                status_text = "WAITING"
                status_color = "bg-neutral-600 text-neutral-300"
                task_text = "Waiting for incoming applications..."
                duration_sec = "0.00s"

            agent_telemetry.append({
                "id": f"agent-{idx}",
                "agent_key": agent_key,
                "name": display_name,
                "role": role_name,
                "status": status_text,
                "statusColor": status_color,
                "currentTask": task_text,
                "duration": duration_sec,
                "processedCount": f"{processed_n} applications processed",
                "activityPercentage": min(100, processed_n * 20) if processed_n > 0 else 0,
                "lastActive": t_rec.completed_at.strftime("%H:%M:%S") if (t_rec and t_rec.completed_at) else "No activity"
            })

        # Query recent audit logs for activity stream
        from app.models.audit import AuditLog
        audit_logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(10).all()
        recent_activity = []
        for log in audit_logs:
            details_str = ""
            if log.details and isinstance(log.details, dict):
                details_str = log.details.get("candidate_name") or log.details.get("job_title") or str(log.details)
            recent_activity.append({
                "id": str(log.id),
                "timestamp": log.timestamp.isoformat() if log.timestamp else "",
                "timeAgo": "Recently",
                "actor": log.actor_name or str(log.actor_type),
                "action": str(log.action.value if hasattr(log.action, 'value') else log.action).replace("_", " ").title(),
                "details": details_str or f"Target {log.target_type} #{log.target_id}",
                "status": "Completed"
            })

        return {
            "metrics": {
                "activeJobs": open_jobs,
                "totalJobs": total_jobs,
                "closedJobs": closed_jobs,
                "totalApplicants": total_applications,
                "aiShortlisted": shortlisted_count,
                "interviews": interview_count,
                "offers": offer_count,
                "hired": hired_count,
                "rejected": rejected_count,
                "avgTimeToHireDays": 0  # 0 when no historical hires exist
            },
            "agent_telemetry": agent_telemetry,
            "recent_activity": recent_activity
        }

    @staticmethod
    def get_real_insights(db: Session) -> Dict[str, Any]:
        """Get strictly calculated Insights metrics from SQLite database without fake values."""
        applications = db.query(CandidateApplication).all()
        total_apps = len(applications)

        hires = [a for a in applications if getattr(a.status, 'value', str(a.status)) == 'HIRED']
        shortlisted = [a for a in applications if getattr(a.status, 'value', str(a.status)) == 'SHORTLISTED']
        offers = [a for a in applications if getattr(a.status, 'value', str(a.status)) in ('OFFERED', 'OFFER_SENT')]

        # Calculated accuracy based on shortlisted candidates who achieved >= 80 score
        scored_apps = [a for a in applications if a.overall_match_score is not None]
        avg_score = round(sum(a.overall_match_score for a in scored_apps) / len(scored_apps), 1) if scored_apps else None

        offer_acceptance_rate = round(len(hires) / len(offers) * 100, 1) if offers else None

        return {
            "total_applications": total_apps,
            "total_hires": len(hires),
            "total_shortlisted": len(shortlisted),
            "average_match_score": f"{avg_score}%" if avg_score is not None else "N/A — insufficient data",
            "offer_acceptance_rate": f"{offer_acceptance_rate}%" if offer_acceptance_rate is not None else "N/A — insufficient data",
            "avg_time_to_hire": "N/A — insufficient data",
            "cost_per_hire": "N/A — insufficient data",
            "nps_score": "N/A — insufficient data",
            "message": "Metrics calculated from live database records."
        }

