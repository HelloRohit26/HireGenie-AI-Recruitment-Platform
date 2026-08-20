import React from 'react';
import { JobRequisition } from '../../types';

interface PauseJobModalProps {
  job: JobRequisition | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmPause: (jobId: string) => void;
}

export const PauseJobModal: React.FC<PauseJobModalProps> = ({
  job,
  isOpen,
  onClose,
  onConfirmPause
}) => {
  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-[#181815] border border-[#2A2A28] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-5"
        role="dialog"
        aria-labelledby="pause-modal-title"
        aria-describedby="pause-modal-description"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[#C97C5D]/15 border border-[#C97C5D]/30 flex items-center justify-center text-[#C97C5D] shrink-0">
            <span className="material-symbols-outlined text-xl">pause_circle</span>
          </div>
          <div>
            <h3 id="pause-modal-title" className="text-base font-bold text-[#F4F1E9]">
              Pause hiring for this role?
            </h3>
            <p id="pause-modal-description" className="text-xs text-[#A1A19A] mt-1 leading-relaxed">
              New applications for <strong className="text-[#E5E2DE]">{job.title}</strong> will no longer enter the active screening pipeline until resumed.
            </p>
          </div>
        </div>

        <div className="p-3 bg-[#11110F] border border-[#2A2A28] rounded-lg text-[11px] font-mono text-[#A1A19A]">
          <p>Role: {job.title} ({job.department})</p>
          <p>Current Applicants: {job.applicantsCount.toLocaleString()} candidates</p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-[#20201C] text-[#E5E2DE] hover:bg-[#2A2A28] text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirmPause(job.id);
              onClose();
            }}
            className="px-4 py-2 rounded-md bg-[#C97C5D] text-white hover:bg-[#b0674a] text-xs font-bold shadow-md transition-colors"
          >
            Pause Job
          </button>
        </div>
      </div>
    </div>
  );
};
