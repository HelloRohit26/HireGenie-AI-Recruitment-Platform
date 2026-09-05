import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { 
  Sparkles, 
  Mic, 
  Volume2, 
  Clock, 
  ShieldCheck, 
  User, 
  Cpu, 
  Briefcase, 
  PhoneOff,
  Radio,
  Headphones,
  Loader2,
  PhoneCall,
  MicOff,
  Activity,
  Send,
  Building2,
  Award,
  Bot,
  Copy,
  Check,
  Terminal,
  Zap,
  Code2,
  LayoutGrid,
  AlertTriangle
} from 'lucide-react';
import { LiveCodeSandbox } from '../components/interview/LiveCodeSandbox';
import { AIProctoringOverlay } from '../components/interview/AIProctoringOverlay';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'sarvam-widget': any;
    }
  }
}

interface TranscriptItem {
  speaker: 'ai' | 'candidate';
  text: string;
  timestamp: string;
}

interface VoiceInterviewRoomPageProps {
  token?: string;
  autoStart?: boolean;
  onNavigate?: (route: string) => void;
}

export const VoiceInterviewRoomPage: React.FC<VoiceInterviewRoomPageProps> = ({
  token: propToken,
  autoStart = false,
  onNavigate
}) => {
  const token = propToken || (typeof window !== 'undefined' ? (window.location.pathname.split('/')[2] || 'demo-token') : 'demo-token');

  const [loading, setLoading] = useState<boolean>(true);
  const [interviewData, setInterviewData] = useState<any>(null);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [callState, setCallState] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isSarvamCallActive, setIsSarvamCallActive] = useState<boolean>(false);
  const [isSarvamConnecting, setIsSarvamConnecting] = useState<boolean>(false);
  const [hasStartedVoice, setHasStartedVoice] = useState<boolean>(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(900); // 15 mins
  const [isEnding, setIsEnding] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [textInput, setTextInput] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Next-Gen Features: Mode Switcher & Proctoring
  const [viewMode, setViewMode] = useState<'voice' | 'code' | 'split'>('voice');
  const [codeSubmissions, setCodeSubmissions] = useState<any[]>([]);
  const [proctoringScore, setProctoringScore] = useState<number>(100);
  const [totalInfractions, setTotalInfractions] = useState<number>(0);

  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const seenTranscriptsRef = useRef<Set<string>>(new Set());
  const widgetRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeWsRef = useRef<WebSocket | null>(null);
  const recognitionRef = useRef<any>(null);
  const isConnectedRef = useRef<boolean>(false);
  const callStateRef = useRef<string>('idle');
  const currentQuestionIndexRef = useRef<number>(0);

  isConnectedRef.current = isConnected;
  callStateRef.current = callState;
  currentQuestionIndexRef.current = currentQuestionIndex;

  // Metadata accessors
  const interviewerName = interviewData?.interviewer_name || interviewData?.recruiter_name || 'Recruiter Admin';
  const candidateName = interviewData?.candidate_name || interviewData?.candidate?.full_name || 'Rohit Maurya';
  const jobTitle = interviewData?.job_title || interviewData?.job?.title || 'AI Engineer - Generative AI & LLMs (Fresher)';
  const companyName = interviewData?.company || interviewData?.job?.company || 'Sarvam AI';
  const department = interviewData?.department || 'GenAI Research & Engineering';
  const experienceLevel = interviewData?.experience_level || 'ENTRY_LEVEL';
  const jobLocation = interviewData?.location || 'Bengaluru, Karnataka, India (Hybrid)';
  const candidateSkills = interviewData?.candidate_skills || 'Python, PyTorch, Transformers, LangChain, FastAPI';
  const skillsArray = interviewData?.skills || ['Python', 'PyTorch', 'Transformers', 'LangChain', 'FastAPI'];

  const jobDescription = interviewData?.job_description || 'Technical engineering role focusing on generative AI and LLMs.';
  const candidateResume = interviewData?.candidate_resume_summary || candidateSkills;
  const interviewContext = interviewData?.interview_context || `Technical interview for ${jobTitle} at ${companyName}.`;

  const agentVariablesRef = useRef<any>({});

  const agentVariablesObj = {
    candidate_name: candidateName,
    name: candidateName,
    job_title: jobTitle,
    role: jobTitle,
    position: jobTitle,
    company_name: companyName,
    company: companyName,
    interviewer_name: interviewerName,
    recruiter_name: interviewerName,
    candidate_skills: candidateSkills,
    skills: candidateSkills,
    job_description: jobDescription,
    job_requirements: jobDescription,
    candidate_resume: candidateResume,
    candidate_resume_summary: candidateResume,
    resume: candidateResume,
    interview_context: interviewContext,
    context: interviewContext,
    interview_difficulty: 'Medium'
  };
  agentVariablesRef.current = agentVariablesObj;

  // Derive questions list dynamically
  const questionsList = useMemo<string[]>(() => {
    if (interviewData?.screening_questions && Array.isArray(interviewData.screening_questions) && interviewData.screening_questions.length > 0) {
      return interviewData.screening_questions.map((q: any) => q.question_text || q.text || String(q));
    }
    return [
      "Explain the mechanism of Multi-Head Self-Attention in Transformers and why queries, keys, and values are projected into multiple subspaces.",
      "Walk us through an AI/ML project or experiment where you implemented a RAG system, fine-tuned an open-weights model, or built a high-throughput inference API in Python.",
      "How do you minimize latency and control hallucination when streaming model responses to an end-user client application in production?"
    ];
  }, [interviewData]);

  // 1. Fetch Dynamic Context from Backend
  useEffect(() => {
    async function loadInterview() {
      try {
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const res = await fetch(`${backendUrl}/api/v1/interview/invitation/${token}`);
        if (res.ok) {
          const data = await res.json();
          setInterviewData(data);
        }
      } catch (err) {
        console.error('Error fetching interview context:', err);
      } finally {
        setLoading(false);
      }
    }
    if (token) loadInterview();
  }, [token]);

  // 2. Auto-scroll transcript container
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  // Helper to add transcript turn with deduplication
  const handleAddTurn = useCallback((role: 'ai' | 'candidate', rawText: string) => {
    if (!rawText) return;
    const text = rawText.trim();
    if (!text || text.length < 2) return;
    
    // Normalize string for deduplication
    const normalizedKey = text.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
    if (!normalizedKey) return;
    if (seenTranscriptsRef.current.has(normalizedKey)) return;
    seenTranscriptsRef.current.add(normalizedKey);

    setIsConnected(true);
    setTranscripts((prev) => [
      ...prev,
      {
        speaker: role,
        text: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }
    ]);
    setCallState(role === 'ai' ? 'speaking' : 'listening');
  }, []);

  // 3. Audio Autoplay Policy Handler (User Gesture Unlock)
  const unlockAudioContext = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current && AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
    } catch (e) {
      console.warn('AudioContext unlock note:', e);
    }
  }, []);

  // Voice AI Synthesis (Web Speech API with Natural Voice Selection)
  const speakAI = useCallback((textToSpeak: string, onEnd?: () => void) => {
    if (typeof window === 'undefined') {
      if (onEnd) onEnd();
      return;
    }

    // Stop recognition while AI speaks to avoid self-echo
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    if (!('speechSynthesis' in window)) {
      console.warn('speechSynthesis not supported in this environment');
      if (onEnd) onEnd();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find(v => 
        v.lang.startsWith('en') && (
          v.name.includes('Natural') || 
          v.name.includes('Google') || 
          v.name.includes('India') || 
          v.name.includes('Microsoft') || 
          v.name.includes('Samantha') || 
          v.name.includes('David') ||
          v.name.includes('Guy')
        )
      ) || voices.find(v => v.lang.startsWith('en')) || voices[0];

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      setCallState('speaking');

      utterance.onend = () => {
        setCallState('listening');
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        setCallState('listening');
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('speakAI error:', err);
      setCallState('listening');
      if (onEnd) onEnd();
    }
  }, []);

  // Continuous Speech-to-Text Recognition for Candidate
  const startSpeechRecognition = useCallback(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not available in browser. Text input is ready.');
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }

      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setCallState('listening');
      };

      rec.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const part = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += part;
          } else {
            interimTranscript += part;
          }
        }

        if (finalTranscript.trim()) {
          const userSpeech = finalTranscript.trim();
          handleAddTurn('candidate', userSpeech);
          setTextInput('');
          handleCandidateTurnCompleted(userSpeech);
        } else if (interimTranscript.trim()) {
          setTextInput(interimTranscript.trim());
        }
      };

      rec.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
      };

      rec.onend = () => {
        if (isConnectedRef.current && callStateRef.current === 'listening') {
          try { rec.start(); } catch (e) {}
        }
      };

      rec.start();
      recognitionRef.current = rec;
    } catch (err) {
      console.warn('startSpeechRecognition error:', err);
    }
  }, [handleAddTurn]);

  // Progressive Question Generator
  const askQuestion = useCallback((idx: number) => {
    const qList = questionsList;
    const cName = candidateName;
    const rName = interviewerName;
    const jTitle = jobTitle;
    const cCompany = companyName;

    let aiPromptText = '';
    if (idx === 0) {
      aiPromptText = `Hello ${cName}! Welcome to your technical interview for the ${jTitle} position at ${cCompany}. I am ${rName}, your AI interviewer today. Let's begin with our first question: ${qList[0] || 'Could you explain your background and projects in AI?'}`;
    } else if (idx < qList.length) {
      const acknowledgments = [
        `Thank you for detailing that, ${cName}. That's a solid breakdown.`,
        `Understood, ${cName}. Good points on the architecture.`,
        `Excellent explanation, ${cName}. Let's move to our next question.`
      ];
      const ack = acknowledgments[(idx - 1) % acknowledgments.length];
      aiPromptText = `${ack} Here is our next question: ${qList[idx]}`;
    } else {
      aiPromptText = `Thank you so much, ${cName}! You have successfully answered all technical screening questions for this role. Our recruitment team and evaluation models will analyze your responses and generate your comprehensive evaluation report. You may click 'End Session' when you are ready. Best of luck!`;
    }

    handleAddTurn('ai', aiPromptText);
    speakAI(aiPromptText, () => {
      startSpeechRecognition();
    });
  }, [questionsList, candidateName, interviewerName, jobTitle, companyName, handleAddTurn, speakAI, startSpeechRecognition]);

  // Turn Progression Handler
  const handleCandidateTurnCompleted = useCallback((answerText: string) => {
    const nextIdx = currentQuestionIndexRef.current + 1;
    setCurrentQuestionIndex(nextIdx);
    currentQuestionIndexRef.current = nextIdx;

    setTimeout(() => {
      askQuestion(nextIdx);
    }, 1200);
  }, [askQuestion]);

  // Stop Sarvam Voice Call
  const handleStopSarvamCall = () => {
    setIsSarvamCallActive(false);
    setIsConnected(false);
    setCallState('idle');
    try {
      const widget = widgetRef.current || document.querySelector('sarvam-widget');
      const shadow = widget?.shadowRoot;
      if (shadow) {
        const buttons = Array.from(shadow.querySelectorAll('button')) as HTMLButtonElement[];
        const stopBtn = buttons.find(b => 
          b.textContent?.toLowerCase().includes('end') || 
          b.textContent?.toLowerCase().includes('stop')
        );
        if (stopBtn) stopBtn.click();
      }
    } catch (e) {}
  };

  // 4. Trigger Sarvam Voice Call Programmatically via Center Begin Button
  const handleStartInterview = async () => {
    unlockAudioContext();
    setHasStartedVoice(true);
    setIsSarvamConnecting(true);
    setCallState('listening');

    // Notify backend session start
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      fetch(`${backendUrl}/api/v1/interview/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      }).catch(err => console.warn('Backend start session notice:', err));
    } catch (e) {}

    // Request microphone permissions
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e) {
        console.warn('Microphone permission notice:', e);
      }
    }

    // Trigger Sarvam Conversational Voice Agent Widget
    const triggerSarvamAssistant = () => {
      const widget = widgetRef.current || document.querySelector('sarvam-widget');
      if (!widget || !widget.shadowRoot) return false;
      const shadow = widget.shadowRoot;
      const btns = Array.from(shadow.querySelectorAll('button')) as HTMLButtonElement[];
      if (btns.length === 0) return false;

      // 1. If call button exists directly
      const callBtn = btns.find(b => 
        b.style.borderRadius === '9999px' ||
        b.textContent?.toLowerCase().includes('start') || 
        b.textContent?.toLowerCase().includes('begin') ||
        b.textContent?.toLowerCase().includes('voice') ||
        b.textContent?.toLowerCase().includes('call')
      );
      if (callBtn) {
        callBtn.click();
        setIsSarvamCallActive(true);
        setIsSarvamConnecting(false);
        setIsConnected(true);
        return true;
      }

      // 2. Click FAB to expand, then poll to click inner start call button
      btns[0].click();
      let attempts = 0;
      const pollTimer = setInterval(() => {
        attempts++;
        const currentBtns = Array.from(shadow.querySelectorAll('button')) as HTMLButtonElement[];
        const innerCallBtn = currentBtns.find(b => 
          b.style.borderRadius === '9999px' ||
          b.textContent?.toLowerCase().includes('start') || 
          b.textContent?.toLowerCase().includes('begin') ||
          b.textContent?.toLowerCase().includes('voice') ||
          b.textContent?.toLowerCase().includes('call')
        );
        if (innerCallBtn) {
          innerCallBtn.click();
          clearInterval(pollTimer);
          setIsSarvamCallActive(true);
          setIsSarvamConnecting(false);
          setIsConnected(true);
        } else if (attempts >= 15) {
          clearInterval(pollTimer);
          setIsSarvamConnecting(false);
        }
      }, 100);

      return true;
    };

    const launched = triggerSarvamAssistant();
    if (!launched) {
      // If widget wasn't ready, retry in 300ms
      setTimeout(() => {
        triggerSarvamAssistant();
      }, 300);
    }
  };

  // Auto-start on load if requested via autostart query param
  useEffect(() => {
    if (autoStart && !isConnected && !hasStartedVoice && !loading) {
      const t = setTimeout(() => {
        handleStartInterview();
      }, 700);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [autoStart, loading]);

  const handleToggleMute = () => {
    setIsMuted(prev => !prev);
    if (!isMuted) {
      // Muting
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    } else {
      // Unmuting
      if (isConnected && callState === 'listening') {
        startSpeechRecognition();
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
    };
  }, []);

  // 5. Send Typed Response Handler (Seamless Multi-Modal Text + Voice)
  const handleSendTextResponse = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const message = textInput.trim();
    if (!message) return;

    // Add candidate turn immediately to transcript stream
    handleAddTurn('candidate', message);
    setTextInput('');

    // Trigger AI response & progression
    handleCandidateTurnCompleted(message);
  };

  // Copy full transcript to clipboard
  const handleCopyTranscript = () => {
    const fullText = transcripts.map(t => `[${t.timestamp}] ${t.speaker === 'ai' ? `${interviewerName} (AI Interviewer)` : `${candidateName} (Candidate)`}: ${t.text}`).join('\n\n');
    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // 6. Accurate Real-Time Transcript Capture Engine
  useEffect(() => {
    // A. Intercept Browser WebSocket Traffic for direct Sarvam frames
    const OriginalWebSocket = window.WebSocket;

    const parseMessagePayload = (data: any) => {
      if (!data) return;
      
      let obj = data;
      if (typeof data === 'string') {
        try {
          obj = JSON.parse(data);
        } catch {
          return;
        }
      }

      if (!obj || typeof obj !== 'object') return;

      // Status updates
      if (obj.type === 'server.event.user_speech_start') {
        setCallState('listening');
        setIsConnected(true);
      } else if (obj.type === 'server.media.audio_chunk' || obj.type === 'server.media.audio') {
        setCallState('speaking');
        setIsConnected(true);
      }

      // Transcription content extraction
      const text = obj.content || obj.text || obj.transcript || obj.message;
      if (text && typeof text === 'string' && text.trim().length > 1) {
        if (text.startsWith('redirect::')) return;

        // Determine speaker role accurately
        const isBot = obj.role === 'bot' || obj.speaker === 'bot' || obj.sender === 'bot' || obj.role === 'agent' || obj.type === 'server.media.text' || obj.type === 'server.media.text_chunk';
        const role = isBot ? 'ai' : 'candidate';

        handleAddTurn(role, text);
      }
    };

    // Monkey-patch WebSocket to capture all incoming Sarvam frames and inject dynamic variables on send
    const PatchedWebSocket = function (url: string | URL, protocols?: string | string[]) {
      const ws = new OriginalWebSocket(url, protocols);
      activeWsRef.current = ws;

      const origSend = ws.send;
      ws.send = function (data: any) {
        try {
          if (typeof data === 'string') {
            const parsed = JSON.parse(data);
            if (parsed && typeof parsed === 'object') {
              // Inject active dynamic variables on start/init frames or whenever agent_variables is referenced
              if (
                parsed.type === 'interaction_start' ||
                parsed.type === 'client.action.interaction_start' ||
                parsed.type?.includes('start') ||
                parsed.type?.includes('init') ||
                'agent_variables' in parsed ||
                parsed.origin === 'client'
              ) {
                parsed.agent_variables = {
                  ...(parsed.agent_variables || {}),
                  ...agentVariablesRef.current
                };
                data = JSON.stringify(parsed);
                console.log('🎙️ [HireGenie -> Sarvam ConvAI] Injected Dynamic Prompt Variables:', parsed.agent_variables);
              }
            }
          }
        } catch (e) {}
        return origSend.call(this, data);
      };

      ws.addEventListener('message', (event) => {
        try {
          if (typeof event.data === 'string') {
            parseMessagePayload(event.data);
          }
        } catch (e) {}
      });

      ws.addEventListener('open', () => {
        setIsConnected(true);
        setCallState('listening');
      });

      return ws;
    };

    (PatchedWebSocket as any).CONNECTING = OriginalWebSocket.CONNECTING;
    (PatchedWebSocket as any).OPEN = OriginalWebSocket.OPEN;
    (PatchedWebSocket as any).CLOSING = OriginalWebSocket.CLOSING;
    (PatchedWebSocket as any).CLOSED = OriginalWebSocket.CLOSED;
    (PatchedWebSocket as any).prototype = OriginalWebSocket.prototype;

    (window as any).WebSocket = PatchedWebSocket;

    // B. Window Message Listener (iframe / postMessage)
    const handleMessage = (event: MessageEvent) => {
      try {
        parseMessagePayload(event.data);
      } catch (e) {}
    };

    // C. Deep Console Interceptor (Catches Sarvam SDK logs: "Transcript:")
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    const inspectConsoleArgs = (args: any[]) => {
      try {
        for (let i = 0; i < args.length; i++) {
          const arg = args[i];
          if (!arg) continue;

          if (typeof arg === 'object') {
            parseMessagePayload(arg);
          } else if (typeof arg === 'string') {
            // Parse "Transcript:" JSON string
            if (arg.includes('Transcript:')) {
              const rest = arg.replace('Transcript:', '').trim() || (args[i + 1] ? String(args[i + 1]).trim() : '');
              if (rest) {
                try {
                  const parsed = JSON.parse(rest);
                  parseMessagePayload(parsed);
                } catch {}
              }
            } else if (arg.includes('Text message:') && args[i + 1]) {
              parseMessagePayload(args[i + 1]);
            } else if (arg.includes('"type"') && (arg.includes('"role"') || arg.includes('"content"'))) {
              try {
                const parsed = JSON.parse(arg);
                parseMessagePayload(parsed);
              } catch {}
            }
          }
        }
      } catch (e) {}
    };

    console.log = (...args: any[]) => {
      originalLog.apply(console, args);
      inspectConsoleArgs(args);
    };

    console.warn = (...args: any[]) => {
      originalWarn.apply(console, args);
      inspectConsoleArgs(args);
    };

    console.info = (...args: any[]) => {
      originalInfo.apply(console, args);
      inspectConsoleArgs(args);
    };

    // D. Custom Event Listeners on Widget
    const widgetNode = widgetRef.current;
    const handleCustomEvent = (e: any) => {
      if (e.detail) parseMessagePayload(e.detail);
    };

    if (widgetNode) {
      widgetNode.addEventListener('transcription', handleCustomEvent);
      widgetNode.addEventListener('server.event.transcription', handleCustomEvent);
      widgetNode.addEventListener('text', handleCustomEvent);
    }

    window.addEventListener('message', handleMessage);

    return () => {
      (window as any).WebSocket = OriginalWebSocket;
      window.removeEventListener('message', handleMessage);
      if (widgetNode) {
        widgetNode.removeEventListener('transcription', handleCustomEvent);
        widgetNode.removeEventListener('server.event.transcription', handleCustomEvent);
        widgetNode.removeEventListener('text', handleCustomEvent);
      }
      console.log = originalLog;
      console.warn = originalWarn;
      console.info = originalInfo;
    };
  }, [handleAddTurn]);

  // 7. Timer Countdown (ONLY counts down when interview has actively started)
  useEffect(() => {
    if (!isConnected) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isConnected]);

  // 8. Cleanup on Unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        try {
          audioCtxRef.current.close().catch(() => {});
        } catch (e) {}
      }
      audioCtxRef.current = null;
    };
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleEndInterview = async () => {
    if (isEnding) return;
    setIsEnding(true);

    try {
      // Trigger stop in widget
      const shadow = widgetRef.current?.shadowRoot;
      if (shadow) {
        const buttons = Array.from(shadow.querySelectorAll('button')) as HTMLButtonElement[];
        const stopBtn = buttons.find(b => 
          b.textContent?.toLowerCase().includes('end') || 
          b.textContent?.toLowerCase().includes('stop') ||
          b.style.backgroundColor?.includes('red')
        );
        if (stopBtn) stopBtn.click();
      }
    } catch (e) {}

    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      await fetch(`${backendUrl}/api/v1/interview/session/${token}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transcript: transcripts,
          code_submissions: codeSubmissions,
          proctoring_data: { integrity_score: proctoringScore, infractions: totalInfractions },
          integrity_score: proctoringScore
        })
      });
    } catch (e) {
      console.warn('Failed to record interview completion:', e);
    }
    
    if (onNavigate) {
      onNavigate('/candidate/applications');
    } else {
      window.location.href = '/candidate/applications';
    }
  };

  // Helper when candidate requests AI Code Review in Live Sandbox
  const handleCodeAnalyzed = (verbalPrompt: string, analysisData: any) => {
    handleAddTurn('ai', `[AI Technical Evaluation: ${analysisData.time_complexity} Time, ${analysisData.space_complexity} Space] Follow-up Question: "${verbalPrompt}"`);
    setCodeSubmissions(prev => [
      ...prev,
      {
        timestamp: new Date().toLocaleTimeString(),
        analysis: analysisData
      }
    ]);
  };

  // Helper when code changes
  const handleCodeChange = (currentCode: string, lang: string) => {
    setCodeSubmissions(prev => {
      const filtered = prev.filter(x => !x.is_draft);
      return [...filtered, { is_draft: true, language: lang, code: currentCode, timestamp: new Date().toLocaleTimeString() }];
    });
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      
      {/* Headless Sarvam Voice Agent - Hidden from bottom-right corner, triggered via center Begin button */}
      <style>{`
        sarvam-widget {
          position: fixed !important;
          top: -9999px !important;
          left: -9999px !important;
          width: 1px !important;
          height: 1px !important;
          overflow: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          z-index: -9999 !important;
          clip: rect(0, 0, 0, 0) !important;
        }
      `}</style>

      {/* Embedded Official Sarvam Conversational Voice Agent Widget */}
      {!loading && (
        <sarvam-widget
          key={`${candidateName}_${jobTitle}_${companyName}`}
          ref={widgetRef}
          api-key={import.meta.env.VITE_SARVAM_API_KEY || "sk_samvaad_pv4mkhlz_dVCg8jcoaLPgaPL1aQc2pFwk"}
          app-id={import.meta.env.VITE_SARVAM_APP_ID || "AI-Recruite-9479a495-758f"}
          org-id={import.meta.env.VITE_SARVAM_ORG_ID || "019e90d2-5a2a-7d28-9d8c-cc1af5fa4cd2"}
          workspace-id={import.meta.env.VITE_SARVAM_WORKSPACE_ID || "019e90d2-5a54-7c98-ac08-87dfc654bfbe"}
          user-id={`candidate_${token || 'session'}`}
          button-text="Start Sarvam Voice Call"
          title="Sarvam AI Technical Screener"
          button-color="#10B981"
          button-hover-color="#059669"
          text-color="#ffffff"
          position="bottom-right"
          size="large"
          proxy="true"
        ></sarvam-widget>
      )}

      {/* Top Enterprise Executive Navigation Header */}
      <header className="h-20 border-b border-slate-800/80 bg-[#0B0F19]/95 backdrop-blur-2xl px-6 md:px-10 flex items-center justify-between sticky top-0 z-50 shadow-2xl">
        <div className="flex items-center gap-5">
          {/* Company Brand Logo Badge */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 border border-indigo-400/40 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-mono font-bold tracking-widest text-[#D6A85F] uppercase">
                  {companyName}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> VERIFIED REQUISITION
                </span>
              </div>
              <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                {jobTitle}
                <span className="text-xs font-normal text-slate-400 font-mono">/ Assessment Room</span>
              </h1>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs shadow-inner">
            <span className={`w-2 h-2 rounded-full ${callState === 'speaking' ? 'bg-emerald-400 animate-pulse' : callState === 'listening' ? 'bg-indigo-400 animate-ping' : isConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="capitalize font-medium text-slate-300 font-mono">
              {callState === 'speaking' ? `${interviewerName} Speaking` : callState === 'listening' ? 'Listening to You...' : isConnected ? 'Voice & Text Active' : 'Ready to Start'}
            </span>
          </div>
        </div>

        {/* Top Right Executive Controls */}
        <div className="flex items-center gap-4">
          
          {/* Candidate Dossier Badge */}
          <div className="hidden xl:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-slate-300">
            <div className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-400/50 flex items-center justify-center text-indigo-300 font-bold text-[10px]">
              {candidateName.charAt(0)}
            </div>
            <div>
              <span className="font-semibold text-white block leading-tight">{candidateName}</span>
              <span className="text-[10px] text-slate-500 font-mono">Candidate ID #{token.slice(0, 6).toUpperCase()}</span>
            </div>
          </div>

          {/* Multi-Modal Stage Switcher (Voice / Code / Split) */}
          <div className="flex items-center p-1 bg-slate-900/90 border border-slate-800 rounded-2xl text-xs font-mono">
            <button
              type="button"
              onClick={() => setViewMode('voice')}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'voice'
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Voice-to-Voice Stage View"
            >
              <Radio className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Voice Stage</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('code')}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'code'
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Live Code Sandbox & Pair-Programming"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Code Sandbox</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Side-by-Side Split View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Split View</span>
            </button>
          </div>

          {/* AI Proctoring Live Integrity Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono">
            <ShieldCheck className={`w-3.5 h-3.5 ${proctoringScore >= 85 ? 'text-emerald-400' : proctoringScore >= 70 ? 'text-amber-400' : 'text-rose-400'}`} />
            <span className="text-white font-bold">{proctoringScore}%</span>
            <span className="text-[10px] text-slate-500">Integrity</span>
          </div>

          {/* Session Timer */}
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-amber-300 text-xs font-mono font-bold tracking-wider shadow-inner">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>{formatTime(timeLeft)}</span>
            <span className="text-slate-500 font-normal">/ 15:00</span>
          </div>

          {/* End Interview */}
          <button
            onClick={handleEndInterview}
            disabled={isEnding}
            className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-semibold font-mono transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>{isEnding ? 'Finalizing...' : 'End Session'}</span>
          </button>
        </div>
      </header>

      {/* Main Multi-Modal Interview Stage */}
      <div className="flex-1 grid grid-cols-12 gap-6 p-6 md:p-8 max-w-[1800px] w-full mx-auto">
        
        {/* ========================================================================= */}
        {/* MODE 1: LIVE CODE SANDBOX (8 cols Code + 4 cols Compact Voice & Transcript) */}
        {/* ========================================================================= */}
        {viewMode === 'code' && (
          <>
            {/* Live Code Sandbox (8 cols) */}
            <div className="col-span-12 lg:col-span-8 min-h-[640px]">
              <LiveCodeSandbox
                onCodeAnalyzed={handleCodeAnalyzed}
                onCodeChange={handleCodeChange}
              />
            </div>

            {/* Compact Voice & Transcript Sidebar (4 cols) */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
              
              {/* Compact Voice Status Card */}
              <div className="p-4 rounded-3xl bg-gradient-to-b from-[#0D121F] to-[#090D17] border border-slate-800/80 shadow-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border transition-all ${
                    callState === 'speaking'
                      ? 'bg-emerald-600/30 border-emerald-400/50 text-emerald-300 shadow-lg shadow-emerald-500/20'
                      : callState === 'listening'
                      ? 'bg-indigo-600/30 border-indigo-400/50 text-indigo-300 shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
                  }`}>
                    {callState === 'speaking' ? <Volume2 className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">{interviewerName}</span>
                      <span className="text-[10px] font-mono text-indigo-400 px-1.5 py-0.2 rounded bg-indigo-500/10 border border-indigo-500/20">AI</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 block">
                      {callState === 'speaking' ? 'Speaking to you...' : callState === 'listening' ? 'Listening...' : isConnected ? 'Voice Connected' : 'Ready'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleMute}
                    className={`p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                      isMuted ? 'bg-rose-500/20 border-rose-500/50 text-rose-300' : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                    title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                  >
                    {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  {!isConnected && (
                    <button
                      type="button"
                      id="code-start-voice-interview-btn"
                      onClick={handleStartInterview}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-mono text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-1.5 animate-pulse"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Start Voice</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Sidebar Transcripts */}
              <div className="flex-1 flex flex-col bg-gradient-to-b from-[#0D121F] to-[#090D17] border border-slate-800/80 rounded-3xl p-5 shadow-2xl justify-between min-h-[500px]">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 text-xs font-mono">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-indigo-400" /> Live Turns
                    </span>
                    <span className="text-slate-500">{transcripts.length} Turns</span>
                  </div>

                  <div className="overflow-y-auto space-y-2.5 py-3 max-h-[380px] scrollbar-thin">
                    {transcripts.length === 0 ? (
                      <div className="py-12 text-center text-slate-500 font-mono text-xs">
                        <Terminal className="w-8 h-8 opacity-40 mx-auto mb-2" />
                        <p>Voice conversation & AI code review follow-ups will appear here.</p>
                      </div>
                    ) : (
                      transcripts.map((t, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-2xl text-xs ${
                            t.speaker === 'ai' ? 'bg-slate-800/40 border border-slate-700/50 text-slate-200' : 'bg-indigo-600/15 border border-indigo-500/30 text-indigo-100'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                            <span className={t.speaker === 'ai' ? 'text-emerald-400 font-bold' : 'text-indigo-400 font-bold'}>
                              {t.speaker === 'ai' ? interviewerName : candidateName}
                            </span>
                            <span>{t.timestamp}</span>
                          </div>
                          <p className="text-[12px] leading-relaxed">{t.text}</p>
                        </div>
                      ))
                    )}
                    <div ref={transcriptEndRef} />
                  </div>
                </div>

                {/* Hybrid text input */}
                <form onSubmit={handleSendTextResponse} className="pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-2 bg-[#0B0F19] border border-slate-800 rounded-2xl p-1 focus-within:border-indigo-500/60">
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Type response to AI... (↵)"
                      className="flex-1 bg-transparent px-3 py-1.5 text-xs text-white outline-none"
                    />
                    <button type="submit" disabled={!textInput.trim()} className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-30 cursor-pointer">
                      <Send className="w-3 h-3" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* MODE 2: SPLIT SCREEN (6 cols Voice Hub + 6 cols Code Sandbox)             */}
        {/* ========================================================================= */}
        {viewMode === 'split' && (
          <>
            {/* Left Side: Voice Stage Hub with Compact Visualizer (6 cols) */}
            <div className="col-span-12 lg:col-span-6 flex flex-col justify-between bg-gradient-to-b from-[#0D121F] to-[#090D17] border border-slate-800/80 rounded-3xl p-6 backdrop-blur-2xl shadow-2xl min-h-[640px]">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 text-xs font-mono">
                <span className="text-indigo-300 font-bold flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-indigo-400" /> {department} Stage
                </span>
                <span className="text-slate-400">{jobTitle}</span>
              </div>

              {/* Central Equalizer Avatar */}
              <div className="flex flex-col items-center justify-center my-6">
                <div className={`w-28 h-28 rounded-full border border-indigo-400/40 flex items-center justify-center backdrop-blur-xl shadow-2xl transition-all ${
                  callState === 'speaking' ? 'scale-105 border-emerald-400/60 shadow-[0_0_60px_rgba(16,185,129,0.3)]' : 'border-indigo-500/30'
                }`}>
                  {callState === 'speaking' ? (
                    <Volume2 className="w-10 h-10 text-emerald-400 animate-pulse" />
                  ) : callState === 'listening' ? (
                    <Mic className="w-10 h-10 text-indigo-400 animate-pulse" />
                  ) : (
                    <Bot className="w-10 h-10 text-indigo-300" />
                  )}
                </div>
                <span className="mt-3 text-xs font-mono text-slate-300 capitalize font-semibold">
                  {callState === 'speaking' ? `${interviewerName} Speaking...` : callState === 'listening' ? 'Listening to You...' : 'Voice Stream Active'}
                </span>
              </div>

              {/* Split-mode Transcript Snippet */}
              <div className="flex-1 bg-[#07090F]/90 border border-slate-800/80 rounded-2xl p-3 overflow-y-auto max-h-[220px] mb-4 text-xs font-mono space-y-2">
                {transcripts.slice(-4).map((t, i) => (
                  <div key={i} className="p-2 rounded-xl bg-slate-800/40 text-[11px]">
                    <span className={t.speaker === 'ai' ? 'text-emerald-400 font-bold block' : 'text-indigo-400 font-bold block'}>
                      {t.speaker === 'ai' ? interviewerName : 'You'}:
                    </span>
                    <span className="text-slate-300">{t.text}</span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleToggleMute}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                    isMuted ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-slate-800 text-slate-200 border border-slate-700'
                  }`}
                >
                  {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span>{isMuted ? 'Unmute' : 'Mute'}</span>
                </button>
                {!isConnected && (
                  <button
                    type="button"
                    id="split-start-voice-interview-btn"
                    onClick={handleStartInterview}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs font-mono font-bold shadow-lg shadow-emerald-500/30 cursor-pointer transition-all flex items-center gap-2 animate-pulse"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Begin AI Interview</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right Side: Code Sandbox (6 cols) */}
            <div className="col-span-12 lg:col-span-6 min-h-[640px]">
              <LiveCodeSandbox
                onCodeAnalyzed={handleCodeAnalyzed}
                onCodeChange={handleCodeChange}
              />
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* MODE 3: STANDARD IMMERSIVE VOICE STAGE (7 cols Stage + 5 cols Transcript)  */}
        {/* ========================================================================= */}
        {viewMode === 'voice' && (
          <>
            {/* Left Side: Enterprise Stage Hub (7 cols) */}
            <div className="col-span-12 lg:col-span-7 flex flex-col justify-between bg-gradient-to-b from-[#0D121F] to-[#090D17] border border-slate-800/80 rounded-3xl p-8 backdrop-blur-2xl relative overflow-hidden shadow-2xl min-h-[620px]">
              
              {/* Ambient Lighting */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />

              {/* Header Metadata Bar */}
              <div className="flex flex-col gap-3 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium font-mono flex items-center gap-1.5 shadow-sm">
                      <Award className="w-3.5 h-3.5 text-indigo-400" /> {department} Assessment Suite
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-300 text-xs font-mono">
                      {experienceLevel} • {jobLocation}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Biometrics & Audio Encrypted</span>
                  </div>
                </div>

                {/* Evaluated Competencies Tag Cloud */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[11px] font-mono text-slate-500 mr-1">Evaluated Skills:</span>
                  {skillsArray.slice(0, 5).map((skill: string, idx: number) => (
                    <span key={idx} className="px-2.5 py-0.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-300">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Central AI Voice Visualizer Hub + Interviewer Profile */}
              <div className="flex flex-col items-center justify-center my-auto py-8 z-10">
                
                {/* Visualizer Pulsing Rings */}
                <div 
                  className={`relative flex items-center justify-center mb-6 ${!isConnected ? 'cursor-pointer group' : ''}`}
                  onClick={!isConnected ? handleStartInterview : undefined}
                  title={!isConnected ? "Click to begin voice interview" : undefined}
                >
                  <div className={`w-56 h-56 rounded-full border border-indigo-500/20 flex items-center justify-center transition-all duration-700 ${callState === 'speaking' ? 'scale-110 border-indigo-500/50 shadow-[0_0_100px_rgba(99,102,241,0.4)]' : isConnected ? 'border-emerald-500/30' : 'group-hover:border-emerald-500/40'}`}>
                    <div className={`w-44 h-44 rounded-full border border-indigo-400/30 flex items-center justify-center transition-all duration-500 ${callState === 'listening' ? 'scale-105 border-emerald-500/50 shadow-[0_0_80px_rgba(16,185,129,0.35)]' : 'group-hover:border-emerald-400/50'}`}>
                      <div className={`w-32 h-32 rounded-full bg-gradient-to-tr backdrop-blur-2xl flex flex-col items-center justify-center border shadow-2xl transition-all duration-500 ${
                        callState === 'speaking' 
                          ? 'from-emerald-600/30 to-teal-600/30 border-emerald-400/50' 
                          : callState === 'listening'
                          ? 'from-indigo-600/40 to-purple-600/40 border-indigo-400/60'
                          : !isConnected
                          ? 'from-emerald-600/25 to-teal-600/25 border-emerald-500/40 group-hover:scale-105 group-hover:shadow-[0_0_40px_rgba(16,185,129,0.3)]'
                          : 'from-indigo-600/20 to-purple-600/20 border-indigo-500/30'
                      }`}>
                        {callState === 'speaking' ? (
                          <Volume2 className="w-12 h-12 text-emerald-400 scale-110 animate-bounce" />
                        ) : callState === 'listening' ? (
                          <Mic className="w-12 h-12 text-indigo-400 animate-pulse" />
                        ) : !isConnected ? (
                          <PhoneCall className="w-12 h-12 text-emerald-400 animate-pulse" />
                        ) : (
                          <Bot className="w-12 h-12 text-indigo-300" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interviewer Persona Card */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-white tracking-tight">Sarvam AI Technical Screener</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Official Sarvam Conversational Agent
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono max-w-sm mx-auto leading-relaxed">
                    Lead Technical Interviewer for {companyName} • Powered by Sarvam Conversational AI Voice Engine.
                  </p>
                </div>

                {/* Prominent Center Stage BEGIN INTERVIEW Button */}
                <div className="mt-5 mb-2 flex flex-col items-center justify-center z-20">
                  {!isSarvamCallActive ? (
                    <button
                      type="button"
                      id="stage-start-voice-interview-btn"
                      onClick={handleStartInterview}
                      disabled={isSarvamConnecting}
                      className="px-10 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-base font-mono tracking-wider shadow-[0_0_45px_rgba(16,185,129,0.55)] hover:shadow-[0_0_60px_rgba(16,185,129,0.75)] flex items-center gap-3 cursor-pointer transition-all transform hover:scale-105 active:scale-95 animate-pulse disabled:opacity-60"
                    >
                      <PhoneCall className="w-6 h-6 animate-pulse" />
                      <span>{isSarvamConnecting ? 'CONNECTING SARVAM AI...' : 'BEGIN INTERVIEW'}</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="px-5 py-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/10">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                        <span>SARVAM VOICE CALL ACTIVE</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleStopSarvamCall}
                        className="px-4 py-2.5 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <PhoneOff className="w-4 h-4" />
                        <span>End Call</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Real-time Frequency Waveform Bars */}
                <div className="flex items-center justify-center gap-1.5 h-10 mt-4 px-6 py-2 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                  {[40, 75, 55, 90, 100, 65, 80, 45, 95, 60, 30, 85, 70, 40].map((h, i) => (
                    <div
                      key={i}
                      className={`w-1.5 rounded-full transition-all duration-150 ${
                        callState === 'speaking'
                          ? 'bg-gradient-to-t from-emerald-500 to-teal-400 animate-pulse'
                          : callState === 'listening'
                          ? 'bg-gradient-to-t from-indigo-500 to-purple-400 animate-pulse'
                          : isConnected
                          ? 'bg-indigo-500/40'
                          : 'bg-slate-700'
                      }`}
                      style={{
                        height: isConnected ? `${Math.max(15, (h * (callState !== 'idle' ? 1 : 0.3)))}%` : '20%',
                        animationDelay: `${i * 60}ms`
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Bottom Interactive Voice Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-800/80 z-10">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {!isSarvamCallActive ? (
                    <button
                      type="button"
                      id="bottom-begin-interview-btn"
                      onClick={handleStartInterview}
                      disabled={isSarvamConnecting}
                      className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-sm font-mono shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60"
                    >
                      <PhoneCall className="w-4 h-4 animate-pulse" />
                      <span>{isSarvamConnecting ? 'Connecting Sarvam...' : 'Begin AI Interview'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleToggleMute}
                      className={`w-full sm:w-auto px-5 py-3 rounded-2xl border text-xs font-mono font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isMuted 
                          ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-lg shadow-rose-500/10' 
                          : 'bg-slate-800/90 hover:bg-slate-700/90 border-slate-700 text-slate-200'
                      }`}
                    >
                      {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      <span>{isMuted ? 'Microphone Muted' : 'Mute Mic'}</span>
                    </button>
                  )}

                  {/* Switch to Code Sandbox Shortcut */}
                  <button
                    onClick={() => setViewMode('code')}
                    className="hidden sm:flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-semibold transition-all cursor-pointer"
                  >
                    <Code2 className="w-4 h-4" />
                    <span>Open Code Sandbox</span>
                  </button>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono text-slate-300 font-semibold block">
                    {callState === 'speaking' ? 'AI Voice Synthesizing...' : callState === 'listening' ? 'Transcribing your audio...' : isConnected ? 'Voice Connected' : 'Ready'}
                  </span>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {callState === 'speaking' 
                      ? 'Listen to question or interrupt anytime' 
                      : callState === 'listening' 
                      ? 'Speak clearly into your microphone' 
                      : 'Two-way voice active • Speak naturally or type in the transcript panel.'}
                  </p>
                </div>
              </div>

              {/* Bottom Security Info */}
              <div className="p-4 rounded-2xl bg-[#07090F]/90 border border-slate-800/80 text-xs text-slate-400 flex items-center justify-between shadow-inner z-10 mt-4">
                <span className="flex items-center gap-2 font-mono">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Continuous Multi-Modal Voice & Text Synthesis Active
                </span>
                <span className="text-slate-500 font-medium font-mono flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Powered by Sarvam Voice AI Engine
                </span>
              </div>
            </div>

            {/* Right Side: Live Turn-by-Turn Transcript & Text Response Terminal (5 cols) */}
            <div className="col-span-12 lg:col-span-5 flex flex-col bg-gradient-to-b from-[#0D121F] to-[#090D17] border border-slate-800/80 rounded-3xl p-6 backdrop-blur-2xl shadow-2xl min-h-[620px] justify-between">
              
              {/* Header */}
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                    <h2 className="text-sm font-semibold text-white tracking-wide font-mono">LIVE TURN TRANSCRIPT</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyTranscript}
                      disabled={transcripts.length === 0}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400 hover:text-white transition-colors flex items-center gap-1 disabled:opacity-40"
                      title="Copy full transcript"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                    <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono font-medium text-slate-400">
                      {transcripts.length} Turns
                    </span>
                  </div>
                </div>

                {/* Scrollable Transcript Stream */}
                <div className="overflow-y-auto space-y-3.5 py-4 pr-1 min-h-[380px] max-h-[460px] scrollbar-thin scrollbar-thumb-slate-800">
                  {transcripts.length === 0 ? (
                    <div className="h-full min-h-[340px] flex flex-col items-center justify-center text-center p-8 text-slate-500">
                      <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3 text-slate-500">
                        <Terminal className="w-6 h-6 opacity-60" />
                      </div>
                      <p className="text-sm font-medium text-slate-300">Ready for Assessment</p>
                      <p className="text-xs text-slate-500 mt-1.5 max-w-xs leading-relaxed font-mono">
                        Click "Begin AI Interview" to start. Spoken turns from {interviewerName} and your responses will appear here in real-time.
                      </p>
                    </div>
                  ) : (
                    transcripts.map((t, index) => (
                      <div
                        key={index}
                        className={`flex flex-col gap-1.5 p-4 rounded-2xl text-xs transition-all shadow-sm ${
                          t.speaker === 'ai'
                            ? 'bg-slate-800/40 border border-slate-700/50 text-slate-200 mr-4'
                            : 'bg-indigo-600/15 border border-indigo-500/30 text-indigo-100 ml-4'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] font-medium">
                          <span className={`flex items-center gap-1.5 font-semibold font-mono ${t.speaker === 'ai' ? 'text-emerald-400' : 'text-indigo-400'}`}>
                            {t.speaker === 'ai' ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                            {t.speaker === 'ai' ? `${interviewerName} (AI Interviewer)` : `${candidateName} (You)`}
                          </span>
                          <span className="text-slate-500 font-mono text-[10px]">{t.timestamp}</span>
                        </div>
                        <p className="mt-1 leading-relaxed text-[13px] text-slate-200 font-normal">{t.text}</p>
                      </div>
                    ))
                  )}
                  <div ref={transcriptEndRef} />
                </div>
              </div>

              {/* Bottom Hybrid Text Response Terminal */}
              <form onSubmit={handleSendTextResponse} className="pt-3 border-t border-slate-800/80">
                <div className="flex items-center gap-2 bg-[#0B0F19] border border-slate-800 rounded-2xl p-1.5 focus-within:border-indigo-500/60 shadow-inner">
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Type your response or paste code/links... (Press Enter ↵)"
                    className="flex-1 bg-transparent px-3 py-2 text-xs font-sans text-white placeholder:text-slate-500 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!textInput.trim()}
                    className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:hover:bg-indigo-600 transition-all cursor-pointer shadow-md shadow-indigo-600/20"
                    title="Send text response"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between px-2 pt-1.5 text-[10px] font-mono text-slate-500">
                  <span>💡 Tip: You can speak or type your answers simultaneously.</span>
                  <span>Hybrid Mode Active</span>
                </div>
              </form>

            </div>
          </>
        )}

      </div>

      {/* Real-time AI Proctoring & Anti-Cheat Suite Overlay */}
      <AIProctoringOverlay
        sessionToken={token}
        onIntegrityChange={(score, inf) => {
          setProctoringScore(score);
          setTotalInfractions(inf);
        }}
      />
    </div>
  );
};

export default VoiceInterviewRoomPage;
