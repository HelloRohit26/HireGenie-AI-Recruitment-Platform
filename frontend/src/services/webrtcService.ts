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

// Native Web Audio Buffer Queue for Real-Time Binary PCM Streaming (Zero Glitch)
export class NativeStreamAudioPlayer {
  private ctx: AudioContext | null = null;
  private nextPlayTime = 0;
  private activeNodes: AudioBufferSourceNode[] = [];
  private sampleRate = 16000;

  constructor() {
    if (typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx({ sampleRate: this.sampleRate });
      }
    }
  }

  public async resume(): Promise<void> {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public playRawBytes(arrayBuffer: ArrayBuffer): void {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx({ sampleRate: this.sampleRate });
      }
    }
    if (!this.ctx) return;
    this.resume();

    // 16-bit PCM to Float32 conversion
    const int16 = new Int16Array(arrayBuffer);
    if (int16.length === 0) return;

    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768.0;
    }

    const buffer = this.ctx.createBuffer(1, float32.length, this.sampleRate);
    buffer.getChannelData(0).set(float32);

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.ctx.destination);

    const currentTime = this.ctx.currentTime;
    
    // Agar queue piche chhoot gayi ho toh small 30ms pre-buffer rakho taaki audio na kate
    if (this.nextPlayTime < currentTime) {
      this.nextPlayTime = currentTime + 0.03;
    }

    source.start(this.nextPlayTime);
    this.nextPlayTime += buffer.duration;

    this.activeNodes.push(source);
    source.onended = () => {
      this.activeNodes = this.activeNodes.filter((n) => n !== source);
    };
  }

  public pushChunk(base64OrBuffer: string | ArrayBuffer): void {
    if (base64OrBuffer instanceof ArrayBuffer) {
      this.playRawBytes(base64OrBuffer);
    } else if (typeof base64OrBuffer === 'string') {
      const buf = base64ToArrayBuffer(base64OrBuffer);
      this.playRawBytes(buf);
    }
  }

  public playChunk(data: string | ArrayBuffer): void {
    this.pushChunk(data);
  }

  public queueChunk(data: string | ArrayBuffer): void {
    this.pushChunk(data);
  }

  public stop(): void {
    this.activeNodes.forEach((node) => {
      try {
        node.stop();
      } catch (e) {}
    });
    this.activeNodes = [];
    if (this.ctx) {
      this.nextPlayTime = this.ctx.currentTime;
    }
  }

  public stopAll(): void {
    this.stop();
  }

  public getIsPlaying(): boolean {
    return this.activeNodes.length > 0;
  }

  public destroy(): void {
    this.stop();
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close();
      this.ctx = null;
    }
  }

  public getContext(): AudioContext | null {
    return this.ctx;
  }
}

export const nativePlayer = new NativeStreamAudioPlayer();
export const streamPlayer = nativePlayer;
export const audioPlayer = nativePlayer;
export const voicePlayer = nativePlayer;
export const ContinuousAudioStreamer = NativeStreamAudioPlayer;
export const SmoothVoicePlayer = NativeStreamAudioPlayer;
export const StreamAudioPlayer = NativeStreamAudioPlayer;

// Utility: Convert ArrayBuffer to Base64
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Utility: Convert Base64 to ArrayBuffer
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const cleanB64 = base64.includes(',') ? base64.split(',')[1] : base64;
  const binaryString = atob(cleanB64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Standalone helper: Send 16kHz PCM audio chunk over WebSocket (Direct Binary ArrayBuffer)
export function sendAudioChunk(ws: WebSocket | null, pcmData: ArrayBuffer): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    // Send direct binary frame (Zero JSON latency)
    ws.send(pcmData);
  }
}

// Utility: Downsample Float32 input audio to 16kHz 16-bit linear PCM ArrayBuffer
export function downsampleTo16kPCM(inputData: Float32Array, inputSampleRate: number): ArrayBuffer {
  if (inputSampleRate === 16000) {
    const pcm16 = new Int16Array(inputData.length);
    for (let i = 0; i < inputData.length; i++) {
      const s = Math.max(-1, Math.min(1, inputData[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return pcm16.buffer;
  }

  const ratio = inputSampleRate / 16000;
  const newLength = Math.round(inputData.length / ratio);
  const pcm16 = new Int16Array(newLength);
  let offsetResult = 0;
  let offsetInput = 0;

  while (offsetResult < newLength) {
    const nextOffsetInput = Math.round((offsetResult + 1) * ratio);
    let sum = 0;
    let count = 0;
    for (let i = offsetInput; i < nextOffsetInput && i < inputData.length; i++) {
      sum += inputData[i];
      count++;
    }
    const avg = count > 0 ? sum / count : 0;
    const s = Math.max(-1, Math.min(1, avg));
    pcm16[offsetResult] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    offsetResult++;
    offsetInput = nextOffsetInput;
  }
  return pcm16.buffer;
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

      // Request microphone access with Echo Cancellation & noise suppression enabled
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          this.localStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              channelCount: 1,
              sampleRate: 16000,
              echoCancellation: true, // Prevents speaker audio from looping back
              noiseSuppression: true,
              autoGainControl: true,
            },
            video: false,
          });
          this.setupAudioPipeline(this.localStream);
        } catch (initialMicErr: any) {
          console.warn('[HireGenie WebRTC] Trying fallback audio constraints...', initialMicErr);
          try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },
              video: false,
            });
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
      this.socket.binaryType = 'arraybuffer'; // Enable raw binary audio frame streaming
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
      // 1. Direct raw audio binary chunk from Sarvam AI agent (ArrayBuffer)
      if (event.data instanceof ArrayBuffer) {
        this.isAudioPlaying = true;
        this.updateVoiceState('AI_SPEAKING');
        if (this.options.onAudioPlaybackStart) {
          this.options.onAudioPlaybackStart();
        }
        nativePlayer.playRawBytes(event.data);
        return;
      }

      // 2. Text / JSON control & signaling messages
      if (typeof event.data === 'string') {
        try {
          const data = JSON.parse(event.data);

          // Real-time AI Audio Chunk Streaming (Fallback if base64 text)
          if (data.type === 'ai_audio_chunk' && data.audio_base64) {
            const pcmBuf = base64ToArrayBuffer(data.audio_base64);
            this.isAudioPlaying = true;
            this.updateVoiceState('AI_SPEAKING');
            nativePlayer.playRawBytes(pcmBuf);
          }
          // Barge-in Acknowledgment
          else if (data.type === 'barge_in_acknowledged') {
            nativePlayer.stop();
            this.stopCurrentPlayback();
          }
          // Connection & Welcome
          else if (data.type === 'connected') {
            this.updateState('connected');
          }
          // Standard / Complete AI Speech Turn
          else if (data.type === 'ai_speech') {
            const respId = data.response_id || data.text;
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
                text: data.text,
                response_id: data.response_id,
                question_index: data.question_index,
                total_questions: data.total_questions,
                question_text: data.question_text || data.text,
                competency_focus: data.competency_focus,
                question_type: data.question_type,
                current_difficulty: data.current_difficulty,
                interview_completed: data.interview_completed,
                audio_base64: data.audio_base64,
                audio_format: data.audio_format,
                voice_provider: data.voice_provider,
                speaker_name: data.speaker
              });
            }

            // Play Sarvam AI TTS Audio if provided as audio turn
            if (data.audio_base64) {
              const pcmBuf = base64ToArrayBuffer(data.audio_base64);
              this.isAudioPlaying = true;
              this.updateVoiceState('AI_SPEAKING');
              nativePlayer.playRawBytes(pcmBuf);
            } else {
              setTimeout(() => {
                this.onAISpeechFinished();
              }, 2500);
            }
          }
          // Session End
          else if (data.type === 'interview_completed') {
            this.updateVoiceState('COMPLETED');
            if (this.options.onInterviewCompleted) {
              this.options.onInterviewCompleted();
            }
          }
          // WebRTC SDP Offer / Candidate Exchange
          else if (data.type === 'offer' && this.peerConnection) {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            this.socket?.send(JSON.stringify({ type: 'answer', sdp: answer }));
          } else if (data.type === 'candidate' && this.peerConnection) {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
          } else if (data.type === 'error') {
            console.error('[HireGenie WebRTC] Server error:', data.message);
            this.updateState('failed');
          }
        } catch (e) {
          console.error('[HireGenie WebRTC] Signaling parse error:', e);
        }
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
      console.log('🎙️ [AUTOMATIC LISTENING] Microphone active and streaming candidate voice...');
    }

    if (this.options.onAudioPlaybackEnd) {
      this.options.onAudioPlaybackEnd();
    }
  }

  /**
   * Immediately stops active audio playback (Barge-in / Candidate Interrupt)
   */
  public stopCurrentPlayback(): void {
    // 1. Stop nativePlayer queue
    nativePlayer.stop();

    // 2. Stop HTMLAudioElement if any is active
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement = null;
    }

    this.isAudioPlaying = false;
    if (this.voiceState !== 'COMPLETED') {
      this.updateVoiceState('LISTENING');
    }
    console.log('⚡ [HireGenie Voice] Active audio playback stopped immediately.');
  }

  /**
   * Barge-in handler: Candidate interrupts AI while AI is speaking
   */
  public triggerBargeIn(): void {
    if (this.isAudioPlaying || nativePlayer.getIsPlaying()) {
      console.log('⚡ [BARGE-IN] Candidate interrupted AI audio playback.');
      this.stopCurrentPlayback();

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
   * Decodes Base64 audio chunk or ArrayBuffer and feeds it into the NativeStreamAudioPlayer queue
   */
  public playAudioChunk(audioData: string | ArrayBuffer): void {
    try {
      this.isAudioPlaying = true;
      this.updateVoiceState('AI_SPEAKING');

      if (this.options.onAudioPlaybackStart) {
        this.options.onAudioPlaybackStart();
      }

      nativePlayer.pushChunk(audioData);
    } catch (err) {
      console.error('[HireGenie Voice] playAudioChunk error:', err);
    }
  }

  /**
   * Helper: Sends continuous 16kHz PCM audio chunk over WebSocket
   */
  public sendAudioChunk(ws: WebSocket | null, pcmData: ArrayBuffer): void {
    sendAudioChunk(ws, pcmData);
  }

  /**
   * Sets up AudioContext, ScriptProcessor PCM recorder, and continuous VAD analyzer
   */
  private setupAudioPipeline(stream: MediaStream): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!this.audioContext || this.audioContext.state === 'closed') {
        this.audioContext = new AudioCtx();
      }
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      // Setup ScriptProcessor for continuous 16kHz PCM streaming to Sarvam Voice Agent
      const bufferSize = 4096;
      this.processorNode = this.audioContext.createScriptProcessor(bufferSize, 1, 1);
      
      this.processorNode.onaudioprocess = (e) => {
        if (this.isMuted) return;

        // Silence Microphone While AI Speaks: Pause sending candidate mic frames while the AI agent is actively outputting speech chunks
        const isAiSpeaking = audioPlayer.getIsPlaying() || this.voiceState === 'AI_SPEAKING';
        if (isAiSpeaking) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const inputSampleRate = this.audioContext?.sampleRate || 16000;

        // Continuous streaming when active or listening
        if (
          this.voiceState === 'LISTENING' ||
          this.voiceState === 'CANDIDATE_SPEAKING' ||
          this.voiceState === 'IDLE'
        ) {
          // Downsample input data to 16kHz 16-bit linear PCM
          const pcm16Data = downsampleTo16kPCM(inputData, inputSampleRate);

          // Stream continuous 16kHz PCM chunk to backend WebSocket
          this.sendAudioChunk(this.socket, pcm16Data);
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
        if (
          this.autoListeningEnabled &&
          (this.voiceState === 'LISTENING' || this.voiceState === 'CANDIDATE_SPEAKING') &&
          !this.isMuted
        ) {
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

            if (silenceDuration >= this.endOfTurnSilenceMs && totalSpeechDuration >= this.minSpeechDurationMs) {
              console.log(`🎙️ [VAD TURN COMPLETE] Silence ${silenceDuration}ms detected.`);
              this.isCandidateSpeaking = false;
              this.speakingStartTime = null;
              this.lastSoundDetectedTime = null;
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
    this.stopCurrentPlayback();
    streamPlayer.destroy();
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
    if (this.audioContext && this.audioContext.state !== 'closed') {
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

