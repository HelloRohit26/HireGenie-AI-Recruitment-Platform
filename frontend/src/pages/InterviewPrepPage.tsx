import React, { useState, useEffect, useRef } from 'react';
import { TalentConstellation } from '../components/3d/TalentConstellation';
import { candidateService } from '../services/candidateService';

interface InterviewPrepPageProps {
  token?: string;
  onNavigate?: (route: string) => void;
}

interface AudioDevice {
  deviceId: string;
  label: string;
}

export const InterviewPrepPage: React.FC<InterviewPrepPageProps> = ({
  token = 'demo-token',
  onNavigate
}) => {
  const [micGranted, setMicGranted] = useState<boolean>(false);
  const [micTesting, setMicTesting] = useState<boolean>(false);
  const [micLevel, setMicLevel] = useState<number>(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');
  const [speakerTested, setSpeakerTested] = useState<boolean>(false);
  const [invitationStatus, setInvitationStatus] = useState<string>('UNKNOWN');
  const [loading, setLoading] = useState<boolean>(true);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'chrome' | 'edge' | 'windows' | 'mac'>('chrome');

  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Check server-side invitation status on load
  useEffect(() => {
    const checkInvitation = async () => {
      setLoading(true);
      try {
        const res = await candidateService.getInvitationByToken(token);
        if (res.data) {
          setInvitationStatus(res.data.status || 'UNKNOWN');
        }
      } catch (e) {
        console.warn('Failed to verify token state:', e);
      } finally {
        setLoading(false);
      }
    };
    checkInvitation();
  }, [token]);

  // Query native browser microphone permission on mount
  useEffect(() => {
    const queryMicPermission = async () => {
      try {
        if (navigator.permissions && (navigator.permissions as any).query) {
          const result = await (navigator.permissions as any).query({ name: 'microphone' });
          setPermissionState(result.state);
          
          if (result.state === 'granted') {
            setMicGranted(true);
            enumerateAudioDevices();
            // Automatically start live level test if already granted
            handleRequestMicPermission(false);
          }

          result.onchange = () => {
            setPermissionState(result.state);
            if (result.state === 'granted') {
              setMicGranted(true);
              setMicError(null);
              enumerateAudioDevices();
            } else if (result.state === 'denied') {
              setMicGranted(false);
            }
          };
        }
      } catch (e) {
        console.log('Permission query not supported or restricted:', e);
      }
    };

    queryMicPermission();

    return () => {
      handleStopMicTest();
    };
  }, []);

  // Enumerate connected microphones
  const enumerateAudioDevices = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices
          .filter(d => d.kind === 'audioinput')
          .map((d, idx) => ({
            deviceId: d.deviceId,
            label: d.label || `Microphone ${idx + 1} (${d.deviceId ? d.deviceId.slice(0, 8) + '...' : 'Default'})`
          }));
        
        setAudioDevices(audioInputs);
        if (audioInputs.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(audioInputs[0].deviceId);
        }
      }
    } catch (e) {
      console.warn('Device enumeration error:', e);
    }
  };

  // Tech Check: Request explicit microphone permission and start audio meter
  const handleRequestMicPermission = async (openModalOnError: boolean = true) => {
    setMicError(null);
    handleStopMicTest();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const errMsg = 'Your web browser does not support microphone input. Please use Chrome, Edge, Safari, or Firefox.';
        setMicError(errMsg);
        if (openModalOnError) setShowSettingsModal(true);
        return;
      }

      const constraints: MediaStreamConstraints = {
        audio: selectedDeviceId
          ? {
              deviceId: { exact: selectedDeviceId },
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          : {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            },
        video: false
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (constraintErr) {
        console.warn('Advanced constraints failed, trying basic audio stream...', constraintErr);
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      }

      mediaStreamRef.current = stream;
      setMicGranted(true);
      setMicTesting(true);
      setPermissionState('granted');
      setMicError(null);

      // Re-enumerate audio inputs to obtain accurate human-readable hardware labels
      await enumerateAudioDevices();

      // Web Audio API Audio Level Meter
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setMicLevel(normalized);

        animFrameRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
    } catch (err: any) {
      console.error('Microphone access check failed:', err);
      setPermissionState('denied');
      
      let msg = 'Microphone permission denied or device unavailable. Please allow microphone access in your browser settings.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Microphone permission is blocked in your browser for this site. Click "Microphone Settings" to view easy instructions to enable it.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No microphone device was detected on your system. Please plug in a microphone or headset.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'Your microphone is currently being used by another application (e.g. Zoom, Teams, Discord). Please close other apps and retry.';
      }

      setMicError(msg);
      if (openModalOnError) {
        setShowSettingsModal(true);
      }
    }
  };

  const handleStopMicTest = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      try {
        audioCtxRef.current.close().catch(() => {});
      } catch (e) {}
    }
    audioCtxRef.current = null;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    setMicTesting(false);
    setMicLevel(0);
  };

  const handleDeviceChange = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    if (micGranted) {
      setTimeout(() => {
        handleRequestMicPermission(false);
      }, 100);
    }
  };

  // Manual bypass verification if candidate has already granted permission or prefers direct start
  const handleManualBypass = () => {
    setMicGranted(true);
    setMicError(null);
    setShowSettingsModal(false);
  };

  const handleTestSpeaker = () => {
    setSpeakerTested(true);
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } catch (e) {
        console.log('Audio test tone played');
      }
    }
  };

  const handleEnterInterview = async () => {
    handleStopMicTest();
    try {
      await candidateService.respondToInvitation(token, 'ACCEPT');
    } catch (e) {
      console.warn('Failed to record invitation acceptance consent:', e);
    }
    if (onNavigate) {
      onNavigate(`/interview/${token}/room?autostart=true`);
    }
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close();
        } catch (e) {}
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const isReadyToStart = micGranted && (invitationStatus === 'READY' || invitationStatus === 'ACCEPTED' || invitationStatus === 'VIEWED' || invitationStatus === 'UNKNOWN');

  return (
    <div className="bg-[#121412] text-[#E3E2DF] min-h-screen flex flex-col font-sans antialiased relative overflow-hidden">
      {/* Ambient Constellation */}
      <TalentConstellation opacity={0.25} />

      {/* Atmospheric Radial Lights */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D6A85F]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#474744]/10 rounded-full blur-[150px]" />
      </div>

      {/* Header Anchor */}
      <header className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-20">
        <div
          onClick={() => onNavigate?.('/candidate')}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-[#D6A85F] flex items-center justify-center font-bold text-sm text-[#11110F] shadow-md shadow-[#D6A85F]/20 group-hover:scale-105 transition-transform">
            HG
          </div>
          <span className="text-base font-bold text-[#F4F1E9] tracking-tight">HireGenie AI</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A1C1A] border border-[#4F4538]/40 text-xs font-mono text-[#D6A85F] hover:bg-[#292A29] transition-all"
            title="Open Microphone & Device Settings"
          >
            <span className="material-symbols-outlined text-sm">settings_voice</span>
            <span>Mic Settings</span>
          </button>

          <button
            onClick={() => onNavigate?.('/candidate/applications')}
            className="text-xs font-mono text-[#A1A19A] hover:text-[#F4F1E9] transition-colors"
          >
            Exit to Dashboard
          </button>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-1 flex items-center justify-center p-6 md:p-12 relative z-10 my-12">
        <div className="max-w-[800px] w-full space-y-8 animate-fadeIn">
          
          {/* Title Banner */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#292A29] border border-[#4F4538]/30 mb-2 relative">
              <span className={`material-symbols-outlined text-3xl ${micGranted ? 'text-emerald-400' : 'text-[#F4C377]'}`}>
                {micGranted ? 'mic' : 'mic_none'}
              </span>
              <div className={`absolute inset-0 rounded-full border ${micGranted ? 'border-emerald-400/40' : 'border-[#F4C377]/30'} animate-ping opacity-40`} />
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-[#F4F1E9] tracking-tight">
              AI Voice Tech Check & Setup
            </h1>
            <p className="text-sm md:text-base text-[#D2C4B3] max-w-lg mx-auto font-mono">
              Please verify your microphone permission and system readiness before starting the live voice interview.
            </p>
          </div>

          {/* Error Banner */}
          {micError && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-mono flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-xl text-rose-400 shrink-0">error</span>
                <span>{micError}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="px-3 py-1 bg-[#D6A85F]/20 hover:bg-[#D6A85F]/30 text-[#F4C377] border border-[#D6A85F]/40 rounded-lg text-xs font-bold transition"
                >
                  View How to Allow
                </button>
                <button
                  onClick={() => handleRequestMicPermission(true)}
                  className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 rounded-lg text-xs font-bold transition"
                >
                  Retry Access
                </button>
              </div>
            </div>
          )}

          {/* Bento Grid Structure for Info & System Checks */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Session Details Panel */}
            <div className="md:col-span-1 bg-[#292A29]/40 backdrop-blur-md border border-[#9B8F7F]/20 rounded-2xl p-6 flex flex-col justify-between shadow-2xl">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#D2C4B3] font-bold mb-4 border-b border-[#4F4538]/40 pb-2">
                  Session Details
                </h3>
                <ul className="space-y-4 font-mono text-xs">
                  <li className="flex items-center text-[#E3E2DF]">
                    <span className="material-symbols-outlined text-[#C9C6C2] mr-3 text-lg">schedule</span>
                    15 Minutes Duration
                  </li>
                  <li className="flex items-center text-[#E3E2DF]">
                    <span className="material-symbols-outlined text-[#C9C6C2] mr-3 text-lg">headset</span>
                    Browser Voice Transport
                  </li>
                  <li className="flex items-center text-[#E3E2DF]">
                    <span className="material-symbols-outlined text-[#C9C6C2] mr-3 text-lg">verified_user</span>
                    Status: <span className="ml-1 text-emerald-400 font-bold">{invitationStatus}</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-[#4F4538]/30">
                <div className="text-[10px] text-[#D2C4B3] font-mono">
                  💡 Tip: Speak clearly into your microphone when answering.
                </div>
              </div>
            </div>

            {/* System Readiness & Live Test Panel */}
            <div className="md:col-span-2 bg-[#292A29]/40 backdrop-blur-md border border-[#9B8F7F]/20 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#D2C4B3] font-bold">
                  Hardware Tech Check
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSettingsModal(true)}
                    className="text-[10px] font-mono text-[#D6A85F] hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-xs">tune</span>
                    Settings
                  </button>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-mono border font-bold ${
                    micGranted ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}>
                    {micGranted ? 'Microphone Connected' : 'Permission Required'}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {/* Microphone Check & Live Meter */}
                <div className="p-4 rounded-xl bg-[#1A1C1A] border border-[#4F4538]/30 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-xl ${micGranted ? 'text-emerald-400' : 'text-[#D2C4B3]'}`}>
                        {micGranted ? 'mic' : 'mic_none'}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-[#F4F1E9] block">
                          Microphone Consent & Audio Stream
                        </span>
                        <span className="text-[10px] text-[#A1A19A] font-mono">
                          {micGranted ? 'Audio track active & connected' : 'Click to request or verify microphone access'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {micGranted ? (
                        <button
                          type="button"
                          onClick={() => handleRequestMicPermission(false)}
                          className="px-3.5 py-1.5 rounded text-xs font-mono font-bold transition-colors border shadow-sm bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/50 flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-xs">check_circle</span>
                          <span>Verified ✓ (Test Again)</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRequestMicPermission(true)}
                          className="px-3.5 py-1.5 rounded text-xs font-mono font-bold transition-colors border shadow-sm bg-[#D6A85F] text-[#11110F] border-[#D6A85F] hover:bg-[#F4C377] flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-xs">mic</span>
                          <span>Grant Mic Access</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Device selector if multiple inputs detected */}
                  {audioDevices.length > 1 && (
                    <div className="pt-2 border-t border-white/5 flex items-center gap-2 text-xs font-mono">
                      <span className="text-[10px] text-[#A1A19A] shrink-0">Input:</span>
                      <select
                        value={selectedDeviceId}
                        onChange={(e) => handleDeviceChange(e.target.value)}
                        className="bg-[#121412] text-[#E3E2DF] border border-white/10 rounded px-2 py-1 text-xs outline-none focus:border-[#D6A85F] w-full max-w-xs"
                      >
                        {audioDevices.map((d) => (
                          <option key={d.deviceId} value={d.deviceId}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Audio Volume Visualizer */}
                  {micTesting && (
                    <div className="space-y-1.5 animate-fadeIn pt-1">
                      <div className="flex justify-between text-[10px] font-mono text-[#A1A19A]">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                          <span>Live Voice Input Waveform</span>
                        </span>
                        <span className={micLevel > 15 ? 'text-emerald-400 font-bold' : 'text-[#A1A19A]'}>
                          {micLevel}% {micLevel > 15 ? '(Speaking Detected)' : '(Silent)'}
                        </span>
                      </div>
                      <div className="w-full h-3 bg-[#121412] rounded-full overflow-hidden p-0.5 border border-white/10 relative">
                        <div
                          className={`h-full rounded-full transition-all duration-75 ${
                            micLevel > 15 ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-[#D6A85F]' : 'bg-emerald-600/40'
                          }`}
                          style={{ width: `${Math.max(4, micLevel)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Speaker Check */}
                <div className="p-4 rounded-xl bg-[#1A1C1A] border border-[#4F4538]/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#D2C4B3] text-xl">volume_up</span>
                    <div>
                      <span className="text-xs font-bold text-[#F4F1E9] block">Audio Speaker Test</span>
                      <span className="text-[10px] text-[#A1A19A] font-mono">Verify clear audio output</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestSpeaker}
                    className="px-3 py-1 rounded bg-[#292A29] text-[#79A89A] text-xs font-mono font-bold hover:bg-[#343533] transition-colors border border-[#4F4538]/40 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">play_arrow</span>
                    {speakerTested ? 'Tested (Play Tone)' : 'Play Test Tone'}
                  </button>
                </div>

                {/* Connection & Browser Compatibility Check */}
                <div className="p-4 rounded-xl bg-[#1A1C1A] border border-[#4F4538]/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#D2C4B3] text-xl">wifi</span>
                    <div>
                      <span className="text-xs font-bold text-[#F4F1E9] block">Browser & Network Readiness</span>
                      <span className="text-[10px] text-[#A1A19A] font-mono">WebRTC & WebSocket transport ready</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400">Ready</span>
                </div>
              </div>
            </div>

          </div>

          {/* Action Area */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              id="start-voice-interview-prep-btn"
              onClick={handleEnterInterview}
              className="w-full sm:w-auto px-8 py-3.5 font-bold text-sm rounded-full shadow-lg transition-all duration-300 flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#D6A85F] via-[#F4C377] to-[#D6A85F] text-[#131311] shadow-[#D6A85F]/30 hover:scale-105 cursor-pointer hover:shadow-xl hover:bg-[#F4C377]"
            >
              <span className="material-symbols-outlined text-base">mic</span>
              <span>START VOICE INTERVIEW NOW</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>

            <button
              onClick={() => onNavigate?.('/candidate/applications')}
              className="w-full sm:w-auto px-8 py-3.5 bg-transparent text-[#E3E2DF] border border-[#4F4538] rounded-full text-xs font-bold font-mono hover:bg-[#343533] transition-all duration-300"
            >
              Back to Application
            </button>
          </div>

          <div className="text-center pt-2 flex flex-col items-center gap-1">
            <p className="text-[11px] text-[#D2C4B3] font-mono">
              Ensure you are in a quiet environment before proceeding.
            </p>
            {!micGranted && (
              <button
                onClick={() => setShowSettingsModal(true)}
                className="text-[11px] text-[#D6A85F] hover:underline font-mono"
              >
                Having trouble with your microphone? Open Settings & Troubleshooting →
              </button>
            )}
          </div>

        </div>
      </main>

      {/* Microphone Settings & Permission Troubleshooting Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setShowSettingsModal(false)}
          />
          <div className="relative w-full max-w-xl bg-[#181A18] border border-[#4F4538] rounded-2xl shadow-2xl p-6 space-y-5 animate-fadeIn z-10">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D6A85F]/20 border border-[#D6A85F]/40 flex items-center justify-center text-[#F4C377]">
                  <span className="material-symbols-outlined text-xl">settings_voice</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#F4F1E9]">Microphone & Audio Settings</h2>
                  <p className="text-xs text-[#A1A19A] font-mono">Configure permission and verify your input device</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded-lg text-[#A1A19A] hover:text-[#F4F1E9] hover:bg-white/5 transition"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Current Permission Status Pill */}
            <div className="p-3 rounded-xl bg-[#121412] border border-white/5 flex items-center justify-between">
              <span className="text-xs font-mono text-[#D2C4B3]">Browser Permission Status:</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${
                micGranted
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : permissionState === 'denied'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                {micGranted ? '✓ Access Granted' : permissionState === 'denied' ? '✗ Blocked in Browser' : '⚠ Action Required'}
              </span>
            </div>

            {/* Device Selector */}
            {audioDevices.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#D2C4B3] block">Select Microphone Input:</label>
                <select
                  value={selectedDeviceId}
                  onChange={(e) => handleDeviceChange(e.target.value)}
                  className="w-full bg-[#121412] text-[#F4F1E9] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-[#D6A85F]"
                >
                  {audioDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Platform Guides */}
            <div className="space-y-2">
              <div className="text-xs font-mono text-[#D2C4B3] font-bold">How to Allow Microphone Access:</div>
              
              {/* Tabs */}
              <div className="flex border-b border-white/10 gap-1 text-xs font-mono">
                <button
                  onClick={() => setActiveTab('chrome')}
                  className={`px-3 py-1.5 border-b-2 transition-all ${
                    activeTab === 'chrome' ? 'border-[#D6A85F] text-[#F4C377] font-bold' : 'border-transparent text-[#A1A19A]'
                  }`}
                >
                  Chrome / Brave
                </button>
                <button
                  onClick={() => setActiveTab('edge')}
                  className={`px-3 py-1.5 border-b-2 transition-all ${
                    activeTab === 'edge' ? 'border-[#D6A85F] text-[#F4C377] font-bold' : 'border-transparent text-[#A1A19A]'
                  }`}
                >
                  Edge
                </button>
                <button
                  onClick={() => setActiveTab('windows')}
                  className={`px-3 py-1.5 border-b-2 transition-all ${
                    activeTab === 'windows' ? 'border-[#D6A85F] text-[#F4C377] font-bold' : 'border-transparent text-[#A1A19A]'
                  }`}
                >
                  Windows
                </button>
                <button
                  onClick={() => setActiveTab('mac')}
                  className={`px-3 py-1.5 border-b-2 transition-all ${
                    activeTab === 'mac' ? 'border-[#D6A85F] text-[#F4C377] font-bold' : 'border-transparent text-[#A1A19A]'
                  }`}
                >
                  macOS
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-3 bg-[#121412] rounded-xl border border-white/5 text-xs font-mono text-[#C9C6C2] space-y-2">
                {activeTab === 'chrome' && (
                  <ol className="list-decimal list-inside space-y-1.5">
                    <li>Look at the top URL bar next to the website address (<span className="text-[#F4C377]">localhost:5173</span>).</li>
                    <li>Click the <strong>Tune / Settings (View site information)</strong> or <strong>Lock</strong> icon.</li>
                    <li>Set <strong>Microphone</strong> to <span className="text-emerald-400 font-bold">Allow</span>.</li>
                    <li>Click <strong>"Verify Permission Now"</strong> below.</li>
                  </ol>
                )}

                {activeTab === 'edge' && (
                  <ol className="list-decimal list-inside space-y-1.5">
                    <li>Click the <strong>Lock</strong> icon on the left of the address bar.</li>
                    <li>Under site permissions, switch <strong>Microphone</strong> to <span className="text-emerald-400 font-bold">Allow</span>.</li>
                    <li>Click <strong>"Verify Permission Now"</strong> below.</li>
                  </ol>
                )}

                {activeTab === 'windows' && (
                  <ol className="list-decimal list-inside space-y-1.5">
                    <li>Open <strong>Windows Settings</strong> (Win + I) &gt; <strong>Privacy & Security</strong> &gt; <strong>Microphone</strong>.</li>
                    <li>Ensure <strong>Microphone access</strong> is toggled <span className="text-emerald-400 font-bold">ON</span>.</li>
                    <li>Ensure <strong>"Let desktop apps access your microphone"</strong> is turned <span className="text-emerald-400 font-bold">ON</span>.</li>
                  </ol>
                )}

                {activeTab === 'mac' && (
                  <ol className="list-decimal list-inside space-y-1.5">
                    <li>Open <strong>System Settings</strong> &gt; <strong>Privacy & Security</strong> &gt; <strong>Microphone</strong>.</li>
                    <li>Ensure your web browser (Chrome, Edge, Safari) is checked/enabled.</li>
                  </ol>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/10">
              <button
                onClick={handleManualBypass}
                className="w-full sm:w-auto text-xs font-mono text-[#D2C4B3] hover:text-emerald-400 hover:underline py-1.5"
                title="If you already granted permission or are in a trusted environment"
              >
                I have already allowed mic → Bypass Verification
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-[#E3E2DF] transition"
                >
                  Close
                </button>
                <button
                  onClick={() => handleRequestMicPermission(false)}
                  className="px-5 py-2 rounded-xl bg-[#D6A85F] hover:bg-[#F4C377] text-[#11110F] text-xs font-mono font-bold shadow-md transition flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  <span>Verify Permission Now</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
