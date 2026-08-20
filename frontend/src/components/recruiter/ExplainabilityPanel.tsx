import React, { useState, useEffect } from "react";

interface ExplanationData {
  id: number;
  type: string;
  matched_skills: string[];
  missing_skills: string[];
  strengths: string[];
  weaknesses: string[];
  reasoning: string;
  confidence: number;
  score_breakdown: Record<string, number>;
  created_at: string;
}

interface OverrideData {
  id: number;
  original_decision: string;
  overridden_to: string;
  reason: string;
  overridden_by: number;
  created_at: string;
}

interface ExplainabilityProps {
  applicationId: number;
}

export const ExplainabilityPanel: React.FC<ExplainabilityProps> = ({ applicationId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideTo, setOverrideTo] = useState("SHORTLISTED");
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:8000/api/v1/explainability/${applicationId}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [applicationId]);

  const handleOverride = async () => {
    if (!overrideReason.trim()) return;
    const res = await fetch(`http://localhost:8000/api/v1/explainability/override/${applicationId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        original_decision: data?.current_status || "UNKNOWN",
        override_to: overrideTo,
        reason: overrideReason,
        overridden_by: 1,
      }),
    });
    if (res.ok) {
      setShowOverrideForm(false);
      setOverrideReason("");
      const refreshed = await fetch(`http://localhost:8000/api/v1/explainability/${applicationId}`).then((r) => r.json());
      setData(refreshed);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse bg-[#181815] rounded-xl p-5 border border-[#2A2A28]">
        <div className="h-4 bg-[#2A2A28] rounded w-1/3 mb-4"></div>
        <div className="h-20 bg-[#2A2A28] rounded"></div>
      </div>
    );
  }

  if (!data || !data.explanations?.length) {
    return (
      <div className="bg-[#181815] rounded-xl p-6 border border-[#2A2A28] text-center text-[#A1A19A]">
        <span className="material-symbols-outlined text-3xl opacity-50 block mb-2">psychology</span>
        <p className="text-xs">No AI explanation available for this application.</p>
      </div>
    );
  }

  const explanation: ExplanationData = data.explanations[0];
  const overrides: OverrideData[] = data.overrides || [];

  return (
    <div className="bg-[#181815] rounded-xl border border-[#2A2A28] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#20201C] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#D6A85F]/15 border border-[#D6A85F]/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#F4C377] text-lg">psychology</span>
          </div>
          <div className="text-left">
            <h3 className="text-xs font-bold text-[#F4F1E9]">🧠 Explainable AI Intelligence</h3>
            <p className="text-[10px] text-[#A1A19A]">Transparent reasoning & deterministic decision breakdown</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded ${
            explanation.type === "SHORTLIST" ? "bg-[#79A89A]/20 text-[#79A89A] border border-[#79A89A]/30" :
            explanation.type === "REJECT" ? "bg-[#C97C5D]/20 text-[#C97C5D] border border-[#C97C5D]/30" :
            "bg-[#D6A85F]/20 text-[#F4C377] border border-[#D6A85F]/30"
          }`}>
            {explanation.type}
          </span>
          <span className="text-sm font-mono font-bold text-[#F4F1E9]">{explanation.confidence?.toFixed(1)}%</span>
          <span className="material-symbols-outlined text-[#A1A19A] text-lg">
            {expanded ? "expand_less" : "expand_more"}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 text-xs border-t border-[#2A2A28]/50 pt-4">
          {/* Matched vs Missing Skills */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#11110F] p-3 rounded-lg border border-[#2A2A28]">
              <h4 className="text-[10px] font-bold text-[#79A89A] mb-2 uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">check_circle</span> Matched Skills
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {explanation.matched_skills.map((skill, i) => (
                  <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#79A89A]/15 text-[#79A89A] border border-[#79A89A]/30">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-[#11110F] p-3 rounded-lg border border-[#2A2A28]">
              <h4 className="text-[10px] font-bold text-[#C97C5D] mb-2 uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">cancel</span> Missing Skills
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {explanation.missing_skills.map((skill, i) => (
                  <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#C97C5D]/15 text-[#C97C5D] border border-[#C97C5D]/30">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#11110F] p-3 rounded-lg border border-[#2A2A28]">
              <h4 className="text-[10px] font-bold text-[#F4C377] mb-2 uppercase tracking-wider">💪 Candidate Strengths</h4>
              <ul className="space-y-1">
                {explanation.strengths.map((s, i) => (
                  <li key={i} className="text-[11px] text-[#E5E2DE] flex items-start gap-1.5">
                    <span className="text-[#F4C377] font-bold mt-0.5">▸</span> {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-[#11110F] p-3 rounded-lg border border-[#2A2A28]">
              <h4 className="text-[10px] font-bold text-[#C97C5D] mb-2 uppercase tracking-wider">⚠️ Area Deficits</h4>
              <ul className="space-y-1">
                {explanation.weaknesses.map((w, i) => (
                  <li key={i} className="text-[11px] text-[#E5E2DE] flex items-start gap-1.5">
                    <span className="text-[#C97C5D] font-bold mt-0.5">▸</span> {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* AI Narrative Reasoning */}
          <div className="bg-[#11110F] rounded-lg p-3.5 border border-[#2A2A28]">
            <h4 className="text-[10px] font-bold text-[#F4C377] mb-1.5 uppercase tracking-wider">🧠 AI Narrative Reasoning</h4>
            <p className="text-[11px] text-[#E5E2DE] leading-relaxed">{explanation.reasoning}</p>
          </div>

          {/* Score Breakdown Grid */}
          {explanation.score_breakdown && (
            <div>
              <h4 className="text-[10px] font-bold text-[#A1A19A] mb-2 uppercase tracking-wider">📊 Score Breakdown</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(explanation.score_breakdown).map(([key, value]) => (
                  <div key={key} className="bg-[#11110F] rounded-lg p-2.5 text-center border border-[#2A2A28]">
                    <div className="text-[9px] text-[#A1A19A] uppercase tracking-wider">{key.replace(/_/g, " ")}</div>
                    <div className="text-sm font-mono font-bold text-[#F4F1E9] mt-0.5">{typeof value === 'number' ? value.toFixed(1) : value}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recruiter Override Logs */}
          {overrides.length > 0 && (
            <div className="bg-[#11110F] rounded-lg p-3 border border-[#D6A85F]/30">
              <h4 className="text-[10px] font-bold text-[#F4C377] mb-2 uppercase tracking-wider">🔄 Recruiter Human-in-the-Loop Override History</h4>
              {overrides.map((o) => (
                <div key={o.id} className="flex items-center gap-2 text-[11px] text-[#E5E2DE] mb-1">
                  <span className="material-symbols-outlined text-sm text-[#F4C377]">swap_horiz</span>
                  <span className="text-[#C97C5D] font-bold">{o.original_decision}</span>
                  <span>→</span>
                  <span className="text-[#79A89A] font-bold">{o.overridden_to}</span>
                  <span className="text-[#A1A19A]">"{o.reason}"</span>
                </div>
              ))}
            </div>
          )}

          {/* Override Action */}
          <div className="pt-2 border-t border-[#2A2A28]">
            {!showOverrideForm ? (
              <button
                onClick={() => setShowOverrideForm(true)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded bg-[#D6A85F]/20 text-[#F4C377] border border-[#D6A85F]/40 hover:bg-[#D6A85F]/30 transition-colors"
              >
                <span className="material-symbols-outlined text-base">admin_panel_settings</span> Override AI Decision (Human-in-the-Loop)
              </button>
            ) : (
              <div className="bg-[#11110F] rounded-lg p-3 space-y-3 border border-[#D6A85F]/40">
                <div className="flex gap-2">
                  <select
                    value={overrideTo}
                    onChange={(e) => setOverrideTo(e.target.value)}
                    className="bg-[#181815] border border-[#2A2A28] rounded px-3 py-1.5 text-xs text-[#F4F1E9]"
                  >
                    <option value="SHORTLISTED">SHORTLIST</option>
                    <option value="REJECTED">REJECT</option>
                    <option value="HR_APPROVED">APPROVE</option>
                    <option value="MANUAL_REVIEW">MANUAL REVIEW</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Reason for manual override..."
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="flex-1 bg-[#181815] border border-[#2A2A28] rounded px-3 py-1.5 text-xs text-[#F4F1E9] placeholder-[#A1A19A]"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleOverride}
                    className="px-3 py-1.5 text-xs font-bold rounded bg-[#D6A85F] text-[#11110F] hover:bg-[#F4C377] transition-colors"
                  >
                    Confirm Override
                  </button>
                  <button
                    onClick={() => setShowOverrideForm(false)}
                    className="px-3 py-1.5 text-xs font-bold rounded bg-[#20201C] text-[#A1A19A] hover:bg-[#2A2A28] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
