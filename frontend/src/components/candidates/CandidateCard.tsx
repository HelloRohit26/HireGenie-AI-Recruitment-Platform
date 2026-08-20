import React from 'react';
import { Candidate, CandidateStatus } from '../../types';
import { InteractiveTiltCard } from '../ui/InteractiveTiltCard';

interface CandidateCardProps {
  candidate: Candidate;
  onClick: () => void;
  onStatusChange?: (candidateId: string, newStatus: CandidateStatus) => void;
  showQuickActions?: boolean;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  onClick,
  onStatusChange,
  showQuickActions = true
}) => {
  const statusColors: Record<string, string> = {
    'Applied': 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] border-[var(--border)]',
    'Screening': 'bg-[var(--status-warning)]/15 text-[var(--status-warning)] border-[var(--status-warning)]/30',
    'Shortlisted': 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border-[var(--accent-primary)]/30',
    'Interview': 'bg-[var(--accent-supporting)]/15 text-[var(--accent-supporting)] border-[var(--accent-supporting)]/30',
    'Final Review': 'bg-[var(--status-success)]/15 text-[var(--status-success)] border-[var(--status-success)]/30',
    'Offered': 'bg-[var(--accent-secondary)]/15 text-[var(--accent-secondary)] border-[var(--accent-secondary)]/30',
    'Hired': 'bg-[var(--status-success)]/20 text-[var(--status-success)] border-[var(--status-success)]/40',
    'Rejected': 'bg-[var(--status-error)]/15 text-[var(--status-error)] border-[var(--status-error)]/30'
  };

  const allStatuses: CandidateStatus[] = [
    'Applied', 'Screening', 'Shortlisted', 'Interview', 'Final Review', 'Offered', 'Hired', 'Rejected'
  ];

  const scoreColor = candidate.aiScore >= 85 ? 'text-[var(--status-success)]' :
                     candidate.aiScore >= 70 ? 'text-[var(--accent-primary)]' :
                     candidate.aiScore >= 50 ? 'text-[var(--status-warning)]' :
                     'text-[var(--status-error)]';

  return (
    <InteractiveTiltCard
      onClick={onClick}
      className="p-4 group cursor-pointer flex flex-col justify-between hover:border-[var(--accent-primary)]"
    >
      <div tabIndex={0} role="button" aria-label={`Candidate ${candidate.name}, ${candidate.title}, AI Score ${candidate.aiScore}`}>
        {/* Top: Avatar + Name + Score */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/40 flex items-center justify-center font-bold text-xs text-[var(--accent-primary)] shrink-0 group-hover:scale-105 transition-transform">
              {candidate.avatar}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--accent-primary)] transition-colors">
                {candidate.name}
              </h3>
              <p className="text-[10px] text-[var(--text-secondary)] font-mono truncate">
                {candidate.title}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className={`text-lg font-mono font-bold ${scoreColor}`}>
              {candidate.aiScore}
            </div>
            <div className="text-[8px] uppercase tracking-wider text-[var(--text-muted)] font-mono">AI Score</div>
          </div>
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1 mb-3">
          {candidate.skills.slice(0, 4).map((skill, i) => (
            <span
              key={i}
              className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition-colors ${
                skill.matched
                  ? 'bg-[var(--accent-secondary)]/15 text-[var(--accent-secondary)] border-[var(--accent-secondary)]/30'
                  : 'bg-[var(--surface-elevated)] text-[var(--text-muted)] border-[var(--border)]'
              }`}
            >
              {skill.name}
            </span>
          ))}
          {candidate.skills.length > 4 && (
            <span className="text-[9px] font-mono text-[var(--text-muted)] px-1.5 py-0.5">
              +{candidate.skills.length - 4}
            </span>
          )}
        </div>
      </div>

      {/* Bottom: Job + Status Selector */}
      <div className="pt-2 border-t border-[var(--border)] space-y-2">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-[var(--text-secondary)] truncate">{candidate.jobTitle}</span>
          
          {showQuickActions && onStatusChange ? (
            <select
              value={candidate.status}
              onClick={e => e.stopPropagation()}
              onChange={e => {
                e.stopPropagation();
                onStatusChange(candidate.id, e.target.value as CandidateStatus);
              }}
              className={`px-1.5 py-0.5 rounded border text-[9px] font-bold outline-none cursor-pointer ${statusColors[candidate.status] || ''}`}
            >
              {allStatuses.map(s => (
                <option key={s} value={s} className="bg-[var(--surface)] text-[var(--text-primary)]">
                  {s}
                </option>
              ))}
            </select>
          ) : (
            <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${statusColors[candidate.status] || ''}`}>
              {candidate.status}
            </span>
          )}
        </div>
      </div>
    </InteractiveTiltCard>
  );
};
