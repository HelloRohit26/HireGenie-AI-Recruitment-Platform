import React from 'react';
import { JobRequisition } from '../../types';

interface JobDiscoveryCardProps {
  job: JobRequisition;
  matchPercentage?: number;
  onClick: () => void;
}

export const JobDiscoveryCard: React.FC<JobDiscoveryCardProps> = ({
  job,
  matchPercentage = 92,
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className="group bg-[#181815] border border-[#2A2A28] hover:border-[#79A89A] rounded-xl p-5 transition-all duration-200 cursor-pointer hover:shadow-xl hover:shadow-[#79A89A]/5 hover:-translate-y-0.5 flex flex-col justify-between"
    >
      <div>
        {/* Header: Title + Match Badge */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <h3 className="text-base font-bold text-[#F4F1E9] group-hover:text-[#79A89A] transition-colors">
              {job.title}
            </h3>
            <p className="text-xs text-[#A1A19A] font-mono mt-0.5">
              {job.department} • {job.location}
            </p>
          </div>

          <div className="text-right shrink-0">
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#79A89A]/15 text-[#79A89A] border border-[#79A89A]/30 text-xs font-mono font-bold">
              <span className="material-symbols-outlined text-xs">auto_awesome</span>
              {matchPercentage}% Match
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 my-3">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#11110F] text-[#E5E2DE] border border-[#2A2A28]">
            {job.employmentType ? job.employmentType.replace('_', '-') : 'Full-time'}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#11110F] text-[#E5E2DE] border border-[#2A2A28]">
            {job.salaryRange || 'Competitive'}
          </span>
          {job.screeningEnabled && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#79A89A]/10 text-[#79A89A] border border-[#79A89A]/20">
              AI Screening Enabled
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-[#2A2A28]/60 text-xs font-mono text-[#A1A19A]">
        <span>Posted {job.postedDate || job.createdAt}</span>
        <span className="text-[#79A89A] group-hover:underline flex items-center gap-1 font-bold">
          View & Apply →
        </span>
      </div>
    </div>
  );
};
