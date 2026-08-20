import React from 'react';
import { CandidateStatus } from '../../types';

interface ApplicationTimelineProps {
  currentStatus: CandidateStatus;
  appliedDate: string;
}

export const ApplicationTimeline: React.FC<ApplicationTimelineProps> = ({
  currentStatus,
  appliedDate
}) => {
  const steps = [
    { id: 'Applied', label: 'Applied', desc: 'Application submitted', icon: 'send' },
    { id: 'Screening', label: 'AI Screening', desc: 'Parsing & rubric matching', icon: 'psychology' },
    { id: 'Shortlisted', label: 'Shortlisted', desc: 'Top tier match rank', icon: 'auto_awesome' },
    { id: 'Interview', label: 'Voice AI Interview', desc: 'Autonomous audio session', icon: 'video_camera_front' },
    { id: 'Final Review', label: 'Final Review', desc: 'Recruiter decision bar', icon: 'badge' },
    { id: 'Offered', label: 'Offer Sent', desc: 'Decision bar complete', icon: 'handshake' }
  ];

  const getStepStatus = (stepId: string) => {
    const order = ['Applied', 'Screening', 'Shortlisted', 'Interview', 'Final Review', 'Offered', 'Hired'];
    const currentIndex = order.indexOf(currentStatus);
    const stepIndex = order.indexOf(stepId);

    if (currentStatus === 'Rejected') {
      if (stepId === 'Applied') return 'completed';
      return 'disabled';
    }

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'upcoming';
  };

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center justify-between text-xs font-mono text-[#A1A19A] border-b border-[#2A2A28] pb-2">
        <span>Application Timeline</span>
        <span>Applied on {appliedDate}</span>
      </div>

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-2">
        {steps.map((step, idx) => {
          const status = getStepStatus(step.id);
          const isCompleted = status === 'completed';
          const isActive = status === 'active';

          return (
            <div key={step.id} className="flex-1 flex sm:flex-col items-center gap-2 text-left sm:text-center group">
              {/* Icon Circle */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 transition-all ${
                  isActive
                    ? 'bg-[#79A89A] text-[#11110F] font-bold shadow-lg shadow-[#79A89A]/20 ring-4 ring-[#79A89A]/20'
                    : isCompleted
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-[#11110F] text-[#A1A19A] border border-[#2A2A28]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{step.icon}</span>
              </div>

              {/* Text Label */}
              <div>
                <div className={`text-xs font-bold ${isActive ? 'text-[#79A89A]' : isCompleted ? 'text-[#F4F1E9]' : 'text-[#A1A19A]'}`}>
                  {step.label}
                </div>
                <div className="text-[9px] text-[#A1A19A] font-mono line-clamp-1">{step.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
