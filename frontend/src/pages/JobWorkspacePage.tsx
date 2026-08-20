import React, { useState, useEffect, useMemo } from 'react';
import { RecruiterShell } from '../components/layout/RecruiterShell';
import { CandidateCard } from '../components/candidates/CandidateCard';
import { CandidateDossierModal } from '../components/candidates/CandidateDossierModal';
import { jobService } from '../services/jobService';
import { candidateService } from '../services/candidateService';
import { Candidate, CandidateStatus, JobStatusType, JobRequisition } from '../types';

interface JobWorkspacePageProps {
  jobId: string;
  onNavigate?: (route: string) => void;
}

export const JobWorkspacePage: React.FC<JobWorkspacePageProps> = ({ jobId, onNavigate }) => {
  const [job, setJob] = useState<JobRequisition | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatusType>('OPEN');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [pipelineFilter, setPipelineFilter] = useState<string>('all');
  const [jobCandidates, setJobCandidates] = useState<Candidate[]>([]);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      jobService.getJobById(jobId).catch(() => null),
      candidateService.getCandidates(jobId).catch(() => ({ data: [] }))
    ]).then(([jobRes, candRes]) => {
      if (jobRes && jobRes.data) {
        setJob(jobRes.data);
        setJobStatus(jobRes.data.status || 'OPEN');
      }
      setJobCandidates(candRes.data || []);
    }).finally(() => setIsLoading(false));
  }, [jobId]);

  const handleStatusChange = async (candidateId: string, newStatus: CandidateStatus) => {
    try {
      await candidateService.updateCandidateStatus(candidateId, newStatus);
      setJobCandidates(prev =>
        prev.map(c => (c.id === candidateId ? { ...c, status: newStatus } : c))
      );
    } catch (e) {
      console.error("Failed to update candidate status:", e);
    }
  };

  const handleToggleJobStatus = async () => {
    const isClosed = String(jobStatus).toUpperCase() === 'CLOSED';
    const nextStatus: JobStatusType = isClosed ? 'OPEN' : 'CLOSED';
    try {
      const res = await jobService.updateJobStatus(jobId, nextStatus);
      setJobStatus(res.data.status || nextStatus);
      if (job) setJob({ ...job, status: res.data.status || nextStatus });
    } catch (e) {
      console.error("Failed to update job status:", e);
    }
  };

  const filteredCandidates = useMemo(() => {
    if (pipelineFilter === 'all') return jobCandidates;
    return jobCandidates.filter(c => c.status === pipelineFilter);
  }, [jobCandidates, pipelineFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: jobCandidates.length };
    jobCandidates.forEach(c => { counts[c.status] = (counts[c.status] || 0) + 1; });
    return counts;
  }, [jobCandidates]);

  const dynamicPipeline = useMemo(() => {
    return {
      applicants: jobCandidates.length,
      shortlisted: jobCandidates.filter(c => c.status === 'Shortlisted').length,
      interviews: jobCandidates.filter(c => c.status === 'Interview').length,
      offers: jobCandidates.filter(c => c.status === 'Offered' || c.status === 'Final Review').length,
      hired: jobCandidates.filter(c => c.status === 'Hired').length
    };
  }, [jobCandidates]);

  const jobBadgeColors: Record<JobStatusType, string> = {
    OPEN: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    Active: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    Draft: 'bg-neutral-500/20 text-neutral-300 border-neutral-500/40',
    Paused: 'bg-[#C97C5D]/20 text-[#C97C5D] border-[#C97C5D]/40',
    Closed: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    CLOSED: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    ARCHIVED: 'bg-zinc-700/40 text-zinc-400 border-zinc-600/40'
  };

  if (isLoading) {
    return (
      <RecruiterShell activeRoute="/recruiter/jobs" onNavigate={onNavigate}>
        <div className="py-20 text-center space-y-2">
          <span className="w-6 h-6 border-2 border-[#D6A85F] border-t-transparent rounded-full animate-spin inline-block" />
          <p className="text-xs text-[#A1A19A] font-mono">Loading job workspace...</p>
        </div>
      </RecruiterShell>
    );
  }

  if (!job) {
    return (
      <RecruiterShell activeRoute="/recruiter/jobs" onNavigate={onNavigate}>
        <div className="flex flex-col items-center justify-center py-20 animate-fadeIn">
          <span className="material-symbols-outlined text-5xl text-[#A1A19A] opacity-50 mb-4">work_off</span>
          <h2 className="text-lg font-bold text-[#F4F1E9] dark:text-[#F4F1E9] light:text-[#171714] mb-2">Job Not Found</h2>
          <p className="text-xs text-[#A1A19A] font-mono mb-4">Requisition "{jobId}" does not exist or has been removed.</p>
          <button
            onClick={() => onNavigate?.('/recruiter/jobs')}
            className="px-4 py-2 rounded-md bg-[#D6A85F] text-[#11110F] text-xs font-bold hover:bg-[#F4C377] transition-all"
          >
            ← Back to Jobs
          </button>
        </div>
      </RecruiterShell>
    );
  }

  return (
    <RecruiterShell activeRoute="/recruiter/jobs" onNavigate={onNavigate}>
      <div className="space-y-6 animate-fadeIn">
        <button
          onClick={() => onNavigate?.('/recruiter/jobs')}
          className="flex items-center gap-1 text-xs text-[#A1A19A] hover:text-[#F4C377] font-mono transition-colors"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Requisitions
        </button>

        <div className="bg-[#181815] dark:bg-[#181815] light:bg-[#FAF8F2] border border-[#2A2A28] dark:border-[#2A2A28] light:border-[#E2DEC5] rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-[#F4F1E9] dark:text-[#F4F1E9] light:text-[#171714]">{job.title}</h1>
                <button
                  onClick={handleToggleJobStatus}
                  className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded border transition-all flex items-center gap-1.5 ${jobBadgeColors[jobStatus] || jobBadgeColors['OPEN']}`}
                  title="Click to toggle job status (OPEN ↔ CLOSED)"
                >
                  <span className="material-symbols-outlined text-xs">
                    {String(jobStatus).toUpperCase() === 'CLOSED' ? 'lock' : 'lock_open'}
                  </span>
                  <span>● {jobStatus} (Click to {String(jobStatus).toUpperCase() === 'CLOSED' ? 'Reopen' : 'Close Applications'})</span>
                </button>
              </div>
              <p className="text-xs text-[#A1A19A] dark:text-[#A1A19A] light:text-[#587C6D] font-mono">
                {job.department} • {job.location} • Posted {job.postedDate}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate?.('/recruiter/screening')}
                className="px-3.5 py-1.5 rounded-lg bg-[#D6A85F]/20 text-[#F4C377] border border-[#D6A85F]/40 text-xs font-bold hover:bg-[#D6A85F]/30 transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">psychology</span>
                Launch AI Screening
              </button>
            </div>
          </div>

          {/* Dynamic Pipeline Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
            {[
              { label: 'Applicants', value: dynamicPipeline.applicants, color: 'text-[#F4F1E9] light:text-[#171714]' },
              { label: 'Shortlisted', value: dynamicPipeline.shortlisted, color: 'text-[#F4C377] light:text-[#8B6914]' },
              { label: 'Interviews', value: dynamicPipeline.interviews, color: 'text-teal-400 light:text-teal-700' },
              { label: 'Offers / Final', value: dynamicPipeline.offers, color: 'text-[#79A89A] light:text-[#3D6B5C]' },
              { label: 'Hired', value: dynamicPipeline.hired, color: 'text-emerald-400 light:text-emerald-700' }
            ].map(stat => (
              <div key={stat.label} className="text-center bg-[#11110F] dark:bg-[#11110F] light:bg-white rounded-lg p-3 border border-[#2A2A28] dark:border-[#2A2A28] light:border-[#E2DEC5]">
                <div className={`text-lg font-mono font-bold ${stat.color}`}>{stat.value.toLocaleString()}</div>
                <div className="text-[9px] text-[#A1A19A] uppercase tracking-wider font-mono">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline Stage Filters */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {['all', 'Applied', 'Screening', 'Shortlisted', 'Interview', 'Final Review', 'Offered', 'Hired', 'Rejected'].map(s => (
            <button
              key={s}
              onClick={() => setPipelineFilter(s)}
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold whitespace-nowrap transition-all ${
                pipelineFilter === s
                  ? 'bg-[#D6A85F]/20 text-[#F4C377] border border-[#D6A85F]/40'
                  : 'text-[#A1A19A] hover:text-[#F4F1E9] border border-transparent'
              }`}
            >
              {s === 'all' ? 'All' : s} ({s === 'all' ? statusCounts.all : statusCounts[s] || 0})
            </button>
          ))}
        </div>

        {/* Candidates Grid */}
        {filteredCandidates.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredCandidates.map(candidate => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                onClick={() => setSelectedCandidate(candidate)}
                onStatusChange={handleStatusChange}
                showQuickActions={true}
              />
            ))}
          </div>
        ) : (
          <div className="bg-[#181815] dark:bg-[#181815] light:bg-[#FAF8F2] rounded-xl p-12 border border-[#2A2A28] dark:border-[#2A2A28] light:border-[#E2DEC5] text-center">
            <span className="material-symbols-outlined text-4xl text-[#A1A19A] opacity-50 block mb-3">person_off</span>
            <p className="text-sm text-[#A1A19A]">No candidates at this stage.</p>
          </div>
        )}

        {/* Dossier Modal */}
        <CandidateDossierModal
          candidate={selectedCandidate}
          isOpen={selectedCandidate !== null}
          onClose={() => setSelectedCandidate(null)}
          onNavigate={onNavigate}
        />
      </div>
    </RecruiterShell>
  );
};
