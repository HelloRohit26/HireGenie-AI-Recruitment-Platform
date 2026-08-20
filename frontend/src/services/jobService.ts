import { apiRequest, ApiResponse } from './apiClient';
import { JobRequisition, JobStatusType, JobCreationPayload } from '../types';

const normalizeJob = (item: any): JobRequisition => ({
  id: String(item.id),
  title: item.title || 'Untitled Job Position',
  department: item.department || item.company || 'Engineering',
  company: item.company || 'Organization',
  location: item.location || 'Remote',
  workMode: item.work_mode || 'REMOTE',
  employmentType: item.employment_type || 'FULL_TIME',
  experienceLevel: item.experience_level || 'MID_LEVEL',
  minExperience: Number(item.min_experience ?? 0),
  maxExperience: Number(item.max_experience ?? 5),
  salaryRange: item.salary_range || 'Salary not disclosed',
  salaryDisclosed: item.salary_disclosed !== false,
  salaryType: item.salary_type || 'ANNUAL',
  currency: item.currency || 'INR',
  minSalary: (item.min_salary !== undefined && item.min_salary !== null) ? Number(item.min_salary) : (item.minSalary !== undefined && item.minSalary !== null ? Number(item.minSalary) : undefined),
  maxSalary: (item.max_salary !== undefined && item.max_salary !== null) ? Number(item.max_salary) : (item.maxSalary !== undefined && item.maxSalary !== null ? Number(item.maxSalary) : undefined),
  description: item.description || '',
  responsibilities: item.responsibilities || '',
  requirements: item.requirements || '',
  requiredQualifications: item.required_qualifications || '',
  preferredQualifications: item.preferred_qualifications || '',
  companyWebsite: item.company_website || '',
  companyDescription: item.company_description || '',
  companySize: item.company_size || '',
  mustHaveSkills: item.must_have_skills || [],
  niceToHaveSkills: item.nice_to_have_skills || [],
  extractedSkills: item.extracted_skills || [],
  screeningEnabled: item.screening_enabled !== false,
  educationRequirements: item.education_requirements || '',
  certifications: item.certifications || [],
  resumeRequired: item.resume_required !== false,
  targetShortlistCount: Number(item.target_shortlist_count ?? 20),
  shortlistThreshold: Number(item.shortlist_threshold ?? 70.0),
  maxInterviewCandidates: Number(item.max_interview_candidates ?? 10),
  autoShortlist: item.auto_shortlist !== false,
  interviewMode: item.interview_mode || 'WEBRTC',
  interviewDurationMinutes: Number(item.interview_duration_minutes ?? 15),
  technicalTopics: item.technical_topics || [],
  behavioralTopics: item.behavioral_topics || [],
  interviewDifficulty: item.interview_difficulty || 'MEDIUM',
  interviewRubric: item.interview_rubric || {
    "Communication": 25.0,
    "Technical Knowledge": 35.0,
    "Problem Solving": 25.0,
    "Role Fit": 15.0
  },
  screeningQuestions: item.screening_questions || [],
  postedDate: item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date unavailable',
  postedTimestamp: item.created_at ? new Date(item.created_at).getTime() : 0,
  applicantsCount: Number(item.applicants_count || 0),
  shortlistedCount: Number(item.shortlisted_count || 0),
  interviewsCount: Number(item.interviews_count || 0),
  offersCount: Number(item.offers_count || 0),
  hiredCount: Number(item.hired_count || 0),
  avgTimeToHireDays: Number(item.avg_time_to_hire_days || 0),
  status: (item.status || 'OPEN') as JobStatusType,
  statusBadgeColor: (item.status === 'CLOSED' || item.status === 'Closed')
    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
    : (item.status === 'DRAFT' || item.status === 'Draft')
    ? 'bg-neutral-500/20 text-neutral-300 border-neutral-500/40'
    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  pipeline: {
    applicants: Number(item.applicants_count || 0),
    shortlisted: Number(item.shortlisted_count || 0),
    interviews: Number(item.interviews_count || 0),
    offers: Number(item.offers_count || 0),
    hired: Number(item.hired_count || 0)
  },
  createdAt: item.created_at || 'Date unavailable'
});

export const jobService = {
  /**
   * Fetches all live job requisitions from FastAPI backend
   */
  async getJobs(): Promise<ApiResponse<JobRequisition[]>> {
    const res = await apiRequest<any[]>('/jobs', { method: 'GET' });
    const normalizedData: JobRequisition[] = (res.data || []).map(normalizeJob);
    return { ...res, data: normalizedData };
  },

  /**
   * Fetches single requisition details by ID from FastAPI backend
   */
  async getJobById(jobId: string): Promise<ApiResponse<JobRequisition>> {
    const res = await apiRequest<any>(`/jobs/${jobId}`, { method: 'GET' });
    return { ...res, data: normalizeJob(res.data) };
  },

  /**
   * Creates a new job requisition via FastAPI backend
   */
  async createJob(newJobData: Partial<JobCreationPayload> | any): Promise<ApiResponse<JobRequisition>> {
    const payload = {
      title: newJobData.title,
      company: newJobData.company || 'Organization',
      department: newJobData.department || 'Engineering',
      description: newJobData.description || '',
      responsibilities: newJobData.responsibilities || '',
      requirements: newJobData.requirements || '',
      required_qualifications: newJobData.required_qualifications || newJobData.requiredQualifications || '',
      preferred_qualifications: newJobData.preferred_qualifications || newJobData.preferredQualifications || '',
      location: newJobData.location || 'Remote',
      work_mode: newJobData.work_mode || newJobData.workMode || 'REMOTE',
      employment_type: newJobData.employment_type || newJobData.employmentType || 'FULL_TIME',
      experience_level: newJobData.experience_level || newJobData.experienceLevel || 'MID_LEVEL',
      min_experience: Number(newJobData.min_experience ?? newJobData.minExperience ?? 0),
      max_experience: Number(newJobData.max_experience ?? newJobData.maxExperience ?? 5),
      salary_disclosed: newJobData.salary_disclosed ?? newJobData.salaryDisclosed ?? true,
      salary_type: newJobData.salary_type || newJobData.salaryType || 'ANNUAL',
      currency: newJobData.currency || newJobData.currencyType || 'INR',
      min_salary: (newJobData.min_salary !== undefined && newJobData.min_salary !== null) ? Number(newJobData.min_salary) : (newJobData.minSalary !== undefined && newJobData.minSalary !== null ? Number(newJobData.minSalary) : null),
      max_salary: (newJobData.max_salary !== undefined && newJobData.max_salary !== null) ? Number(newJobData.max_salary) : (newJobData.maxSalary !== undefined && newJobData.maxSalary !== null ? Number(newJobData.maxSalary) : null),
      salary_range: newJobData.salary_range || newJobData.salaryRange || null,
      company_website: newJobData.company_website || newJobData.companyWebsite || '',
      company_description: newJobData.company_description || newJobData.companyDescription || '',
      company_size: newJobData.company_size || newJobData.companySize || '',
      status: newJobData.status || 'OPEN',
      must_have_skills: newJobData.must_have_skills || newJobData.mustHaveSkills || [],
      nice_to_have_skills: newJobData.nice_to_have_skills || newJobData.niceToHaveSkills || [],
      screening_enabled: newJobData.screening_enabled ?? newJobData.screeningEnabled ?? true,
      education_requirements: newJobData.education_requirements || newJobData.educationRequirements || '',
      certifications: newJobData.certifications || [],
      resume_required: newJobData.resume_required ?? newJobData.resumeRequired ?? true,
      target_shortlist_count: Number(newJobData.target_shortlist_count ?? newJobData.targetShortlistCount ?? 20),
      shortlist_threshold: Number(newJobData.shortlist_threshold ?? newJobData.shortlistThreshold ?? 70.0),
      max_interview_candidates: Number(newJobData.max_interview_candidates ?? newJobData.maxInterviewCandidates ?? 10),
      auto_shortlist: newJobData.auto_shortlist ?? newJobData.autoShortlist ?? true,
      interview_mode: newJobData.interview_mode || newJobData.interviewMode || 'WEBRTC',
      interview_duration_minutes: Number(newJobData.interview_duration_minutes ?? newJobData.interviewDurationMinutes ?? 15),
      technical_topics: newJobData.technical_topics || newJobData.technicalTopics || [],
      behavioral_topics: newJobData.behavioral_topics || newJobData.behavioralTopics || [],
      interview_difficulty: newJobData.interview_difficulty || newJobData.interviewDifficulty || 'MEDIUM',
      interview_rubric: newJobData.interview_rubric || newJobData.interviewRubric || null,
      screening_questions: newJobData.screening_questions || newJobData.screeningQuestions || []
    };

    const res = await apiRequest<any>('/jobs', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    return { ...res, data: normalizeJob(res.data) };
  },

  /**
   * Updates requisition status (OPEN, DRAFT, CLOSED, ARCHIVED)
   */
  async updateJobStatus(jobId: string, status: JobStatusType): Promise<ApiResponse<JobRequisition>> {
    const res = await apiRequest<any>(`/jobs/${jobId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });

    return { ...res, data: normalizeJob(res.data) };
  },

  /**
   * Edits an existing job requisition
   */
  async updateJob(jobId: string, updateData: Partial<JobCreationPayload> | any): Promise<ApiResponse<JobRequisition>> {
    const res = await apiRequest<any>(`/jobs/${jobId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });

    return { ...res, data: normalizeJob(res.data) };
  }
};
