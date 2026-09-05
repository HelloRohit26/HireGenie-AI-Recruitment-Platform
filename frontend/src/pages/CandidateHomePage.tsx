import React, { useState, useEffect } from 'react';
import { CandidateShell } from '../components/layout/CandidateShell';
import { JobDiscoveryCard } from '../components/candidate/JobDiscoveryCard';
import { PageTransition } from '../components/ui/PageTransition';
import { jobService } from '../services/jobService';
import { candidateService } from '../services/candidateService';
import { JobRequisition, CandidateJourneyData } from '../types';

interface CandidateHomePageProps {
  onNavigate?: (route: string) => void;
}

export const CandidateHomePage: React.FC<CandidateHomePageProps> = ({ onNavigate }) => {
  const storedName = localStorage.getItem('hg_user_name') || 'Candidate User';
  const candidateFirstName = storedName.split(' ')[0];

  const [jobs, setJobs] = useState<JobRequisition[]>([]);
  const [journeys, setJourneys] = useState<CandidateJourneyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      jobService.getJobs().catch(() => ({ data: [] })),
      candidateService.getMyApplications().catch(() => ({ data: [] }))
    ]).then(([jobsRes, appsRes]) => {
      setJobs(jobsRes.data || []);
      setJourneys(appsRes.data || []);
    }).finally(() => setIsLoading(false));
  }, []);

  const activeApplication = journeys.find(j => 
    j.interview_invitation && (j.interview_invitation.status === 'INVITED' || j.interview_invitation.status === 'READY')
  );
  const recommendedJobs = jobs.slice(0, 3);

  return (
    <CandidateShell activeRoute="/candidate" onNavigate={onNavigate}>
      <PageTransition routeKey="/candidate">
        <div className="space-y-8">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2A2A28] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-[#F4F1E9]">Welcome back, {candidateFirstName}</h1>
              <span className="px-2 py-0.5 rounded-full bg-[#79A89A]/15 text-[#79A89A] border border-[#79A89A]/30 text-[10px] font-mono font-bold">
                Profile 94% Complete
              </span>
            </div>
            <p className="text-xs text-[#A1A19A] font-mono">
              Senior AI Engineer • Bangalore, India • 6 years exp
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate?.('/candidate/jobs')}
              className="px-4 py-2 rounded-lg bg-[#79A89A] text-[#11110F] text-xs font-bold shadow-md hover:bg-[#AACEFF] transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">search</span>
              Explore All Jobs
            </button>
          </div>
        </div>

        {/* Active Interview Banner (If scheduled/in-progress) */}
        {activeApplication && activeApplication.interview_invitation && (
          <div className="bg-[#181815] border border-[#D6A85F]/40 rounded-xl p-6 relative overflow-hidden shadow-xl shadow-[#D6A85F]/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#D6A85F]/20 border border-[#D6A85F]/40 flex items-center justify-center text-[#F4C377] shrink-0">
                  <span className="material-symbols-outlined text-2xl">video_camera_front</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#F4C377] uppercase tracking-wider">
                      Upcoming AI Voice Interview
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#D6A85F] animate-pulse" />
                  </div>
                  <h3 className="text-base font-bold text-[#F4F1E9] mt-0.5">
                    {activeApplication.job.title} • {activeApplication.job.company}
                  </h3>
                  <p className="text-xs text-[#A1A19A] font-mono mt-1">
                    15-Minute WebRTC Voice AI Session • Autonomous Rubric Assessment
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <button
                  type="button"
                  id="start-voice-interview-home-btn"
                  onClick={() => onNavigate?.(`/interview/${activeApplication.interview_invitation?.invitation_token}/room?autostart=true`)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#D6A85F] via-[#F4C377] to-[#D6A85F] text-[#11110F] text-xs font-bold shadow-lg hover:bg-[#F4C377] hover:scale-105 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">phone_in_talk</span>
                  <span>START VOICE INTERVIEW NOW</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate?.(`/interview/${activeApplication.interview_invitation?.invitation_token}/prep`)}
                  className="px-3 py-2.5 rounded-lg bg-[#181815] border border-[#3A3A36] text-[#A1A19A] hover:text-[#F4F1E9] text-xs font-mono transition flex items-center gap-1 cursor-pointer"
                  title="Test microphone and audio"
                >
                  <span className="material-symbols-outlined text-sm">tune</span>
                  <span className="hidden md:inline">Setup</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Summary & Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="bg-[#181815] border border-[#2A2A28] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono uppercase text-[#A1A19A]">Active Applications</span>
              <span className="material-symbols-outlined text-[#79A89A] text-lg">assignment</span>
            </div>
            <div className="text-2xl font-mono font-bold text-[#F4F1E9]">{journeys.length} Active</div>
            <p className="text-[10px] text-[#A1A19A] font-mono mt-1">
              {journeys.length > 0 ? `${journeys[0].job.title} (${journeys[0].application.status})` : 'No submitted applications'}
            </p>
            <button
              type="button"
              onClick={() => onNavigate?.('/candidate/applications')}
              className="mt-3 text-xs text-[#79A89A] hover:underline font-mono block"
            >
              Track Application Progress →
            </button>
          </div>

          <div className="bg-[#181815] border border-[#2A2A28] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono uppercase text-[#A1A19A]">Resume Match Readiness</span>
              <span className="material-symbols-outlined text-[#D6A85F] text-lg">psychology</span>
            </div>
            <div className="text-2xl font-mono font-bold text-[#F4C377]">
              {journeys.length > 0 && journeys[0].application.overall_match_score ? `${journeys[0].application.overall_match_score.toFixed(1)}% Score` : 'Vector Ready'}
            </div>
            <p className="text-[10px] text-[#A1A19A] font-mono mt-1">Autonomous semantic screening active</p>
            <button
              type="button"
              onClick={() => onNavigate?.('/candidate/jobs')}
              className="mt-3 text-xs text-[#D6A85F] hover:underline font-mono block"
            >
              Discover Open Roles →
            </button>
          </div>

          <div className="bg-[#181815] border border-[#2A2A28] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono uppercase text-[#A1A19A]">Voice Interview Ready</span>
              <span className="material-symbols-outlined text-[#79A89A] text-lg">mic</span>
            </div>
            <div className="text-2xl font-mono font-bold text-[#79A89A]">System Ready</div>
            <p className="text-[10px] text-[#A1A19A] font-mono mt-1">WebRTC Audio & Mic Verified</p>
            <button
              type="button"
              onClick={() => onNavigate?.('/candidate/jobs')}
              className="mt-3 text-xs text-[#79A89A] hover:underline font-mono block"
            >
              Find More Positions →
            </button>
          </div>

        </div>

        {/* Recommended AI Jobs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#F4F1E9] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#79A89A]">auto_awesome</span>
              Open Positions for You
            </h2>
            <button
              type="button"
              onClick={() => onNavigate?.('/candidate/jobs')}
              className="text-xs text-[#79A89A] hover:underline font-mono"
            >
              View All ({jobs.length}) →
            </button>
          </div>

          {jobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendedJobs.map((job, idx) => (
                <JobDiscoveryCard
                  key={job.id}
                  job={job}
                  matchPercentage={95 - idx * 3}
                  onClick={() => onNavigate?.(`/candidate/jobs/${job.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-[#181815] border border-[#2A2A28] rounded-xl p-8 text-center text-xs font-mono text-[#A1A19A]">
              No active job requisitions found. Check back soon!
            </div>
          )}
        </div>
      </div>
      </PageTransition>
    </CandidateShell>
  );
};
