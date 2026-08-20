import React, { useState, useEffect, useRef } from 'react';
import { VoiceCoreVisualizer } from '../components/interview/VoiceCoreVisualizer';
import { VoiceDepthShader } from '../components/3d/VoiceDepthShader';
import { WebRTCService, WebRTCConnectionState, AISpeechEvent, VoiceInterviewerState } from '../services/webrtcService';
import { candidateService } from '../services/candidateService';

interface VoiceInterviewRoomPageProps {
  token?: string;
  onNavigate?: (route: string) => void;
}

interface TranscriptItem {
  sender: string;
  text: string;
  role: 'ai' | 'candidate';
  competency?: string;
  difficulty?: string;
  timestamp?: string;
}

export const VoiceInterviewRoomPage: React.FC<VoiceInterviewRoomPageProps> = ({
  token = 'demo-token',
  onNavigate
}) => {
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(900); // 15 mins
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(1);
  const [currentQuestionText, setCurrentQuestionText] = useState<string>("Connecting to AI Interviewer...");
  const [currentCompetency, setCurrentCompetency] = useState<string>("Technical Architecture");
  const [currentDifficulty, setCurrentDifficulty] = useState<string>("MEDIUM");
  const [totalQuestions, setTotalQuestions] = useState<number>(6);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [voiceState, setVoiceState] = useState<VoiceInterviewerState>('IDLE');
  const [showTranscript, setShowTranscript] = useState<boolean>(true);
  const [showEndModal, setShowEndModal] = useState<boolean>(false);
  const [interviewCompleted, setInterviewCompleted] = useState<boolean>(false);
  const [connectionState, setConnectionState] = useState<WebRTCConnectionState>('connecting');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [candidateSpeechInput, setCandidateSpeechInput] = useState<string>('');
  const [jobTitle, setJobTitle] = useState<string>('AI Engineer');
  const [candidateName, setCandidateName] = useState<string>('Candidate');
  const [companyName, setCompanyName] = useState<string>('HireGenie AI');

  const [transcriptDialogue, setTranscriptDialogue] = useState<TranscriptItem[]>([]);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const webrtcRef = useRef<WebRTCService | null>(null);

  // Initialize interview session from backend DB
  useEffect(() => {
    let isMounted = true;
    const initSession = async () => {
      try {
        const sessionRes = await candidateService.startSession(token);
        if (sessionRes.data && isMounted) {
          const sData = sessionRes.data;
          setSecondsElapsed(sData.elapsed_seconds || 0);
          setRemainingSeconds(sData.remaining_seconds || 900);
          if (sData.current_question_index) {
            setCurrentQuestionIdx(sData.current_question_index);
          }
          if (sData.job_title) setJobTitle(sData.job_title);
          if (sData.candidate_name) setCandidateName(sData.candidate_name);
        }
      } catch (err: any) {
        console.warn('Session init warning (using active token context):', err.message);
      }
    };

    initSession();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Session 15-minute timer ticker
  useEffect(() => {
    if (interviewCompleted) return;

    const timer = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          handleEndInterviewConfirm();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [interviewCompleted]);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcriptDialogue]);

  // Connect WebRTC & WebSocket Voice signaling with Continuous Listening
  useEffect(() => {
    const service = new WebRTCService({
      token,
      onConnectionStateChange: (state) => {
        console.log(`[VoiceRoom] Connection state -> ${state}`);
        setConnectionState(state);
      },
      onVoiceStateChange: (state) => {
        setVoiceState(state);
      },
      onAudioLevelChange: (level) => {
        setAudioLevel(level);
      },
      onAISpeech: (event: AISpeechEvent) => {
        if (event.question_text || event.text) {
          setCurrentQuestionText(event.question_text || event.text);
        }
        if (typeof event.question_index === 'number') {
          setCurrentQuestionIdx(event.question_index);
        }
        if (typeof event.total_questions === 'number') {
          setTotalQuestions(event.total_questions);
        }
        if (event.competency_focus) {
          setCurrentCompetency(event.competency_focus);
        }
        if (event.current_difficulty) {
          setCurrentDifficulty(event.current_difficulty);
        }

        setTranscriptDialogue(prev => [
          ...prev,
          {
            sender: 'AI Interviewer',
            text: event.text,
            role: 'ai',
            competency: event.competency_focus,
            difficulty: event.current_difficulty,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);

        if (event.interview_completed) {
          setInterviewCompleted(true);
          setShowEndModal(true);
        }
      },
      onCandidateSpeechDetected: () => {
        // Real-time audio activity detected
      },
      onInterviewCompleted: () => {
        setInterviewCompleted(true);
        setShowEndModal(true);
      },
      onError: (err) => {
        console.error('[VoiceRoom] WebRTC transport error:', err);
        setConnectionState('failed');
      }
    });

    service.initialize();
    webrtcRef.current = service;

    return () => {
      service.disconnect();
    };
  }, [token]);

  const handleToggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (webrtcRef.current) {
      webrtcRef.current.toggleMute(newMuted);
    }
  };

  const handleManualSendSpeech = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const speechText = candidateSpeechInput.trim();
    if (!speechText) return;

    setTranscriptDialogue(prev => [
      ...prev,
      {
        sender: `${candidateName} (You)`,
        text: speechText,
        role: 'candidate',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    if (webrtcRef.current) {
      webrtcRef.current.sendCandidateSpeech(speechText);
    }

    setCandidateSpeechInput('');
  };

  const handleRetryConnection = () => {
    setConnectionState('connecting');
    if (webrtcRef.current) {
      webrtcRef.current.reconnect();
    }
  };

  const handleEndInterviewConfirm = async () => {
    if (webrtcRef.current) {
      webrtcRef.current.sendEndInterview();
      webrtcRef.current.disconnect();
    }

    try {
      await candidateService.completeSession(token, transcriptDialogue);
    } catch (e) {
      console.warn('Session complete submission note:', e);
    }

    setInterviewCompleted(true);
    if (onNavigate) {
      onNavigate('/candidate/applications');
    }
  };

  const formatTimer = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = Math.floor(totalSecs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getDifficultyBadgeColor = (diff: string) => {
    switch (diff.toUpperCase()) {
      case 'HARD':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'EASY':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      default:
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    }
  };

  const getStatusDisplay = () => {
    switch (voiceState) {
      case 'AI_SPEAKING':
        return { text: 'AI Interviewer Speaking...', color: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30 animate-pulse' };
      case 'LISTENING':
        return { text: 'Listening Automatically (Speak freely)', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' };
      case 'CANDIDATE_SPEAKING':
        return { text: 'Candidate Speaking...', color: 'text-amber-400 bg-amber-500/20 border-amber-500/30 animate-pulse' };
      case 'PROCESSING':
        return { text: 'Transcribing & Thinking (Gemini LLM)...', color: 'text-purple-400 bg-purple-500/20 border-purple-500/30 animate-spin' };
      case 'COMPLETED':
        return { text: 'Interview Completed', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' };
      default:
        return { text: 'Initializing Voice Channel...', color: 'text-zinc-400 bg-zinc-800 border-zinc-700' };
    }
  };

  const statusBadge = getStatusDisplay();

  return (
    <div className="bg-[#0b0c10] text-[#e0e6ed] h-screen w-screen overflow-hidden flex flex-col font-sans antialiased relative selection:bg-cyan-500 selection:text-black">
      {/* Background Volumetric Depth GLSL Shader */}
      <VoiceDepthShader opacity={0.85} />

      {/* Ambient Lighting */}
      <div className="absolute inset-0 bg-radial-gradient from-cyan-500/10 via-transparent to-transparent pointer-events-none" />

      {/* Top Header Navigation */}
      <header className="relative z-20 w-full px-6 py-3.5 flex justify-between items-center max-w-7xl mx-auto shrink-0 border-b border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-cyan-400 text-2xl animate-pulse">graphic_eq</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-white">HireGenie AI Voice Assessment</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1.5 ${statusBadge.color}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {statusBadge.text}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono">
              {jobTitle} • {candidateName}
            </p>
          </div>
        </div>

        {/* Pacing & Voice Pipeline Telemetry */}
        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border ${getDifficultyBadgeColor(currentDifficulty)}`}>
            Difficulty: {currentDifficulty}
          </span>
          <div className="flex items-center gap-2 bg-zinc-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-mono font-bold text-white tracking-wider">
              {formatTimer(remainingSeconds)} / 15:00
            </span>
          </div>
          <button
            onClick={() => setShowEndModal(true)}
            className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-medium transition"
          >
            End Interview
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex overflow-hidden max-w-7xl mx-auto w-full p-4 gap-4">
        {/* Left / Center: Interactive Voice Orb & Current Question */}
        <div className="flex-1 flex flex-col justify-between items-center bg-zinc-950/40 rounded-2xl border border-white/5 p-6 backdrop-blur-xl relative overflow-hidden">
          
          {/* Question Meta Badge */}
          <div className="w-full flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Focus Area:</span>
              <span className="text-xs font-semibold text-cyan-300 bg-cyan-950/60 px-2.5 py-0.5 rounded-md border border-cyan-800/40">
                {currentCompetency}
              </span>
            </div>
            <span className="text-xs font-mono text-zinc-400">
              Turn {currentQuestionIdx} • Adaptive Pacing
            </span>
          </div>

          {/* Center 3D Voice Orb Visualizer */}
          <div className="my-auto flex flex-col items-center justify-center relative">
            <div className="relative w-64 h-64 flex items-center justify-center">
              <VoiceCoreVisualizer
                isSpeaking={voiceState === 'AI_SPEAKING' || voiceState === 'CANDIDATE_SPEAKING'}
                speakerRole={voiceState === 'AI_SPEAKING' ? 'ai' : 'candidate'}
              />
            </div>
            
            {/* Real-time Voice Activity Cue */}
            <div className="mt-4 text-center">
              <p className="text-xs font-mono text-zinc-300 tracking-wide flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm text-cyan-400">mic</span>
                Continuous Voice AI • Speak naturally without clicking buttons
              </p>
              <p className="text-[11px] text-zinc-500 font-mono mt-1">
                Sarvam AI STT (saarika:v2.5) & TTS (bulbul:v2)
              </p>
            </div>
          </div>

          {/* Active Question Prompt Display */}
          <div className="w-full bg-zinc-900/80 border border-white/10 rounded-xl p-4 shadow-xl">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-mono mb-1.5">
              <span>ACTIVE INTERVIEW PROMPT</span>
              <span className="text-cyan-400">Barge-in Enabled</span>
            </div>
            <p className="text-sm font-medium text-white leading-relaxed">
              "{currentQuestionText}"
            </p>
          </div>

          {/* Microphone Controls & Manual Fallback Bar */}
          <div className="w-full flex items-center justify-between gap-3 mt-3 pt-3 border-t border-white/5">
            <button
              onClick={handleToggleMute}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition border ${
                isMuted
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-zinc-900 text-zinc-200 border-white/10 hover:bg-zinc-800'
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                {isMuted ? 'mic_off' : 'mic'}
              </span>
              {isMuted ? 'Microphone Muted' : 'Microphone Active'}
            </button>

            {/* Optional Typed Text Input fallback for accessibility */}
            <form onSubmit={handleManualSendSpeech} className="flex-1 flex gap-2">
              <input
                type="text"
                value={candidateSpeechInput}
                onChange={(e) => setCandidateSpeechInput(e.target.value)}
                placeholder="Type response (optional fallback)..."
                className="flex-1 bg-zinc-900/70 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition"
              />
              <button
                type="submit"
                disabled={!candidateSpeechInput.trim()}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-black font-bold rounded-xl text-xs transition"
              >
                Send
              </button>
            </form>

            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/10 rounded-xl text-xs flex items-center gap-1.5 transition"
            >
              <span className="material-symbols-outlined text-sm">subtitles</span>
              {showTranscript ? 'Hide' : 'Transcript'}
            </button>
          </div>
        </div>

        {/* Right Panel: Live Conversational Transcript */}
        {showTranscript && (
          <div className="w-80 lg:w-96 bg-zinc-950/60 rounded-2xl border border-white/5 p-4 flex flex-col backdrop-blur-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-cyan-400 text-sm">notes</span>
                Live Turn Transcript
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                {transcriptDialogue.length} Turns Recorded
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1 text-xs">
              {transcriptDialogue.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 font-mono text-xs">
                  Awaiting initial greeting from AI Interviewer...
                </div>
              ) : (
                transcriptDialogue.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border leading-relaxed ${
                      item.role === 'ai'
                        ? 'bg-cyan-950/20 border-cyan-500/20 text-zinc-200'
                        : 'bg-zinc-900/60 border-white/5 text-zinc-300'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1 text-[10px] font-mono">
                      <span className={item.role === 'ai' ? 'text-cyan-400 font-bold' : 'text-amber-400 font-bold'}>
                        {item.sender}
                      </span>
                      <span className="text-zinc-500">{item.timestamp}</span>
                    </div>
                    <p className="text-xs">{item.text}</p>
                    {item.competency && (
                      <span className="inline-block mt-1.5 text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-900/30 text-cyan-300 border border-cyan-700/30">
                        {item.competency}
                      </span>
                    )}
                  </div>
                ))
              )}
              <div ref={transcriptEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* End Interview Confirmation Modal */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl">
            <span className="material-symbols-outlined text-4xl text-cyan-400 mb-2">task_alt</span>
            <h3 className="text-lg font-bold text-white mb-1">Conclude Interview</h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-6">
              Your voice responses and technical explanations will be evaluated by HireGenie's AI assessment pipeline against the role rubric.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndModal(false)}
                className="flex-1 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-700 transition"
              >
                Continue Interview
              </button>
              <button
                onClick={handleEndInterviewConfirm}
                className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-bold transition"
              >
                Submit & Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
