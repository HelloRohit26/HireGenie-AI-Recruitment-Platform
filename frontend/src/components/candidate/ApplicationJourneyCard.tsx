import React, { useState } from 'react';
import { CandidateJourneyData, CandidateJourneyStage, CandidateTimelineEvent } from '../../types';

interface ApplicationJourneyCardProps {
  journey: CandidateJourneyData;
  isExpandedDefault?: boolean;
  onNavigate?: (route: string) => void;
  onRetryScreening?: (applicationId: number) => Promise<void>;
}

export const ApplicationJourneyCard: React.FC<ApplicationJourneyCardProps> = ({
  journey,
  isExpandedDefault = false,
  onNavigate,
  onRetryScreening
}) => {
  const [isExpanded, setIsExpanded] = useState(isExpandedDefault);
  const [isRetrying, setIsRetrying] = useState(false);

  const { application, job, candidate, agent_telemetry, interview_invitation, job_offer, tracking_stages, timeline, is_processing } = journey;

  const appStatus = (application.status || 'APPLIED').toUpperCase();
  const isRejected = appStatus === 'REJECTED';
  const isHired = appStatus === 'HIRED' || (job_offer && job_offer.status === 'OFFER_ACCEPTED');
  const isOffered = appStatus === 'OFFERED' || (job_offer && job_offer.status === 'OFFERED');

  const formatTimestamp = (ts?: string | null) => {
    if (!ts) return 'Pending';
    try {
      const d = new Date(ts);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return ts;
    }
  };

  const getStatusBadge = () => {
    if (isHired) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          HIRED 🎉
        </span>
      );
    }
    if (isOffered) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#D6A85F]/20 text-[#F4C377] border border-[#D6A85F]/40 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D6A85F]"></span>
          OFFER EXTENDED
        </span>
      );
    }
    if (isRejected) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
          NOT SELECTED
        </span>
      );
    }
    if (appStatus === 'SHORTLISTED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#79A89A]/20 text-[#79A89A] border border-[#79A89A]/40">
          <span className="w-1.5 h-1.5 rounded-full bg-[#79A89A]"></span>
          SHORTLISTED
        </span>
      );
    }
    if (is_processing) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
          AI SCREENING
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-neutral-700/30 text-neutral-300 border border-neutral-600/40">
        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400"></span>
        {appStatus}
      </span>
    );
  };

  const handleRetry = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onRetryScreening || isRetrying) return;
    setIsRetrying(true);
    try {
      await onRetryScreening(application.id);
    } finally {
      setIsRetrying(false);
    }
  };

  const activeAgents = agent_telemetry.filter(t => t.status === 'PROCESSING');

  return (
    <div className="bg-[#181815] border border-[#2A2A28] hover:border-[#3A3A36] rounded-xl overflow-hidden shadow-lg transition-all duration-200">
      {/* CARD HEADER / MAIN SUMMARY */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-5 cursor-pointer hover:bg-[#1C1C19] transition-colors select-none"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* LEFT: JOB & COMPANY SPECS */}
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#79A89A]/15 border border-[#79A89A]/30 flex items-center justify-center font-bold text-xs text-[#79A89A] shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-lg">work</span>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-base font-bold text-[#F4F1E9] truncate hover:text-[#79A89A] transition-colors">
                  {job.title}
                </h2>
                {getStatusBadge()}
              </div>
              <p className="text-xs text-[#A1A19A] font-mono flex flex-wrap items-center gap-2">
                <span className="text-[#F4F1E9] font-semibold">{job.company}</span>
                <span>•</span>
                <span>{job.department}</span>
                <span>•</span>
                <span>{job.location}</span>
                {job.salary_range && (
                  <>
                    <span>•</span>
                    <span className="text-[#D6A85F] font-bold">{job.salary_range}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* RIGHT: MATCH SCORE & ACTIONS */}
          <div className="flex items-center justify-between lg:justify-end gap-4 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#2A2A28]/60">
            <div className="text-left lg:text-right">
              {application.overall_match_score !== null && application.overall_match_score !== undefined ? (
                <div className="flex items-center lg:justify-end gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#79A89A]">psychology</span>
                  <span className="text-sm font-mono font-bold text-[#79A89A]">
                    {application.overall_match_score.toFixed(1)}% AI Score
                  </span>
                  {application.rank && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#79A89A]/20 text-[#79A89A] border border-[#79A89A]/30">
                      Rank #{application.rank}
                    </span>
                  )}
                </div>
              ) : is_processing ? (
                <div className="flex items-center lg:justify-end gap-1.5 text-xs font-mono text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                  <span>Screening in progress...</span>
                </div>
              ) : (
                <div className="text-xs font-mono text-[#A1A19A]">
                  Score pending
                </div>
              )}
              <div className="text-[10px] text-[#A1A19A] font-mono mt-0.5">
                Applied {formatTimestamp(application.applied_at)}
              </div>
            </div>

            <button
              type="button"
              className="p-1.5 rounded-lg text-[#A1A19A] hover:text-[#F4F1E9] hover:bg-[#20201C] transition-colors"
              aria-label={isExpanded ? "Collapse details" : "Expand details"}
            >
              <span className="material-symbols-outlined text-xl transition-transform duration-200">
                {isExpanded ? 'expand_less' : 'expand_more'}
              </span>
            </button>
          </div>
        </div>

        {/* REAL-TIME JOURNEY PIPELINE TRACKER */}
        <div className="mt-5 pt-4 border-t border-[#2A2A28]/60">
          <div className="grid grid-cols-5 gap-2 relative">
            {tracking_stages.map((st, idx) => {
              const isCompleted = st.status === 'COMPLETED';
              const isActive = st.status === 'ACTIVE';
              const isFailed = st.status === 'FAILED';
              const isNotApp = st.status === 'NOT_APPLICABLE';

              let iconName = 'check';
              let badgeColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
              let textColor = 'text-[#F4F1E9]';

              if (isActive) {
                iconName = 'progress_activity';
                badgeColor = 'bg-[#79A89A] text-[#11110F] shadow-lg shadow-[#79A89A]/30 ring-4 ring-[#79A89A]/20';
                textColor = 'text-[#79A89A] font-bold';
              } else if (isFailed) {
                iconName = 'close';
                badgeColor = 'bg-rose-500/20 text-rose-400 border-rose-500/40';
                textColor = 'text-rose-400';
              } else if (isNotApp) {
                iconName = 'remove';
                badgeColor = 'bg-neutral-800/40 text-neutral-600 border-neutral-700/40';
                textColor = 'text-neutral-600';
              } else if (!isCompleted) {
                iconName = 'schedule';
                badgeColor = 'bg-[#11110F] text-[#A1A19A] border border-[#2A2A28]';
                textColor = 'text-[#A1A19A]';
              }

              return (
                <div key={st.id} className="flex flex-col items-center text-center space-y-1.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${badgeColor}`}>
                    <span className={`material-symbols-outlined text-[15px] ${isActive ? 'animate-spin' : ''}`}>
                      {iconName}
                    </span>
                  </div>
                  <span className={`text-[11px] font-mono leading-tight truncate w-full ${textColor}`}>
                    {st.name}
                  </span>
                  <span className="text-[9px] text-[#A1A19A] font-mono hidden sm:block line-clamp-1">
                    {st.status === 'COMPLETED' ? 'Done' : (st.status === 'ACTIVE' ? 'In progress' : (st.status === 'FAILED' ? 'Not selected' : 'Waiting'))}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* LIVE AUTONOMOUS AGENT TELEMETRY STRIP */}
        {activeAgents.length > 0 && (
          <div className="mt-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2 text-xs font-mono text-amber-300">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm animate-spin">sync</span>
              <span><strong>Autonomous Processing:</strong> {activeAgents.map(a => a.agent_name).join(', ')}</span>
            </div>
            <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded font-bold">Live Telemetry</span>
          </div>
        )}
      </div>

      {/* EXPANDED DETAILS DRAWER */}
      {isExpanded && (
        <div className="px-5 pb-5 pt-3 border-t border-[#2A2A28] bg-[#141412] space-y-5 animate-fadeIn">
          
          {/* CALLOUT ACTIONS (INTERVIEW, OFFER, RETRY) */}
          {/* 1. Voice Interview Invitation Ready */}
          {interview_invitation && (interview_invitation.status === 'INVITED' || interview_invitation.status === 'ACCEPTED' || interview_invitation.status === 'READY' || interview_invitation.status === 'SCHEDULED' || application.status === 'INTERVIEW_SCHEDULED' || application.status === 'SHORTLISTED') && !isRejected && (
            <div className="p-4 bg-gradient-to-r from-[#D6A85F]/20 via-[#79A89A]/15 to-[#D6A85F]/20 border border-[#D6A85F]/50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl animate-fadeIn">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#F4C377] text-xl animate-pulse">mic</span>
                  <h3 className="text-sm font-bold text-[#F4F1E9]">Voice AI Interview Ready — You Are Shortlisted!</h3>
                </div>
                <p className="text-xs text-[#A1A19A] font-mono">
                  Autonomous WebRTC voice assessment for <strong>{job.title}</strong> at <strong>{job.company}</strong>. Click below to begin speaking with your AI Interviewer.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  id="start-voice-interview-journey-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate?.(`/interview/${interview_invitation.invitation_token}/room?autostart=true`);
                  }}
                  className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#D6A85F] via-[#F4C377] to-[#D6A85F] text-[#11110F] text-xs font-bold font-mono hover:bg-[#F4C377] shadow-lg shadow-[#D6A85F]/25 hover:scale-105 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">phone_in_talk</span>
                  <span>START VOICE INTERVIEW NOW</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate?.(`/interview/${interview_invitation.invitation_token}/prep`);
                  }}
                  className="px-3 py-2.5 rounded-lg bg-[#181815] border border-[#3A3A36] text-[#A1A19A] hover:text-[#F4F1E9] text-xs font-mono transition flex items-center gap-1 cursor-pointer"
                  title="Test microphone and audio before entering"
                >
                  <span className="material-symbols-outlined text-sm">tune</span>
                  <span className="hidden md:inline">Setup</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. Official Job Offer Extended */}
          {job_offer && job_offer.status === 'OFFERED' && (
            <div className="p-4 bg-gradient-to-r from-emerald-500/20 to-[#79A89A]/20 border border-emerald-500/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-400 text-lg">celebration</span>
                  <h3 className="text-sm font-bold text-[#F4F1E9]">Official Job Offer Extended!</h3>
                </div>
                <p className="text-xs text-[#A1A19A] font-mono">
                  Role: <strong>{job_offer.role_title}</strong> • Compensation: <strong>{job_offer.compensation || 'Competitive'}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate?.(`/offer/${job_offer.offer_token}`);
                }}
                className="px-4 py-2 rounded-lg bg-emerald-500 text-[#11110F] text-xs font-bold font-mono hover:bg-emerald-400 shadow-md transition flex items-center justify-center gap-1.5 shrink-0"
              >
                <span>VIEW & RESPOND TO OFFER</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          )}

          {/* 3. Rejection Explainability / Feedback */}
          {isRejected && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-rose-300 text-xs font-bold font-mono">
                <span className="material-symbols-outlined text-sm">info</span>
                <span>Application Feedback & Status</span>
              </div>
              <p className="text-xs text-[#A1A19A]">
                {application.rejection_reason || "Thank you for applying. After reviewing candidate qualifications against requisition rubrics, we have decided to move forward with other candidates whose skill profile aligns more closely with our current technical stack requirements."}
              </p>
            </div>
          )}

          {/* 4. Screening Execution Retry (if Failed) */}
          {appStatus === 'FAILED' && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-rose-300">
                <span className="material-symbols-outlined text-sm">error</span>
                <span>Screening encountered a recoverable error.</span>
              </div>
              <button
                type="button"
                onClick={handleRetry}
                disabled={isRetrying}
                className="px-3 py-1.5 rounded bg-rose-500 text-white text-xs font-bold font-mono hover:bg-rose-600 shadow transition flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">{isRetrying ? 'sync' : 'refresh'}</span>
                <span>{isRetrying ? 'Retrying...' : 'Retry Screening'}</span>
              </button>
            </div>
          )}

          {/* SCORE BREAKDOWN GRID */}
          {application.score_breakdown && Object.keys(application.score_breakdown).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-bold text-[#A1A19A] uppercase tracking-wider">
                Autonomous Rubric Evaluation Breakdown
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(application.score_breakdown).map(([category, val]) => (
                  <div key={category} className="bg-[#181815] border border-[#2A2A28] rounded-lg p-2.5">
                    <span className="text-[10px] text-[#A1A19A] font-mono block capitalize">
                      {category.replace('_', ' ')}
                    </span>
                    <span className="text-sm font-bold font-mono text-[#F4F1E9]">
                      {typeof val === 'number' ? `${val.toFixed(1)}%` : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* REAL CHRONOLOGICAL TIMELINE */}
          <div className="space-y-2 pt-2 border-t border-[#2A2A28]/60">
            <h4 className="text-xs font-mono font-bold text-[#A1A19A] uppercase tracking-wider flex items-center justify-between">
              <span>Chronological Application Timeline</span>
              <span className="text-[10px] text-[#79A89A] font-normal">Real PostgreSQL Events</span>
            </h4>

            {timeline.length === 0 ? (
              <p className="text-xs text-[#A1A19A] font-mono">No timeline events recorded yet.</p>
            ) : (
              <div className="space-y-2.5 relative pl-4 border-l border-[#2A2A28] ml-2">
                {timeline.map((evt, idx) => (
                  <div key={`${evt.key}-${idx}`} className="relative pl-3">
                    {/* Bullet */}
                    <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 bg-[#181815] ${
                      evt.status === 'SUCCESS' ? 'border-emerald-400 bg-emerald-500/30' : (evt.status === 'FAILED' ? 'border-rose-400 bg-rose-500/30' : 'border-[#79A89A] bg-[#79A89A]/30 animate-pulse')
                    }`} />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-xs font-bold text-[#F4F1E9]">{evt.title}</span>
                      <span className="text-[10px] text-[#A1A19A] font-mono">{formatTimestamp(evt.timestamp)}</span>
                    </div>
                    <p className="text-xs text-[#A1A19A] font-mono mt-0.5">{evt.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AGENT TELEMETRY LOGS */}
          {agent_telemetry.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#2A2A28]/60">
              <h4 className="text-xs font-mono font-bold text-[#A1A19A] uppercase tracking-wider">
                Autonomous Agent Telemetry
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {agent_telemetry.map(agent => (
                  <div key={agent.id} className="p-2.5 rounded-lg bg-[#181815] border border-[#2A2A28] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#F4F1E9] truncate">{agent.agent_name}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                        agent.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300' : (agent.status === 'PROCESSING' ? 'bg-amber-500/20 text-amber-300 animate-pulse' : 'bg-neutral-800 text-neutral-400')
                      }`}>
                        {agent.status}
                      </span>
                    </div>
                    {agent.duration_ms && (
                      <span className="text-[10px] text-[#A1A19A] font-mono block">
                        Latency: {agent.duration_ms.toFixed(0)}ms
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
