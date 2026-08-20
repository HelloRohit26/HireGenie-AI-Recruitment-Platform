import React, { useState, useEffect, useMemo } from 'react';
import { RecruiterShell } from '../components/layout/RecruiterShell';
import { MetricCard } from '../components/ui/MetricCard';
import { RecruitmentPipeline } from '../components/recruiter/RecruitmentPipeline';
import { ActiveAgentOperations } from '../components/recruiter/ActiveAgentOperations';
import { ActiveJobsList } from '../components/recruiter/ActiveJobsList';
import { RecentActivityFeed } from '../components/recruiter/RecentActivityFeed';
import { CreateJobWizardModal } from '../components/jobs/CreateJobWizardModal';
import { CandidateDossierModal } from '../components/candidates/CandidateDossierModal';
import { AgentDetailsModal } from '../components/recruiter/AgentDetailsModal';
import { PageTransition } from '../components/ui/PageTransition';
import { jobService } from '../services/jobService';
import { analyticsService, AnalyticsSummary } from '../services/analyticsService';
import { Candidate, AIAgentStatus, JobRequisition, PipelineStage } from '../types';

interface RecruiterCommandCenterProps {
  onNavigate?: (route: string) => void;
}

export const RecruiterCommandCenter: React.FC<RecruiterCommandCenterProps> = ({ onNavigate }) => {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AIAgentStatus | null>(null);
  const [liveJobs, setLiveJobs] = useState<JobRequisition[]>([]);
  const [telemetry, setTelemetry] = useState<AnalyticsSummary | null>(null);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [jobsError, setJobsError] = useState('');

  const loadDashboardData = () => {
    setIsLoadingJobs(true);
    setJobsError('');
    Promise.all([
      jobService.getJobs().catch(err => {
        setJobsError(err.message || 'Unable to connect to HireGenie server.');
        return { data: [] };
      }),
      analyticsService.getSummary().catch(() => ({ data: null }))
    ]).then(([jobsRes, telemetryRes]) => {
      setLiveJobs(jobsRes.data || []);
      if (telemetryRes.data) {
        setTelemetry(telemetryRes.data);
      }
    }).finally(() => setIsLoadingJobs(false));
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Smart Polling: Polls dashboard summary every 4s if any agent is currently processing
  useEffect(() => {
    const isProcessing = telemetry?.agent_telemetry?.some(a => String(a.status).toUpperCase() === 'PROCESSING');
    if (!isProcessing) return;

    const interval = setInterval(() => {
      loadDashboardData();
    }, 4000);

    return () => clearInterval(interval);
  }, [telemetry]);

  const metrics = useMemo(() => {
    if (telemetry && telemetry.metrics) {
      return telemetry.metrics;
    }
    const activeJobsCount = liveJobs.filter(j => String(j.status).toUpperCase() === 'OPEN').length;
    let totalApplicants = 0;
    let shortlisted = 0;
    let interviews = 0;
    let offers = 0;
    let hired = 0;

    liveJobs.forEach(j => {
      totalApplicants += (j.applicantsCount || 0);
      shortlisted += (j.shortlistedCount || 0);
      interviews += (j.interviewsCount || 0);
      offers += (j.offersCount || 0);
      hired += (j.hiredCount || 0);
    });

    return {
      activeJobs: activeJobsCount,
      totalJobs: liveJobs.length,
      closedJobs: liveJobs.length - activeJobsCount,
      totalApplicants,
      aiShortlisted: shortlisted,
      interviews,
      offers,
      hired,
      rejected: 0,
      avgTimeToHireDays: 0
    };
  }, [liveJobs, telemetry]);

  const pipelineStages: PipelineStage[] = useMemo(() => {
    const total = metrics.totalApplicants || 1;
    return [
      { id: 'applied', name: 'Applied', count: metrics.totalApplicants, percentage: 100, conversionRate: 'Base Pool', color: 'border-neutral-700 text-neutral-300' },
      { id: 'screening', name: 'AI Screening', count: metrics.totalApplicants, percentage: Math.round((metrics.totalApplicants / total) * 100), conversionRate: `${metrics.totalApplicants} Analyzed`, color: 'border-amber-500/40 text-amber-300' },
      { id: 'shortlisted', name: 'Shortlisted', count: metrics.aiShortlisted, percentage: Math.round((metrics.aiShortlisted / total) * 100), conversionRate: `${metrics.aiShortlisted} Shortlisted`, color: 'border-amber-400 text-amber-200' },
      { id: 'interview', name: 'Interview', count: metrics.interviews, percentage: Math.round((metrics.interviews / total) * 100), conversionRate: `${metrics.interviews} Interviewed`, color: 'border-teal-500/60 text-teal-300' },
      { id: 'offers', name: 'Offers', count: metrics.offers, percentage: Math.round((metrics.offers / total) * 100), conversionRate: `${metrics.offers} Offered`, color: 'border-emerald-500/60 text-emerald-300' },
      { id: 'hired', name: 'Hired', count: metrics.hired, percentage: Math.round((metrics.hired / total) * 100), conversionRate: `${metrics.hired} Hired`, color: 'border-emerald-400 text-emerald-200 font-bold' }
    ];
  }, [metrics]);

  const agents: AIAgentStatus[] = useMemo(() => {
    if (telemetry && telemetry.agent_telemetry) {
      return telemetry.agent_telemetry as AIAgentStatus[];
    }
    return [];
  }, [telemetry]);

  const activities = useMemo(() => {
    if (telemetry && telemetry.recent_activity) {
      return telemetry.recent_activity.map(a => ({
        id: a.id,
        title: `${a.action}: ${a.details}`,
        jobTitle: a.details,
        agentName: a.actor,
        timeAgo: a.timeAgo || 'Recently',
        type: 'shortlist' as const,
        typeBadgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      }));
    }
    return [];
  }, [telemetry]);

  const handleCreateJob = () => {
    setIsWizardOpen(true);
  };

  const handleJobCreated = (_newJobData: any) => {
    setIsWizardOpen(false);
    loadDashboardData();
    if (onNavigate) {
      onNavigate('/recruiter/jobs');
    }
  };

  const handleJobSelect = (route: string) => {
    if (onNavigate) {
      onNavigate(route);
    }
  };

  return (
    <RecruiterShell 
      activeRoute="/recruiter" 
      onNavigate={onNavigate}
      onCreateJob={handleCreateJob}
    >
      <PageTransition routeKey="/recruiter">
        <div className="space-y-6">
          
          {/* 1. OVERVIEW METRICS GRID */}
          <section aria-label="Key Hiring Metrics">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <MetricCard
                label="Active Jobs"
                value={metrics.activeJobs}
                trend="SQLite"
                subtitle="Requisitions open"
                icon="work"
                hoverInfo="Real live SQLite data"
                onClick={() => onNavigate?.('/recruiter/jobs')}
              />
              <MetricCard
                label="Total Applicants"
                value={metrics.totalApplicants}
                trend="Live"
                subtitle="Candidate talent pool"
                icon="groups"
                hoverInfo="DB aggregate count"
                onClick={() => onNavigate?.('/recruiter/candidates')}
              />
              <MetricCard
                label="AI Shortlisted"
                value={metrics.aiShortlisted}
                trend="Scored"
                subtitle="Top target pool"
                icon="auto_awesome"
                hoverInfo="DB shortlist count"
                onClick={() => onNavigate?.('/recruiter/screening')}
              />
              <MetricCard
                label="Interviews"
                value={metrics.interviews}
                trend="Active"
                subtitle="Voice AI & Technical"
                icon="video_camera_front"
                hoverInfo="DB interview count"
                onClick={() => onNavigate?.('/recruiter/interviews')}
              />
              <MetricCard
                label="Offers"
                value={metrics.offers}
                trend="Ready"
                subtitle="Decision bar ready"
                icon="task_alt"
                hoverInfo="DB offers count"
                onClick={() => onNavigate?.('/recruiter/candidates')}
              />
              <MetricCard
                label="Avg Time to Hire"
                value={metrics.avgTimeToHireDays > 0 ? `${metrics.avgTimeToHireDays} days` : '0 days'}
                trend="Target"
                subtitle="Velocity speed"
                icon="speed"
                hoverInfo="Calculated metric"
                onClick={() => onNavigate?.('/recruiter/insights')}
              />
            </div>
          </section>

          {/* 2. LIVE RECRUITMENT PIPELINE */}
          <section aria-label="Recruitment Pipeline Funnel">
            <RecruitmentPipeline stages={pipelineStages} />
          </section>

          {/* 3. ACTIVE AI OPERATIONS */}
          <section aria-label="Active AI Operations">
            <ActiveAgentOperations agents={agents} onSelectAgent={setSelectedAgent} />
          </section>

          {/* 4. ACTIVE JOBS & RECENT AI ACTIVITY */}
          <section aria-label="Jobs and AI Activity" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {jobsError ? (
                <div className="bg-[#181815] border border-rose-500/30 rounded-xl p-6 text-center space-y-3">
                  <span className="material-symbols-outlined text-3xl text-rose-400">cloud_off</span>
                  <p className="text-xs text-[#F4F1E9] font-bold">Unable to connect to HireGenie server.</p>
                  <p className="text-[11px] text-[#A1A19A] font-mono">{jobsError}</p>
                </div>
              ) : (
                <ActiveJobsList jobs={liveJobs} onSelectJob={handleJobSelect} />
              )}
            </div>
            <div>
              <RecentActivityFeed
                activities={activities}
                onSelectCandidate={() => {}}
                onNavigate={onNavigate}
              />
            </div>
          </section>

        </div>
      </PageTransition>

      {/* CREATE JOB WIZARD MODAL */}
      <CreateJobWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onJobCreated={handleJobCreated}
      />

      {/* CANDIDATE DOSSIER MODAL */}
      <CandidateDossierModal
        candidate={selectedCandidate}
        isOpen={selectedCandidate !== null}
        onClose={() => setSelectedCandidate(null)}
        onNavigate={onNavigate}
      />

      {/* AGENT DETAILS INSPECTION MODAL */}
      <AgentDetailsModal
        agent={selectedAgent}
        isOpen={selectedAgent !== null}
        onClose={() => setSelectedAgent(null)}
        onNavigate={onNavigate}
      />
    </RecruiterShell>
  );
};
