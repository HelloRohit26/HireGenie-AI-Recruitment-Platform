/**
 * HireGenie AI - TypeScript Data Definitions
 * Designed for seamless integration with FastAPI backend endpoints.
 */

export type ThemeMode = 'dark' | 'light';

export interface UserProfile {
  name: string;
  role: string;
  avatarUrl?: string;
  greeting: string;
  subtitle: string;
}

export interface SystemMetrics {
  activeJobs: number;
  activeJobsTrend: string;
  totalApplicants: number;
  totalApplicantsTrend: string;
  aiShortlisted: number;
  aiShortlistedTrend: string;
  interviews: number;
  interviewsTrend: string;
  offers: number;
  offersTrend: string;
  avgTimeToHireDays: number;
  timeToHireTrend: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  count: number;
  percentage: number;
  conversionRate: string;
  color: string;
}

export interface AIAgentStatus {
  id: string;
  name: string;
  role: string;
  status: 'Processing' | 'Active' | 'Conducting' | 'Analyzing' | 'Idle';
  statusColor: string;
  currentTask: string;
  processedCount: string;
  activityPercentage: number;
  lastActive: string;
}

export type JobStatusType = 'Active' | 'Draft' | 'Paused' | 'Closed' | 'OPEN' | 'CLOSED' | 'ARCHIVED';

export interface JobPipelineBreakdown {
  applicants: number;
  shortlisted: number;
  interviews: number;
  offers: number;
  hired: number;
}

export interface ScreeningQuestionItem {
  id?: number;
  question_text: string;
  category?: string;
  weight?: number;
  is_required?: boolean;
}

export interface JobRequisition {
  id: string;
  title: string;
  department: string;
  company?: string;
  location: string;
  workMode?: 'REMOTE' | 'HYBRID' | 'ON_SITE' | string;
  employmentType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | string;
  experienceLevel?: 'ENTRY_LEVEL' | 'MID_LEVEL' | 'SENIOR' | 'LEAD' | string;
  minExperience?: number;
  maxExperience?: number;
  salaryRange?: string;
  salaryDisclosed?: boolean;
  salaryType?: 'ANNUAL' | 'MONTHLY' | 'HOURLY' | string;
  currency?: 'INR' | 'USD' | 'EUR' | 'GBP' | string;
  minSalary?: number;
  maxSalary?: number;
  description?: string;
  responsibilities?: string;
  requirements?: string;
  requiredQualifications?: string;
  preferredQualifications?: string;
  companyWebsite?: string;
  companyDescription?: string;
  companySize?: string;
  mustHaveSkills?: string[];
  niceToHaveSkills?: string[];
  extractedSkills?: string[];
  screeningEnabled?: boolean;
  educationRequirements?: string;
  certifications?: string[];
  resumeRequired?: boolean;
  targetShortlistCount?: number;
  shortlistThreshold?: number;
  maxInterviewCandidates?: number;
  autoShortlist?: boolean;
  interviewMode?: string;
  interviewDurationMinutes?: number;
  technicalTopics?: string[];
  behavioralTopics?: string[];
  interviewDifficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT' | string;
  interviewRubric?: Record<string, number>;
  screeningQuestions?: ScreeningQuestionItem[];
  postedDate: string;
  postedTimestamp: number;
  applicantsCount: number;
  shortlistedCount: number;
  interviewsCount: number;
  offersCount: number;
  hiredCount?: number;
  avgTimeToHireDays: number;
  status: JobStatusType;
  statusBadgeColor: string;
  pipeline: JobPipelineBreakdown;
  createdAt: string;
}

export interface JobCreationPayload {
  title: string;
  company: string;
  department: string;
  description: string;
  responsibilities?: string;
  requirements?: string;
  required_qualifications?: string;
  preferred_qualifications?: string;
  location?: string;
  work_mode?: string;
  employment_type?: string;
  experience_level?: string;
  min_experience?: number;
  max_experience?: number;
  salary_disclosed?: boolean;
  salary_type?: string;
  currency?: string;
  min_salary?: number;
  max_salary?: number;
  salary_range?: string;
  company_website?: string;
  company_description?: string;
  company_size?: string;
  status?: string;
  must_have_skills?: string[];
  nice_to_have_skills?: string[];
  screening_enabled?: boolean;
  education_requirements?: string;
  certifications?: string[];
  resume_required?: boolean;
  target_shortlist_count?: number;
  shortlist_threshold?: number;
  max_interview_candidates?: number;
  auto_shortlist?: boolean;
  interview_mode?: string;
  interview_duration_minutes?: number;
  technical_topics?: string[];
  behavioral_topics?: string[];
  interview_difficulty?: string;
  interview_rubric?: Record<string, number>;
  screening_questions?: ScreeningQuestionItem[];
}

export interface AIActivityItem {
  id: string;
  title: string;
  jobTitle: string;
  agentName: string;
  timeAgo: string;
  type: 'shortlist' | 'parse' | 'interview' | 'review' | 'offer';
  typeBadgeColor: string;
}

export type JobSortOption = 'recently_posted' | 'applicants' | 'shortlisted' | 'interviews' | 'time_to_hire';

// ─── Candidate Types ──────────────────────────────────

export type CandidateStatus = 'Applied' | 'Screening' | 'Shortlisted' | 'Interview' | 'Final Review' | 'Offered' | 'Hired' | 'Rejected' | 'OFFER_DECLINED';

export interface CandidateSkill {
  name: string;
  score: number; // 0-100
  matched: boolean;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string; // initials
  title: string;
  location: string;
  experience: string;
  appliedDate: string;
  appliedTimestamp: number;
  jobId: string;
  jobTitle: string;
  status: CandidateStatus;
  aiScore: number; // 0-100
  skills: CandidateSkill[];
  resumeUrl?: string;
  education: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  interviewScore?: number;
  interviewNotes?: string;
  interviewEvaluation?: InterviewEvaluationData;
  offer?: OfferData;
  canMakeDecision?: boolean;
  hasCompletedInterview?: boolean;
  hasCompletedEvaluation?: boolean;
  company?: string;
  salaryRange?: string;
}

export interface InterviewEvaluationData {
  id?: number;
  status: 'PENDING' | 'ANALYZING' | 'COMPLETED' | 'FAILED' | 'NOT_STARTED';
  technicalScore?: number;
  problemSolvingScore?: number;
  communicationScore?: number;
  roleFitScore?: number;
  overallScore?: number;
  recommendation?: 'STRONG_HIRE' | 'HIRE' | 'CONSIDER' | 'NO_HIRE';
  strengths?: string[];
  gaps?: string[];
  evidence?: string[];
  explanation?: string;
  errorMessage?: string;
  message?: string;
  canRetry?: boolean;
}

export interface OfferData {
  id?: number;
  offerToken?: string;
  status: 'OFFERED' | 'OFFER_ACCEPTED' | 'OFFER_DECLINED';
  compensation?: string;
  roleTitle?: string;
  companyName?: string;
  createdAt?: string;
  expiresAt?: string;
  acceptedAt?: string;
  declinedAt?: string;
}

// ─── Screening Types ──────────────────────────────────

export type ScreeningStage = 'Parsing' | 'Matching' | 'Ranking' | 'Complete' | 'Failed';

export interface ScreeningItem {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateAvatar: string;
  jobId: string;
  jobTitle: string;
  stage: ScreeningStage;
  progress: number; // 0-100
  aiScore?: number;
  startedAt: string;
  completedAt?: string;
  reasoning?: string;
  matchedSkills: string[];
  missingSkills: string[];
  decision?: 'Shortlisted' | 'Rejected' | 'Manual Review';
}

// ─── Interview Types ──────────────────────────────────

export type InterviewStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled' | 'No Show';
export type InterviewType = 'AI Voice' | 'Technical' | 'Behavioral' | 'Final Round';

export interface InterviewItem {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateAvatar: string;
  jobId: string;
  jobTitle: string;
  type: InterviewType;
  status: InterviewStatus;
  scheduledDate: string;
  scheduledTime: string;
  duration: string;
  interviewer: string;
  score?: number;
  notes?: string;
  recordingUrl?: string;
  magicLink?: string;
}

// ─── Insights Types ──────────────────────────────────

export interface InsightMetric {
  label: string;
  value: string | number;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: string;
}

export interface FunnelData {
  stage: string;
  count: number;
  percentage: number;
  color: string;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

// ─── Notification Types ──────────────────────────────────

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'ai';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timeAgo: string;
  read: boolean;
  actionUrl?: string;
  icon: string;
}

// ─── Settings Types ──────────────────────────────────

export interface SettingsSection {
  id: string;
  label: string;
  icon: string;
}

// ─── Help Types ──────────────────────────────────

export interface HelpArticle {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

// ─── Candidate Journey & Tracking Types ─────────────────────────

export interface CandidateJourneyStage {
  id: string;
  name: string;
  status: 'COMPLETED' | 'ACTIVE' | 'FAILED' | 'PENDING' | 'NOT_APPLICABLE';
  score?: number | null;
  rank?: number | null;
  score_breakdown?: Record<string, number> | null;
  rejection_reason?: string | null;
  invitation_token?: string | null;
  session_token?: string | null;
  decision?: string | null;
  timestamp?: string | null;
  detail?: string;
}

export interface CandidateTimelineEvent {
  key: string;
  title: string;
  description: string;
  timestamp?: string | null;
  status: 'SUCCESS' | 'FAILED' | 'IN_PROGRESS' | 'INFO';
  agent_name?: string;
}

export interface CandidateJourneyApplication {
  id: number;
  candidate_id: number;
  job_id: number;
  status: string;
  overall_match_score?: number | null;
  score_breakdown?: Record<string, number> | null;
  rejection_reason?: string | null;
  rank?: number | null;
  magic_token?: string | null;
  applied_at?: string | null;
}

export interface CandidateJourneyJob {
  id: number;
  title: string;
  company: string;
  department: string;
  location: string;
  work_mode?: string;
  employment_type?: string;
  salary_range?: string | null;
  status?: string;
  must_have_skills?: string[];
  description?: string;
}

export interface CandidateJourneyData {
  application: CandidateJourneyApplication;
  job: CandidateJourneyJob;
  candidate: {
    id: number;
    full_name: string;
    email: string;
  };
  agent_telemetry: Array<{
    id: number;
    agent_name: string;
    status: string;
    started_at?: string | null;
    completed_at?: string | null;
    duration_ms?: number | null;
    error_message?: string | null;
    details?: any;
  }>;
  interview_invitation?: {
    id: number;
    invitation_token: string;
    status: string;
    interview_mode?: string;
    created_at?: string | null;
    expires_at?: string | null;
    accepted_at?: string | null;
    scheduled_at?: string | null;
  } | null;
  interview_session?: {
    id: number;
    session_token: string;
    status: string;
    started_at?: string | null;
    ended_at?: string | null;
    elapsed_seconds?: number;
  } | null;
  interview_evaluation?: {
    id: number;
    status: string;
    overall_score?: number | null;
    technical_score?: number | null;
    problem_solving_score?: number | null;
    communication_score?: number | null;
    role_fit_score?: number | null;
    recommendation?: string | null;
    strengths?: string[] | null;
    gaps?: string[] | null;
    explanation?: string | null;
  } | null;
  hiring_decision?: {
    id: number;
    decision: string;
    decided_at?: string | null;
    reason?: string | null;
  } | null;
  job_offer?: {
    id: number;
    offer_token: string;
    status: string;
    compensation?: string | null;
    role_title: string;
    company_name: string;
    created_at?: string | null;
    expires_at?: string | null;
    accepted_at?: string | null;
    declined_at?: string | null;
    decline_reason?: string | null;
  } | null;
  tracking_stages: CandidateJourneyStage[];
  timeline: CandidateTimelineEvent[];
  is_processing: boolean;
}

