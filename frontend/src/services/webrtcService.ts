/**
 * HireGenie AI - Real-Time WebRTC & Continuous Voice AI Audio Transport Service
 * Manages WebSocket signaling, microphone stream, continuous Voice Activity Detection (VAD),
 * automatic turn taking, silence detection, barge-in cancellation, and single audio playback guarantee.
 */

export type WebRTCConnectionState = 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';

export type VoiceInterviewerState = 'IDLE' | 'AI_SPEAKING' | 'LISTENING' | 'CANDIDATE_SPEAKING' | 'PROCESSING' | 'COMPLETED';

export interface AISpeechEvent {
  speaker: 'ai' | 'candidate';
  text: string;
  response_id?: string;
  question_index?: number;
  total_questions?: number;
  question_text?: string;
  competency_focus?: string;
  question_type?: string;
  current_difficulty?: string;
  interview_completed?: boolean;
  audio_base64?: string;
  audio_format?: string;
  voice_provider?: string;
  speaker_name?: string;
}

export interface WebRTCOptions {
  token: string;
  signalingUrl?: string;
  onConnectionStateChange?: (state: WebRTCConnectionState) => void;
  onVoiceStateChange?: (state: VoiceInterviewerState) => void;
  onAudioLevelChange?: (level: number) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onAISpeech?: (event: AISpeechEvent) => void;
  onAudioPlaybackStart?: () => void;
  onAudioPlaybackEnd?: () => void;
  onCandidateSpeechDetected?: (textPreview?: string) => void;
  onInterviewCompleted?: () => void;
  onError?: (error: Error) => void;
}

// Utility: Encode Float32Array PCM samples into standard 16-bit mono WAV buffer
function encodeWAV(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono channel
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // Byte rate (sampleRate * 2)
  view.setUint16(32, 2, true); // Block align (1 * 2 bytes)
  view.setUint16(34, 16, true); // 16-bit
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return buffer;
}

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private socket: WebSocket | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private recordedSamples: Float32Array[] = [];
  
  // State Machine & Turn Management
  private voiceState: VoiceInterviewerState = 'IDLE';
  private currentAudioElement: HTMLAudioElement | null = null;
  private options: WebRTCOptions;
  private animationFrameId: number | null = null;
  private isReconnecting = false;
  private isMuted = false;

  // Single Audio Playback & Deduplication
  private playedResponseIds: Set<string> = new Set();
  private isAudioPlaying = false;

  // Voice Activity Detection (VAD) & Silence Detection Configuration
  private speechStartThreshold = 0.08; // Normalized RMS threshold to trigger speaking
  private silenceThreshold = 0.04;
  private endOfTurnSilenceMs = 1500; // 1.5 seconds silence to conclude candidate turn
  private minSpeechDurationMs = 700;  // Minimum speech duration to prevent false triggers
  private speakingStartTime: number | null = null;
  private lastSoundDetectedTime: number | null = null;
  private isCandidateSpeaking = false;
  private autoListeningEnabled = true;

  constructor(options: WebRTCOptions) {
    this.options = options;
  }

  private updateVoiceState(newState: VoiceInterviewerState): void {
    if (this.voiceState !== newState) {
      this.voiceState = newState;
      console.log(`[HireGenie Voice] State Transition -> ${newState}`);
      if (this.options.onVoiceStateChange) {
        this.options.onVoiceStateChange(newState);
      }
    }
  }

  private getSignalingUrl(): string {
    if (this.options.signalingUrl) {
      return this.options.signalingUrl;
    }

    if (typeof window !== 'undefined') {
      const isHttps = window.location.protocol === 'https:';
      const wsProtocol = isHttps ? 'wss:' : 'ws:';
      const hostname = window.location.hostname || 'localhost';
      
      const port = (window.location.port === '5173' || window.location.port === '3000' || window.location.port === '3001') 
        ? '8000' 
        : (window.location.port ? '8000' : '');

      const hostStr = port ? `${hostname}:${port}` : hostname;
      return `${wsProtocol}//${hostStr}/api/v1/interview/ws/${this.options.token}`;
    }

    return `ws://localhost:8000/api/v1/interview/ws/${this.options.token}`;
  }

  public async initialize(): Promise<void> {
    try {
      this.updateState('connecting');

      // Request microphone access
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          this.localStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            },
            video: false
          });
          this.setupAudioPipeline(this.localStream);
        } catch (initialMicErr: any) {
          console.warn('[HireGenie WebRTC] Trying fallback audio constraints...', initialMicErr);
          try {
            this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            this.setupAudioPipeline(this.localStream);
          } catch (basicMicErr: any) {
            console.warn('[HireGenie WebRTC] Microphone fallback initialized (silent stream):', basicMicErr);
            try {
              const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
              if (AudioCtx) {
                const ctx = new AudioCtx();
                const osc = ctx.createOscillator();
                const dst = ctx.createMediaStreamDestination();
                const gain = ctx.createGain();
                gain.gain.value = 0.0;
                osc.connect(gain);
                gain.connect(dst);
                osc.start();
                this.localStream = dst.stream;
              }
            } catch (fallbackErr) {
              console.warn('[HireGenie WebRTC] Synthetic audio stream note:', fallbackErr);
            }
          }
        }
      }

      const signalingUrl = this.getSignalingUrl();
      console.log(`[HireGenie WebRTC] Connecting WebSocket signaling to ${signalingUrl}`);

      this.socket = new WebSocket(signalingUrl);
      this.setupSocketListeners();

    } catch (err: any) {
      console.error('[HireGenie WebRTC] Initialization error:', err.message);
      this.updateState('failed');
      if (this.options.onError) {
        this.options.onError(err);
      }
    }
  }

  private createPeerConnection(): void {
    if (this.peerConnection) {
      this.peerConnection.close();
    }

    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    this.peerConnection = new RTCPeerConnection(configuration);

    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection) {
        const state = this.peerConnection.connectionState as WebRTCConnectionState;
        this.updateState(state);
      }
    };

    this.peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        if (this.options.onRemoteStream) {
          this.options.onRemoteStream(this.remoteStream);
        }
      }
    };

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });
    }
  }

  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      console.log('[HireGenie WebRTC] Signaling WebSocket open.');
      this.updateState('connected');
      this.createPeerConnection();
    };

    this.socket.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === 'connected') {
          this.updateState('connected');
        } else if (msg.type === 'ai_speech') {
          // CRITICAL: Prevent duplicate audio playback using unique response_id
          const respId = msg.response_id || msg.text;
          if (respId && this.playedResponseIds.has(respId)) {
            console.warn(`[HireGenie Voice] Dropping duplicate AI speech turn: ${respId}`);
            return;
          }
          if (respId) {
            this.playedResponseIds.add(respId);
          }

          if (this.options.onAISpeech) {
            this.options.onAISpeech({
              speaker: 'ai',
              text: msg.text,
              response_id: msg.response_id,
              question_index: msg.question_index,
              total_questions: msg.total_questions,
              question_text: msg.question_text || msg.text,
              competency_focus: msg.competency_focus,
              question_type: msg.question_type,
              current_difficulty: msg.current_difficulty,
              interview_completed: msg.interview_completed,
              audio_base64: msg.audio_base64,
              audio_format: msg.audio_format,
              voice_provider: msg.voice_provider,
              speaker_name: msg.speaker
            });
          }

          // Play Sarvam AI TTS Audio exactly once
          if (msg.audio_base64) {
            await this.playAudioBase64(msg.audio_base64, msg.audio_format || 'audio/wav');
          } else {
            // If no audio payload, automatically switch to listening mode after short delay
            setTimeout(() => {
              this.onAISpeechFinished();
            }, 2500);
          }
        } else if (msg.type === 'interview_completed') {
          this.updateVoiceState('COMPLETED');
          if (this.options.onInterviewCompleted) {
            this.options.onInterviewCompleted();
          }
        } else if (msg.type === 'barge_in_acknowledged') {
          this.updateVoiceState('LISTENING');
        } else if (msg.type === 'offer' && this.peerConnection) {
          await this.peerConnection.setRemoteDescription(new RTCSessionDescription(msg.sdp));
          const answer = await this.peerConnection.createAnswer();
          await this.peerConnection.setLocalDescription(answer);
          this.socket?.send(JSON.stringify({ type: 'answer', sdp: answer }));
        } else if (msg.type === 'candidate' && this.peerConnection) {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(msg.candidate));
        } else if (msg.type === 'error') {
          console.error('[HireGenie WebRTC] Server error:', msg.message);
          this.updateState('failed');
        }
      } catch (e) {
        console.error('[HireGenie WebRTC] Signaling parse error:', e);
      }
    };

    this.socket.onerror = (err) => {
      console.warn('[HireGenie WebRTC] WebSocket error occurred:', err);
      this.updateState('failed');
    };

    this.socket.onclose = () => {
      console.log('[HireGenie WebRTC] WebSocket connection closed');
      if (!this.isReconnecting) {
        this.updateState('disconnected');
      }
    };
  }

  /**
   * Called when AI finishes speaking its question/utterance.
   * Automatically transitions system into LISTENING mode (Zero button clicks needed).
   */
  private onAISpeechFinished(): void {
    this.isAudioPlaying = false;
    this.recordedSamples = [];
    this.isCandidateSpeaking = false;
    this.speakingStartTime = null;
    this.lastSoundDetectedTime = null;

    if (this.voiceState !== 'COMPLETED') {
      this.updateVoiceState('LISTENING');
      console.log('🎙️ [AUTOMATIC LISTENING] Microphone active and listening for candidate voice...');
    }

    if (this.options.onAudioPlaybackEnd) {
      this.options.onAudioPlaybackEnd();
    }
  }

  /**
   * Barge-in handler: Candidate interrupts AI while AI is speaking
   */
  public triggerBargeIn(): void {
    if (this.isAudioPlaying && this.currentAudioElement) {
      console.log('⚡ [BARGE-IN] Candidate interrupted AI audio playback.');
      this.currentAudioElement.pause();
      this.currentAudioElement = null;
      this.isAudioPlaying = false;

      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'barge_in' }));
      }

      this.updateVoiceState('CANDIDATE_SPEAKING');
      this.isCandidateSpeaking = true;
      this.speakingStartTime = Date.now();
      this.lastSoundDetectedTime = Date.now();
    }
  }

  /**
   * Plays Sarvam AI Audio returned via Base64 with single-instance guarantee
   */
  public playAudioBase64(base64Data: string, format = 'audio/wav'): Promise<void> {
    return new Promise((resolve) => {
      try {
        // Cancel any active audio playback to prevent overlapping / double audio
        if (this.currentAudioElement) {
          this.currentAudioElement.pause();
          this.currentAudioElement = null;
        }

        this.isAudioPlaying = true;
        this.updateVoiceState('AI_SPEAKING');

        const cleanB64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
        const audioSrc = `data:${format};base64,${cleanB64}`;
        const audio = new Audio(audioSrc);
        this.currentAudioElement = audio;

        if (this.options.onAudioPlaybackStart) {
          this.options.onAudioPlaybackStart();
        }

        audio.onended = () => {
          this.currentAudioElement = null;
          this.onAISpeechFinished();
          resolve();
        };

        audio.onerror = (err) => {
          console.warn('[HireGenie Voice] Audio playback note:', err);
          this.currentAudioElement = null;
          this.onAISpeechFinished();
          resolve();
        };

        audio.play().catch(e => {
          console.warn('[HireGenie Voice] Audio autoplay requires user interaction:', e);
          this.onAISpeechFinished();
          resolve();
        });
      } catch (err) {
        console.error('[HireGenie Voice] Audio playback error:', err);
        this.onAISpeechFinished();
        resolve();
      }
    });
  }

  /**
   * Sets up AudioContext, ScriptProcessor PCM recorder, and continuous VAD analyzer
   */
  private setupAudioPipeline(stream: MediaStream): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      // Setup ScriptProcessor for candidate PCM recording to Sarvam STT
      this.processorNode = this.audioContext.createScriptProcessor(4096, 1, 1);
      this.processorNode.onaudioprocess = (e) => {
        // Buffer PCM samples when in LISTENING or CANDIDATE_SPEAKING mode
        if (this.voiceState === 'LISTENING' || this.voiceState === 'CANDIDATE_SPEAKING') {
          if (!this.isMuted) {
            const inputData = e.inputBuffer.getChannelData(0);
            this.recordedSamples.push(new Float32Array(inputData));
          }
        }
      };
      source.connect(this.processorNode);
      this.processorNode.connect(this.audioContext.destination);

      // Continuous Voice Activity Detection (VAD) loop
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const vadLoop = () => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalizedLevel = Math.min(1.0, average / 128);

        if (this.options.onAudioLevelChange) {
          this.options.onAudioLevelChange(normalizedLevel);
        }

        const now = Date.now();

        // 1. Check for Barge-in during AI speech
        if (this.isAudioPlaying && normalizedLevel > this.speechStartThreshold * 1.5 && !this.isMuted) {
          this.triggerBargeIn();
        }

        // 2. Continuous VAD during candidate turns
        if (this.autoListeningEnabled && (this.voiceState === 'LISTENING' || this.voiceState === 'CANDIDATE_SPEAKING') && !this.isMuted) {
          if (normalizedLevel >= this.speechStartThreshold) {
            // Speech detected
            this.lastSoundDetectedTime = now;
            if (!this.isCandidateSpeaking) {
              this.isCandidateSpeaking = true;
              this.speakingStartTime = now;
              this.updateVoiceState('CANDIDATE_SPEAKING');
              if (this.options.onCandidateSpeechDetected) {
                this.options.onCandidateSpeechDetected();
              }
            }
          } else if (normalizedLevel < this.silenceThreshold && this.isCandidateSpeaking) {
            // Silence detected after speaking
            const silenceDuration = this.lastSoundDetectedTime ? (now - this.lastSoundDetectedTime) : 0;
            const totalSpeechDuration = this.speakingStartTime ? (now - this.speakingStartTime) : 0;

            // If silence exceeded threshold and candidate spoke long enough -> end turn automatically
            if (silenceDuration >= this.endOfTurnSilenceMs && totalSpeechDuration >= this.minSpeechDurationMs) {
              console.log(`🎙️ [VAD END OF TURN] Silence ${silenceDuration}ms detected -> Sending audio to Sarvam STT.`);
              this.finalizeAndSendCandidateAudio();
            }
          }
        }

        this.animationFrameId = requestAnimationFrame(vadLoop);
      };

      vadLoop();
    } catch (e) {
      console.warn('[HireGenie WebRTC] Audio pipeline init warning:', e);
    }
  }

  /**
   * Finalizes candidate recorded audio buffer, encodes to WAV, and sends to Sarvam STT via WebSocket
   */
  public finalizeAndSendCandidateAudio(): void {
    if (this.recordedSamples.length === 0) {
      this.isCandidateSpeaking = false;
      return;
    }

    this.updateVoiceState('PROCESSING');
    this.isCandidateSpeaking = false;
    this.speakingStartTime = null;
    this.lastSoundDetectedTime = null;

    let totalLength = 0;
    for (const chunk of this.recordedSamples) {
      totalLength += chunk.length;
    }

    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of this.recordedSamples) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    const sampleRate = this.audioContext?.sampleRate || 16000;
    const wavBuffer = encodeWAV(merged, sampleRate);
    
    let binary = '';
    const bytes = new Uint8Array(wavBuffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64Audio = btoa(binary);

    console.log(`[HireGenie Voice] Transmitting candidate voice (${base64Audio.length} b64 chars) to Sarvam STT...`);
    
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'candidate_audio',
        audio_base64: base64Audio
      }));
    }

    this.recordedSamples = [];
  }

  /**
   * Manual override: send candidate speech text
   */
  public sendCandidateSpeech(text: string): void {
    this.updateVoiceState('PROCESSING');
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'candidate_speech',
        text: text
      }));
    }
  }

  public sendEndInterview(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'end_interview'
      }));
    }
  }

  public toggleMute(muted: boolean): void {
    this.isMuted = muted;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
  }

  public async reconnect(): Promise<void> {
    this.isReconnecting = true;
    this.disconnect();
    this.isReconnecting = false;
    await this.initialize();
  }

  public disconnect(): void {
    this.autoListeningEnabled = false;
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement = null;
    }
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.updateState('closed');
  }

  private updateState(state: WebRTCConnectionState): void {
    if (this.options.onConnectionStateChange) {
      this.options.onConnectionStateChange(state);
    }
  }
}
