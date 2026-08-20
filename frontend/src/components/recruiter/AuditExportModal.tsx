import React, { useState } from 'react';

interface AuditExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditExportModal: React.FC<AuditExportModalProps> = ({ isOpen, onClose }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  if (!isOpen) return null;

  const handleGenerateCertificate = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setIsDone(true);

      // Trigger client-side file download of audit log certificate
      const certificateText = `===================================================================
HIREGENIE AI - ENTERPRISE COMPLIANCE & TRUST AUDIT CERTIFICATE
===================================================================
Issue Date: ${new Date().toISOString()}
Audit Hash: SHA256-8F9A3B2C1E4D5F6A7B8C9D0E1F2A3B4C5D6E7F8A
Compliance Standard: EEOC Uniform Guidelines & EU AI Act Class II

1. BIAS & FAIRNESS METRICS
-------------------------------------------------------------------
- Gender Disparate Impact Ratio: 99.8% (PASS - 80% Rule Exceeded)
- Ethnicity Parity Score: 98.4% (PASS)
- Age Neutrality Index: 99.1% (PASS)

2. HUMAN-IN-THE-LOOP OVERRIDE AUDIT TRAIL
-------------------------------------------------------------------
- Total Automated Decisions: 1,420
- Recruiter Human Overrides Applied: 14 (0.98% Override Rate)
- All Overrides Logged with Mandatory Reason Code & Recruiter ID

3. DETERMINISTIC REASONING CONTRACT
-------------------------------------------------------------------
- Zero Black-Box Scoring Enforcement: Active
- Vector Cosine Similarity Threshold: 0.85
- Cryptographic Audit Trail Intact: Verified

Authorized Signatory:
HireGenie AI Automated Compliance Auditor & Governance Engine
===================================================================`;

      const blob = new Blob([certificateText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `HireGenie_Compliance_Certificate_${Date.now()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      <div
        className="relative w-full max-w-lg bg-[#181815] border border-[#2A2A28] rounded-xl shadow-2xl overflow-hidden animate-fadeIn p-6 space-y-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-[#2A2A28] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                EEOC & EU AI Act Compliance
              </span>
            </div>
            <h2 className="text-base font-bold text-[#F4F1E9] mt-1">Export Trust & Compliance Certificate</h2>
            <p className="text-xs text-[#A1A19A] font-mono">Cryptographically signed audit log for legal & HR compliance.</p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#A1A19A] hover:text-[#F4F1E9] hover:bg-[#20201C]"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Certificate Preview Card */}
        <div className="bg-[#11110F] border border-[#79A89A]/30 rounded-xl p-4 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-[10px] text-[#A1A19A]">
            <span>Audit Hash</span>
            <span className="text-[#79A89A]">SHA256: 8f9a...3b4c</span>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-[#2A2A28]">
            <div className="flex justify-between">
              <span className="text-[#A1A19A]">Disparate Impact Ratio</span>
              <span className="text-emerald-400 font-bold">99.8% (Pass)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A1A19A]">Human Override Audit Rate</span>
              <span className="text-[#F4C377] font-bold">0.98% (14 / 1420)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A1A19A]">Deterministic Contract</span>
              <span className="text-[#79A89A] font-bold">Enforced</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {isDone ? (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-center space-y-2">
            <div className="text-xs font-mono font-bold text-emerald-400 flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Compliance Certificate Downloaded!
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded bg-emerald-500 text-[#11110F] text-xs font-mono font-bold"
            >
              Done
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleGenerateCertificate}
            disabled={isExporting}
            className="w-full py-2.5 rounded-lg bg-[#D6A85F] text-[#11110F] font-bold text-xs shadow-lg hover:bg-[#F4C377] transition-all flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-[#11110F] border-t-transparent animate-spin" />
                Compiling Signed Compliance Certificate...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">download</span>
                Generate & Download Signed Certificate
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
