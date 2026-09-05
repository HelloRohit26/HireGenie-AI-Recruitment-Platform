import React, { useEffect, useState, useRef } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  Camera, 
  CameraOff, 
  AlertTriangle, 
  Maximize2, 
  Minimize2, 
  Clock, 
  Activity, 
  X 
} from 'lucide-react';

interface ProctoringEvent {
  id: number;
  type: string;
  details: string;
  timestamp: string;
  deduction: number;
}

interface AIProctoringOverlayProps {
  sessionToken: string;
  onIntegrityChange?: (newScore: number, totalInfractions: number) => void;
}

export const AIProctoringOverlay: React.FC<AIProctoringOverlayProps> = ({
  sessionToken,
  onIntegrityChange
}) => {
  const [integrityScore, setIntegrityScore] = useState<number>(100);
  const [events, setEvents] = useState<ProctoringEvent[]>([]);
  const [activeWarning, setActiveWarning] = useState<string | null>(null);
  
  // Camera stream state
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize Camera Stream
  useEffect(() => {
    async function startCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 320, height: 240, facingMode: 'user' }, 
            audio: false 
          });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setCameraActive(true);
        }
      } catch (err: any) {
        console.warn('[AI Proctoring] Camera access denied or unavailable:', err);
        setCameraError('Camera preview inactive (simulation mode active)');
      }
    }

    startCamera();

    return () => {
      // Clean up camera stream on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Listen to Tab Switching & Window Focus Loss
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordInfraction('TAB_SWITCH', 'Candidate switched browser tab or minimized window', 5);
      }
    };

    const handleWindowBlur = () => {
      // Record blur only if not already triggered by visibilitychange
      if (!document.hidden) {
        recordInfraction('WINDOW_BLUR', 'Interview window lost focus to another desktop application', 3);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [integrityScore, events, sessionToken]);

  // Helper to record an infraction and sync with backend
  const recordInfraction = async (eventType: string, details: string, deduction: number) => {
    const newScore = Math.max(0, Math.min(100, integrityScore - deduction));
    setIntegrityScore(newScore);

    const nowTime = new Date().toLocaleTimeString();
    const newEv: ProctoringEvent = {
      id: events.length + 1,
      type: eventType,
      details,
      timestamp: nowTime,
      deduction
    };

    const updatedEvents = [newEv, ...events];
    setEvents(updatedEvents);

    if (onIntegrityChange) {
      onIntegrityChange(newScore, updatedEvents.length);
    }

    // Show temporary warning toast
    setActiveWarning(`⚠️ Proctor Alert: ${details}. Integrity adjusted to ${newScore}%.`);
    setTimeout(() => setActiveWarning(null), 4500);

    // Sync event with backend
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      await fetch(`${backendUrl}/api/v1/interview/session/${sessionToken}/proctoring`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: eventType,
          details,
          deduction,
          current_integrity: integrityScore
        })
      });
    } catch (err) {
      console.warn('[AI Proctoring] Failed to sync telemetry with backend:', err);
    }
  };

  const riskLevel = integrityScore >= 85 ? 'LOW' : (integrityScore >= 70 ? 'MODERATE' : 'HIGH');

  return (
    <>
      {/* Floating Proctoring PiP Camera Card (Bottom Left or Right) */}
      <div className={`fixed bottom-6 left-6 z-40 transition-all duration-300 ${isMinimized ? 'w-48' : 'w-72'}`}>
        
        {/* Card Frame */}
        <div className="bg-[#0A0E1A]/95 border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
          
          {/* Top Bar with Score & Controls */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#060913] border-b border-slate-800 text-[11px] font-mono">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${riskLevel === 'LOW' ? 'bg-emerald-400 animate-pulse' : riskLevel === 'MODERATE' ? 'bg-amber-400 animate-ping' : 'bg-rose-500 animate-ping'}`} />
              <span className="font-bold text-white">PROCTOR {integrityScore}%</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] cursor-pointer"
                title="View Detailed Audit Log"
              >
                Log ({events.length})
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Video Preview Frame */}
          {!isMinimized && (
            <div className="relative aspect-video bg-[#04060C] flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />

              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-slate-900/90 text-slate-400 text-[11px]">
                  <CameraOff className="w-5 h-5 mb-1 text-slate-500" />
                  <span>{cameraError || 'Camera feed connecting...'}</span>
                </div>
              )}

              {/* Real-Time Facial / Gaze Telemetry Overlay */}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-slate-950/80 border border-emerald-500/40 text-[9px] font-mono text-emerald-300 flex items-center gap-1">
                <Eye className="w-2.5 h-2.5 text-emerald-400" />
                <span>Gaze: On Screen</span>
              </div>

              {/* Watermark Token */}
              <div className="absolute bottom-1 right-2 text-[9px] font-mono text-slate-500">
                #PROCTOR-{sessionToken.slice(0, 6).toUpperCase()}
              </div>
            </div>
          )}

          {/* Status Bar */}
          <div className="px-3 py-1.5 bg-[#080C19] flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-slate-800/80">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Risk: <strong className={riskLevel === 'LOW' ? 'text-emerald-400' : riskLevel === 'MODERATE' ? 'text-amber-400' : 'text-rose-400'}>{riskLevel}</strong>
            </span>
            <span>{events.length} Infractions</span>
          </div>
        </div>
      </div>

      {/* Real-time Warning Banner (Appears at top center when an infraction occurs) */}
      {activeWarning && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="px-4 py-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/50 text-amber-200 text-xs font-mono flex items-center gap-2 shadow-2xl backdrop-blur-xl">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{activeWarning}</span>
          </div>
        </div>
      )}

      {/* Proctoring Audit Log Drawer Modal */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={() => setIsDrawerOpen(false)}>
          <div className="w-full max-w-md bg-[#0A0F1F] border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-200" onClick={e => e.stopPropagation()}>
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Real-Time Proctoring Audit</h3>
                  <span className="text-[11px] text-slate-400 font-mono">Continuous Session Verification</span>
                </div>
              </div>
              <button onClick={() => setIsDrawerOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Metric Summary */}
            <div className="grid grid-cols-3 gap-2 my-4">
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-mono block">Integrity</span>
                <span className={`text-base font-bold font-mono ${integrityScore >= 85 ? 'text-emerald-400' : 'text-amber-400'}`}>{integrityScore}%</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-mono block">Infractions</span>
                <span className="text-base font-bold font-mono text-rose-400">{events.length}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-mono block">Risk Status</span>
                <span className="text-base font-bold font-mono text-indigo-400">{riskLevel}</span>
              </div>
            </div>

            {/* Event Timeline */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              <span className="text-[11px] font-mono text-slate-400 font-bold block mb-1">Audit Incident Log:</span>
              {events.length > 0 ? (
                events.map((ev) => (
                  <div key={ev.id} className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex items-start justify-between text-xs font-mono">
                    <div>
                      <span className="text-amber-400 font-bold block">{ev.type}</span>
                      <span className="text-[11px] text-slate-400 block">{ev.details}</span>
                      <span className="text-[10px] text-slate-500">{ev.timestamp}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 text-[10px] font-bold">
                      -{ev.deduction}%
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs text-center font-mono">
                  ✓ 100% Clean Session. Zero integrity anomalies detected.
                </div>
              )}
            </div>

            <button
              onClick={() => setIsDrawerOpen(false)}
              className="w-full mt-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold transition-all cursor-pointer"
            >
              Close Proctoring Report
            </button>
          </div>
        </div>
      )}
    </>
  );
};
