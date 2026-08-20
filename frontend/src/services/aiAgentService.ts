/**
 * HireGenie AI - Autonomous Recruitment AI Agent Pipeline Service
 * Interfacing ResumeParserAgent, SkillMatcherAgent, CandidateRankerAgent,
 * VoiceInterviewerAgent, and EvaluationAgent with deterministic scoring & explainable reasoning.
 */

import { apiRequest, ApiResponse } from './apiClient';

export interface AIAgentStatus {
  agentName: 'ResumeParserAgent' | 'SkillMatcherAgent' | 'CandidateRankerAgent' | 'VoiceInterviewerAgent' | 'EvaluationAgent';
  status: 'idle' | 'processing' | 'completed' | 'failed';
  processedCount: number;
  totalCount: number;
  lastActivity: string;
}

export interface ExplainableScoreBreakdown {
  candidateId: string;
  candidateName: string;
  overallScore: number;
  skillMatchScore: number;
  experienceScore: number;
  projectAlignmentScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
  recommendation: 'STRONGLY_RECOMMEND' | 'RECOMMEND' | 'MANUAL_REVIEW' | 'DO_NOT_RECOMMEND';
  reasoningText: string;
}

export interface InterviewEvaluationReport {
  candidateId: string;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  overallScore: number;
  strengths: string[];
  areasForImprovement: string[];
  recommendation: 'STRONGLY_RECOMMEND' | 'RECOMMEND' | 'MANUAL_REVIEW' | 'DO_NOT_RECOMMEND';
  summary: string;
}

class AIAgentService {
  /**
   * Triggers autonomous AI mass screening job
   */
  public async triggerScreeningBatch(jobId: string, targetShortlist: number = 20): Promise<ApiResponse<{ jobId: string; status: string }>> {
    return apiRequest<{ jobId: string; status: string }>(
      '/screening/run',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, targetShortlist })
      },
      { jobId, status: 'PROCESSING' }
    );
  }

  /**
   * Fetches real-time status of all 5 AI Agents
   */
  public async getAgentStatuses(): Promise<ApiResponse<AIAgentStatus[]>> {
    const mockStatuses: AIAgentStatus[] = [
      { agentName: 'ResumeParserAgent', status: 'completed', processedCount: 10000, totalCount: 10000, lastActivity: 'Parsed 10,000 resume vectors' },
      { agentName: 'SkillMatcherAgent', status: 'completed', processedCount: 7842, totalCount: 7842, lastActivity: 'Calculated cosine skill similarity' },
      { agentName: 'CandidateRankerAgent', status: 'processing', processedCount: 2431, totalCount: 2431, lastActivity: 'Weighted deterministic ranking active' },
      { agentName: 'VoiceInterviewerAgent', status: 'idle', processedCount: 420, totalCount: 420, lastActivity: 'Generated 420 interview plans' },
      { agentName: 'EvaluationAgent', status: 'idle', processedCount: 20, totalCount: 20, lastActivity: 'Compiled post-interview scorecards' }
    ];

    return apiRequest<AIAgentStatus[]>('/recruiter/agents/status', { method: 'GET' }, mockStatuses);
  }

  /**
   * Retrieves Explainable AI score breakdown for candidate dossier
   */
  public async getCandidateExplanation(candidateId: string): Promise<ApiResponse<ExplainableScoreBreakdown>> {
    const mockExplanation: ExplainableScoreBreakdown = {
      candidateId,
      candidateName: 'Candidate Assessment',
      overallScore: 94,
      skillMatchScore: 96,
      experienceScore: 92,
      projectAlignmentScore: 95,
      matchedSkills: ['PyTorch', 'Transformers', 'Python', 'MLOps', 'Distributed Systems'],
      missingSkills: ['Kubernetes'],
      strengths: [
        'Strong 5+ years background building production LLM pipelines',
        'Expertise in low-rank adaptation (LoRA/QLoRA) parameter efficiency',
        'Demonstrated WebRTC audio streaming expertise'
      ],
      weaknesses: ['Limited hands-on Kubernetes cluster administration'],
      recommendation: 'STRONGLY_RECOMMEND',
      reasoningText: 'Candidate exhibits top 1% alignment for AI Engineering Lead position based on deterministic skill cosine similarity and project relevance.'
    };

    return apiRequest<ExplainableScoreBreakdown>(`/explainability/candidate/${candidateId}`, { method: 'GET' }, mockExplanation);
  }

  /**
   * Retrieves post-interview evaluation report
   */
  public async getInterviewEvaluation(candidateId: string): Promise<ApiResponse<InterviewEvaluationReport>> {
    const mockEvaluation: InterviewEvaluationReport = {
      candidateId,
      technicalScore: 92,
      communicationScore: 88,
      problemSolvingScore: 95,
      overallScore: 92,
      strengths: [
        'Articulate explanation of LLM memory constraints and quantization tradeoffs',
        'Clear problem-solving approach to sub-200ms latency audio pipelines',
        'Strong collaborative communication posture'
      ],
      areasForImprovement: ['Could expand on automated unit testing coverage for LLM outputs'],
      recommendation: 'STRONGLY_RECOMMEND',
      summary: 'Candidate passed all technical & behavioral benchmarks with distinction. Recommended for rapid advancement to offer stage.'
    };

    return apiRequest<InterviewEvaluationReport>(`/interview/evaluation/${candidateId}`, { method: 'GET' }, mockEvaluation);
  }
}

export const aiAgentService = new AIAgentService();
