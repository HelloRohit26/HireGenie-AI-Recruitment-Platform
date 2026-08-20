import React, { useState } from 'react';
import { SignInModal } from '../components/auth/SignInModal';
import { SharpNavyRainCanvas } from '../components/landing/SharpNavyRainCanvas';
import { useTheme } from '../context/ThemeContext';

interface EntryLandingPageProps {
  onNavigate?: (route: string) => void;
  onAuthenticate?: (role: 'recruiter' | 'candidate', name: string) => void;
  initialAuthModalOpen?: boolean;
  initialAuthRole?: 'recruiter' | 'candidate';
  initialMessage?: string;
}

export const EntryLandingPage: React.FC<EntryLandingPageProps> = ({
  onNavigate,
  onAuthenticate,
  initialAuthModalOpen = false,
  initialAuthRole = 'recruiter',
  initialMessage
}) => {
  const { theme, toggleTheme } = useTheme();
  const [authModalOpen, setAuthModalOpen] = useState(initialAuthModalOpen);
  const [selectedRole, setSelectedRole] = useState<'recruiter' | 'candidate'>(initialAuthRole);
  const [modalMessage, setModalMessage] = useState<string | undefined>(initialMessage);

  const handleOpenAuth = (role: 'recruiter' | 'candidate', msg?: string) => {
    setSelectedRole(role);
    setModalMessage(msg);
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = (role: 'recruiter' | 'candidate', name: string) => {
    onAuthenticate?.(role, name);
    if (role === 'recruiter') {
      onNavigate?.('/recruiter');
    } else {
      onNavigate?.('/candidate');
    }
  };

  const agentsList = [
    { name: 'Resume Parser', icon: 'description', role: 'Document Extraction' },
    { name: 'Skill Matcher', icon: 'hub', role: 'Vector Embeddings' },
    { name: 'Candidate Ranker', icon: 'format_list_numbered', role: 'Deterministic Scoring' },
    { name: 'Voice Interviewer', icon: 'mic', role: 'Autonomous WebRTC' },
    { name: 'Evaluation Agent', icon: 'analytics', role: 'Synthesis & Scoring' }
  ];

  return (
    <div className="h-screen w-screen bg-[#020617] text-white font-sans flex flex-col relative overflow-hidden">
      
      {/* Sharp Navy Blue Light Rain Background Canvas */}
      <SharpNavyRainCanvas />

      {/* ─── 1. NAVBAR (TOP) ───────────────── */}
      <header className="relative z-20 h-16 sm:h-20 bg-[#020617]/70 backdrop-blur-md border-b border-[#1e293b]/60 px-6 md:px-12 flex items-center justify-between">
        <div
          onClick={() => window.location.reload()}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] flex items-center justify-center font-bold text-base text-white shadow-[0_0_20px_rgba(37,99,235,0.6)] group-hover:scale-105 transition-transform">
            HG
          </div>
          <div>
            <span className="text-base font-bold text-white tracking-tight block">HireGenie AI</span>
            <span className="text-[10px] text-[#38bdf8] font-mono block">Autonomous Recruitment Engine</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            aria-label="Switch mode"
            className="p-2 rounded-lg bg-[#0f172a] border border-[#1e293b] text-[#38bdf8] hover:text-white transition-all"
            title={`Active mode: ${theme}`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          <button
            onClick={() => handleOpenAuth('candidate')}
            className="hidden sm:flex px-4 py-2 rounded-lg text-xs font-semibold text-[#94a3b8] hover:text-white hover:bg-[#0f172a] border border-transparent hover:border-[#1e293b] transition-all"
          >
            Candidate Portal
          </button>

          <button
            onClick={() => handleOpenAuth('recruiter')}
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white text-xs font-bold shadow-[0_4px_25px_rgba(37,99,235,0.5)] hover:shadow-[0_8px_35px_rgba(56,189,248,0.7)] hover:-translate-y-0.5 transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">login</span>
            Recruiter Sign In
          </button>
        </div>
      </header>

      {/* ─── 2. MAIN SINGLE PAGE HERO (CENTER) ───────────────── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto space-y-6 pointer-events-none">
        
        {/* Status Badge */}
        <div className="pointer-events-auto inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0f172a]/90 backdrop-blur-md border border-[#1e3a8a] text-[#38bdf8] text-xs font-mono shadow-[0_0_25px_rgba(29,78,216,0.35)]">
          <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-pulse" />
          <span>AUTONOMOUS RECRUITMENT PLATFORM</span>
        </div>

        {/* Main Glowing High-Contrast Headline */}
        <div className="space-y-4 max-w-3xl pointer-events-auto">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.18]">
            <span className="text-white drop-shadow-[0_2px_20px_rgba(255,255,255,0.4)]">
              From Talent Chaos
            </span>{" "}
            <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38bdf8] via-[#60a5fa] to-[#818cf8] drop-shadow-[0_0_40px_rgba(56,189,248,0.8)]">
              to Hiring Intelligence.
            </span>
          </h1>
          <p className="text-sm sm:text-base text-[#cbd5e1] max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
            HireGenie AI brings autonomous agents, real-time intelligence, and human oversight together to help teams hire better and faster.
          </p>
        </div>

        {/* Hero Action CTAs */}
        <div className="pointer-events-auto flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 w-full sm:w-auto">
          <button
            onClick={() => handleOpenAuth('recruiter')}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white text-sm font-bold shadow-[0_4px_25px_rgba(37,99,235,0.5)] hover:shadow-[0_8px_35px_rgba(56,189,248,0.7)] hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 group"
          >
            <span>Explore Recruiter Platform</span>
            <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>

          <button
            onClick={() => handleOpenAuth('candidate')}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#0f172a]/90 backdrop-blur-md border border-[#1e293b] hover:border-[#38bdf8] text-white text-sm font-bold shadow-md hover:bg-[#1e293b] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <span>Explore Candidate Experience</span>
          </button>
        </div>

      </main>

      {/* ─── 3. BOTTOM BAR (5 AI AGENT PILLS & FOOTER) ───────────────── */}
      <footer className="relative z-20 pb-6 px-6 max-w-6xl mx-auto w-full space-y-3 pointer-events-auto">
        {/* Horizontal 5 AI Agent Badges */}
        <div className="hidden sm:flex items-center justify-center gap-3 overflow-x-auto py-1">
          {agentsList.map(agent => (
            <div
              key={agent.name}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0f172a]/80 backdrop-blur-md border border-[#1e293b] text-xs font-mono text-[#94a3b8] hover:border-[#38bdf8] hover:text-white transition-all shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm text-[#38bdf8]">{agent.icon}</span>
              <span>{agent.name}</span>
            </div>
          ))}
        </div>

        {/* Minimal Footer Row */}
        <div className="flex items-center justify-between border-t border-[#1e293b]/60 pt-3 text-[11px] font-mono text-[#64748b]">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white font-bold flex items-center justify-center text-[9px]">
              HG
            </div>
            <span>HireGenie AI © 2026</span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate?.('/help')} className="hover:text-white transition-colors">Documentation</button>
            <button onClick={() => onNavigate?.('/recruiter/trust-safety')} className="hover:text-white transition-colors">Trust & Safety</button>
          </div>
        </div>
      </footer>

      {/* Sign In Modal */}
      <SignInModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        initialRole={selectedRole}
        initialMessage={modalMessage}
      />
    </div>
  );
};
