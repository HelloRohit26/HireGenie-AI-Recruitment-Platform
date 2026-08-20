import React, { useState, useEffect, useMemo } from 'react';
import { RecruiterShell } from '../components/layout/RecruiterShell';
import { PageTransition } from '../components/ui/PageTransition';
import { candidateService } from '../services/candidateService';
import { Candidate, InterviewItem, InterviewStatus } from '../types';

interface InterviewsPageProps {
  onNavigate?: (route: string) => void;
}

export const InterviewsPage: React.FC<InterviewsPageProps> = ({ onNavigate }) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    candidateService.getCandidates()
      .then(res => setCandidates(res.data || []))
      .catch(() => setCandidates([]))
      .finally(() => setIsLoading(false));
  }, []);

  const interviewsList: InterviewItem[] = useMemo(() => {
    return candidates
      .filter(c => c.status === 'Interview' || c.status === 'Shortlisted')
      .map((c) => ({
        id: c.id,
        candidateId: c.id,
        jobId: c.jobId || '1',
        interviewer: 'HireGenie AI Voice Agent',
        candidateName: c.name,
        candidateAvatar: c.avatar,
        jobTitle: c.jobTitle,
        type: 'AI Voice',
        scheduledDate: c.appliedDate || 'Date unavailable',
        scheduledTime: '10:00 AM',
        duration: '15 min',
        status: (c.status === 'Interview' ? 'Scheduled' : 'Scheduled') as InterviewStatus,
        statusColor: 'bg-[#D6A85F]/20 text-[#F4C377] border-[#D6A85F]/40',
        score: c.aiScore || undefined,
        recommendation: c.aiScore >= 80 ? 'Strong Recommend' : 'Needs Review'
      }));
  }, [candidates]);

  const statuses: InterviewStatus[] = ['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'No Show'];

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return interviewsList;
    return interviewsList.filter(i => i.status === statusFilter);
  }, [statusFilter, interviewsList]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: interviewsList.length };
    interviewsList.forEach(i => { counts[i.status] = (counts[i.status] || 0) + 1; });
    return counts;
  }, [interviewsList]);

  const statusColors: Record<string, string> = {
    'Scheduled': 'bg-[#D6A85F]/20 text-[#F4C377] border-[#D6A85F]/40 light:text-[#8B6914] light:bg-[#D6A85F]/15',
    'In Progress': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 light:text-emerald-700 light:bg-emerald-100',
    'Completed': 'bg-[#79A89A]/20 text-[#79A89A] border-[#79A89A]/40 light:text-[#3D6B5C] light:bg-[#79A89A]/15',
    'Cancelled': 'bg-neutral-500/20 text-neutral-400 border-neutral-500/40 light:text-neutral-600 light:bg-neutral-200',
    'No Show': 'bg-[#C97C5D]/20 text-[#C97C5D] border-[#C97C5D]/40 light:text-[#8B4A2D] light:bg-[#C97C5D]/15'
  };

  const typeIcons: Record<string, string> = {
    'AI Voice': 'smart_toy',
    'Technical': 'code',
    'Behavioral': 'psychology',
    'Final Round': 'groups'
  };

  return (
    <RecruiterShell activeRoute="/recruiter/interviews" onNavigate={onNavigate}>
      <PageTransition routeKey="/recruiter/interviews">
        <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A2A28] dark:border-[#2A2A28] light:border-[#E2DEC5] pb-4">
          <div>
            <h1 className="text-xl font-bold text-[#F4F1E9] dark:text-[#F4F1E9] light:text-[#171714] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#D6A85F]">video_camera_front</span>
              Interviews
            </h1>
            <p className="text-xs text-[#A1A19A] dark:text-[#A1A19A] light:text-[#587C6D] mt-0.5 font-mono">
              Manage AI voice interviews, technical rounds, and scheduling.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-mono font-bold text-[#F4C377]">{interviewsList.length}</span>
            <span className="text-xs text-[#A1A19A] font-mono">Total Interviews</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {statuses.map(s => (
            <div key={s} className="bg-[#181815] dark:bg-[#181815] light:bg-[#FAF8F2] border border-[#2A2A28] dark:border-[#2A2A28] light:border-[#E2DEC5] rounded-lg p-3 text-center">
              <div className="text-lg font-mono font-bold text-[#F4F1E9] dark:text-[#F4F1E9] light:text-[#171714]">{statusCounts[s] || 0}</div>
              <div className="text-[9px] text-[#A1A19A] uppercase tracking-wider font-mono">{s}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-md text-[10px] font-bold whitespace-nowrap transition-all ${
              statusFilter === 'all'
                ? 'bg-[#D6A85F]/20 text-[#F4C377] border border-[#D6A85F]/40'
                : 'text-[#A1A19A] hover:text-[#F4F1E9] border border-transparent'
            }`}
          >
            All ({statusCounts.all})
          </button>
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold whitespace-nowrap transition-all ${
                statusFilter === s
                  ? 'bg-[#D6A85F]/20 text-[#F4C377] border border-[#D6A85F]/40'
                  : 'text-[#A1A19A] hover:text-[#F4F1E9] border border-transparent'
              }`}
            >
              {s} ({statusCounts[s] || 0})
            </button>
          ))}
        </div>

        {/* Interview List */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="bg-[#181815] rounded-xl p-12 border border-[#2A2A28] text-center">
              <span className="material-symbols-outlined text-4xl text-[#A1A19A] opacity-50 block mb-3">event_busy</span>
              <p className="text-sm font-bold text-[#F4F1E9]">No interviews scheduled yet</p>
              <p className="text-xs text-[#A1A19A] font-mono mt-1">Interviews will appear once shortlisted candidates reach the interview stage.</p>
            </div>
          ) : (
            filtered.map(interview => (
              <div
                key={interview.id}
                className="bg-[#181815] dark:bg-[#181815] light:bg-[#FAF8F2] border border-[#2A2A28] dark:border-[#2A2A28] light:border-[#E2DEC5] rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(expandedId === interview.id ? null : interview.id)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-[#20201C] dark:hover:bg-[#20201C] light:hover:bg-[#F0EDE0] transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-[#D6A85F]/20 border border-[#D6A85F]/40 flex items-center justify-center font-bold text-xs text-[#F4C377] shrink-0">
                    {interview.candidateAvatar}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-bold text-[#F4F1E9] dark:text-[#F4F1E9] light:text-[#171714] truncate">{interview.candidateName}</span>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${statusColors[interview.status] || ''}`}>
                        {interview.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[#A1A19A] font-mono">
                      <span className="material-symbols-outlined text-xs">{typeIcons[interview.type] || 'event'}</span>
                      <span>{interview.type}</span>
                      <span>•</span>
                      <span>{interview.jobTitle}</span>
                    </div>
                  </div>

                  {/* Schedule & Score */}
                  <div className="flex items-center gap-4 shrink-0 text-right">
                    <div className="hidden sm:block">
                      <div className="text-xs font-mono text-[#F4F1E9] dark:text-[#F4F1E9] light:text-[#171714]">{interview.scheduledDate}</div>
                      <div className="text-[10px] text-[#A1A19A] font-mono">{interview.scheduledTime} • {interview.duration}</div>
                    </div>
                    {interview.score !== undefined && (
                      <span className={`text-sm font-mono font-bold ${
                        interview.score >= 85 ? 'text-emerald-400 light:text-emerald-600' : 'text-[#F4C377] light:text-[#8B6914]'
                      }`}>
                        {interview.score}/100
                      </span>
                    )}
                    <span className="material-symbols-outlined text-[#A1A19A] text-lg">
                      {expandedId === interview.id ? 'expand_less' : 'expand_more'}
                    </span>
                  </div>
                </button>

                {/* Expanded */}
                {expandedId === interview.id && (
                  <div className="px-4 pb-4 pt-2 border-t border-[#2A2A28]/50 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-[#11110F] dark:bg-[#11110F] light:bg-white rounded-lg p-3 border border-[#2A2A28] dark:border-[#2A2A28] light:border-[#E2DEC5]">
                        <div className="text-[9px] text-[#A1A19A] uppercase tracking-wider mb-1">Interviewer</div>
                        <div className="text-xs font-semibold text-[#F4F1E9] dark:text-[#F4F1E9] light:text-[#171714]">{interview.interviewer}</div>
                      </div>
                      <div className="bg-[#11110F] dark:bg-[#11110F] light:bg-white rounded-lg p-3 border border-[#2A2A28] dark:border-[#2A2A28] light:border-[#E2DEC5]">
                        <div className="text-[9px] text-[#A1A19A] uppercase tracking-wider mb-1">Date & Time</div>
                        <div className="text-xs font-semibold text-[#F4F1E9] dark:text-[#F4F1E9] light:text-[#171714]">{interview.scheduledDate} at {interview.scheduledTime}</div>
                      </div>
                      <div className="bg-[#11110F] dark:bg-[#11110F] light:bg-white rounded-lg p-3 border border-[#2A2A28] dark:border-[#2A2A28] light:border-[#E2DEC5]">
                        <div className="text-[9px] text-[#A1A19A] uppercase tracking-wider mb-1">Duration</div>
                        <div className="text-xs font-semibold text-[#F4F1E9] dark:text-[#F4F1E9] light:text-[#171714]">{interview.duration}</div>
                      </div>
                    </div>

                    {interview.notes && (
                      <div className="bg-[#11110F] dark:bg-[#11110F] light:bg-white rounded-lg p-3 border border-[#D6A85F]/30">
                        <h4 className="text-[9px] font-bold text-[#F4C377] uppercase tracking-wider mb-1">Notes</h4>
                        <p className="text-[11px] text-[#E5E2DE] dark:text-[#E5E2DE] light:text-[#171714] leading-relaxed">{interview.notes}</p>
                      </div>
                    )}

                    {interview.magicLink && (
                      <div className="flex items-center gap-2">
                        <button
                          disabled
                          className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded bg-[#D6A85F] text-[#11110F] opacity-70 cursor-not-allowed"
                          title="Magic link — interview joining not implemented in frontend-only mode"
                        >
                          <span className="material-symbols-outlined text-sm">link</span>
                          Magic Link
                        </button>
                        <span className="text-[9px] text-[#A1A19A] font-mono">Interview link generated</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      </PageTransition>
    </RecruiterShell>
  );
};
