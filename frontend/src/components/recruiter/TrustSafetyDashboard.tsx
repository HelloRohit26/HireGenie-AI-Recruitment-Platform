import React, { useState } from "react";
import { ExplainabilityPanel } from "./ExplainabilityPanel";
import { FairnessReportPanel } from "./FairnessReportPanel";
import { AuditLogViewer } from "./AuditLogViewer";
import { FailureQueuePanel } from "./FailureQueuePanel";
import { IntegrationsPanel } from "./IntegrationsPanel";
import { AuditExportModal } from "./AuditExportModal";

interface TrustSafetyDashboardProps {
  applicationId?: number;
  jobId?: number;
}

export const TrustSafetyDashboard: React.FC<TrustSafetyDashboardProps> = ({ applicationId = 1, jobId = 1 }) => {
  const [activeSection, setActiveSection] = useState("overview");
  const [showExportModal, setShowExportModal] = useState(false);

  const sections = [
    { id: "overview", label: "Trust Overview", icon: "shield" },
    { id: "explainability", label: "Explainable AI", icon: "psychology" },
    { id: "fairness", label: "Bias & Fairness", icon: "balance" },
    { id: "audit", label: "Audit Logs", icon: "assignment" },
    { id: "failures", label: "Failure Recovery", icon: "published_with_changes" },
    { id: "integrations", label: "Integrations", icon: "extension" },
  ];

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Section Tabs */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 bg-[#181815] p-1.5 rounded-xl border border-[#2A2A28] overflow-x-auto">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                activeSection === section.id
                  ? "bg-[#D6A85F]/20 text-[#F4C377] border border-[#D6A85F]/40 shadow-md shadow-[#D6A85F]/10"
                  : "text-[#A1A19A] hover:text-[#F4F1E9] hover:bg-[#20201C]"
              }`}
            >
              <span className="material-symbols-outlined text-base">{section.icon}</span>
              {section.label}
            </button>
          ))}
        </div>

        {/* Export Action Button */}
        <button
          onClick={() => setShowExportModal(true)}
          className="px-3.5 py-2 rounded-xl bg-[#D6A85F] text-[#11110F] text-xs font-bold font-mono hover:bg-[#F4C377] transition-all flex items-center gap-1.5 shrink-0 shadow-md"
        >
          <span className="material-symbols-outlined text-sm">download</span>
          Export Compliance Certificate
        </button>
      </div>

      {/* Section Content */}
      {activeSection === "overview" && (
        <div className="space-y-5">
          {/* Trust Banner */}
          <div className="bg-[#181815] rounded-xl p-6 border border-[#2A2A28] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#D6A85F] via-[#F4C377] to-[#79A89A] p-[1px]">
                <div className="w-full h-full bg-[#11110F] rounded-[11px] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#F4C377] text-xl">verified_user</span>
                </div>
              </div>
              <div>
                <h2 className="text-base font-bold text-[#F4F1E9]">Enterprise Trust, Safety & Compliance Layer</h2>
                <p className="text-xs text-[#A1A19A]">100% Deterministic AI Explanations, Bias Auditing, Audit Trail, & Human Override Control</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2">
              {[
                { label: "RBAC Controls", icon: "lock", status: "Active" },
                { label: "Explainable AI", icon: "psychology", status: "Active" },
                { label: "Bias Audit", icon: "balance", status: "Active" },
                { label: "Audit Logs", icon: "history", status: "Active" },
                { label: "Failure Retry", icon: "sync", status: "Active" },
                { label: "Integrations", icon: "extension", status: "Active" },
              ].map((item) => (
                <div key={item.label} className="bg-[#11110F] rounded-lg p-3 text-center border border-[#2A2A28]">
                  <span className="material-symbols-outlined text-xl text-[#F4C377]">{item.icon}</span>
                  <div className="text-[11px] font-bold text-[#F4F1E9] mt-1">{item.label}</div>
                  <span className="inline-block text-[9px] font-mono text-[#79A89A] font-bold mt-1.5 px-2 py-0.5 rounded bg-[#79A89A]/15 border border-[#79A89A]/30">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <ExplainabilityPanel applicationId={applicationId} />
          <FairnessReportPanel jobId={jobId} />
        </div>
      )}

      {activeSection === "explainability" && <ExplainabilityPanel applicationId={applicationId} />}
      {activeSection === "fairness" && <FairnessReportPanel jobId={jobId} />}
      {activeSection === "audit" && <AuditLogViewer />}
      {activeSection === "failures" && <FailureQueuePanel />}
      {activeSection === "integrations" && <IntegrationsPanel />}

      {/* Compliance Audit Certificate Modal */}
      <AuditExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
    </div>
  );
};
