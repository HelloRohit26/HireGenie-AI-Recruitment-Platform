import React, { useState, useEffect } from 'react';
import { TalentConstellation } from '../components/3d/TalentConstellation';
import { candidateService } from '../services/candidateService';

interface InterviewEntryPageProps {
  token?: string;
  onNavigate?: (route: string) => void;
}

export const InterviewEntryPage: React.FC<InterviewEntryPageProps> = ({
  token = 'demo-token',
  onNavigate
}) => {
  const [jobTitle, setJobTitle] = useState<string>('AI Engineer - Generative AI & LLMs (Fresher)');
  const [companyName, setCompanyName] = useState<string>('Sarvam AI');
  const [candidateName, setCandidateName] = useState<string>('Candidate');
  const [durationMinutes, setDurationMinutes] = useState<number>(15);

  useEffect(() => {
    if (token && token !== 'demo-token') {
      candidateService.getInvitationByToken(token).then((res) => {
        if (res.data) {
          if (res.data.job_title) setJobTitle(res.data.job_title);
          if (res.data.company) setCompanyName(res.data.company);
          if (res.data.candidate_name) setCandidateName(res.data.candidate_name);
          if (res.data.duration_minutes) setDurationMinutes(res.data.duration_minutes);
        }
      }).catch((e) => console.warn('Invitation fetch note:', e));
    }
  }, [token]);

  const handleStartVoiceInterview = () => {
    if (onNavigate) {
      onNavigate(`/interview/${token}/room?autostart=true`);
    }
  };

  const handleSetup = () => {
    if (onNavigate) {
      onNavigate(`/interview/${token}/prep`);
    }
  };

  return (
    <div className="bg-[#131311] text-[#E5E2DE] min-h-screen flex flex-col font-sans antialiased relative overflow-hidden">
      {/* Ambient WebGL Background */}
      <TalentConstellation opacity={0.3} />

      {/* Radial Glow Overlay */}
      <div className="absolute inset-0 bg-radial-gradient from-[#D6A85F]/5 via-transparent to-transparent pointer-events-none" />

      {/* Brand Header */}
      <header className="absolute top-0 left-0 w-full p-6 md:p-12 flex justify-center z-20">
        <div
          onClick={() => onNavigate?.('/candidate')}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-[#D6A85F] flex items-center justify-center font-bold text-sm text-[#11110F] shadow-md shadow-[#D6A85F]/20 group-hover:scale-105 transition-transform">
            HG
          </div>
          <span className="text-base font-bold text-[#F4F1E9] tracking-tight">HireGenie AI</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center relative w-full h-full px-4 py-20 z-10">
        <div className="w-full max-w-[500px] flex flex-col items-center animate-fadeIn space-y-6">
          
          {/* Header Icon & Title */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1F201E] border border-[#2A2A28] shadow-xl shadow-black/40 relative">
              <span className="material-symbols-outlined text-[#F4C377] text-3xl animate-pulse">mic</span>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#131311]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F4F1E9] tracking-tight">
              Your Voice Interview is Ready
            </h1>
            <p className="text-sm font-mono text-[#A1A19A] flex items-center justify-center gap-2 flex-wrap">
              <span>{candidateName}</span>
              <span className="text-[#2A2A28]">•</span>
              <span className="text-emerald-400 font-semibold">Shortlisted</span>
              <span className="text-[#2A2A28]">•</span>
              <span className="text-[#F4C377] font-semibold">{companyName}</span>
            </p>
            <div className="inline-block px-3 py-1 rounded-full bg-[#1F201E] border border-[#3A3A36] text-xs font-mono text-[#D6A85F]">
              Role: {jobTitle} ({durationMinutes} mins)
            </div>
          </div>

          {/* System Readiness Card */}
          <div className="w-full bg-[#1A1C1A] border border-[#2A2A28] rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#2A2A28] pb-3">
              <h2 className="text-xs font-mono uppercase tracking-wider text-[#A1A19A] font-bold">
                Hardware & Transport Readiness
              </h2>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Ready to Connect
              </span>
            </div>

            <ul className="space-y-3 font-mono text-xs">
              <li className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#A1A19A] text-lg">mic</span>
                  <span className="text-[#F4F1E9]">Microphone Input</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span>Audio Enabled</span>
                </div>
              </li>

              <li className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#A1A19A] text-lg">volume_up</span>
                  <span className="text-[#F4F1E9]">AI Voice Speaker</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span>Synthesizer Ready</span>
                </div>
              </li>

              <li className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#A1A19A] text-lg">wifi</span>
                  <span className="text-[#F4F1E9]">WebRTC / Transport</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#F4C377] font-semibold text-[11px]">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span>Ultra-Low Latency</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-3">
            {/* Primary Action Button to Start Voice Interview Directly */}
            <button
              id="begin-voice-interview-main-btn"
              onClick={handleStartVoiceInterview}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#D6A85F] via-[#E8BA70] to-[#D6A85F] hover:from-[#F4C377] hover:to-[#E8BA70] text-[#11110F] font-bold text-sm shadow-xl shadow-[#D6A85F]/30 transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2.5 group cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">phone_in_talk</span>
              <span>START VOICE INTERVIEW NOW</span>
              <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </button>

            {/* Secondary Device Setup */}
            <button
              onClick={handleSetup}
              className="w-full py-2.5 rounded-xl bg-[#1A1C1A] border border-[#2A2A28] text-xs font-mono text-[#A1A19A] hover:text-[#E5E2DE] hover:border-[#4F4538] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">tune</span>
              <span>Hardware & Audio Device Setup</span>
            </button>
          </div>

          {/* Privacy & Security Note */}
          <div className="text-center px-4 pt-1">
            <p className="text-[11px] text-[#A1A19A] font-mono flex items-center justify-center gap-1.5 leading-relaxed">
              <span className="material-symbols-outlined text-sm shrink-0 text-[#D6A85F]">lock</span>
              <span>Audio responses and transcripts are encrypted and evaluated against autonomous technical rubrics.</span>
            </p>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-[10px] text-[#A1A19A]/60 font-mono relative z-20">
        Token: {token.slice(0, 16)}... • HireGenie AI Autonomous Interview Gateway
      </footer>
    </div>
  );
};
