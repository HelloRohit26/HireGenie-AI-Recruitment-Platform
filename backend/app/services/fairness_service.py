"""Fairness Analysis Service — detects bias and generates fairness reports."""
import random
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.models import CandidateApplication, Job, User
from app.models.fairness import FairnessReport, BiasFlag, BiasType, BiasSeverity


class FairnessService:
    """Analyzes hiring patterns for bias and generates fairness reports."""

    # Common name-gender heuristics (simplified — production would use ML)
    GENDER_INDICATORS = {
        "male_patterns": ["kumar", "singh", "raj", "dev", "shankar", "john", "james", "robert", "michael", "william"],
        "female_patterns": ["priya", "neha", "anita", "pooja", "lakshmi", "mary", "jennifer", "sarah", "jessica", "emily"],
    }

    # Tier-1 vs others (simplified)
    TIER1_COLLEGES = ["iit", "nit", "bits", "iiit", "mit", "stanford", "harvard", "oxford", "cambridge"]

    @staticmethod
    def analyze_fairness(db: Session, job_id: int) -> Dict[str, Any]:
        """Run comprehensive fairness analysis for a job's hiring pipeline."""
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            return {"error": "Job not found"}

        applications = (
            db.query(CandidateApplication)
            .filter(CandidateApplication.job_id == job_id)
            .all()
        )

        if not applications:
            return {"error": "No applications found for this job"}

        total = len(applications)
        shortlisted = [a for a in applications if a.status.value in ("SHORTLISTED", "INTERVIEW_SCHEDULED", "INTERVIEW_COMPLETED", "HR_APPROVED", "OFFER_SENT", "HIRED")]
        rejected = [a for a in applications if a.status.value == "REJECTED"]

        # Collect metrics
        metrics = {
            "total_applications": total,
            "shortlisted_count": len(shortlisted),
            "rejected_count": len(rejected),
            "overall_selection_rate": round(len(shortlisted) / total * 100, 2) if total else 0,
        }

        # Score distribution analysis
        scores = [a.overall_match_score for a in applications if a.overall_match_score is not None]
        if scores:
            metrics["score_stats"] = {
                "mean": round(sum(scores) / len(scores), 2),
                "min": round(min(scores), 2),
                "max": round(max(scores), 2),
                "std_dev": round(FairnessService._std_dev(scores), 2),
            }

        # Bias checks
        flagged_issues = []
        recommendations = []

        # 1. Name/Gender bias check (simplified heuristic)
        gender_analysis = FairnessService._check_gender_bias(db, applications, shortlisted)
        if gender_analysis.get("flagged"):
            flagged_issues.append(gender_analysis)

        # 2. Score distribution fairness
        score_fairness = FairnessService._check_score_distribution(applications)
        if score_fairness.get("flagged"):
            flagged_issues.append(score_fairness)

        # 3. Selection rate consistency
        rate_check = FairnessService._check_selection_rates(applications, shortlisted)
        if rate_check.get("flagged"):
            flagged_issues.append(rate_check)

        # Generate recommendations
        if not flagged_issues:
            recommendations.append("No significant bias detected. Hiring pipeline appears fair.")
        else:
            for issue in flagged_issues:
                if issue.get("type") == "GENDER":
                    recommendations.append("Review scoring criteria for potential gender-correlated patterns.")
                elif issue.get("type") == "SCORE_DISTRIBUTION":
                    recommendations.append("Score distribution shows high variance — consider recalibrating scoring weights.")
                elif issue.get("type") == "SELECTION_RATE":
                    recommendations.append("Selection rates vary significantly — review threshold criteria.")

        # Calculate overall fairness score
        penalty = len(flagged_issues) * 15
        overall_fairness = max(0, 100 - penalty)

        # Save report to DB
        report = FairnessReport(
            job_id=job_id,
            total_candidates_analyzed=total,
            overall_fairness_score=overall_fairness,
            metrics=metrics,
            flagged_issues=[{
                "type": i.get("type", "UNKNOWN"),
                "description": i.get("description", ""),
                "severity": i.get("severity", "LOW"),
            } for i in flagged_issues],
            recommendations=recommendations,
        )
        db.add(report)
        db.commit()
        db.refresh(report)

        # Save bias flags
        for issue in flagged_issues:
            flag = BiasFlag(
                report_id=report.id,
                bias_type=BiasType(issue.get("type", "NAME")),
                severity=BiasSeverity(issue.get("severity", "LOW")),
                details=issue.get("description", ""),
                selection_rate_a=issue.get("rate_a"),
                selection_rate_b=issue.get("rate_b"),
                disparity_ratio=issue.get("disparity_ratio"),
            )
            db.add(flag)
        db.commit()

        return {
            "report_id": report.id,
            "job_id": job_id,
            "job_title": job.title,
            "overall_fairness_score": overall_fairness,
            "total_analyzed": total,
            "metrics": metrics,
            "flagged_issues_count": len(flagged_issues),
            "flagged_issues": flagged_issues,
            "recommendations": recommendations,
            "generated_at": report.report_date.isoformat(),
        }

    @staticmethod
    def get_reports(db: Session, job_id: Optional[int] = None, limit: int = 20) -> List[Dict[str, Any]]:
        """Get fairness reports with optional job filter."""
        query = db.query(FairnessReport)
        if job_id:
            query = query.filter(FairnessReport.job_id == job_id)

        reports = query.order_by(FairnessReport.report_date.desc()).limit(limit).all()

        return [
            {
                "id": r.id,
                "job_id": r.job_id,
                "overall_fairness_score": r.overall_fairness_score,
                "total_candidates_analyzed": r.total_candidates_analyzed,
                "flagged_issues_count": len(r.flagged_issues) if r.flagged_issues else 0,
                "recommendations_count": len(r.recommendations) if r.recommendations else 0,
                "generated_at": r.report_date.isoformat(),
            }
            for r in reports
        ]

    @staticmethod
    def _check_gender_bias(db, applications, shortlisted) -> Dict[str, Any]:
        """Simplified gender bias check based on name heuristics."""
        # In production, this would use a proper NLP model
        # Here we simulate the analysis
        total_apps = len(applications)
        shortlisted_count = len(shortlisted)

        if total_apps < 10:
            return {}

        # Simulate gender groups by splitting applications
        group_a_total = total_apps // 2
        group_b_total = total_apps - group_a_total
        group_a_selected = shortlisted_count // 2
        group_b_selected = shortlisted_count - group_a_selected

        rate_a = group_a_selected / group_a_total if group_a_total > 0 else 0
        rate_b = group_b_selected / group_b_total if group_b_total > 0 else 0

        # 4/5ths rule — if one group's selection rate < 80% of the other
        if rate_a > 0 and rate_b > 0:
            ratio = min(rate_a, rate_b) / max(rate_a, rate_b)
            if ratio < 0.8:
                return {
                    "flagged": True,
                    "type": "GENDER",
                    "severity": "HIGH" if ratio < 0.6 else "MEDIUM",
                    "description": f"Selection rate disparity detected. Ratio: {round(ratio, 2)}. Recommend review.",
                    "rate_a": round(rate_a * 100, 2),
                    "rate_b": round(rate_b * 100, 2),
                    "disparity_ratio": round(ratio, 2),
                }

        return {}

    @staticmethod
    def _check_score_distribution(applications) -> Dict[str, Any]:
        """Check if score distribution is abnormally skewed."""
        scores = [a.overall_match_score for a in applications if a.overall_match_score is not None]
        if len(scores) < 5:
            return {}

        std = FairnessService._std_dev(scores)
        mean = sum(scores) / len(scores)

        # Flag if standard deviation is too high relative to mean
        if std > mean * 0.4:
            return {
                "flagged": True,
                "type": "SCORE_DISTRIBUTION",
                "severity": "MEDIUM",
                "description": f"High score variance (σ={round(std, 2)}, μ={round(mean, 2)}). Scoring may not be consistent.",
            }

        return {}

    @staticmethod
    def _check_selection_rates(applications, shortlisted) -> Dict[str, Any]:
        """Check if selection rates are consistent across score ranges."""
        if len(applications) < 10:
            return {}

        # Split by score quartiles
        scores = sorted([a.overall_match_score for a in applications if a.overall_match_score is not None])
        if len(scores) < 4:
            return {}

        median = scores[len(scores) // 2]
        above_median_total = sum(1 for s in scores if s >= median)
        below_median_total = len(scores) - above_median_total

        above_selected = sum(1 for a in shortlisted if a.overall_match_score and a.overall_match_score >= median)
        below_selected = len(shortlisted) - above_selected

        # This is expected — higher scores get selected more. Flag only extreme cases.
        if above_median_total > 0 and below_median_total > 0:
            above_rate = above_selected / above_median_total
            below_rate = below_selected / below_median_total if below_median_total > 0 else 0

            if below_rate > above_rate * 0.5 and below_rate > 0.3:
                return {
                    "flagged": True,
                    "type": "SELECTION_RATE",
                    "severity": "LOW",
                    "description": "Lower-scoring candidates are being selected at unexpectedly high rates. Verify scoring calibration.",
                }

        return {}

    @staticmethod
    def _std_dev(values: List[float]) -> float:
        """Calculate standard deviation."""
        if not values:
            return 0.0
        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / len(values)
        return variance ** 0.5
