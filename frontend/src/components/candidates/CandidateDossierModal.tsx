import React, { useState } from 'react';
import { Candidate, CandidateStatus } from '../../types';
import { AudioWaveformPlayer } from './AudioWaveformPlayer';
import { SkillGraph3D } from '../3d/SkillGraph3D';
import { candidateService } from '../../services/candidateService';

interface CandidateDossierModalProps {
  candidate: Candidate | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (route: string) => void;
  onStatusUpdate?: (candidateId: string, newStatus: CandidateStatus) => void;
}

export const CandidateDossierModal: React.FC<CandidateDossierModalProps> = ({
  candidate,
  isOpen,
  onClose,
  onNavigate,
  onStatusUpdate
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [candidateStatus, setCandidateStatus] = useState<CandidateStatus>(candidate?.status || 'Shortlisted');
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const [isHiring, setIsHiring] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [decisionMessage, setDecisionMessage] = useState<string | null>(null);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  if (!isOpen || !candidate) return null;

  const handleRetryEvaluation = async () => {
    setIsRetrying(true);
    setRetryMessage(null);
    try {
      const res = await candidateService.retryEvaluation(candidate.id);
      if (res.data && res.data.message) {
        setRetryMessage(res.data.message);
      } else {
        setRetryMessage('Evaluation retry queued.');
      }
    } catch (err: any) {
      setRetryMessage(err.message || 'Retry failed');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleHireCandidate = async () => {
    setIsHiring(true);
    setDecisionMessage(null);
    try {
      const res = await candidateService.hireCandidate(candidate.id);
      if (res.data) {
        const msg = res.data.message || res.data.status;
        setDecisionMessage(`\u2705 ${msg}`);
        setCandidateStatus('Offered');
        if (onStatusUpdate) onStatusUpdate(candidate.id, 'Offered');
      }
    } catch (err: any) {
      setDecisionMessage(`\u274C ${err.message || 'Hire failed'}`);
    } finally {
      setIsHiring(false);
    }
  };

  const handleRejectCandidate = async () => {
    setIsRejecting(true);
    setDecisionMessage(null);
    setShowRejectConfirm(false);
    try {
      const res = await candidateService.rejectCandidate(candidate.id);
      if (res.data) {
        const msg = res.data.message || res.data.status;
        setDecisionMessage(`\u274C ${msg}`);
        setCandidateStatus('Rejected');
        if (onStatusUpdate) onStatusUpdate(candidate.id, 'Rejected');
      }
    } catch (err: any) {
      setDecisionMessage(`\u26A0\uFE0F ${err.message || 'Reject failed'}`);
    } finally {
      setIsRejecting(false);
    }
  };

  const screeningScore = candidate.aiScore || 0;
  const scoreColor = screeningScore >= 85 ? 'text-emerald-400' :
                     screeningScore >= 70 ? 'text-[#F4C377]' :
                     screeningScore >= 50 ? 'text-[#C97C5D]' : 'text-red-400';

  const scoreBg = screeningScore >= 85 ? 'bg-emerald-500/20 border-emerald-500/40' :
                  screeningScore >= 70 ? 'bg-[#D6A85F]/20 border-[#D6A85F]/40' :
                  screeningScore >= 50 ? 'bg-[#C97C5D]/20 border-[#C97C5D]/40' :
                  'bg-red-500/20 border-red-500/40';

  const evalData = candidate.interviewEvaluation;
  const offerData = candidate.offer;
  const canMakeDecision = candidate.canMakeDecision || false;
  const isAlreadyDecided = ['Offered', 'Hired', 'Rejected', 'OFFER_DECLINED'].includes(candidateStatus);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'person' },
    { id: 'skills', label: 'Skills', icon: 'code' },
    { id: 'ai', label: 'AI Screening', icon: 'psychology' },
    { id: 'interview', label: 'Interview Evaluation', icon: 'record_voice_over' }
  ];

  const getRecommendationBadge = (rec?: string) => {
    switch (rec) {
      case 'STRONG_HIRE':
        return (
          <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">stars</span> STRONG HIRE
          </span>
        );
      case 'HIRE':
        return (
          <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-[#79A89A]/20 text-[#79A89A] border border-[#79A89A]/40 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">check_circle</span> HIRE
          </span>
        );
      case 'CONSIDER':
        return (
          <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-[#D6A85F]/20 text-[#F4C377] border border-[#D6A85F]/40 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">help</span> CONSIDER
          </span>
        );
      case 'NO_HIRE':
        return (
          <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">cancel</span> NO HIRE
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = () => {
    const s = candidateStatus;
    if (s === 'Offered' || (offerData && offerData.status === 'OFFERED')) {
      return (
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">mail</span> OFFERED
        </span>
      );
    }
    if (s === 'Hired' || (offerData && offerData.status === 'OFFER_ACCEPTED')) {
      return (
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">verified</span> HIRED
        </span>
      );
    }
    if (s === 'Rejected') {
      return (
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">block</span> REJECTED
        </span>
      );
    }
    if (s === 'OFFER_DECLINED' || (offerData && offerData.status === 'OFFER_DECLINED')) {
      return (
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/40 flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">thumb_down</span> OFFER DECLINED
        </span>
      );
    }
    return (
      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#D6A85F]/20 text-[#F4C377] border border-[#D6A85F]/40">
        {candidateStatus}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-3xl max-h-[90vh] bg-[#181815] border border-[#2A2A28] rounded-xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col animate-fadeIn"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[#2A2A28] shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#D6A85F]/20 border-2 border-[#D6A85F]/40 flex items-center justify-center font-bold text-lg text-[#F4C377]">
              {candidate.avatar}
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#F4F1E9]">{candidate.name}</h2>
              <p className="text-xs text-[#A1A19A] font-mono">{candidate.title} \u2022 {candidate.location}</p>
              <p className="text-[10px] text-[#A1A19A] font-mono mt-0.5">
                {candidate.experience} experience \u2022 {candidate.education}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`text-center px-3 py-1.5 rounded-lg border ${scoreBg}`}>
              <div className={`text-lg font-mono font-bold ${scoreColor}`}>{screeningScore}%</div>
              <div className="text-[8px] uppercase tracking-wider text-[#A1A19A] font-mono">Screening Score</div>
            </div>

            {evalData && evalData.status === 'COMPLETED' && evalData.overallScore !== undefined && (
              <div className="text-center px-3 py-1.5 rounded-lg border bg-[#D6A85F]/20 border-[#D6A85F]/40">
                <div className="text-lg font-mono font-bold text-[#F4C377]">{evalData.overallScore}%</div>
                <div className="text-[8px] uppercase tracking-wider text-[#A1A19A] font-mono">Interview Score</div>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-[#A1A19A] hover:text-[#F4F1E9] hover:bg-[#20201C] transition-colors"
              aria-label="Close modal"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-[#2A2A28] shrink-0 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#D6A85F]/15 text-[#F4C377] border-b-2 border-[#D6A85F]'
                  : 'text-[#A1A19A] hover:text-[#F4F1E9]'
              }`}
            >
              <span className="material-symbols-outlined text-sm">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'overview' && (
            <>
              <div className="bg-[#11110F] rounded-lg p-4 border border-[#2A2A28]">
                <h4 className="text-xs font-bold text-[#F4F1E9] mb-2">Candidate Summary</h4>
                <p className="text-xs text-[#A1A19A] leading-relaxed font-mono">
                  {candidate.name} is a {candidate.title} with {candidate.experience} of experience. Top skills include {candidate.skills.slice(0, 3).map(s => s.name).join(', ')}. Scored {screeningScore}% on automated screening.
                </p>
              </div>

              <div className="bg-[#11110F] rounded-lg p-4 border border-[#2A2A28]">
                <h4 className="text-xs font-bold text-[#F4F1E9] mb-2">Primary Competencies</h4>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.skills.map((skill, i) => (
                    <span
                      key={i}
                      className={`text-xs font-mono px-2.5 py-1 rounded border ${
                        skill.matched
                          ? 'bg-[#79A89A]/15 text-[#79A89A] border-[#79A89A]/30'
                          : 'bg-[#C97C5D]/15 text-[#C97C5D] border-[#C97C5D]/30'
                      }`}
                    >
                      {skill.name} \u2022 {skill.score}%
                    </span>
                  ))}
                </div>
              </div>

              {/* Offer Details Card */}
              {offerData && (
                <div className="bg-[#11110F] rounded-lg p-4 border border-amber-500/30 space-y-2">
                  <h4 className="text-xs font-bold text-amber-400 font-mono flex items-center gap-1.5 uppercase tracking-wider">
                    <span className="material-symbols-outlined text-base">description</span>
                    Offer Details
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-[#A1A19A] font-mono block">Role</span>
                      <span className="text-xs text-[#F4F1E9] font-mono">{offerData.roleTitle}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#A1A19A] font-mono block">Compensation</span>
                      <span className="text-xs text-[#F4C377] font-mono font-bold">{offerData.compensation}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#A1A19A] font-mono block">Status</span>
                      <span className={`text-xs font-mono font-bold ${
                        offerData.status === 'OFFER_ACCEPTED' ? 'text-emerald-400' :
                        offerData.status === 'OFFER_DECLINED' ? 'text-orange-400' :
                        'text-amber-400'
                      }`}>{offerData.status.replace(/_/g, ' ')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#A1A19A] font-mono block">Expires</span>
                      <span className="text-[10px] text-[#A1A19A] font-mono">{offerData.expiresAt ? new Date(offerData.expiresAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'skills' && (
            <div className="space-y-3">
              {candidate.skills.map((skill, i) => (
                <div key={i} className="bg-[#11110F] rounded-lg p-3 border border-[#2A2A28] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#F4F1E9]">{skill.name}</span>
                    <span className="text-[10px] text-[#A1A19A] font-mono block">Proficiency score: {skill.score}%</span>
                  </div>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                    skill.matched ? 'bg-[#79A89A]/20 text-[#79A89A] border-[#79A89A]/40' : 'bg-[#C97C5D]/20 text-[#C97C5D] border-[#C97C5D]/40'
                  }`}>
                    {skill.matched ? 'MATCHED' : 'MISSING'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-4 animate-fadeIn">
              <SkillGraph3D candidateName={candidate.name} skills={candidate.skills} size={280} />

              <div className="bg-[#11110F] rounded-lg p-4 border border-[#D6A85F]/30 space-y-2">
                <h4 className="text-xs font-bold text-[#F4C377] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <span className="material-symbols-outlined text-base">psychology</span>
                  Deterministic AI Screening Breakdown
                </h4>
                <p className="text-xs text-[#E5E2DE] leading-relaxed font-mono">
                  Multi-criteria screening match score: {screeningScore}%. Candidate evaluated against job description, required competencies, and resume experience.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'interview' && (
            <div className="space-y-4">
              <AudioWaveformPlayer title={`Autonomous AI Voice Session \u2014 ${candidate.name}`} />

              {!evalData || evalData.status === 'NOT_STARTED' ? (
                <div className="bg-[#11110F] rounded-lg p-5 border border-[#2A2A28] text-center space-y-2">
                  <span className="material-symbols-outlined text-3xl text-[#A1A19A]">assignment_late</span>
                  <h4 className="text-sm font-bold text-[#F4F1E9]">No Evaluation Available</h4>
                  <p className="text-xs text-[#A1A19A] font-mono">
                    {candidate.status === 'Shortlisted' || candidate.status === 'Interview'
                      ? 'The candidate has been invited. Evaluation will automatically execute upon interview completion.'
                      : 'No completed interview session found for this candidate.'}
                  </p>
                </div>
              ) : evalData.status === 'PENDING' || evalData.status === 'ANALYZING' ? (
                <div className="bg-[#11110F] rounded-lg p-5 border border-[#D6A85F]/40 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-2xl text-[#F4C377] animate-spin">progress_activity</span>
                    <div>
                      <h4 className="text-sm font-bold text-[#F4F1E9]">Evaluation in progress...</h4>
                      <p className="text-xs text-[#A1A19A] font-mono">
                        The Evaluation Agent is analyzing candidate interview transcripts, technical depth, and communication skills.
                      </p>
                    </div>
                  </div>
                </div>
              ) : evalData.status === 'FAILED' ? (
                <div className="bg-[#11110F] rounded-lg p-5 border border-red-500/40 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-xl text-red-400">error</span>
                      <h4 className="text-sm font-bold text-red-400">Evaluation Failed</h4>
                    </div>
                    <button
                      type="button"
                      onClick={handleRetryEvaluation}
                      disabled={isRetrying}
                      className="px-3 py-1 rounded bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-bold hover:bg-red-500/30 transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-sm">refresh</span>
                      {isRetrying ? 'Retrying...' : 'Retry Evaluation'}
                    </button>
                  </div>
                  <p className="text-xs text-[#A1A19A] font-mono bg-[#181815] p-3 rounded border border-[#2A2A28]">
                    {evalData.errorMessage || 'REAL AI EVALUATION NOT CONFIGURED'}
                  </p>
                  {retryMessage && (
                    <p className="text-xs text-[#F4C377] font-mono">{retryMessage}</p>
                  )}
                </div>
              ) : evalData.status === 'COMPLETED' && (
                <div className="space-y-4">
                  <div className="bg-[#11110F] rounded-lg p-4 border border-[#D6A85F]/30 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2A2A28] pb-3">
                      <div>
                        <h4 className="text-xs font-bold text-[#F4F1E9] uppercase tracking-wider font-mono">
                          Post-Interview Evaluation Report
                        </h4>
                        <span className="text-[10px] text-[#A1A19A] font-mono block mt-0.5">
                          Autonomous AI Assessment \u2022 Real Transcript Analysis
                        </span>
                      </div>
                      {getRecommendationBadge(evalData.recommendation)}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-[#181815] p-3 rounded border border-[#2A2A28] text-center">
                        <div className="text-sm font-mono font-bold text-[#F4C377]">{evalData.technicalScore}%</div>
                        <div className="text-[9px] uppercase tracking-wider text-[#A1A19A] font-mono mt-0.5">Technical</div>
                      </div>
                      <div className="bg-[#181815] p-3 rounded border border-[#2A2A28] text-center">
                        <div className="text-sm font-mono font-bold text-[#F4C377]">{evalData.problemSolvingScore}%</div>
                        <div className="text-[9px] uppercase tracking-wider text-[#A1A19A] font-mono mt-0.5">Problem Solving</div>
                      </div>
                      <div className="bg-[#181815] p-3 rounded border border-[#2A2A28] text-center">
                        <div className="text-sm font-mono font-bold text-[#F4C377]">{evalData.communicationScore}%</div>
                        <div className="text-[9px] uppercase tracking-wider text-[#A1A19A] font-mono mt-0.5">Communication</div>
                      </div>
                      <div className="bg-[#181815] p-3 rounded border border-[#2A2A28] text-center">
                        <div className="text-sm font-mono font-bold text-[#79A89A]">{evalData.roleFitScore}%</div>
                        <div className="text-[9px] uppercase tracking-wider text-[#A1A19A] font-mono mt-0.5">Role Fit</div>
                      </div>
                    </div>

                    {evalData.explanation && (
                      <div className="bg-[#181815] p-3 rounded border border-[#2A2A28]">
                        <span className="text-[10px] font-bold text-[#F4C377] uppercase tracking-wider font-mono block mb-1">
                          Evaluation Summary & Rationale
                        </span>
                        <p className="text-xs text-[#E5E2DE] font-mono leading-relaxed">
                          {evalData.explanation}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#11110F] rounded-lg p-4 border border-emerald-500/30 space-y-2">
                      <h5 className="text-xs font-bold text-emerald-400 font-mono flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">check_circle</span>
                        Verified Strengths
                      </h5>
                      <ul className="space-y-1.5">
                        {(evalData.strengths || []).map((str, idx) => (
                          <li key={idx} className="text-xs text-[#A1A19A] font-mono flex items-start gap-1.5">
                            <span className="text-emerald-400 font-bold">\u2022</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-[#11110F] rounded-lg p-4 border border-[#C97C5D]/30 space-y-2">
                      <h5 className="text-xs font-bold text-[#C97C5D] font-mono flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">warning</span>
                        Identified Gaps
                      </h5>
                      <ul className="space-y-1.5">
                        {(evalData.gaps || []).map((gap, idx) => (
                          <li key={idx} className="text-xs text-[#A1A19A] font-mono flex items-start gap-1.5">
                            <span className="text-[#C97C5D] font-bold">\u2022</span>
                            <span>{gap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {evalData.evidence && evalData.evidence.length > 0 && (
                    <div className="bg-[#11110F] rounded-lg p-4 border border-[#2A2A28] space-y-2">
                      <h5 className="text-xs font-bold text-[#F4F1E9] font-mono flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">format_quote</span>
                        Transcript Evidence Snippets
                      </h5>
                      <div className="space-y-2">
                        {evalData.evidence.map((ev, idx) => (
                          <div key={idx} className="bg-[#181815] p-2.5 rounded border border-[#2A2A28] text-xs text-[#A1A19A] font-mono italic">
                            &ldquo;{ev}&rdquo;
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Decision Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-[#2A2A28] gap-3 shrink-0 bg-[#11110F]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[#A1A19A]">Current Status:</span>
            {getStatusBadge()}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {decisionMessage && (
              <span className="text-[10px] font-mono text-[#F4C377] max-w-[200px] truncate">
                {decisionMessage}
              </span>
            )}

            {showRejectConfirm && (
              <div className="flex items-center gap-1.5 bg-red-500/10 px-2 py-1 rounded border border-red-500/30">
                <span className="text-[10px] text-red-400 font-mono">Confirm reject?</span>
                <button
                  type="button"
                  onClick={handleRejectCandidate}
                  disabled={isRejecting}
                  className="px-2 py-0.5 rounded bg-red-500/30 text-red-300 text-[10px] font-bold hover:bg-red-500/50 transition-colors"
                >
                  {isRejecting ? '...' : 'Yes'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRejectConfirm(false)}
                  className="px-2 py-0.5 rounded bg-[#20201C] text-[#A1A19A] text-[10px] font-bold hover:bg-[#2A2A28] transition-colors"
                >
                  No
                </button>
              </div>
            )}

            {!isAlreadyDecided && !showRejectConfirm && (
              <>
                {canMakeDecision ? (
                  <>
                    <button
                      type="button"
                      onClick={handleHireCandidate}
                      disabled={isHiring}
                      className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold hover:bg-emerald-500/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-sm">verified</span>
                      {isHiring ? 'Processing...' : 'Hire Candidate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRejectConfirm(true)}
                      className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 text-xs font-bold hover:bg-red-500/20 transition-all flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">block</span>
                      Reject Candidate
                    </button>
                  </>
                ) : (
                  <span className="text-[10px] text-[#A1A19A] font-mono italic flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">lock</span>
                    {!candidate.hasCompletedInterview
                      ? 'Interview not completed'
                      : 'Evaluation not completed'}
                  </span>
                )}
              </>
            )}

            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-bold rounded bg-[#20201C] text-[#A1A19A] hover:bg-[#2A2A28] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
