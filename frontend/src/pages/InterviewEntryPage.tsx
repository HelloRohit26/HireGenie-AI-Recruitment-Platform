import React, { useState } from 'react';
import { TalentConstellation } from '../components/3d/TalentConstellation';

interface InterviewEntryPageProps {
  token?: string;
  onNavigate?: (route: string) => void;
}

export const InterviewEntryPage: React.FC<InterviewEntryPageProps> = ({
  token = 'demo-token',
  onNavigate
}) => {
  const [micReady] = useState(true);
  const [speakerReady] = useState(true);
  const [connectionReady] = useState(true);

  const handleBegin = () => {
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
          onClick={() => onNavigate?.('/entry')}
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
        <div className="w-full max-w-[480px] flex flex-col items-center animate-fadeIn space-y-6">
          
          {/* Header Icon & Title */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1F201E] border border-[#2A2A28] shadow-xl shadow-black/40">
              <span className="material-symbols-outlined text-[#F4C377] text-3xl">smart_toy</span>
            </div>
            <h1 className="text-3xl font-bold text-[#F4F1E9] tracking-tight">Your interview is ready</h1>
            <p className="text-sm font-mono text-[#A1A19A] flex items-center justify-center gap-2">
              <span>AI Engineer</span>
              <span className="text-[#2A2A28]">|</span>
              <span className="text-[#F4C377] font-semibold">HireGenie AI</span>
            </p>
          </div>

          {/* System Readiness Card */}
          <div className="w-full bg-[#1A1C1A] border border-[#2A2A28] rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#2A2A28] pb-3">
              <h2 className="text-xs font-mono uppercase tracking-wider text-[#A1A19A] font-bold">
                System Readiness Check
              </h2>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Verified
              </span>
            </div>

            <ul className="space-y-3.5 font-mono text-xs">
              <li className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#A1A19A] text-lg">mic</span>
                  <span className="text-[#F4F1E9]">Microphone</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span>Ready</span>
                </div>
              </li>

              <li className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#A1A19A] text-lg">volume_up</span>
                  <span className="text-[#F4F1E9]">Speaker / Audio Output</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span>Ready</span>
                </div>
              </li>

              <li className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#A1A19A] text-lg">wifi</span>
                  <span className="text-[#F4F1E9]">Connection Speed</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#F4C377] font-semibold text-[11px]">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span>Excellent (12 ms)</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={handleBegin}
            className="w-full py-4 rounded-xl bg-[#D6A85F] text-[#11110F] font-bold text-sm shadow-xl shadow-[#D6A85F]/20 hover:bg-[#F4C377] transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2 group"
          >
            <span>Begin Interview Setup</span>
            <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </button>

          {/* Privacy & Security Note */}
          <div className="text-center px-4 pt-2">
            <p className="text-[11px] text-[#A1A19A] font-mono flex items-center justify-center gap-1.5 leading-relaxed">
              <span className="material-symbols-outlined text-sm shrink-0 text-[#D6A85F]">lock</span>
              <span>Your responses and audio recording are securely encrypted and evaluated by the hiring team.</span>
            </p>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-[10px] text-[#A1A19A]/60 font-mono relative z-20">
        Token verified: {token.slice(0, 16)}... • HireGenie AI Enterprise Protocol
      </footer>
    </div>
  );
};
