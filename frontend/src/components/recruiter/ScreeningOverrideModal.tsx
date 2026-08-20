import React, { useState } from 'react';
import { ScreeningItem } from '../../types';

interface ScreeningOverrideModalProps {
  item: ScreeningItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOverrideSuccess: (itemId: string, newDecision: 'Shortlisted' | 'Rejected' | 'Manual Review', reason: string) => void;
}

export const ScreeningOverrideModal: React.FC<ScreeningOverrideModalProps> = ({
  item,
  isOpen,
  onClose,
  onOverrideSuccess
}) => {
  const [decision, setDecision] = useState<'Shortlisted' | 'Rejected' | 'Manual Review'>('Shortlisted');
  const [reasonCategory, setReasonCategory] = useState('Domain Expertise');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onOverrideSuccess(item.id, decision, `${reasonCategory}: ${notes || 'Recruiter human override applied.'}`);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg bg-[#181815] border border-[#2A2A28] rounded-xl shadow-2xl shadow-black/70 overflow-hidden animate-fadeIn p-6 space-y-5"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#2A2A28] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#D6A85F]/20 text-[#F4C377] border border-[#D6A85F]/30">
                Human-in-the-Loop Override
              </span>
            </div>
            <h2 className="text-base font-bold text-[#F4F1E9] mt-1">Override AI Decision — {item.candidateName}</h2>
            <p className="text-xs text-[#A1A19A] font-mono">{item.jobTitle} • Current Score: {item.aiScore}%</p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#A1A19A] hover:text-[#F4F1E9] hover:bg-[#20201C] transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Current AI Reasoning Summary */}
        <div className="bg-[#11110F] rounded-lg p-3 border border-[#2A2A28]">
          <div className="text-[9px] text-[#A1A19A] uppercase tracking-wider font-mono mb-1">AI Recommendation</div>
          <p className="text-xs text-[#E5E2DE] font-mono leading-relaxed">{item.reasoning}</p>
        </div>

        {/* Decision Toggle */}
        <div>
          <label className="text-[10px] text-[#A1A19A] uppercase tracking-wider font-mono block mb-1.5">
            New Recruiter Decision
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setDecision('Shortlisted')}
              className={`py-2 px-3 rounded-lg text-xs font-bold font-mono transition-all ${
                decision === 'Shortlisted'
                  ? 'bg-[#79A89A]/20 text-[#79A89A] border border-[#79A89A]/40'
                  : 'bg-[#11110F] text-[#A1A19A] border border-[#2A2A28]'
              }`}
            >
              Shortlist Candidate
            </button>
            <button
              type="button"
              onClick={() => setDecision('Manual Review')}
              className={`py-2 px-3 rounded-lg text-xs font-bold font-mono transition-all ${
                decision === 'Manual Review'
                  ? 'bg-[#D6A85F]/20 text-[#F4C377] border border-[#D6A85F]/40'
                  : 'bg-[#11110F] text-[#A1A19A] border border-[#2A2A28]'
              }`}
            >
              Manual Review
            </button>
            <button
              type="button"
              onClick={() => setDecision('Rejected')}
              className={`py-2 px-3 rounded-lg text-xs font-bold font-mono transition-all ${
                decision === 'Rejected'
                  ? 'bg-[#C97C5D]/20 text-[#C97C5D] border border-[#C97C5D]/40'
                  : 'bg-[#11110F] text-[#A1A19A] border border-[#2A2A28]'
              }`}
            >
              Reject Candidate
            </button>
          </div>
        </div>

        {/* Mandatory Reason */}
        <div>
          <label className="text-[10px] text-[#A1A19A] uppercase tracking-wider font-mono block mb-1.5">
            Audit Reason Category
          </label>
          <select
            value={reasonCategory}
            onChange={e => setReasonCategory(e.target.value)}
            className="w-full bg-[#11110F] border border-[#2A2A28] rounded-lg px-3 py-2 text-xs text-[#F4F1E9] outline-none"
          >
            <option value="Domain Expertise">Strong Domain Expertise (Not Captured by AI Parser)</option>
            <option value="Interview Pass">Direct Referral / Manager Sign-off</option>
            <option value="Requirements Relaxed">Requirement Softened for High Potential</option>
            <option value="Misclassified Skill">AI Parser Skill Misclassification</option>
          </select>
        </div>

        {/* Audit Notes */}
        <div>
          <label className="text-[10px] text-[#A1A19A] uppercase tracking-wider font-mono block mb-1.5">
            Audit Trail Explanation (Saved to Compliance Log)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Explain why the AI recommendation is being overridden..."
            className="w-full bg-[#11110F] border border-[#2A2A28] rounded-lg px-3 py-2 text-xs text-[#F4F1E9] placeholder-[#A1A19A] outline-none focus:border-[#D6A85F] transition-colors resize-none"
          />
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-2.5 rounded-lg bg-[#D6A85F] text-[#11110F] font-bold text-xs shadow-lg hover:bg-[#F4C377] transition-all flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-[#11110F] border-t-transparent animate-spin" />
              Applying Override...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-sm">gavel</span>
              Save Override to Audit Trail
            </>
          )}
        </button>
      </div>
    </div>
  );
};
