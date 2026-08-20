/**
 * HireGenie AI - Candidate Intelligence & Dossier API Service
 * Handles live FastAPI backend candidate fetching, dossier hydration, status updates, and multi-candidate comparison.
 */

import { apiRequest, ApiResponse } from './apiClient';
import { Candidate, CandidateStatus, CandidateSkill, OfferData } from '../types';

export const candidateService = {
  /**
   * Fetches live candidate intelligence roster with optional job and status filtering from FastAPI
   */
  async getCandidates(jobId?: string, status?: string): Promise<ApiResponse<Candidate[]>> {
    let endpoint = '/recruiter/candidates';
    const params = new URLSearchParams();
    if (jobId && jobId !== 'all') params.append('job_id', jobId);
    if (status && status.toLowerCase() !== 'all') params.append('status', status);
    if (params.toString()) endpoint += `?${params.toString()}`;

    const res = await apiRequest<any[]>(endpoint, { method: 'GET' });
    const normalizedCandidates: Candidate[] = (res.data || []).map((item) => {
      const rawSkills = item.skills || item.parsed_skills || [];
      const skillList: CandidateSkill[] = (Array.isArray(rawSkills) ? rawSkills : []).map((s: any) => ({
        name: typeof s === 'string' ? s : s.name || 'Skill',
        score: typeof s === 'object' && s.score ? s.score : 0,
        matched: true
      }));

      const candidateName = item.candidate_name || item.full_name || 'Candidate User';
      const initials = candidateName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'CU';

      return {
        id: String(item.id || item.application_id),
        name: candidateName,
        email: item.email || 'Not provided',
        phone: item.phone || 'Not provided',
        avatar: initials,
        title: item.job_title || 'Not provided',
        location: item.location || 'Not provided',
        experience: item.experience || 'Not provided',
        appliedDate: item.applied_date || item.applied_at ? new Date(item.applied_at || item.applied_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date unavailable',
        appliedTimestamp: item.applied_at ? new Date(item.applied_at).getTime() : 0,
        jobId: String(item.job_id || ''),
        jobTitle: item.job_title || 'Not specified',
        status: (item.status || 'RECEIVED') as CandidateStatus,
        aiScore: Number(item.overall_match_score || item.overall_score || 0),
        skills: skillList,
        education: item.education || 'Not provided',
        summary: item.summary || item.rejection_reason || 'Application registered in database.',
        strengths: item.strengths || [],
        weaknesses: item.weaknesses || []
      };
    });

    return { ...res, data: normalizedCandidates };
  },

  /**
   * Fetches detailed candidate dossier by ID from FastAPI backend
   */
  async getCandidateById(candidateId: string): Promise<ApiResponse<Candidate>> {
    const res = await apiRequest<any>(`/recruiter/dossier/${candidateId}`, { method: 'GET' });
    const item = res.data;

    const candidateName = item.candidate_name || 'Candidate User';
    const initials = candidateName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'CU';

    const rawSkills = item.skills || item.parsed_skills || [];
    const skillList: CandidateSkill[] = (Array.isArray(rawSkills) ? rawSkills : []).map((s: any) => ({
      name: typeof s === 'string' ? s : s.name || 'Skill',
      score: typeof s === 'object' && s.score ? s.score : 0,
      matched: true
    }));

    const rawEval = item.interview_evaluation;
    let evalObj = undefined;
    if (rawEval) {
      evalObj = {
        id: rawEval.id,
        status: rawEval.status,
        technicalScore: rawEval.technical_score,
        problemSolvingScore: rawEval.problem_solving_score,
        communicationScore: rawEval.communication_score,
        roleFitScore: rawEval.role_fit_score,
        overallScore: rawEval.overall_score,
        recommendation: rawEval.recommendation,
        strengths: rawEval.strengths || [],
        gaps: rawEval.gaps || [],
        evidence: rawEval.evidence || [],
        explanation: rawEval.explanation,
        errorMessage: rawEval.error_message,
        message: rawEval.message,
        canRetry: rawEval.can_retry
      };
    }

    const rawOffer = item.offer;
    let offerObj: OfferData | undefined = undefined;
    if (rawOffer) {
      offerObj = {
        id: rawOffer.id,
        offerToken: rawOffer.offer_token,
        status: rawOffer.status,
        compensation: rawOffer.compensation,
        roleTitle: rawOffer.role_title,
        companyName: rawOffer.company_name,
        createdAt: rawOffer.created_at,
        expiresAt: rawOffer.expires_at,
        acceptedAt: rawOffer.accepted_at,
        declinedAt: rawOffer.declined_at
      };
    }

    const normalizedCandidate: Candidate = {
      id: String(item.application_id || candidateId),
      name: candidateName,
      email: item.email || 'Not provided',
      phone: item.phone || 'Not provided',
      avatar: initials,
      title: item.job_title || 'Not provided',
      location: item.location || 'Not provided',
      experience: item.experience || 'Not provided',
      appliedDate: item.applied_at ? new Date(item.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date unavailable',
      appliedTimestamp: item.applied_at ? new Date(item.applied_at).getTime() : 0,
      jobId: String(item.job_id || ''),
      jobTitle: item.job_title || 'Not specified',
      status: (item.status || 'RECEIVED') as CandidateStatus,
      aiScore: Number(item.overall_score || item.overall_match_score || 0),
      skills: skillList,
      education: item.education || 'Not provided',
      summary: item.summary || 'Dossier generated from database metrics.',
      strengths: item.strengths || [],
      weaknesses: item.weaknesses || [],
      interviewEvaluation: evalObj,
      offer: offerObj,
      canMakeDecision: item.can_make_decision || false,
      hasCompletedInterview: item.has_completed_interview || false,
      hasCompletedEvaluation: item.has_completed_evaluation || false,
      company: item.company || '',
      salaryRange: item.salary_range || undefined
    };

    return { ...res, data: normalizedCandidate };
  },

  /**
   * Retries failed interview evaluation for an application via FastAPI backend
   */
  async retryEvaluation(applicationId: string): Promise<ApiResponse<any>> {
    return apiRequest<any>(`/interview/evaluation/${applicationId}/retry`, {
      method: 'POST'
    });
  },

  /**
   * Updates candidate status pipeline stage (e.g. Shortlisted -> Interview) via FastAPI backend
   */
  async updateCandidateStatus(candidateId: string, status: CandidateStatus): Promise<ApiResponse<Candidate>> {
    return apiRequest<Candidate>(`/recruiter/applications/${candidateId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  /**
   * Fetches side-by-side comparison data for selected candidates
   */
  async compareCandidates(candidateIds: string[]): Promise<ApiResponse<Candidate[]>> {
    return apiRequest<Candidate[]>('/recruiter/candidates/compare', {
      method: 'POST',
      body: JSON.stringify({ candidate_ids: candidateIds })
    });
  },

  /**
   * Uploads resume file for authenticated candidate to FastAPI backend
   */
  async uploadResume(file: File): Promise<ApiResponse<{ resume_id: number; filename: string; file_path: string }>> {
    const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
    const formData = new FormData();
    formData.append('file', file);

    const token = (import.meta as any).env ? localStorage.getItem('hg_auth_token') : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/candidate/upload-resume`, {
      method: 'POST',
      headers,
      body: formData
    });
    if (!response.ok) {
      throw new Error(`Resume upload failed with status: ${response.status}`);
    }
    const data = await response.json();
    return { data, status: response.status };
  },

  /**
   * Submits candidate application to FastAPI backend
   */
  async applyForJob(payload: { jobId: string; resumeId?: number; coverNote?: string }): Promise<ApiResponse<any>> {
    return apiRequest<any>('/candidate/apply', {
      method: 'POST',
      body: JSON.stringify({
        job_id: Number(payload.jobId),
        resume_id: payload.resumeId || undefined,
        cover_note: payload.coverNote || '',
        answers: []
      })
    });
  },

  /**
   * Fetches applications for the authenticated candidate from FastAPI backend
   */
  async getMyApplications(): Promise<ApiResponse<any[]>> {
    return apiRequest<any[]>('/candidate/applications', { method: 'GET' });
  },

  /**
   * Fetches aggregated real candidate journey for an application
   */
  async getApplicationJourney(applicationId: string | number): Promise<ApiResponse<any>> {
    return apiRequest<any>(`/candidate/applications/${applicationId}/journey`, { method: 'GET' });
  },

  /**
   * Fetches live agent execution telemetry for a specific application
   */
  async getApplicationTelemetry(applicationId: string | number): Promise<ApiResponse<any[]>> {
    return apiRequest<any[]>(`/candidate/applications/${applicationId}/telemetry`, { method: 'GET' });
  },

  /**
   * Idempotently retries screening pipeline for a failed or rejected application
   */
  async retryScreening(applicationId: string | number): Promise<ApiResponse<any>> {
    return apiRequest<any>(`/candidate/applications/${applicationId}/retry`, { method: 'POST' });
  },

  /**
   * Fetches interview invitation details by secure token
   */
  async getInvitationByToken(token: string): Promise<ApiResponse<any>> {
    return apiRequest<any>(`/interview/invitation/${token}`, { method: 'GET' });
  },

  /**
   * Responds to interview invitation (ACCEPT or DECLINE)
   */
  async respondToInvitation(token: string, action: 'ACCEPT' | 'DECLINE', notes?: string): Promise<ApiResponse<any>> {
    return apiRequest<any>(`/interview/invitation/${token}/respond`, {
      method: 'POST',
      body: JSON.stringify({ action, notes })
    });
  },

  /**
   * Starts or recovers an interview session via FastAPI backend
   */
  async startSession(token: string): Promise<ApiResponse<any>> {
    return apiRequest<any>('/interview/session/start', {
      method: 'POST',
      body: JSON.stringify({ token })
    });
  },

  /**
   * Gets current persisted interview session state & timer info via FastAPI backend
   */
  async getSession(token: string): Promise<ApiResponse<any>> {
    return apiRequest<any>(`/interview/session/${token}`, { method: 'GET' });
  },

  /**
   * Completes an active interview session
   */
  async completeSession(token: string, transcript?: any[]): Promise<ApiResponse<any>> {
    return apiRequest<any>(`/interview/session/${token}/complete`, {
      method: 'POST',
      body: JSON.stringify({ transcript })
    });
  },

  /**
   * Recruiter hires a candidate — creates offer and triggers offer email
   */
  async hireCandidate(applicationId: string, reason?: string): Promise<ApiResponse<any>> {
    return apiRequest<any>(`/hiring/recruiter/applications/${applicationId}/hire`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  },

  /**
   * Recruiter rejects a candidate after evaluation
   */
  async rejectCandidate(applicationId: string, reason?: string): Promise<ApiResponse<any>> {
    return apiRequest<any>(`/hiring/recruiter/applications/${applicationId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  },

  /**
   * Fetches offer details for candidate portal by token
   */
  async getOfferByToken(token: string): Promise<ApiResponse<any>> {
    return apiRequest<any>(`/hiring/candidate/offer/${token}`, { method: 'GET' });
  },

  /**
   * Candidate responds to offer (ACCEPT or DECLINE)
   */
  async respondToOffer(token: string, action: 'ACCEPT' | 'DECLINE', declineReason?: string): Promise<ApiResponse<any>> {
    return apiRequest<any>(`/hiring/candidate/offer/${token}/respond`, {
      method: 'POST',
      body: JSON.stringify({ action, decline_reason: declineReason })
    });
  }
};
