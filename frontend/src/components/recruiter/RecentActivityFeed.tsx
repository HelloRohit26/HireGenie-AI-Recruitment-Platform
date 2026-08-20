import React from 'react';
import { AIActivityItem } from '../../types';

interface RecentActivityFeedProps {
  activities: AIActivityItem[];
  onSelectCandidate?: (candidateName: string) => void;
  onNavigate?: (route: string) => void;
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  activities,
  onSelectCandidate,
  onNavigate
}) => {
  return (
    <div className="bg-[#181815] dark:bg-[#181815] light:bg-[#FAF8F2] border border-[#2A2A28] dark:border-[#2A2A28] light:border-[#E2DEC5] rounded-xl p-5 space-y-4">
      {/* Feed Header */}
      <div className="flex items-center justify-between border-b border-[#2A2A28] dark:border-[#2A2A28] light:border-[#E2DEC5] pb-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#D6A85F] text-lg">auto_awesome</span>
          <h2 className="text-sm font-bold text-[#F4F1E9] dark:text-[#F4F1E9] light:text-[#171714]">
            Recent AI Activity
          </h2>
        </div>
        <button
          onClick={() => onNavigate?.('/recruiter/trust-safety')}
          className="text-[10px] text-[#D6A85F] hover:underline font-mono"
        >
          View Audit Log →
        </button>
      </div>

      {/* Activity List */}
      <div className="space-y-3">
        {activities.map(item => (
          <div
            key={item.id}
            onClick={() => onSelectCandidate?.(item.title)}
            className="group flex items-start gap-3 p-2.5 rounded-lg bg-[#11110F] dark:bg-[#11110F] light:bg-white border border-[#2A2A28]/60 dark:border-[#2A2A28]/60 light:border-[#E2DEC5] hover:border-[#D6A85F] transition-all cursor-pointer"
          >
            {/* Type Indicator */}
            <div className={`mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border shrink-0 ${item.typeBadgeColor}`}>
              {item.type.toUpperCase()}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-[#F4F1E9] dark:text-[#F4F1E9] light:text-[#171714] truncate group-hover:text-[#F4C377] transition-colors">
                {item.title}
              </div>
              <div className="text-[10px] text-[#A1A19A] dark:text-[#A1A19A] light:text-[#587C6D] font-mono truncate">
                {item.jobTitle} • {item.agentName}
              </div>
            </div>

            {/* Time */}
            <span className="text-[9px] text-[#A1A19A]/70 font-mono shrink-0">
              {item.timeAgo}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
