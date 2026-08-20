/**
 * HireGenie AI - Job Status Filter Unit & Logic Verification Suite
 */

import { normalizeCanonicalJobStatus, matchesJobStatusFilter, computeJobStatusCounts } from './src/utils/statusUtils.ts';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

console.log('==================================================');
console.log('STARTING JOB STATUS FILTER & NORMALIZATION TESTS');
console.log('==================================================');

// 1. CASE NORMALIZATION
console.log('\n--- 1. Case Normalization ---');
assert(normalizeCanonicalJobStatus('open') === 'OPEN', "'open' normalizes to 'OPEN'");
assert(normalizeCanonicalJobStatus('OPEN') === 'OPEN', "'OPEN' normalizes to 'OPEN'");
assert(normalizeCanonicalJobStatus('Open') === 'OPEN', "'Open' normalizes to 'OPEN'");
assert(normalizeCanonicalJobStatus('active') === 'OPEN', "'active' normalizes to 'OPEN'");
assert(normalizeCanonicalJobStatus('ACTIVE') === 'OPEN', "'ACTIVE' normalizes to 'OPEN'");
assert(normalizeCanonicalJobStatus('Active') === 'OPEN', "'Active' normalizes to 'OPEN'");

assert(normalizeCanonicalJobStatus('closed') === 'CLOSED', "'closed' normalizes to 'CLOSED'");
assert(normalizeCanonicalJobStatus('CLOSED') === 'CLOSED', "'CLOSED' normalizes to 'CLOSED'");
assert(normalizeCanonicalJobStatus('Closed') === 'CLOSED', "'Closed' normalizes to 'CLOSED'");
assert(normalizeCanonicalJobStatus('paused') === 'CLOSED', "'paused' normalizes to 'CLOSED'");

assert(normalizeCanonicalJobStatus('draft') === 'DRAFT', "'draft' normalizes to 'DRAFT'");
assert(normalizeCanonicalJobStatus('DRAFT') === 'DRAFT', "'DRAFT' normalizes to 'DRAFT'");

assert(normalizeCanonicalJobStatus('archived') === 'ARCHIVED', "'archived' normalizes to 'ARCHIVED'");
assert(normalizeCanonicalJobStatus('ARCHIVED') === 'ARCHIVED', "'ARCHIVED' normalizes to 'ARCHIVED'");

// 2. FILTER MATCHING LOGIC
console.log('\n--- 2. Filter Matching Logic ---');
// 'all' matches everything
assert(matchesJobStatusFilter('OPEN', 'all') === true, "'all' matches 'OPEN'");
assert(matchesJobStatusFilter('CLOSED', 'all') === true, "'all' matches 'CLOSED'");
assert(matchesJobStatusFilter('DRAFT', 'all') === true, "'all' matches 'DRAFT'");
assert(matchesJobStatusFilter('ARCHIVED', 'all') === true, "'all' matches 'ARCHIVED'");

// 'Active' matches 'OPEN' and 'ACTIVE'
assert(matchesJobStatusFilter('OPEN', 'Active') === true, "'Active' filter matches PostgreSQL status 'OPEN'");
assert(matchesJobStatusFilter('open', 'Active') === true, "'Active' filter matches PostgreSQL status 'open'");
assert(matchesJobStatusFilter('ACTIVE', 'Active') === true, "'Active' filter matches status 'ACTIVE'");
assert(matchesJobStatusFilter('CLOSED', 'Active') === false, "'Active' filter does not match 'CLOSED'");

// 'Closed' matches 'CLOSED'
assert(matchesJobStatusFilter('CLOSED', 'Closed') === true, "'Closed' filter matches 'CLOSED'");
assert(matchesJobStatusFilter('OPEN', 'Closed') === false, "'Closed' filter does not match 'OPEN'");

// 'Draft' matches 'DRAFT'
assert(matchesJobStatusFilter('DRAFT', 'Draft') === true, "'Draft' filter matches 'DRAFT'");
assert(matchesJobStatusFilter('OPEN', 'Draft') === false, "'Draft' filter does not match 'OPEN'");

// 'Archived' matches 'ARCHIVED'
assert(matchesJobStatusFilter('ARCHIVED', 'Archived') === true, "'Archived' filter matches 'ARCHIVED'");
assert(matchesJobStatusFilter('OPEN', 'Archived') === false, "'Archived' filter does not match 'OPEN'");

// 3. REAL DATABASE COUNTS SIMULATION
console.log('\n--- 3. Database Status Counts Simulation ---');
// Scenario A: 3 OPEN jobs
const datasetA = [
  { id: '1', title: 'Software Engineer', status: 'OPEN' },
  { id: '2', title: 'Lead Staff Architect', status: 'OPEN' },
  { id: '3', title: 'Autonomous AI Engineer', status: 'OPEN' }
];
const countsA = computeJobStatusCounts(datasetA);
assert(countsA.all === 3, 'Scenario A: All = 3');
assert(countsA.active === 3, 'Scenario A: Active = 3');
assert(countsA.closed === 0, 'Scenario A: Closed = 0');
assert(countsA.draft === 0, 'Scenario A: Draft = 0');
assert(countsA.archived === 0, 'Scenario A: Archived = 0');

// Scenario B: 1 OPEN, 1 CLOSED, 1 ARCHIVED, 1 DRAFT
const datasetB = [
  { id: '1', title: 'Software Engineer', status: 'OPEN' },
  { id: '2', title: 'Legacy Backend Dev', status: 'CLOSED' },
  { id: '3', title: 'Old ML Researcher', status: 'ARCHIVED' },
  { id: '4', title: 'Unpublished PM Role', status: 'DRAFT' }
];
const countsB = computeJobStatusCounts(datasetB);
assert(countsB.all === 4, 'Scenario B: All = 4');
assert(countsB.active === 1, 'Scenario B: Active = 1');
assert(countsB.closed === 1, 'Scenario B: Closed = 1');
assert(countsB.archived === 1, 'Scenario B: Archived = 1');
assert(countsB.draft === 1, 'Scenario B: Draft = 1');

// 4. SEARCH + FILTER COMBINATIONS
console.log('\n--- 4. Search + Filter Combinations ---');
const searchDataset = [
  { id: '1', title: 'Senior AI Engineer', department: 'Engineering', location: 'San Francisco, CA', status: 'OPEN' },
  { id: '2', title: 'Senior Product Manager', department: 'Product', location: 'New York, NY', status: 'OPEN' },
  { id: '3', title: 'Senior AI Engineer (Contract)', department: 'Engineering', location: 'Remote', status: 'CLOSED' }
];

// Filter: Active only
const activeOnly = searchDataset.filter(j => matchesJobStatusFilter(j.status, 'Active'));
assert(activeOnly.length === 2, 'Search combo: Active filter yields 2 jobs');

// Filter: Active + Search "AI"
const activeAndSearchAI = activeOnly.filter(j => j.title.toLowerCase().includes('ai'));
assert(activeAndSearchAI.length === 1 && activeAndSearchAI[0].id === '1', 'Search combo: Active + "AI" yields 1 job');

// Filter: Closed + Search "AI"
const closedAndSearchAI = searchDataset
  .filter(j => matchesJobStatusFilter(j.status, 'Closed'))
  .filter(j => j.title.toLowerCase().includes('ai'));
assert(closedAndSearchAI.length === 1 && closedAndSearchAI[0].id === '3', 'Search combo: Closed + "AI" yields 1 job');

console.log('\n==================================================');
console.log('ALL JOB STATUS FILTER & NORMALIZATION TESTS PASSED');
console.log('==================================================');
