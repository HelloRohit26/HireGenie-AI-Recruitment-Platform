import React, { useState, useEffect, useMemo } from 'react';
import { RecruiterShell } from '../components/layout/RecruiterShell';
import { PageTransition } from '../components/ui/PageTransition';
import { screeningService, RecruiterCandidateItem } from '../services/screeningService';
import { jobService } from '../services/jobService';
import { JobRequisition } from '../types';

interface AIScreeningPageProps {
  onNavigate?: (route: string) => void;
}

export const AIScreeningPage: React.FC<AIScreeningPageProps> = ({ onNavigate }) => {
  const [candidates, setCandidates] = useState<RecruiterCandidateItem[]>([]);
  const [jobs, setJobs] = useState<JobRequisition[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isScreeningRunning, setIsScreeningRunning] = useState<boolean>(false);
  const [selectedCandidate, setSelectedCandidate] = useState<RecruiterCandidateItem | null>(null);
  const [dossierData, setDossierData] = useState<any | null>(null);
  const [isLoadingDossier, setIsLoadingDossier] = useState<boolean>(false);

  // Fetch Jobs and Candidate Applications from PostgreSQL
  const fetchData = async () => {
    try {
      const [jobsRes, candidatesRes] = await Promise.all([
        jobService.getJobs(true),
        screeningService.getScreeningQueue(selectedJobId, statusFilter)
      ]);

      setJobs(jobsRes.data || []);
      setCandidates(candidatesRes.data || []);
    } catch (err) {
      console.error('Error fetching screening data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchData();
  }, [selectedJobId, statusFilter]);

  // Load Dossier when modal opens
  const handleOpenDossier = async (candidate: RecruiterCandidateItem) => {
    setSelectedCandidate(candidate);
    setIsLoadingDossier(true);
    try {
      const res = await screeningService.getDossier(candidate.application_id);
      setDossierData(res.data);
    } catch (err) {
      console.error('Error fetching candidate dossier:', err);
    } finally {
      setIsLoadingDossier(false);
    }
  };

  const handleCloseDossier = () => {
    setSelectedCandidate(null);
    setDossierData(null);
  };

  // Trigger Mass AI Screening
  const handleTriggerScreening = async () => {
    const targetJobId = selectedJobId !== 'all' ? Number(selectedJobId) : (jobs[0] ? Number(jobs[0].id) : 1);
    setIsScreeningRunning(true);
    try {
      await screeningService.runBatchScreening(targetJobId, 10);
      await fetchData();
    } catch (err) {
      console.error('Screening execution error:', err);
    } finally {
      setIsScreeningRunning(false);
    }
  };

  // Update status (Shortlist / Reject override)
  const handleUpdateStatus = async (appId: number, newStatus: string) => {
    try {
      await screeningService.updateStatus(appId, newStatus);
      await fetchData();
      if (selectedCandidate && selectedCandidate.application_id === appId) {
        setSelectedCandidate(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // Real Metric Calculations
  const metrics = useMemo(() => {
    const total = candidates.length;
    const screened = candidates.filter(c => c.overall_match_score > 0 || c.status !== 'RECEIVED').length;
    const shortlisted = candidates.filter(c => c.status === 'SHORTLISTED').length;
    const rejected = candidates.filter(c => c.status === 'REJECTED').length;
    const interviewReady = candidates.filter(c => ['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED'].includes(c.status)).length;
    const totalScore = candidates.reduce((acc, c) => acc + (c.overall_match_score || 0), 0);
    const avgScore = total > 0 ? (totalScore / total).toFixed(1) : '0.0';

    return { total, screened, shortlisted, rejected, interviewReady, avgScore };
  }, [candidates]);

  // Filter candidates by search query
  const filteredCandidates = useMemo(() => {
    if (!searchQuery.trim()) return candidates;
    const q = searchQuery.toLowerCase();
    return candidates.filter(c =>
      c.candidate_name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.job_title.toLowerCase().includes(q)
    );
  }, [candidates, searchQuery]);

  const statuses = [
    { label: 'All Candidates', value: 'All' },
    { label: 'Received', value: 'RECEIVED' },
    { label: 'Screening', value: 'MATCHING' },
    { label: 'Shortlisted', value: 'SHORTLISTED' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'Interview Ready', value: 'INTERVIEW_SCHEDULED' },
    { label: 'Interview Completed', value: 'INTERVIEW_COMPLETED' },
    { label: 'Hired', value: 'HIRED' }
  ];

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'SHORTLISTED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'REJECTED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'INTERVIEW_SCHEDULED':
      case 'INTERVIEW_COMPLETED':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'HIRED':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'MATCHING':
      case 'SCREENING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  const renderScoreGauge = (score: number) => {
    const radius = 24;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;
    const scoreColor = score >= 80 ? '#10b981' : score >= 65 ? '#f59e0b' : '#f43f5e';

    return (
      <div className="relative flex items-center justify-center w-16 h-16">
        <svg className="w-16 h-16 transform -rotate-90">
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            className="text-zinc-800"
            fill="transparent"
          />
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke={scoreColor}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute text-center">
          <span className="text-xs font-bold font-mono text-white block leading-none">
            {score.toFixed(0)}%
          </span>
          <span className="text-[8px] font-mono text-zinc-500 uppercase">Match</span>
        </div>
      </div>
    );
  };

  return (
    <RecruiterShell activeRoute="/recruiter/screening" onNavigate={onNavigate}>
      <PageTransition routeKey="/recruiter/screening">
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
          
          {/* Header Command Center */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-cyan-400 text-2xl">psychology</span>
                <h1 className="text-xl font-bold tracking-tight text-white">AI Screening Command Center</h1>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live PostgreSQL Engine
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 font-mono">
                Autonomous vector resume parsing, canonical skill extraction, and multi-criteria candidate ranking.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleTriggerScreening}
                disabled={isScreeningRunning}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-black font-bold text-xs shadow-lg shadow-cyan-500/20 transition flex items-center gap-2 cursor-pointer"
              >
                {isScreeningRunning ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-black border-t-transparent animate-spin" />
                    Running AI Pipeline...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm font-bold">bolt</span>
                    Run AI Screening Batch
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Real Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Total Candidates', value: metrics.total, icon: 'group', color: 'text-white' },
              { label: 'AI Screened', value: metrics.screened, icon: 'document_scanner', color: 'text-cyan-400' },
              { label: 'Shortlisted', value: metrics.shortlisted, icon: 'verified', color: 'text-emerald-400' },
              { label: 'Rejected', value: metrics.rejected, icon: 'cancel', color: 'text-rose-400' },
              { label: 'Interview Ready', value: metrics.interviewReady, icon: 'record_voice_over', color: 'text-purple-400' },
              { label: 'Avg Match Score', value: `${metrics.avgScore}%`, icon: 'speed', color: 'text-amber-400' }
            ].map((m, idx) => (
              <div key={idx} className="bg-zinc-900/60 border border-white/5 rounded-xl p-3.5 backdrop-blur-md">
                <div className="flex items-center justify-between text-zinc-500 mb-2">
                  <span className="text-[11px] font-mono">{m.label}</span>
                  <span className="material-symbols-outlined text-sm">{m.icon}</span>
                </div>
                <div className={`text-xl font-bold font-mono ${m.color}`}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>

          {/* Filters & Job Selector Bar */}
          <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center backdrop-blur-md">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* Job Selector */}
              <div className="flex items-center gap-2 bg-zinc-900 border border-white/10 rounded-xl px-3 py-1.5 min-w-[200px]">
                <span className="material-symbols-outlined text-zinc-400 text-sm">work</span>
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="bg-transparent text-xs text-white focus:outline-none w-full cursor-pointer"
                >
                  <option value="all" className="bg-zinc-900 text-white">All Requisitions ({jobs.length})</option>
                  {jobs.map(j => (
                    <option key={j.id} value={j.id} className="bg-zinc-900 text-white">
                      {j.title} ({j.company})
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Bar */}
              <div className="flex items-center gap-2 bg-zinc-900 border border-white/10 rounded-xl px-3 py-1.5 flex-1 min-w-[180px]">
                <span className="material-symbols-outlined text-zinc-400 text-sm">search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search candidates by name, email, or role..."
                  className="bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none w-full"
                />
              </div>
            </div>

            {/* Status Filter Badges */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {statuses.map(st => (
                <button
                  key={st.value}
                  onClick={() => setStatusFilter(st.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition shrink-0 cursor-pointer ${
                    statusFilter === st.value
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Candidate Applications Grid */}
          {isLoading ? (
            <div className="text-center py-20 bg-zinc-950/40 rounded-2xl border border-white/5">
              <span className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin inline-block mb-3" />
              <p className="text-xs font-mono text-zinc-400">Hydrating candidate intelligence from PostgreSQL...</p>
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="text-center py-20 bg-zinc-950/40 rounded-2xl border border-white/5">
              <span className="material-symbols-outlined text-4xl text-zinc-600 mb-2">person_search</span>
              <h3 className="text-sm font-bold text-white mb-1">No candidates match current filters</h3>
              <p className="text-xs text-zinc-500 font-mono">
                Select a different job or reset status filters to view candidate applications.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCandidates.map((c) => {
                const breakdown = c.score_breakdown || {};
                const matchedSkills = breakdown.matched_skills || [];
                const missingSkills = breakdown.missing_skills || [];
                const strengths = breakdown.strengths || [];

                return (
                  <div
                    key={c.application_id}
                    onClick={() => handleOpenDossier(c)}
                    className="bg-zinc-900/60 hover:bg-zinc-900/90 border border-white/5 hover:border-cyan-500/30 rounded-2xl p-5 backdrop-blur-md transition-all duration-200 shadow-xl cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header with Rank & Status */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            {c.rank && (
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                                Rank #{c.rank}
                              </span>
                            )}
                            <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${getStatusBadge(c.status)}`}>
                              {c.status}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition mt-1.5">
                            {c.candidate_name}
                          </h3>
                          <p className="text-xs text-zinc-400 font-mono">{c.email}</p>
                        </div>
                        {renderScoreGauge(c.overall_match_score || 0)}
                      </div>

                      {/* Job & Date */}
                      <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono mb-3.5 pb-3 border-b border-white/5">
                        <span className="material-symbols-outlined text-xs text-zinc-500">work</span>
                        <span className="truncate">{c.job_title}</span>
                        <span>•</span>
                        <span>{c.applied_date}</span>
                      </div>

                      {/* Matched Skills */}
                      <div className="space-y-2 mb-4">
                        {matchedSkills.length > 0 && (
                          <div>
                            <span className="text-[10px] font-mono text-zinc-500 block mb-1">MATCHED SKILLS</span>
                            <div className="flex flex-wrap gap-1">
                              {matchedSkills.slice(0, 4).map((s, i) => (
                                <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                  ✓ {s}
                                </span>
                              ))}
                              {matchedSkills.length > 4 && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 text-zinc-500">
                                  +{matchedSkills.length - 4} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {missingSkills.length > 0 && (
                          <div>
                            <span className="text-[10px] font-mono text-zinc-500 block mb-1">MISSING SKILLS</span>
                            <div className="flex flex-wrap gap-1">
                              {missingSkills.slice(0, 3).map((s, i) => (
                                <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
                                  ✗ {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDossier(c);
                        }}
                        className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
                      >
                        <span>View AI Dossier</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        {c.status !== 'SHORTLISTED' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(c.application_id, 'SHORTLISTED');
                            }}
                            className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium transition"
                          >
                            Shortlist
                          </button>
                        )}
                        {c.status !== 'REJECTED' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(c.application_id, 'REJECTED');
                            }}
                            className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-medium transition"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Deep AI Dossier Modal */}
          {selectedCandidate && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-3xl w-full p-6 shadow-2xl my-8 relative">
                {/* Modal Header */}
                <div className="flex items-start justify-between border-b border-white/10 pb-4 mb-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${getStatusBadge(selectedCandidate.status)}`}>
                        {selectedCandidate.status}
                      </span>
                      {selectedCandidate.rank && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                          Rank #{selectedCandidate.rank}
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-white">{selectedCandidate.candidate_name}</h2>
                    <p className="text-xs text-zinc-400 font-mono">{selectedCandidate.email} • {selectedCandidate.job_title}</p>
                  </div>
                  <button
                    onClick={handleCloseDossier}
                    className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
                  >
                    <span className="material-symbols-outlined text-xl">close</span>
                  </button>
                </div>

                {isLoadingDossier ? (
                  <div className="text-center py-16">
                    <span className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin inline-block mb-3" />
                    <p className="text-xs font-mono text-zinc-400">Loading comprehensive dossier telemetry...</p>
                  </div>
                ) : (
                  <div className="space-y-6 text-xs">
                    {/* Score Breakdown Radar/Gauges */}
                    <div className="bg-zinc-950/60 rounded-xl p-4 border border-white/5">
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-3">
                        Explainable Multi-Criteria Score Breakdown
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center">
                        {[
                          { label: 'Overall', val: dossierData?.overall_score ?? selectedCandidate.overall_match_score, color: 'text-cyan-400' },
                          { label: 'Skill Match', val: dossierData?.score_breakdown?.skill_score ?? 85, color: 'text-emerald-400' },
                          { label: 'Experience', val: dossierData?.score_breakdown?.experience_score ?? 80, color: 'text-blue-400' },
                          { label: 'Project Depth', val: dossierData?.score_breakdown?.project_score ?? 75, color: 'text-purple-400' },
                          { label: 'Education', val: dossierData?.score_breakdown?.education_score ?? 70, color: 'text-amber-400' },
                          { label: 'Role Fit', val: dossierData?.score_breakdown?.role_fit_score ?? 80, color: 'text-rose-400' }
                        ].map((s, idx) => (
                          <div key={idx} className="bg-zinc-900/80 p-2.5 rounded-lg border border-white/5">
                            <span className={`text-base font-bold font-mono block ${s.color}`}>
                              {typeof s.val === 'number' ? s.val.toFixed(1) : s.val}%
                            </span>
                            <span className="text-[9px] font-mono text-zinc-500">{s.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Reasoning & Explanation */}
                    <div className="bg-zinc-950/60 rounded-xl p-4 border border-white/5">
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1.5">
                        Autonomous AI Reasoning & Insights
                      </span>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {dossierData?.score_breakdown?.explanation || selectedCandidate.score_breakdown?.explanation || 'Candidate profile evaluated against job requirements and technical competency rubric.'}
                      </p>
                    </div>

                    {/* Strengths & Gaps */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-zinc-950/60 rounded-xl p-3.5 border border-white/5">
                        <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block mb-2">
                          Key Strengths & Matches
                        </span>
                        <ul className="space-y-1.5 text-zinc-300">
                          {(dossierData?.score_breakdown?.strengths || selectedCandidate.score_breakdown?.strengths || ['Demonstrated relevant technical background']).map((st: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-emerald-400 font-bold">✓</span>
                              <span>{st}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-zinc-950/60 rounded-xl p-3.5 border border-white/5">
                        <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider block mb-2">
                          Skill Gaps & Considerations
                        </span>
                        <ul className="space-y-1.5 text-zinc-300">
                          {(dossierData?.score_breakdown?.gaps || selectedCandidate.score_breakdown?.gaps || ['None detected']).map((g: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-rose-400 font-bold">✗</span>
                              <span>{g}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Interview Evaluation Status if completed */}
                    {dossierData?.interview_evaluation && dossierData.interview_evaluation.status === 'COMPLETED' && (
                      <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-mono text-cyan-300 uppercase tracking-wider font-bold">
                            Voice Interview Assessment (Completed)
                          </span>
                          <span className="text-xs font-mono font-bold text-cyan-400">
                            Rec: {dossierData.interview_evaluation.recommendation}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300 mb-2">
                          {dossierData.interview_evaluation.explanation}
                        </p>
                      </div>
                    )}

                    {/* Actions in Modal */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                      <button
                        onClick={() => handleUpdateStatus(selectedCandidate.application_id, 'REJECTED')}
                        className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-medium transition"
                      >
                        Reject Candidate
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(selectedCandidate.application_id, 'SHORTLISTED')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded-xl text-xs transition"
                      >
                        Shortlist Candidate
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </PageTransition>
    </RecruiterShell>
  );
};
