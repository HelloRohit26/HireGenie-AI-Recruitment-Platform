import React, { useState, useEffect, useMemo } from 'react';
import { RecruiterShell } from '../components/layout/RecruiterShell';
import { CandidateCard } from '../components/candidates/CandidateCard';
import { CandidateDossierModal } from '../components/candidates/CandidateDossierModal';
import { CandidateComparisonDrawer } from '../components/candidates/CandidateComparisonDrawer';
import { PageTransition } from '../components/ui/PageTransition';
import { candidateService } from '../services/candidateService';
import { Candidate, CandidateStatus } from '../types';

interface CandidatesPageProps {
  onNavigate?: (route: string) => void;
}

export const CandidatesPage: React.FC<CandidatesPageProps> = ({ onNavigate }) => {
  const [candidatesList, setCandidatesList] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [jobFilter, setJobFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('score');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  // Multi-selection state for comparison
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showComparisonDrawer, setShowComparisonDrawer] = useState(false);

  // Fetch candidates asynchronously via candidateService
  useEffect(() => {
    setIsLoading(true);
    candidateService.getCandidates()
      .then(res => setCandidatesList(res.data || []))
      .catch(() => setCandidatesList([]))
      .finally(() => setIsLoading(false));
  }, []);

  const statuses: CandidateStatus[] = ['Applied', 'Screening', 'Shortlisted', 'Interview', 'Final Review', 'Offered', 'Hired', 'Rejected'];
  const jobs = useMemo(() => Array.from(new Set(candidatesList.map(c => c.jobTitle))), [candidatesList]);

  const filteredCandidates = useMemo(() => {
    let result = candidatesList.filter(c => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (jobFilter !== 'all' && c.jobTitle !== jobFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!c.name.toLowerCase().includes(q) && !c.title.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case 'score': return b.aiScore - a.aiScore;
        case 'name': return a.name.localeCompare(b.name);
        case 'recent': return b.appliedTimestamp - a.appliedTimestamp;
        default: return 0;
      }
    });

    return result;
  }, [candidatesList, searchQuery, statusFilter, jobFilter, sortBy]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: candidatesList.length };
    candidatesList.forEach(c => { counts[c.status] = (counts[c.status] || 0) + 1; });
    return counts;
  }, [candidatesList]);

  const toggleSelectCandidate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectedCandidatesList = useMemo(() => {
    return candidatesList.filter(c => selectedIds.includes(c.id));
  }, [candidatesList, selectedIds]);

  return (
    <RecruiterShell activeRoute="/recruiter/candidates" onNavigate={onNavigate}>
      <PageTransition routeKey="/recruiter/candidates">
        <div className="space-y-6 relative pb-16">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
            <div>
              <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--accent-primary)]">groups</span>
                Candidate Intelligence
              </h1>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-mono">
                Unified candidate intelligence across all requisitions. Select candidates to compare side-by-side.
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-mono font-bold text-[var(--accent-primary)]">{candidatesList.length}</span>
              <span className="text-xs text-[var(--text-secondary)] font-mono block">Total Candidates</span>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="space-y-3">
            {/* Search */}
            <div className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2">
              <span className="material-symbols-outlined text-[var(--text-secondary)] text-lg">search</span>
              <input
                type="text"
                placeholder="Search by name, title, or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter Chips */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold whitespace-nowrap transition-all ${
                    statusFilter === 'all'
                      ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/40'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent hover:border-[var(--border)]'
                  }`}
                >
                  All ({statusCounts.all})
                </button>
                {statuses.map(s => (
                  statusCounts[s] ? (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold whitespace-nowrap transition-all ${
                        statusFilter === s
                          ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/40'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent hover:border-[var(--border)]'
                      }`}
                    >
                      {s} ({statusCounts[s]})
                    </button>
                  ) : null
                ))}
              </div>

              <div className="flex-1" />

              {/* Job Filter */}
              <select
                value={jobFilter}
                onChange={e => setJobFilter(e.target.value)}
                className="bg-[var(--surface)] border border-[var(--border)] rounded px-2.5 py-1 text-[10px] text-[var(--text-primary)]"
              >
                <option value="all">All Jobs</option>
                {jobs.map(j => <option key={j} value={j}>{j}</option>)}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="bg-[var(--surface)] border border-[var(--border)] rounded px-2.5 py-1 text-[10px] text-[var(--text-primary)]"
              >
                <option value="score">Sort: AI Score</option>
                <option value="recent">Sort: Recent</option>
                <option value="name">Sort: Name</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between text-xs font-mono text-[var(--text-secondary)]">
            <span>Showing <strong className="text-[var(--accent-primary)]">{filteredCandidates.length}</strong> candidates</span>
            {selectedIds.length > 0 && (
              <button onClick={() => setSelectedIds([])} className="text-[10px] text-[var(--status-error)] hover:underline">
                Clear Selection ({selectedIds.length})
              </button>
            )}
          </div>

          {/* Candidate Grid */}
          {filteredCandidates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredCandidates.map(candidate => {
                const isSelected = selectedIds.includes(candidate.id);
                return (
                  <div key={candidate.id} className="relative group">
                    {/* Selection Checkbox overlay */}
                    <button
                      type="button"
                      onClick={(e) => toggleSelectCandidate(candidate.id, e)}
                      className={`absolute top-3 left-3 z-20 w-5 h-5 rounded border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-[#171815]'
                          : 'bg-[var(--surface)]/80 border-[var(--border)] text-transparent hover:border-[var(--accent-primary)]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xs font-bold">check</span>
                    </button>

                    <CandidateCard
                      candidate={candidate}
                      onClick={() => setSelectedCandidate(candidate)}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-[var(--surface)] rounded-xl p-12 border border-[var(--border)] text-center">
              <span className="material-symbols-outlined text-4xl text-[var(--text-secondary)] opacity-50 block mb-3">person_off</span>
              <p className="text-sm font-bold text-[var(--text-primary)]">No candidates yet</p>
              <p className="text-xs text-[var(--text-secondary)] font-mono mt-1">No candidate applications have been submitted to SQLite database.</p>
            </div>
          )}

          {/* Sticky Floating Comparison Bar */}
          {selectedIds.length >= 2 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[var(--surface-elevated)] border border-[var(--accent-primary)]/50 rounded-full px-6 py-3 shadow-2xl flex items-center gap-4 animate-fadeIn">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
                <span className="text-xs font-mono font-bold text-[var(--text-primary)]">
                  {selectedIds.length} Candidates Selected
                </span>
              </div>

              <button
                onClick={() => setShowComparisonDrawer(true)}
                className="px-4 py-1.5 rounded-full bg-[var(--accent-primary)] text-[#171815] text-xs font-mono font-bold shadow-md hover:brightness-110 transition-all flex items-center gap-1.5 active:scale-95"
              >
                <span className="material-symbols-outlined text-sm">compare_arrows</span>
                Compare Side-by-Side
              </button>
            </div>
          )}

          {/* Dossier Modal */}
          <CandidateDossierModal
            candidate={selectedCandidate}
            isOpen={selectedCandidate !== null}
            onClose={() => setSelectedCandidate(null)}
            onNavigate={onNavigate}
          />

          {/* Candidate Comparison Drawer */}
          <CandidateComparisonDrawer
            candidates={selectedCandidatesList}
            isOpen={showComparisonDrawer}
            onClose={() => setShowComparisonDrawer(false)}
            onSelectFinalist={(candidate) => {
              setShowComparisonDrawer(false);
              setSelectedCandidate(candidate);
            }}
          />
        </div>
      </PageTransition>
    </RecruiterShell>
  );
};
