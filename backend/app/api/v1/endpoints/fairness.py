"""Fairness Monitoring API — bias detection and fairness reports."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db
from app.services.fairness_service import FairnessService
from app.models.fairness import FairnessReport, BiasFlag

router = APIRouter()


@router.post("/analyze/{job_id}")
def analyze_fairness(job_id: int, db: Session = Depends(get_db)):
    """Run fairness analysis for a job's hiring pipeline."""
    result = FairnessService.analyze_fairness(db, job_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.get("/reports")
def get_fairness_reports(
    job_id: Optional[int] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """List all fairness reports with optional job filter."""
    return {
        "reports": FairnessService.get_reports(db, job_id=job_id, limit=limit),
    }


@router.get("/report/{report_id}")
def get_fairness_report_detail(report_id: int, db: Session = Depends(get_db)):
    """Get detailed fairness report with bias flags."""
    report = db.query(FairnessReport).filter(FairnessReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    flags = db.query(BiasFlag).filter(BiasFlag.report_id == report_id).all()

    return {
        "id": report.id,
        "job_id": report.job_id,
        "overall_fairness_score": report.overall_fairness_score,
        "total_candidates_analyzed": report.total_candidates_analyzed,
        "metrics": report.metrics,
        "flagged_issues": report.flagged_issues,
        "recommendations": report.recommendations,
        "generated_at": report.report_date.isoformat() if report.report_date else None,
        "bias_flags": [
            {
                "id": f.id,
                "type": f.bias_type.value if f.bias_type else "UNKNOWN",
                "severity": f.severity.value if f.severity else "UNKNOWN",
                "affected_group": f.affected_group,
                "details": f.details,
                "selection_rate_a": f.selection_rate_a,
                "selection_rate_b": f.selection_rate_b,
                "disparity_ratio": f.disparity_ratio,
            }
            for f in flags
        ],
    }
