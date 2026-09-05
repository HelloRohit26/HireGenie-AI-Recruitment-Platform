import React, { useState, useEffect } from 'react';
import { RecruiterShell } from '../components/layout/RecruiterShell';
import { PageTransition } from '../components/ui/PageTransition';
import { analyticsService, RealInsights } from '../services/analyticsService';

interface InsightsPageProps {
  onNavigate?: (route: string) => void;
}

export const InsightsPage: React.FC<InsightsPageProps> = ({ onNavigate }) => {
  const [insights, setInsights] = useState<RealInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    analyticsService.getInsights()
      .then(res => setInsights(res.data))
      .catch(err => console.error("Failed to load insights:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const insightMetrics = [
    { label: 'Total Applications', value: insights ? String(insights.total_applications) : '0', icon: 'groups', note: 'Recorded in PostgreSQL' },
    { label: 'Total Hires', value: insights ? String(insights.total_hires) : '0', icon: 'badge', note: 'Confirmed hires' },
    { label: 'Avg Match Score', value: insights ? insights.average_match_score : 'N/A — insufficient data', icon: 'auto_awesome', note: 'Calculated score' },
    { label: 'Offer Acceptance Rate', value: insights ? insights.offer_acceptance_rate : 'N/A — insufficient data', icon: 'task_alt', note: 'Offer acceptance' },
    { label: 'Avg Time to Hire', value: insights ? insights.avg_time_to_hire : 'N/A — insufficient data', icon: 'speed', note: 'Pipeline velocity' },
    { label: 'Cost Per Hire', value: insights ? insights.cost_per_hire : 'N/A — insufficient data', icon: 'payments', note: 'Financial metric' },
  ];

  return (
    <RecruiterShell activeRoute="/recruiter/insights" onNavigate={onNavigate}>
      <PageTransition routeKey="/recruiter/insights">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A2A28] dark:border-[#2A2A28] light:border-[#E2DEC5] pb-4">
            <div>
              <h1 className="text-xl font-bold text-[#F4F1E9] dark:text-[#F4F1E9] light:text-[#171714] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#D6A85F]">analytics</span>
                Database Insights & Analytics
              </h1>
              <p className="text-xs text-[#A1A19A] dark:text-[#A1A19A] light:text-[#587C6D] mt-0.5 font-mono">
                Real database metrics calculated from PostgreSQL records. No fabricated values.
              </p>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {insightMetrics.map(metric => (
              <div key={metric.label} className="bg-[#181815] dark:bg-[#181815] light:bg-[#FAF8F2] border border-[#2A2A28] dark:border-[#2A2A28] light:border-[#E2DEC5] rounded-lg p-4 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#D6A85F] text-lg">{metric.icon}</span>
                  <span className="text-[9px] text-[#A1A19A] uppercase tracking-wider font-mono">{metric.label}</span>
                </div>
                <div className="text-lg font-mono font-bold text-[#F4F1E9] dark:text-[#F4F1E9] light:text-[#171714]">
                  {isLoading ? '...' : metric.value}
                </div>
                <div className="text-[10px] font-mono text-[#A1A19A]">
                  {metric.note}
                </div>
              </div>
            ))}
          </div>

          {/* Database Notice */}
          <div className="p-4 bg-[#181815] border border-[#2A2A28] rounded-xl space-y-1">
            <h3 className="text-xs font-bold text-[#D6A85F] uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">database</span>
              Database Compliance Policy
            </h3>
            <p className="text-xs text-[#A1A19A] font-mono">
              All metrics on this page are computed directly from active PostgreSQL database rows. Metrics requiring historical data will display "N/A — insufficient data" until additional applications and hires occur.
            </p>
          </div>
        </div>
      </PageTransition>
    </RecruiterShell>
  );
};
