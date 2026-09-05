import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { RecruiterShell } from '../components/layout/RecruiterShell';
import { JobSearch } from '../components/jobs/JobSearch';
import { JobFilters } from '../components/jobs/JobFilters';
import { JobList } from '../components/jobs/JobList';
import { PauseJobModal } from '../components/jobs/PauseJobModal';
import { CreateJobWizardModal } from '../components/jobs/CreateJobWizardModal';
import { PageTransition } from '../components/ui/PageTransition';
import { mockActiveJobs } from '../data/mockData';
import { jobService } from '../services/jobService';
import { JobRequisition, JobSortOption } from '../types';
import { matchesJobStatusFilter, computeJobStatusCounts } from '../utils/statusUtils';

interface RecruiterJobsPageProps {
  onNavigate?: (route: string) => void;
}

export const RecruiterJobsPage: React.FC<RecruiterJobsPageProps> = ({ onNavigate }) => {
  const [jobsList, setJobsList] = useState<JobRequisition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [sortBy, setSortBy] = useState<JobSortOption>('recently_posted');

  // Load jobs via jobService
  const fetchJobs = useCallback(() => {
    setIsLoading(true);
    setApiError('');
    jobService.getJobs(true)
      .then(res => setJobsList(res.data || []))
      .catch((err: any) => {
        console.error("Jobs load error:", err);
        setApiError(err.message || 'Unable to connect to HireGenie server.');
        setJobsList([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Modals state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [jobToPause, setJobToPause] = useState<JobRequisition | null>(null);

  // Compute live database status counts
  const statusCounts = useMemo(() => computeJobStatusCounts(jobsList), [jobsList]);

  // Extract unique departments & locations for filter dropdowns
  const departments = useMemo(() => {
    return Array.from(new Set(jobsList.map(j => j.department).filter(Boolean)));
  }, [jobsList]);

  const locations = useMemo(() => {
    return Array.from(new Set(jobsList.map(j => j.location).filter(Boolean)));
  }, [jobsList]);

  // Filter and sort jobs dynamically without mutating original array
  const filteredAndSortedJobs = useMemo(() => {
    let result = jobsList.filter(job => {
      // 1. Canonical Status Filter
      if (!matchesJobStatusFilter(job.status, statusFilter)) return false;

      // 2. Department Filter
      if (departmentFilter !== 'all' && job.department !== departmentFilter) return false;

      // 3. Location Filter
      if (locationFilter !== 'all' && job.location !== locationFilter) return false;

      // 4. Search Query (title, department, location)
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = (job.title || '').toLowerCase().includes(q);
        const matchesDept = (job.department || '').toLowerCase().includes(q);
        const matchesLoc = (job.location || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesDept && !matchesLoc) return false;
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'recently_posted':
          return b.postedTimestamp - a.postedTimestamp;
        case 'applicants':
          return b.applicantsCount - a.applicantsCount;
        case 'shortlisted':
          return b.shortlistedCount - a.shortlistedCount;
        case 'interviews':
          return b.interviewsCount - a.interviewsCount;
        case 'time_to_hire':
          return a.avgTimeToHireDays - b.avgTimeToHireDays;
        default:
          return 0;
      }
    });

    return result;
  }, [jobsList, statusFilter, departmentFilter, locationFilter, searchQuery, sortBy]);

  // Handle Pause / Close Confirmation
  const handleConfirmPause = async (jobId: string) => {
    try {
      await jobService.updateJobStatus(jobId, 'CLOSED');
      fetchJobs();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  // Handle Create Job
  const handleJobCreated = (createdJob: any) => {
    if (createdJob && createdJob.id) {
      setJobsList(prev => [createdJob, ...prev]);
    }
    fetchJobs();
  };

  const handleClearAllFilters = () => {
    setStatusFilter('all');
    setDepartmentFilter('all');
    setLocationFilter('all');
    setSearchQuery('');
    setSortBy('recently_posted');
  };

  const handleViewJob = (jobId: string) => {
    if (onNavigate) {
      onNavigate(`/recruiter/jobs/${jobId}`);
    }
  };

  const handleEditJob = useCallback((jobId: string) => {
    setIsWizardOpen(true);
  }, []);

  return (
    <RecruiterShell
      activeRoute="/recruiter/jobs"
      onNavigate={onNavigate}
      onCreateJob={() => setIsWizardOpen(true)}
    >
      <PageTransition routeKey="/recruiter/jobs">
        <div className="space-y-6">
        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A2A28] pb-4">
          <div>
            <h1 className="text-xl font-bold text-[#F4F1E9] dark:text-[#F4F1E9] light:text-[#171714] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#D6A85F]">work</span>
              Jobs
            </h1>
            <p className="text-xs text-[#A1A19A] dark:text-[#A1A19A] light:text-[#587C6D] mt-0.5 font-mono">
              Manage your hiring pipelines and autonomous recruitment campaigns.
            </p>
          </div>

          <button
            onClick={() => setIsWizardOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-[#D6A85F] text-[#11110F] text-xs font-bold shadow-md hover:bg-[#F4C377] transition-all shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>+ Create Job</span>
          </button>
        </div>

        {/* SEARCH & FILTERS CONTROLS */}
        <div className="space-y-3">
          <JobSearch
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
          <JobFilters
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            departmentFilter={departmentFilter}
            onDepartmentFilterChange={setDepartmentFilter}
            locationFilter={locationFilter}
            onLocationFilterChange={setLocationFilter}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            onClearAll={handleClearAllFilters}
            departments={departments}
            locations={locations}
            activeCount={filteredAndSortedJobs.length}
            statusCounts={statusCounts}
          />
        </div>

        {/* JOB LIST METRICS SUMMARY */}
        <div className="flex items-center justify-between text-xs font-mono text-[#A1A19A]">
          <span>Showing <strong className="text-[#F4C377]">{filteredAndSortedJobs.length}</strong> requisitions</span>
          <span>Sorted by: {sortBy.replace('_', ' ')}</span>
        </div>

        {/* API ERROR / OFFLINE STATE */}
        {apiError ? (
          <div className="bg-[#181815] border border-rose-500/30 rounded-xl p-8 text-center space-y-4 shadow-lg">
            <span className="material-symbols-outlined text-4xl text-rose-400">cloud_off</span>
            <div>
              <h3 className="text-base font-bold text-[#F4F1E9]">Unable to connect to HireGenie server.</h3>
              <p className="text-xs text-[#A1A19A] font-mono mt-1">{apiError}</p>
            </div>
            <button
              onClick={fetchJobs}
              className="px-4 py-2 rounded-lg bg-[#D6A85F] text-[#11110F] text-xs font-bold shadow hover:bg-[#F4C377] transition-all inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              <span>Retry Connection</span>
            </button>
          </div>
        ) : (
          /* DENSE ENTERPRISE JOB LIST */
          <JobList
            jobs={filteredAndSortedJobs}
            onViewJob={handleViewJob}
            onEditJob={handleEditJob}
            onPauseJob={(job) => setJobToPause(job)}
          />
        )}

        {/* PAUSE CONFIRMATION MODAL */}
        <PauseJobModal
          job={jobToPause}
          isOpen={jobToPause !== null}
          onClose={() => setJobToPause(null)}
          onConfirmPause={handleConfirmPause}
        />

        {/* CREATE JOB WIZARD MODAL */}
        <CreateJobWizardModal
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          onJobCreated={handleJobCreated}
        />
      </div>
      </PageTransition>
    </RecruiterShell>
  );
};
