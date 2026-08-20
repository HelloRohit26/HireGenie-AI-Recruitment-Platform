/**
 * HireGenie AI - Canonical Job Status Normalization & Filter Utilities
 * Provides a single source of truth for mapping database statuses to UI representations.
 */

export type CanonicalJobStatus = 'OPEN' | 'DRAFT' | 'CLOSED' | 'ARCHIVED';

/**
 * Normalizes any API or UI status string to its canonical database representation.
 * Handles case-insensitivity: 'open', 'OPEN', 'Open', 'active', 'ACTIVE', 'Active' -> 'OPEN'
 */
export function normalizeCanonicalJobStatus(status?: string | null): CanonicalJobStatus {
  if (!status) return 'OPEN';
  const s = String(status).trim().toUpperCase();

  switch (s) {
    case 'OPEN':
    case 'ACTIVE':
      return 'OPEN';
    case 'DRAFT':
      return 'DRAFT';
    case 'CLOSED':
    case 'PAUSED':
      return 'CLOSED';
    case 'ARCHIVED':
      return 'ARCHIVED';
    default:
      return 'OPEN';
  }
}

/**
 * Checks if a job status matches a requested UI filter tab.
 * 'all' matches all jobs.
 * 'active' / 'open' matches canonical 'OPEN'.
 * 'closed' matches canonical 'CLOSED'.
 * 'draft' matches canonical 'DRAFT'.
 * 'archived' matches canonical 'ARCHIVED'.
 */
export function matchesJobStatusFilter(jobStatus: string | undefined | null, filterId: string): boolean {
  if (!filterId || filterId.toLowerCase() === 'all') {
    return true;
  }
  const normalizedJob = normalizeCanonicalJobStatus(jobStatus);
  const normalizedFilter = normalizeCanonicalJobStatus(filterId);
  return normalizedJob === normalizedFilter;
}

/**
 * Computes status counts across an array of jobs using the canonical mapping.
 */
export function computeJobStatusCounts(jobs: Array<{ status?: string | null }>): {
  all: number;
  active: number;
  draft: number;
  closed: number;
  archived: number;
} {
  const counts = {
    all: jobs.length,
    active: 0,
    draft: 0,
    closed: 0,
    archived: 0
  };

  jobs.forEach(job => {
    const canonical = normalizeCanonicalJobStatus(job.status);
    if (canonical === 'OPEN') counts.active += 1;
    else if (canonical === 'DRAFT') counts.draft += 1;
    else if (canonical === 'CLOSED') counts.closed += 1;
    else if (canonical === 'ARCHIVED') counts.archived += 1;
  });

  return counts;
}
