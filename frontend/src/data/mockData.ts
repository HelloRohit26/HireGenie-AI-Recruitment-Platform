import { UserProfile, SystemMetrics, PipelineStage, AIAgentStatus, JobRequisition, AIActivityItem, Candidate, ScreeningItem, InterviewItem, InsightMetric, FunnelData, NotificationItem, HelpArticle, FAQItem } from '../types';

export const mockUserProfile: UserProfile = {
  name: 'Recruiter User',
  role: 'Technical Recruiter',
  greeting: 'Welcome back.',
  subtitle: 'HireGenie AI Recruitment Engine.'
};

export const mockSystemMetrics: SystemMetrics = {
  activeJobs: 0,
  activeJobsTrend: 'Live DB data',
  totalApplicants: 0,
  totalApplicantsTrend: 'Live DB data',
  aiShortlisted: 0,
  aiShortlistedTrend: 'Live DB data',
  interviews: 0,
  interviewsTrend: 'Live DB data',
  offers: 0,
  offersTrend: 'Live DB data',
  avgTimeToHireDays: 0,
  timeToHireTrend: 'Calculated from DB'
};

export const mockPipelineStages: PipelineStage[] = [
  { id: 'applied', name: 'Applied', count: 0, percentage: 0, conversionRate: 'Base Pool', color: 'border-neutral-700 text-neutral-300' },
  { id: 'screening', name: 'AI Screening', count: 0, percentage: 0, conversionRate: '0% Screening', color: 'border-amber-500/40 text-amber-300' },
  { id: 'shortlisted', name: 'Shortlisted', count: 0, percentage: 0, conversionRate: '0% Shortlisted', color: 'border-amber-400 text-amber-200' },
  { id: 'interview', name: 'Interview', count: 0, percentage: 0, conversionRate: '0% Interviewed', color: 'border-teal-500/60 text-teal-300' },
  { id: 'final_review', name: 'Final Review', count: 0, percentage: 0, conversionRate: '0% Final Review', color: 'border-emerald-500/60 text-emerald-300' },
  { id: 'hired', name: 'Hired', count: 0, percentage: 0, conversionRate: '0% Hired', color: 'border-emerald-400 text-emerald-200 font-bold' }
];

export const mockAIAgents: AIAgentStatus[] = [
  {
    id: 'agent-1',
    name: 'Resume Parser',
    role: 'Document Extraction',
    status: 'Idle',
    statusColor: 'bg-amber-400 text-amber-950',
    currentTask: 'Processing incoming candidate resumes...',
    processedCount: '0 processed',
    activityPercentage: 0,
    lastActive: 'No activity'
  },
  {
    id: 'agent-2',
    name: 'Skill Matcher',
    role: 'Vector Embeddings',
    status: 'Idle',
    statusColor: 'bg-[#79A89A] text-slate-950',
    currentTask: 'Generating skill similarity vectors against job rubrics...',
    processedCount: '0 scored',
    activityPercentage: 0,
    lastActive: 'No activity'
  },
  {
    id: 'agent-3',
    name: 'Ranking Agent',
    role: 'Deterministic Scoring',
    status: 'Idle',
    statusColor: 'bg-[#D6A85F] text-[#11110F]',
    currentTask: 'Calculating weighted multi-criteria ranks...',
    processedCount: '0 ranked',
    activityPercentage: 0,
    lastActive: 'No activity'
  },
  {
    id: 'agent-4',
    name: 'Voice Interviewer',
    role: 'Autonomous Audio AI',
    status: 'Idle',
    statusColor: 'bg-teal-400 text-teal-950',
    currentTask: 'Conducting live technical voice interviews...',
    processedCount: '0 sessions',
    activityPercentage: 0,
    lastActive: 'No activity'
  },
  {
    id: 'agent-5',
    name: 'Evaluation Agent',
    role: 'Synthesis & Scoring',
    status: 'Idle',
    statusColor: 'bg-[#C97C5D] text-white',
    currentTask: 'Synthesizing dossiers & recruiter approvals...',
    processedCount: '0 dossiers',
    activityPercentage: 0,
    lastActive: 'No activity'
  }
];

export const mockActiveJobs: JobRequisition[] = [];

export const mockAIActivities: AIActivityItem[] = [];

export const mockCandidates: Candidate[] = [];

export const mockScreeningItems: ScreeningItem[] = [];

export const mockInterviews: InterviewItem[] = [];

export const mockInsightMetrics: InsightMetric[] = [
  { label: 'Time to Hire', value: 'N/A — insufficient data', change: '0 days', changeType: 'neutral', icon: 'speed' },
  { label: 'AI Screening Accuracy', value: 'N/A — insufficient data', change: '0%', changeType: 'neutral', icon: 'auto_awesome' },
  { label: 'Offer Acceptance Rate', value: 'N/A — insufficient data', change: '0%', changeType: 'neutral', icon: 'task_alt' },
  { label: 'Cost Per Hire', value: 'N/A — insufficient data', change: '$0', changeType: 'neutral', icon: 'payments' },
  { label: 'Candidate NPS', value: 'N/A — insufficient data', change: '0 pts', changeType: 'neutral', icon: 'thumb_up' }
];

export const mockFunnelData: FunnelData[] = [
  { stage: 'Applied', count: 0, percentage: 0, color: '#79A89A' },
  { stage: 'AI Screened', count: 0, percentage: 0, color: '#D6A85F' },
  { stage: 'Shortlisted', count: 0, percentage: 0, color: '#79A89A' },
  { stage: 'Interviewed', count: 0, percentage: 0, color: '#2DD4BF' },
  { stage: 'Offered', count: 0, percentage: 0, color: '#10B981' },
  { stage: 'Hired', count: 0, percentage: 0, color: '#34D399' }
];

export const mockNotifications: NotificationItem[] = [];

export const mockHelpArticles: HelpArticle[] = [
  {
    id: 'art-1',
    title: 'How Autonomous Candidate Screening Works',
    description: 'Learn how HireGenie AI parses resumes, matches skill vectors against job rubrics, and ranks candidates.',
    category: 'AI Pipeline',
    icon: 'help'
  },
  {
    id: 'art-2',
    title: 'Managing Job Requisitions & Application Limits',
    description: 'Guide to creating jobs, configuring target shortlist counts, and toggling OPEN vs CLOSED statuses.',
    category: 'Requisitions',
    icon: 'work'
  }
];

export const mockFAQs: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'General',
    question: 'Are candidates automatically marked as Hired by the AI?',
    answer: 'No. AI screening parses, matches, ranks, and recommends candidates, but recruiters remain final decision makers to hire candidates.'
  },
  {
    id: 'faq-2',
    category: 'General',
    question: 'What happens when a job status is set to CLOSED?',
    answer: 'New candidate applications are immediately disabled and rejected with 400 Bad Request. Existing candidate records remain visible to recruiters.'
  }
];
