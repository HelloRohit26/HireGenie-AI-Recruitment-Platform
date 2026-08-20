import React, { useState, useEffect } from 'react';
import { candidateService } from '../../services/candidateService';

interface InterviewConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  token?: string;
  applicationId?: number | string;
  onStatusUpdated?: (newStatus: string) => void;
}

export const InterviewConsentModal: React.FC<InterviewConsentModalProps> = ({
  isOpen,
  onClose,
  token,
  applicationId,
  onStatusUpdated
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [invitationData, setInvitationData] = useState<any>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [completedState, setCompletedState] = useState<'READY' | 'DECLINED' | 'EXPIRED' | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchInvitation = async () => {
      setLoading(true);
      setError(null);
      try {
        let activeToken = token;
        if (!activeToken && applicationId) {
          const appRes = await candidateService.getMyApplications();
          const targetApp = (appRes.data || []).find((a: any) => String(a.id) === String(applicationId));
          if (targetApp && targetApp.invitation_token) {
            activeToken = targetApp.invitation_token;
          }
        }

        if (!activeToken) {
          setError("Invitation token not provided.");
          setLoading(false);
          return;
        }

        const res = await candidateService.getInvitationByToken(activeToken);
        if (res.data) {
          setInvitationData(res.data);
          if (res.data.status === 'EXPIRED' || res.data.expired) {
            setCompletedState('EXPIRED');
          } else if (res.data.status === 'ACCEPTED' || res.data.status === 'READY') {
            setCompletedState('READY');
          } else if (res.data.status === 'DECLINED') {
            setCompletedState('DECLINED');
          }
        } else {
          setError(res.message || "Failed to load invitation details.");
        }
      } catch (err: any) {
        setError(err.message || "Error fetching invitation token.");
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [isOpen, token, applicationId]);

  if (!isOpen) return null;

  const handleResponse = async (action: 'ACCEPT' | 'DECLINE') => {
    if (!invitationData?.token) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await candidateService.respondToInvitation(invitationData.token, action);
      if (res.data) {
        const nextState = action === 'ACCEPT' ? 'READY' : 'DECLINED';
        setCompletedState(nextState);
        if (onStatusUpdated) onStatusUpdated(nextState);
      } else {
        setError(res.message || `Failed to submit ${action.toLowerCase()} response.`);
      }
    } catch (err: any) {
      setError(err.message || "Error processing invitation response.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Interview Invitation & Consent
            </span>
            <h3 className="text-xl font-bold text-white mt-1">
              {invitationData?.job_title || 'Position Interview'}
            </h3>
            <p className="text-xs text-slate-400">{invitationData?.company || 'HireGenie AI'}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-sm max-h-[75vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p>Verifying secure interview invitation token...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300">
              <p className="font-semibold mb-1">Invitation Error</p>
              <p className="text-xs">{error}</p>
            </div>
          ) : completedState === 'EXPIRED' ? (
            <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-center">
              <p className="text-lg font-bold mb-1">Invitation Expired</p>
              <p className="text-xs text-amber-200/80">This interview invitation link has passed its expiration timeframe. Please contact the recruiter for a fresh invitation.</p>
            </div>
          ) : completedState === 'READY' ? (
            <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-center">
              <p className="text-lg font-bold mb-1">Consent Recorded — Status: READY</p>
              <p className="text-xs text-emerald-200/80 mb-4">You have accepted the interview invitation and completed pre-checks. When you are ready, enter the assessment portal.</p>
              <div className="p-3 bg-slate-800/80 rounded-lg text-slate-300 text-xs text-left">
                ℹ️ <strong>Note:</strong> Microphone and voice evaluation streams will NOT activate until you explicitly click "Start Assessment".
              </div>
            </div>
          ) : completedState === 'DECLINED' ? (
            <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-center">
              <p className="text-lg font-bold mb-1">Invitation Declined</p>
              <p className="text-xs text-rose-200/80">You have declined this interview invitation. The recruiter has been notified.</p>
            </div>
          ) : (
            <>
              {/* Interview Spec Card */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div>
                  <span className="text-xs text-slate-400 block">Assessment Type</span>
                  <span className="font-semibold text-slate-200">AI Voice Assessment</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Duration</span>
                  <span className="font-semibold text-slate-200">~15 Minutes</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Required Inputs</span>
                  <span className="font-semibold text-emerald-400">Microphone Only</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Interview Mode</span>
                  <span className="font-semibold text-indigo-400">{invitationData?.interview_mode || 'WebRTC Voice'}</span>
                </div>
              </div>

              {/* Requirements & Guidelines */}
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-200">Pre-Assessment Requirements</h4>
                <ul className="space-y-1.5 text-xs text-slate-300 pl-4 list-disc">
                  <li>Functional microphone connected to your device.</li>
                  <li>Quiet environment free from ambient background noise.</li>
                  <li>Modern Web Browser (Google Chrome, Firefox, Edge, or Safari).</li>
                </ul>
              </div>

              {/* Privacy Notice */}
              <div className="p-3.5 bg-indigo-950/40 border border-indigo-500/20 rounded-xl text-xs text-indigo-200/90 space-y-1">
                <p className="font-semibold text-indigo-300">Privacy Notice & Consent</p>
                <p>
                  {invitationData?.privacy_notice || 'Your audio responses will be evaluated securely for assessment purposes. Responses are stored in your application dossier.'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-end space-x-3">
          {completedState ? (
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition"
            >
              Close Window
            </button>
          ) : (
            <>
              <button
                disabled={submitting}
                onClick={() => handleResponse('DECLINE')}
                className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-sm font-medium transition disabled:opacity-50"
              >
                Decline Interview
              </button>
              <button
                disabled={submitting}
                onClick={() => handleResponse('ACCEPT')}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium shadow-lg shadow-emerald-600/20 transition disabled:opacity-50 flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Recording Consent...</span>
                  </>
                ) : (
                  <span>Accept & Continue</span>
                )}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
