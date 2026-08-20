import React, { useState, useEffect } from 'react';
import { candidateService } from '../services/candidateService';

interface OfferPortalPageProps {
  token: string;
  onNavigate: (route: string) => void;
}

export const OfferPortalPage: React.FC<OfferPortalPageProps> = ({ token, onNavigate }) => {
  const [offer, setOffer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responding, setResponding] = useState(false);
  const [responseMessage, setResponseMessage] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineForm, setShowDeclineForm] = useState(false);

  useEffect(() => {
    const fetchOffer = async () => {
      setLoading(true);
      try {
        const res = await candidateService.getOfferByToken(token);
        if (res.data) {
          setOffer(res.data);
        } else {
          setError('Offer not found.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load offer details.');
      } finally {
        setLoading(false);
      }
    };
    fetchOffer();
  }, [token]);

  const handleAccept = async () => {
    setResponding(true);
    setResponseMessage(null);
    try {
      const res = await candidateService.respondToOffer(token, 'ACCEPT');
      if (res.data) {
        setOffer({ ...offer, status: 'OFFER_ACCEPTED', accepted_at: res.data.accepted_at });
        setResponseMessage(res.data.message || 'Offer accepted!');
      }
    } catch (err: any) {
      setResponseMessage(err.message || 'Failed to accept offer.');
    } finally {
      setResponding(false);
    }
  };

  const handleDecline = async () => {
    setResponding(true);
    setResponseMessage(null);
    try {
      const res = await candidateService.respondToOffer(token, 'DECLINE', declineReason);
      if (res.data) {
        setOffer({ ...offer, status: 'OFFER_DECLINED', declined_at: res.data.declined_at });
        setResponseMessage(res.data.message || 'Offer declined.');
      }
    } catch (err: any) {
      setResponseMessage(err.message || 'Failed to decline offer.');
    } finally {
      setResponding(false);
      setShowDeclineForm(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#11110F] flex items-center justify-center">
        <div className="text-center space-y-4">
          <span className="material-symbols-outlined text-5xl text-[#D6A85F] animate-spin">progress_activity</span>
          <p className="text-sm text-[#A1A19A] font-mono">Loading offer details...</p>
        </div>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="min-h-screen bg-[#11110F] flex items-center justify-center">
        <div className="max-w-md w-full bg-[#181815] rounded-xl border border-[#2A2A28] p-8 text-center space-y-4">
          <span className="material-symbols-outlined text-5xl text-red-400">error_outline</span>
          <h1 className="text-xl font-bold text-[#F4F1E9]">Offer Not Found</h1>
          <p className="text-sm text-[#A1A19A] font-mono">{error || 'This offer link is invalid or has expired.'}</p>
          <button
            onClick={() => onNavigate('/')}
            className="px-4 py-2 rounded-lg bg-[#D6A85F]/20 text-[#F4C377] border border-[#D6A85F]/40 text-sm font-bold hover:bg-[#D6A85F]/30 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const isAccepted = offer.status === 'OFFER_ACCEPTED';
  const isDeclined = offer.status === 'OFFER_DECLINED';
  const isExpired = offer.is_expired;
  const canRespond = offer.status === 'OFFERED' && !isExpired;

  return (
    <div className="min-h-screen bg-[#11110F] flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#D6A85F] flex items-center justify-center">
              <span className="text-[#11110F] font-black text-sm">H</span>
            </div>
            <span className="text-lg font-bold text-[#F4F1E9] tracking-tight">HireGenie AI</span>
          </div>
          <p className="text-xs text-[#A1A19A] font-mono">Candidate Offer Portal</p>
        </div>

        {/* Offer Card */}
        <div className="bg-[#181815] rounded-xl border border-[#2A2A28] overflow-hidden shadow-2xl shadow-black/50">
          {/* Status Banner */}
          {isAccepted && (
            <div className="bg-emerald-500/20 border-b border-emerald-500/30 px-6 py-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-400 text-lg">celebration</span>
              <span className="text-sm font-bold text-emerald-400">Offer Accepted \u2014 Welcome to the team!</span>
            </div>
          )}
          {isDeclined && (
            <div className="bg-orange-500/20 border-b border-orange-500/30 px-6 py-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-400 text-lg">info</span>
              <span className="text-sm font-bold text-orange-400">Offer Declined</span>
            </div>
          )}
          {isExpired && !isAccepted && !isDeclined && (
            <div className="bg-red-500/20 border-b border-red-500/30 px-6 py-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-red-400 text-lg">timer_off</span>
              <span className="text-sm font-bold text-red-400">This offer has expired</span>
            </div>
          )}

          <div className="p-6 space-y-6">
            {/* Greeting */}
            <div>
              <h1 className="text-xl font-bold text-[#F4F1E9] mb-1">
                {isAccepted ? 'Congratulations!' : `Hello, ${offer.candidate_name}!`}
              </h1>
              <p className="text-xs text-[#A1A19A] font-mono">
                {isAccepted
                  ? 'You have accepted the offer. We look forward to working with you!'
                  : isDeclined
                  ? 'You have declined this offer. Thank you for your time.'
                  : 'You have received an offer from our team. Please review the details below.'}
              </p>
            </div>

            {/* Offer Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#11110F] rounded-lg p-4 border border-[#2A2A28]">
                <span className="text-[10px] uppercase tracking-wider text-[#A1A19A] font-mono block mb-1">Position</span>
                <span className="text-sm font-bold text-[#F4F1E9]">{offer.role_title}</span>
              </div>
              <div className="bg-[#11110F] rounded-lg p-4 border border-[#2A2A28]">
                <span className="text-[10px] uppercase tracking-wider text-[#A1A19A] font-mono block mb-1">Company</span>
                <span className="text-sm font-bold text-[#F4F1E9]">{offer.company_name}</span>
              </div>
              <div className="bg-[#11110F] rounded-lg p-4 border border-[#D6A85F]/30">
                <span className="text-[10px] uppercase tracking-wider text-[#A1A19A] font-mono block mb-1">Compensation</span>
                <span className="text-sm font-bold text-[#F4C377]">{offer.compensation}</span>
              </div>
              <div className="bg-[#11110F] rounded-lg p-4 border border-[#2A2A28]">
                <span className="text-[10px] uppercase tracking-wider text-[#A1A19A] font-mono block mb-1">Offer Status</span>
                <span className={`text-sm font-bold ${
                  isAccepted ? 'text-emerald-400' :
                  isDeclined ? 'text-orange-400' :
                  isExpired ? 'text-red-400' :
                  'text-amber-400'
                }`}>
                  {offer.status?.replace(/_/g, ' ')}
                </span>
              </div>
              {offer.expires_at && (
                <div className="bg-[#11110F] rounded-lg p-4 border border-[#2A2A28] sm:col-span-2">
                  <span className="text-[10px] uppercase tracking-wider text-[#A1A19A] font-mono block mb-1">Offer Valid Until</span>
                  <span className="text-sm text-[#F4F1E9] font-mono">
                    {new Date(offer.expires_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              )}
            </div>

            {/* Response Message */}
            {responseMessage && (
              <div className={`p-3 rounded-lg border text-sm font-mono ${
                isAccepted ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                isDeclined ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' :
                'bg-[#D6A85F]/10 border-[#D6A85F]/30 text-[#F4C377]'
              }`}>
                {responseMessage}
              </div>
            )}

            {/* Decline Form */}
            {showDeclineForm && (
              <div className="bg-[#11110F] rounded-lg p-4 border border-orange-500/30 space-y-3">
                <h4 className="text-xs font-bold text-orange-400 font-mono">Reason for declining (optional)</h4>
                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="Share why you're declining this offer..."
                  className="w-full bg-[#181815] border border-[#2A2A28] rounded-lg px-3 py-2 text-xs text-[#F4F1E9] font-mono placeholder-[#A1A19A]/50 focus:outline-none focus:border-[#D6A85F]/50 resize-none"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleDecline}
                    disabled={responding}
                    className="flex-1 px-4 py-2 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/40 text-xs font-bold hover:bg-orange-500/30 transition-all disabled:opacity-50"
                  >
                    {responding ? 'Submitting...' : 'Confirm Decline'}
                  </button>
                  <button
                    onClick={() => setShowDeclineForm(false)}
                    className="px-4 py-2 rounded-lg bg-[#20201C] text-[#A1A19A] text-xs font-bold hover:bg-[#2A2A28] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {canRespond && !showDeclineForm && (
              <div className="flex gap-3">
                <button
                  onClick={handleAccept}
                  disabled={responding}
                  className="flex-1 px-5 py-3 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-sm font-bold hover:bg-emerald-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  {responding ? 'Processing...' : 'Accept Offer'}
                </button>
                <button
                  onClick={() => setShowDeclineForm(true)}
                  disabled={responding}
                  className="flex-1 px-5 py-3 rounded-lg bg-[#20201C] text-[#A1A19A] border border-[#2A2A28] text-sm font-bold hover:bg-[#2A2A28] hover:text-[#F4F1E9] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                  Decline Offer
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[#2A2A28] px-6 py-3 flex items-center justify-between">
            <span className="text-[10px] text-[#A1A19A] font-mono">Powered by HireGenie AI</span>
            <button
              onClick={() => onNavigate('/')}
              className="text-[10px] text-[#D6A85F] font-mono hover:underline"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
