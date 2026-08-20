import React from 'react';
import { JobPipelineBreakdown } from '../../types';

interface JobProgressProps {
  pipeline?: JobPipelineBreakdown;
}

export const JobProgress: React.FC<JobProgressProps> = ({ pipeline }) => {
  const safePipeline = pipeline || { applicants: 0, shortlisted: 0, interviews: 0, offers: 0, hired: 0 };
  const applicants = safePipeline.applicants ?? 0;
  const shortlisted = safePipeline.shortlisted ?? 0;
  const interviews = safePipeline.interviews ?? 0;
  const offers = safePipeline.offers ?? 0;

  const total = Math.max(1, applicants);

  const shortlistedWidth = Math.max(8, (shortlisted / total) * 100);
  const interviewsWidth = Math.max(5, (interviews / total) * 100);
  const offersWidth = Math.max(3, (offers / total) * 100);

  return (
    <div className="w-full max-w-[200px]" aria-label="Hiring funnel progress breakdown">
      {/* COMPACT SEGMENTED FUNNEL BAR */}
      <div className="h-2 w-full bg-[var(--surface-elevated)] rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-[var(--border)]">
        <div 
          className="h-full bg-[var(--status-warning)]/80 rounded-l-full transition-all duration-300" 
          style={{ width: `${shortlistedWidth}%` }}
          title={`Shortlisted: ${shortlisted}`}
        />
        <div 
          className="h-full bg-[var(--accent-supporting)]/80 transition-all duration-300" 
          style={{ width: `${interviewsWidth}%` }}
          title={`Interviews: ${interviews}`}
        />
        <div 
          className="h-full bg-[var(--status-success)]/90 rounded-r-full transition-all duration-300" 
          style={{ width: `${offersWidth}%` }}
          title={`Offers: ${offers}`}
        />
      </div>

      {/* METRIC DESCRIPTORS */}
      <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-secondary)] mt-1">
        <span title="Applicants">{applicants.toLocaleString()} App</span>
        <span>→</span>
        <span title="Shortlisted" className="text-[var(--status-warning)] font-semibold">{shortlisted} Short</span>
        <span>→</span>
        <span title="Interviews" className="text-[var(--accent-supporting)]">{interviews} Int</span>
        <span>→</span>
        <span title="Offers" className="text-[var(--status-success)] font-bold">{offers} Off</span>
      </div>
    </div>
  );
};
