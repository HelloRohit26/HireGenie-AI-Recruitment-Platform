import React, { useState } from 'react';
import { JobRequisition } from '../../types';
import { JobStatusBadge } from './JobStatusBadge';
import { JobProgress } from './JobProgress';
import { normalizeCanonicalJobStatus } from '../../utils/statusUtils';

interface JobRowProps {
  job: JobRequisition;
  onViewJob: (jobId: string) => void;
  onEditJob: (jobId: string) => void;
  onPauseJob: (job: JobRequisition) => void;
}

export const JobRow: React.FC<JobRowProps> = ({
  job,
  onViewJob,
  onEditJob,
  onPauseJob
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const applicantsCount = job.applicantsCount ?? 0;
  const shortlistedCount = job.shortlistedCount ?? 0;
  const interviewsCount = job.interviewsCount ?? 0;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group bg-[var(--surface)] border rounded-xl p-4 transition-all duration-200 theme-transition ${
        isHovered
          ? 'border-[var(--accent-primary)] bg-[var(--surface-elevated)] shadow-[var(--shadow-md)] -translate-y-0.5'
          : 'border-[var(--border)] shadow-[var(--shadow-sm)]'
      }`}
      tabIndex={0}
      role="article"
      aria-label={`Job Requisition: ${job.title}, ${job.department}, ${job.status}`}
    >
      {/* DESKTOP LAYOUT */}
      <div className="hidden lg:grid lg:grid-cols-12 lg:items-center lg:gap-4">
        {/* TITLE & METADATA (COL 1-4) */}
        <div className="col-span-4 min-w-0">
          <div className="flex items-center gap-2.5 mb-1">
            <h3 className={`text-sm font-bold transition-colors truncate ${
              isHovered ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'
            }`}>
              {job.title}
            </h3>
            <JobStatusBadge status={job.status} />
          </div>
          <p className="text-xs text-[var(--text-secondary)] font-mono truncate">
            {job.department} • {job.location}
          </p>
          <p className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">
            Posted {job.postedDate}
          </p>
        </div>

        {/* METRICS SUMMARY (COL 5-7) */}
        <div className="col-span-3 flex items-center justify-around text-xs font-mono text-center">
          <div>
            <span className="block font-bold text-sm text-[var(--text-primary)]">
              {applicantsCount.toLocaleString()}
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">Applicants</span>
          </div>

          <div>
            <span className="block font-bold text-sm text-[var(--accent-primary)]">
              {shortlistedCount}
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">Shortlisted</span>
          </div>

          <div>
            <span className="block font-bold text-sm text-[var(--accent-supporting)]">
              {interviewsCount}
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">Interviews</span>
          </div>
        </div>

        {/* PIPELINE PROGRESS INDICATOR (COL 8-10) */}
        <div className="col-span-3 flex items-center justify-center">
          <JobProgress pipeline={job.pipeline} />
        </div>

        {/* CONTEXTUAL ACTION BUTTONS (COL 11-12) */}
        <div className="col-span-2 flex items-center justify-end gap-2">
          <button
            onClick={() => onViewJob(job.id)}
            className="px-3 py-1.5 rounded-lg bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-[#171815] text-xs font-bold transition-all active:scale-95"
            title="View Job Workspace"
          >
            View
          </button>
          <button
            onClick={() => onEditJob(job.id)}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors"
            title="Edit Requisition"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
          </button>
          {normalizeCanonicalJobStatus(job.status) === 'OPEN' && (
            <button
              onClick={() => onPauseJob(job)}
              className="p-1.5 rounded-lg text-[var(--status-warning)] hover:bg-[var(--status-warning)]/15 transition-colors"
              title="Pause Requisition"
            >
              <span className="material-symbols-outlined text-[16px]">pause</span>
            </button>
          )}
        </div>
      </div>

      {/* MOBILE / TABLET COMPACT LAYOUT */}
      <div className="lg:hidden space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">{job.title}</h3>
              <JobStatusBadge status={job.status} />
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-mono">{job.department} • {job.location}</p>
          </div>
          <button
            onClick={() => onViewJob(job.id)}
            className="px-3 py-1 rounded-lg bg-[var(--accent-primary)] text-[#171815] text-xs font-bold shrink-0"
          >
            View
          </button>
        </div>

        <JobProgress pipeline={job.pipeline} />

        <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-[var(--border)]">
          <span className="text-[var(--text-muted)]">{job.postedDate}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEditJob(job.id)}
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline"
            >
              Edit
            </button>
            {normalizeCanonicalJobStatus(job.status) === 'OPEN' && (
              <button
                onClick={() => onPauseJob(job)}
                className="text-xs text-[var(--status-warning)] hover:underline"
              >
                Pause
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
