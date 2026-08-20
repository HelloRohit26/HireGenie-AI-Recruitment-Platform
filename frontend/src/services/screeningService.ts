import { apiRequest, ApiResponse } from './apiClient';
import { ScreeningItem, ScreeningStage } from '../types';

export interface RecruiterCandidateItem {
  id: number;
  application_id: number;
  candidate_id: number;
  candidate_name: string;
  email: string;
  job_id: number;
  job_title: string;
  status: string;
  rank: number | null;
  invitation_status: string;
  invitation_token: string | null;
  overall_match_score: number;
  score_breakdown?: {
    overall_score?: number;
    skill_score?: number;
    experience_score?: number;
    project_score?: number;
    education_score?: number;
    role_fit_score?: number;
    matched_skills?: string[];
    missing_skills?: string[];
    partial_matches?: string[];
    strengths?: string[];
    gaps?: string[];
    explanation?: string;
    ai_provider_status?: string;
  };
  applied_date: string;
}

export const screeningService = {
  /**
   * Fetches real candidate applications from PostgreSQL via FastAPI /recruiter/candidates
   */
  async getScreeningQueue(jobId?: string | number, status?: string): Promise<ApiResponse<RecruiterCandidateItem[]>> {
    const params = new URLSearchParams();
    if (jobId && jobId !== 'all') {
      params.append('job_id', String(jobId));
    }
    if (status && status !== 'all') {
      params.append('status', status);
    } else {
      params.append('status', 'All');
    }

    const endpoint = `/recruiter/candidates?${params.toString()}`;
    return apiRequest<RecruiterCandidateItem[]>(endpoint, { method: 'GET' });
  },

  /**
   * Triggers real AI screening pipeline across all applicants for a job
   */
  async runBatchScreening(jobId: number, topN: number = 5): Promise<ApiResponse<any>> {
    return apiRequest('/recruiter/trigger-screening', {
      method: 'POST',
      body: JSON.stringify({ job_id: jobId, override_top_n: topN })
    });
  },

  /**
   * Updates candidate status (e.g. Shortlist / Reject override)
   */
  async updateStatus(applicationId: number, newStatus: string): Promise<ApiResponse<any>> {
    return apiRequest(`/recruiter/applications/${applicationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    });
  },

  /**
   * Fetches full candidate AI dossier from backend
   */
  async getDossier(applicationId: number): Promise<ApiResponse<any>> {
    return apiRequest(`/recruiter/dossier/${applicationId}`, { method: 'GET' });
  }
};
