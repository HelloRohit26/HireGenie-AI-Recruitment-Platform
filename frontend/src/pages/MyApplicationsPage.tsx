import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CandidateShell } from '../components/layout/CandidateShell';
import { ApplicationJourneyCard } from '../components/candidate/ApplicationJourneyCard';
import { candidateService } from '../services/candidateService';
import { CandidateJourneyData } from '../types';

interface MyApplicationsPageProps {
  onNavigate?: (route: string) => void;
}

export const MyApplicationsPage: React.FC<MyApplicationsPageProps> = ({ onNavigate }) => {
  const [journeys, setJourneys] = useState<CandidateJourneyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchApplications = useCallback(async () => {
    try {
      setApiError('');
      const res = await candidateService.getMyApplications();
      if (isMountedRef.current) {
        setJourneys(res.data || []);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        console.error("Failed to load candidate applications:", err);
        setApiError(err?.message || 'Unable to connect to HireGenie server to load your applications.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchApplications();
  }, [fetchApplications]);

  // SMART POLLING: Only poll while any application is actively processing
  useEffect(() => {
    const hasActiveProcessing = journeys.some(j => j.is_processing);

    if (!hasActiveProcessing) return;

    const interval = setInterval(() => {
      fetchApplications();
    }, 3000);

    return () => clearInterval(interval);
  }, [journeys, fetchApplications]);

  const handleRetryScreening = async (applicationId: number) => {
    await candidateService.retryScreening(applicationId);
    await fetchApplications();
  };

  return (
    <CandidateShell activeRoute="/candidate/applications" onNavigate={onNavigate}>
      <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
        
        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A2A28] pb-4">
          <div>
            <h1 className="text-xl font-bold text-[#F4F1E9] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#79A89A]">assignment</span>
              My Applications
            </h1>
            <p className="text-xs text-[#A1A19A] font-mono mt-0.5">
              Live tracking of your candidate journey, AI screening progress, voice interviews, and offer status.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate?.('/candidate/jobs')}
            className="px-4 py-2 rounded-lg bg-[#79A89A] text-[#11110F] text-xs font-bold font-mono hover:bg-[#AACEFF] transition-all shrink-0 flex items-center gap-1.5 shadow-md"
          >
            <span className="material-symbols-outlined text-base">search</span>
            <span>Discover More Roles</span>
          </button>
        </div>

        {/* METRICS / STATS STRIP */}
        {!isLoading && !apiError && journeys.length > 0 && (
          <div className="flex items-center justify-between text-xs font-mono text-[#A1A19A] px-1">
            <span>Tracking <strong className="text-[#79A89A]">{journeys.length}</strong> active application{journeys.length > 1 ? 's' : ''}</span>
            {journeys.some(j => j.is_processing) && (
              <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                Live AI screening in progress...
              </span>
            )}
          </div>
        )}

        {/* LOADING SKELETON */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="p-6 bg-[#181815] border border-[#2A2A28] rounded-xl space-y-4 animate-pulse">
                <div className="flex justify-between items-center">
                  <div className="space-y-2">
                    <div className="h-4 w-48 bg-[#2A2A28] rounded" />
                    <div className="h-3 w-32 bg-[#2A2A28]/60 rounded" />
                  </div>
                  <div className="h-6 w-24 bg-[#2A2A28] rounded-full" />
                </div>
                <div className="h-10 w-full bg-[#20201C] rounded-lg" />
              </div>
            ))}
          </div>
        ) : apiError ? (
          /* REAL ERROR STATE — NO MOCK FALLBACK */
          <div className="bg-[#181815] border border-rose-500/30 rounded-xl p-8 text-center space-y-4 shadow-lg">
            <span className="material-symbols-outlined text-4xl text-rose-400">cloud_off</span>
            <div>
              <h3 className="text-base font-bold text-[#F4F1E9]">Unable to load application data.</h3>
              <p className="text-xs text-[#A1A19A] font-mono mt-1">{apiError}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsLoading(true);
                fetchApplications();
              }}
              className="px-4 py-2 rounded-lg bg-[#79A89A] text-[#11110F] text-xs font-bold shadow hover:bg-[#AACEFF] transition-all inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              <span>Retry</span>
            </button>
          </div>
        ) : journeys.length === 0 ? (
          /* EMPTY STATE */
          <div className="py-16 px-4 text-center bg-[#181815] border border-[#2A2A28] rounded-xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#79A89A]/10 border border-[#79A89A]/30 mx-auto flex items-center justify-center text-[#79A89A]">
              <span className="material-symbols-outlined text-2xl">inbox</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F4F1E9]">No Applications Found</h3>
              <p className="text-xs text-[#A1A19A] font-mono mt-1">
                You haven't submitted any job applications yet. Find an open position to trigger autonomous AI screening!
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.('/candidate/jobs')}
              className="px-5 py-2.5 rounded-lg bg-[#79A89A] text-[#11110F] text-xs font-bold font-mono hover:bg-[#AACEFF] transition-all inline-flex items-center gap-2 shadow-lg shadow-[#79A89A]/10"
            >
              <span className="material-symbols-outlined text-base">work</span>
              <span>Discover Open Roles</span>
            </button>
          </div>
        ) : (
          /* REAL APPLICATIONS LIST */
          <div className="space-y-4">
            {journeys.map((journey, idx) => (
              <ApplicationJourneyCard
                key={journey.application.id}
                journey={journey}
                isExpandedDefault={idx === 0}
                onNavigate={onNavigate}
                onRetryScreening={handleRetryScreening}
              />
            ))}
          </div>
        )}

      </div>
    </CandidateShell>
  );
};
