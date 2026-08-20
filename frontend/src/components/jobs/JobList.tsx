import React from 'react';
import { JobRequisition } from '../../types';
import { JobRow } from './JobRow';

interface JobListProps {
  jobs: JobRequisition[];
  onViewJob: (jobId: string) => void;
  onEditJob: (jobId: string) => void;
  onPauseJob: (job: JobRequisition) => void;
}

export const JobList: React.FC<JobListProps> = ({
  jobs,
  onViewJob,
  onEditJob,
  onPauseJob
}) => {
  if (jobs.length === 0) {
    return (
      <div className="bg-[#181815] dark:bg-[#181815] light:bg-[#FAF8F2] border border-[#2A2A28] rounded-lg p-12 text-center space-y-3">
        <span className="material-symbols-outlined text-4xl text-[#A1A19A]">work_off</span>
        <h3 className="text-base font-bold text-[#F4F1E9]">No job requisitions match your criteria</h3>
        <p className="text-xs text-[#A1A19A] font-mono max-w-sm mx-auto">
          Try clearing your search query, adjusting department or location filters, or changing the status filter.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3" role="feed" aria-label="Job requisitions list">
      {/* DESKTOP COLUMN HEADERS */}
      <div className="hidden lg:grid lg:grid-cols-12 lg:items-center px-4 py-2 text-[11px] font-mono uppercase tracking-wider text-[#A1A19A]">
        <div className="col-span-4">Requisition & Role</div>
        <div className="col-span-3 text-center">Talent Metrics</div>
        <div className="col-span-3 text-center">Hiring Progress</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      {/* JOB ROWS */}
      {jobs.map(job => (
        <JobRow
          key={job.id}
          job={job}
          onViewJob={onViewJob}
          onEditJob={onEditJob}
          onPauseJob={onPauseJob}
        />
      ))}
    </div>
  );
};
