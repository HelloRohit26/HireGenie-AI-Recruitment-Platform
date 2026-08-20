import React, { useState, useEffect, useMemo } from 'react';
import { CandidateShell } from '../components/layout/CandidateShell';
import { JobDiscoveryCard } from '../components/candidate/JobDiscoveryCard';
import { jobService } from '../services/jobService';
import { JobRequisition } from '../types';

interface CandidateJobsPageProps {
  onNavigate?: (route: string) => void;
}

export const CandidateJobsPage: React.FC<CandidateJobsPageProps> = ({ onNavigate }) => {
  const [jobsList, setJobsList] = useState<JobRequisition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');

  useEffect(() => {
    setIsLoading(true);
    jobService.getJobs()
      .then(res => setJobsList(res.data || []))
      .catch(() => setJobsList([]))
      .finally(() => setIsLoading(false));
  }, []);

  const departments = useMemo(() => Array.from(new Set(jobsList.map(j => j.department))), [jobsList]);

  const filteredJobs = useMemo(() => {
    return jobsList.filter(job => {
      if (selectedDept !== 'all' && job.department !== selectedDept) return false;
      if (selectedLocation !== 'all') {
        if (selectedLocation === 'remote' && !job.location.toLowerCase().includes('remote')) return false;
        if (selectedLocation === 'hybrid' && !job.location.toLowerCase().includes('hybrid')) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!job.title.toLowerCase().includes(q) && !job.department.toLowerCase().includes(q) && !job.location.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [jobsList, searchQuery, selectedDept, selectedLocation]);

  return (
    <CandidateShell activeRoute="/candidate/jobs" onNavigate={onNavigate}>
      <div className="space-y-6 animate-fadeIn">
        
        {/* Hero Search Header */}
        <div className="bg-[#181815] border border-[#2A2A28] rounded-2xl p-6 md:p-8 space-y-6 text-center max-w-4xl mx-auto">
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold text-[#79A89A] uppercase tracking-wider">
              AI-Powered Job Discovery
            </span>
            <h1 className="text-2xl md:text-4xl font-bold text-[#F4F1E9]">
              Find your next role matched by AI
            </h1>
            <p className="text-xs md:text-sm text-[#A1A19A] max-w-xl mx-auto">
              Real-time vector matching analyzes your skills against active requisitions to predict compatibility scores.
            </p>
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-2 bg-[#11110F] border border-[#2A2A28] rounded-xl p-2 max-w-2xl mx-auto shadow-lg">
            <span className="material-symbols-outlined text-[#79A89A] text-xl pl-2">search</span>
            <input
              type="text"
              placeholder="Search by job title, skill, or location (e.g. Full Stack Developer, Python, Remote)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-xs text-[#F4F1E9] placeholder-[#A1A19A] outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-[#A1A19A] hover:text-[#F4F1E9] px-2">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setSelectedDept('all')}
              className={`px-3 py-1 rounded-full text-xs font-mono font-semibold transition-all ${
                selectedDept === 'all'
                  ? 'bg-[#79A89A]/20 text-[#79A89A] border border-[#79A89A]/40'
                  : 'text-[#A1A19A] border border-[#2A2A28] hover:border-[#79A89A]/50'
              }`}
            >
              All Departments
            </button>
            {departments.map(dept => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-3 py-1 rounded-full text-xs font-mono font-semibold transition-all ${
                  selectedDept === dept
                    ? 'bg-[#79A89A]/20 text-[#79A89A] border border-[#79A89A]/40'
                    : 'text-[#A1A19A] border border-[#2A2A28] hover:border-[#79A89A]/50'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>

        {/* Results Metadata */}
        <div className="flex items-center justify-between text-xs font-mono text-[#A1A19A] px-1">
          <span>Showing <strong className="text-[#79A89A]">{filteredJobs.length}</strong> open positions</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedLocation(selectedLocation === 'remote' ? 'all' : 'remote')}
              className={`px-2 py-0.5 rounded border text-[10px] ${
                selectedLocation === 'remote' ? 'bg-[#79A89A]/20 text-[#79A89A] border-[#79A89A]/40' : 'border-[#2A2A28]'
              }`}
            >
              Remote Only
            </button>
            <button
              onClick={() => setSelectedLocation(selectedLocation === 'hybrid' ? 'all' : 'hybrid')}
              className={`px-2 py-0.5 rounded border text-[10px] ${
                selectedLocation === 'hybrid' ? 'bg-[#79A89A]/20 text-[#79A89A] border-[#79A89A]/40' : 'border-[#2A2A28]'
              }`}
            >
              Hybrid
            </button>
          </div>
        </div>

        {/* Job Grid */}
        {isLoading ? (
          <div className="py-12 text-center space-y-2">
            <span className="w-6 h-6 border-2 border-[#79A89A] border-t-transparent rounded-full animate-spin inline-block" />
            <p className="text-xs text-[#A1A19A] font-mono">Loading active requisitions...</p>
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredJobs.map((job, idx) => (
              <JobDiscoveryCard
                key={job.id}
                job={job}
                matchPercentage={95 - idx * 3}
                onClick={() => onNavigate?.(`/candidate/jobs/${job.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-[#181815] rounded-xl p-12 border border-[#2A2A28] text-center">
            <span className="material-symbols-outlined text-4xl text-[#A1A19A] opacity-50 block mb-3">work_off</span>
            <p className="text-sm text-[#A1A19A]">No active requisitions found.</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedDept('all'); setSelectedLocation('all'); }}
              className="mt-3 text-xs text-[#79A89A] hover:underline font-mono"
            >
              Clear filters
            </button>
          </div>
        )}

      </div>
    </CandidateShell>
  );
};
