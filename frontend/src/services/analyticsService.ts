import { apiRequest } from './apiClient';

export interface AnalyticsSummary {
  metrics: {
    activeJobs: number;
    totalJobs: number;
    closedJobs: number;
    totalApplicants: number;
    aiShortlisted: number;
    interviews: number;
    offers: number;
    hired: number;
    rejected: number;
    avgTimeToHireDays: number;
  };
  agent_telemetry: Array<{
    id: string;
    name: string;
    role: string;
    status: string;
    statusColor: string;
    currentTask: string;
    processedCount: string;
    activityPercentage: number;
    lastActive: string;
  }>;
  recent_activity: Array<{
    id: string;
    timestamp: string;
    timeAgo: string;
    actor: string;
    action: string;
    details: string;
    status: string;
  }>;
}

export interface RealInsights {
  total_applications: number;
  total_hires: number;
  total_shortlisted: number;
  average_match_score: string;
  offer_acceptance_rate: string;
  avg_time_to_hire: string;
  cost_per_hire: string;
  nps_score: string;
  message: string;
}

export const analyticsService = {
  getSummary: async (): Promise<{ data: AnalyticsSummary }> => {
    return apiRequest<AnalyticsSummary>('/analytics/summary', {
      method: 'GET'
    });
  },

  getInsights: async (): Promise<{ data: RealInsights }> => {
    return apiRequest<RealInsights>('/analytics/insights', {
      method: 'GET'
    });
  }
};
