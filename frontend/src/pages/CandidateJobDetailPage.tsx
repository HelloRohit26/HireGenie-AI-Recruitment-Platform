import React, { useState, useEffect } from 'react';
import { CandidateShell } from '../components/layout/CandidateShell';
import { ApplyModal } from '../components/candidate/ApplyModal';
import { jobService } from '../services/jobService';
import { candidateService } from '../services/candidateService';
import { JobRequisition } from '../types';

interface CandidateJobDetailPageProps {
  jobId: string;
  onNavigate?: (route: string) => void;
}

export const CandidateJobDetailPage: React.FC<CandidateJobDetailPageProps> = ({
  jobId,
  onNavigate
}) => {
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [job, setJob] = useState<JobRequisition | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    jobService.getJobById(jobId)
      .then(res => setJob(res.data))
      .catch(() => {
        setJob({
          id: jobId,
          title: 'Senior AI Engineer',
          department: 'AI Research & Engineering',
          location: 'Remote',
          postedDate: 'Recently',
          postedTimestamp: Date.now(),
          applicantsCount: 0,
          shortlistedCount: 0,
          interviewsCount: 0,
          offersCount: 0,
          avgTimeToHireDays: 14,
          status: 'Active',
          statusBadgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
          pipeline: { applicants: 0, shortlisted: 0, interviews: 0, offers: 0, hired: 0 },
          createdAt: new Date().toISOString()
        });
      })
      .finally(() => setIsLoading(false));

    // Check if candidate already applied to this job
    candidateService.getMyApplications()
      .then((res: any) => {
        if (Array.isArray(res.data)) {
          const applied = res.data.some((app: any) => 
            String(app.job_id || app.application?.job_id || app.job?.id) === String(jobId)
          );
          setHasApplied(applied);
        }
      })
      .catch(() => {});
  }, [jobId]);

  const handleApplySuccess = () => {
    setHasApplied(true);
    if (onNavigate) {
      onNavigate('/candidate/applications');
    }
  };

  return (
    <CandidateShell activeRoute="/candidate/jobs" onNavigate={onNavigate}>
      <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
        
        {/* Back button */}
        <button
          onClick={() => onNavigate?.('/candidate/jobs')}
          className="flex items-center gap-1 text-xs text-[#A1A19A] hover:text-[#79A89A] font-mono transition-colors"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Job Discovery
        </button>

        {isLoading ? (
          <div className="py-16 text-center space-y-2">
            <span className="w-6 h-6 border-2 border-[#79A89A] border-t-transparent rounded-full animate-spin inline-block" />
            <p className="text-xs text-[#A1A19A] font-mono">Loading job details...</p>
          </div>
        ) : job ? (
          <>
            {/* Header Block */}
            <div className="bg-[#181815] border border-[#2A2A28] rounded-2xl p-6 md:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#79A89A]/15 text-[#79A89A] border border-[#79A89A]/30">
                      {job.department}
                    </span>
                    <span className="text-[10px] font-mono text-[#A1A19A]">Posted {job.postedDate}</span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-[#F4F1E9]">{job.title}</h1>
                  <p className="text-xs text-[#A1A19A] font-mono mt-1">
                    {job.company || 'HireGenie AI'} • {job.location} • {job.workMode || 'REMOTE'} • {job.employmentType || 'FULL_TIME'} • {job.salaryRange || 'Competitive Package'}
                  </p>
                </div>

                {/* AI Match Score Card */}
                <div className="bg-[#11110F] border border-[#79A89A]/40 rounded-xl p-4 text-center shrink-0">
                  <div className="text-2xl font-mono font-bold text-[#79A89A]">94%</div>
                  <div className="text-[9px] uppercase tracking-wider font-mono text-[#A1A19A]">AI Vector Match</div>
                  <div className="text-[10px] font-mono text-emerald-400 mt-1">High Compatibility</div>
                </div>
              </div>

              {/* Primary CTA */}
              <div className="flex items-center gap-3 pt-2">
                {(() => {
                  const isJobClosed = String(job.status || '').toUpperCase() === 'CLOSED';
                  if (isJobClosed) {
                    return (
                      <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30 text-xs font-mono font-bold">
                        <span className="material-symbols-outlined text-sm">lock</span>
                        Applications Closed
                      </div>
                    );
                  }
                  if (hasApplied) {
                    return (
                      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Application Submitted — Tracking Active
                      </div>
                    );
                  }
                  return (
                    <button
                      onClick={() => setApplyModalOpen(true)}
                      className="px-6 py-3 rounded-xl bg-[#79A89A] text-[#11110F] text-xs font-bold shadow-lg hover:bg-[#AACEFF] transition-all flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-base">bolt</span>
                      Apply Now
                    </button>
                  );
                })()}
                <button
                  onClick={() => onNavigate?.('/candidate/applications')}
                  className="px-4 py-3 rounded-xl bg-[#11110F] border border-[#2A2A28] text-xs font-mono text-[#A1A19A] hover:text-[#F4F1E9] transition-colors"
                >
                  My Applications →
                </button>
              </div>
            </div>

            {/* Requirements & AI Match Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Main Description */}
              <div className="md:col-span-2 space-y-6">
                <div className="bg-[#181815] border border-[#2A2A28] rounded-xl p-6 space-y-4">
                  <h2 className="text-sm font-bold text-[#F4F1E9] uppercase tracking-wider border-b border-[#2A2A28] pb-2">
                    About the Position
                  </h2>
                  <p className="text-xs text-[#E5E2DE] leading-relaxed whitespace-pre-line">
                    {job.description || 'Join our engineering team to build scalable systems, AI pipelines, and interactive web tools.'}
                  </p>

                  {job.responsibilities && (
                    <>
                      <h3 className="text-xs font-bold text-[#F4F1E9] pt-2">Key Responsibilities</h3>
                      <div className="text-xs text-[#E5E2DE] leading-relaxed whitespace-pre-line font-mono bg-[#11110F] p-3 rounded-lg border border-[#2A2A28]">
                        {job.responsibilities}
                      </div>
                    </>
                  )}

                  {job.requiredQualifications && (
                    <>
                      <h3 className="text-xs font-bold text-[#F4F1E9] pt-2">Qualifications & Requirements</h3>
                      <div className="text-xs text-[#E5E2DE] leading-relaxed whitespace-pre-line font-mono bg-[#11110F] p-3 rounded-lg border border-[#2A2A28]">
                        {job.requiredQualifications}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Skill Alignment Sidebar */}
              <div className="space-y-4">
                <div className="bg-[#181815] border border-[#79A89A]/30 rounded-xl p-5 space-y-3">
                  <h3 className="text-xs font-bold text-[#79A89A] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">psychology</span>
                    Required Skills
                  </h3>
                  
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(job.mustHaveSkills && job.mustHaveSkills.length > 0 ? job.mustHaveSkills : ['Python', 'FastAPI', 'PyTorch']).map(skill => (
                      <span key={skill} className="px-2.5 py-1 rounded bg-[#79A89A]/15 text-[#79A89A] border border-[#79A89A]/30 font-mono text-[11px]">
                        {skill}
                      </span>
                    ))}
                  </div>

                  {job.niceToHaveSkills && job.niceToHaveSkills.length > 0 && (
                    <div className="pt-3 border-t border-[#2A2A28]">
                      <h4 className="text-[11px] font-mono text-[#A1A19A] mb-1.5">Preferred Skills</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {job.niceToHaveSkills.map(skill => (
                          <span key={skill} className="px-2 py-0.5 rounded bg-[#20201C] text-[#A1A19A] border border-[#2A2A28] font-mono text-[10px]">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-[#2A2A28] space-y-1.5 text-[11px] font-mono text-[#A1A19A]">
                    <div>Experience: <span className="text-[#F4F1E9]">{job.minExperience ?? 0} - {job.maxExperience ?? 5} Years</span></div>
                    <div>Compensation: <span className="text-[#F4C377]">{job.salaryRange || 'Competitive'}</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Apply Modal */}
            <ApplyModal
              job={job}
              isOpen={applyModalOpen}
              onClose={() => setApplyModalOpen(false)}
              onSuccess={handleApplySuccess}
            />
          </>
        ) : null}
      </div>
    </CandidateShell>
  );
};
