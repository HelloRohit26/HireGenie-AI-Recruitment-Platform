import React from 'react';
import { JobRequisition } from '../../types';

interface ActiveJobsListProps {
  jobs: JobRequisition[];
  onSelectJob?: (jobId: string) => void;
}

export const ActiveJobsList: React.FC<ActiveJobsListProps> = ({ jobs, onSelectJob }) => {
  return (
    <div className="bg-[#181815] dark:bg-[#181815] light:bg-[#FAF8F2] border border-[#2A2A28] dark:border-[#2A2A28] light:border-[#E2DEC5] rounded-lg p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-[#F4F1E9] dark:text-[#F4F1E9] light:text-[#171714] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#D6A85F] text-lg">work</span>
            Active Requisitions ({jobs.length})
          </h2>
          <p className="text-xs text-[#A1A19A] dark:text-[#A1A19A] light:text-[#587C6D] mt-0.5 font-mono">
            Open roles with automated AI screening & candidate triage
          </p>
        </div>
        <button 
          onClick={() => onSelectJob && onSelectJob('/recruiter/jobs')}
          className="text-xs text-[#D6A85F] hover:underline font-mono flex items-center gap-1"
        >
          View all requisitions →
        </button>
      </div>

      {/* JOBS LIST TABLE / CARDS */}
      <div className="space-y-2.5">
        {jobs.map((job) => (
          <div
            key={job.id}
            onClick={() => onSelectJob && onSelectJob(`/recruiter/jobs/${job.id}`)}
            className="group bg-[#11110F] border border-[#2A2A28] hover:border-[#D6A85F] rounded-lg p-4 transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            tabIndex={0}
            role="button"
            aria-label={`Job Requisition ${job.title}: ${job.applicantsCount} applicants, ${job.shortlistedCount} shortlisted, ${job.interviewsCount} interviews.`}
          >
            {/* LEFT JOB TITLE & DEPT */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5 mb-1">
                <h3 className="text-sm font-bold text-[#F4F1E9] group-hover:text-[#F4C377] transition-colors truncate">
                  {job.title}
                </h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${job.statusBadgeColor}`}>
                  {job.status}
                </span>
              </div>
              <p className="text-xs text-[#A1A19A] truncate font-mono">
                {job.department} • {job.location}
              </p>
            </div>

            {/* RIGHT APPLICANT METRICS & ACTION */}
            <div className="flex items-center gap-6 text-xs font-mono text-[#E5E2DE] shrink-0">
              <div className="text-center sm:text-right">
                <span className="block font-bold text-sm text-[#F4F1E9]">
                  {job.applicantsCount.toLocaleString()}
                </span>
                <span className="text-[10px] text-[#A1A19A]">Applicants</span>
              </div>

              <div className="text-center sm:text-right">
                <span className="block font-bold text-sm text-[#D6A85F]">
                  {job.shortlistedCount}
                </span>
                <span className="text-[10px] text-[#A1A19A]">Shortlisted</span>
              </div>

              <div className="text-center sm:text-right">
                <span className="block font-bold text-sm text-teal-400">
                  {job.interviewsCount}
                </span>
                <span className="text-[10px] text-[#A1A19A]">Interviews</span>
              </div>

              <span className="material-symbols-outlined text-[#A1A19A] group-hover:text-[#F4C377] group-hover:translate-x-1 transition-all">
                arrow_forward
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
