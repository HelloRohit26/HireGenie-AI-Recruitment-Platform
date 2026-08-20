import React, { useState, useEffect } from "react";

interface FairnessReportPanelProps {
  jobId?: number;
}

export const FairnessReportPanel: React.FC<FairnessReportPanelProps> = ({ jobId }) => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    fetch(`http://localhost:8000/api/v1/fairness/reports${jobId ? `?job_id=${jobId}` : ""}`)
      .then((r) => r.json())
      .then((d) => setReports(d.reports || []))
      .catch(() => {});
  }, [jobId]);

  const runAnalysis = async () => {
    if (!jobId) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/fairness/analyze/${jobId}`, { method: "POST" });
      const data = await res.json();
      setReport(data);
    } catch (e) {}
    setLoading(false);
  };

  return (
    <div className="bg-[#181815] rounded-xl border border-[#2A2A28] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 flex items-center justify-between border-b border-[#2A2A28]/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#79A89A]/15 border border-[#79A89A]/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#79A89A] text-lg">balance</span>
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#F4F1E9]">⚖️ Bias & Fairness Monitor</h3>
            <p className="text-[10px] text-[#A1A19A]">Periodically audits hiring pipeline for gender, college, & selection-rate disparities</p>
          </div>
        </div>
        {jobId && (
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded bg-[#79A89A] text-[#11110F] hover:bg-[#92C4B5] transition-colors disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-sm ${loading ? "animate-spin" : ""}`}>refresh</span>
            {loading ? "Analyzing Pipeline..." : "Run Bias Audit"}
          </button>
        )}
      </div>

      <div className="p-5 space-y-4 text-xs">
        {report && (
          <>
            {/* Score */}
            <div className="bg-[#11110F] rounded-lg p-4 text-center border border-[#79A89A]/30">
              <div className="text-[10px] uppercase tracking-wider text-[#A1A19A]">Overall Pipeline Fairness Score</div>
              <div className="text-3xl font-mono font-bold text-[#79A89A] mt-1">{report.overall_fairness_score}%</div>
              <div className="text-[10px] text-[#A1A19A] mt-0.5">{report.total_analyzed} candidates evaluated</div>
            </div>

            {/* Metrics */}
            {report.metrics && (
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(report.metrics).filter(([k]) => typeof report.metrics[k] !== "object").map(([key, value]) => (
                  <div key={key} className="bg-[#11110F] rounded p-2 text-center border border-[#2A2A28]">
                    <div className="text-[9px] text-[#A1A19A] uppercase tracking-wider">{key.replace(/_/g, " ")}</div>
                    <div className="text-xs font-mono font-bold text-[#F4F1E9] mt-0.5">{typeof value === "number" ? value.toFixed(1) : String(value)}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Flagged issues */}
            {report.flagged_issues_count > 0 ? (
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-bold text-[#C97C5D] uppercase tracking-wider">🚨 Flagged Issues ({report.flagged_issues_count})</h4>
                {report.flagged_issues.map((issue: any, i: number) => (
                  <div key={i} className="bg-[#C97C5D]/10 rounded p-2.5 border border-[#C97C5D]/30 flex items-start gap-2">
                    <span className="material-symbols-outlined text-base text-[#C97C5D]">warning</span>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-[#C97C5D] block">{issue.type} — {issue.severity}</span>
                      <span className="text-[11px] text-[#E5E2DE]">{issue.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#79A89A]/10 rounded p-3 border border-[#79A89A]/30 flex items-center gap-2 text-[#79A89A]">
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span className="font-bold">No bias detected — pipeline meets 80% selection rate parity benchmark</span>
              </div>
            )}
          </>
        )}

        {!report && reports.length === 0 && (
          <div className="text-center py-6 text-[#A1A19A]">
            <span className="material-symbols-outlined text-3xl opacity-50 block mb-1">analytics</span>
            <p className="text-xs">No bias reports generated yet. Click "Run Bias Audit" to run fairness metrics.</p>
          </div>
        )}
      </div>
    </div>
  );
};
