import React, { useState } from 'react';
import { TalentConstellation } from '../components/3d/TalentConstellation';

interface CandidateOnboardingPageProps {
  onNavigate?: (route: string) => void;
}

export const CandidateOnboardingPage: React.FC<CandidateOnboardingPageProps> = ({ onNavigate }) => {
  const [step, setStep] = useState<'upload' | 'parsing' | 'review'>('upload');
  const [parsedChecks, setParsedChecks] = useState({
    exp: false,
    edu: false,
    skills: false,
    proj: false
  });

  const handleSimulateUpload = () => {
    setStep('parsing');

    // Simulate step-by-step checklist parsing items
    setTimeout(() => setParsedChecks(prev => ({ ...prev, exp: true })), 400);
    setTimeout(() => setParsedChecks(prev => ({ ...prev, edu: true })), 800);
    setTimeout(() => setParsedChecks(prev => ({ ...prev, skills: true })), 1200);
    setTimeout(() => {
      setParsedChecks(prev => ({ ...prev, proj: true }));
      setTimeout(() => setStep('review'), 500);
    }, 1600);
  };

  const handleCompleteOnboarding = () => {
    if (onNavigate) {
      onNavigate('/candidate');
    }
  };

  return (
    <div className="bg-[#131311] text-[#E5E2DE] min-h-screen flex flex-col font-sans antialiased relative overflow-hidden items-center">
      {/* Background WebGL Constellation */}
      <TalentConstellation opacity={0.25} />

      {/* Header Anchor */}
      <header className="fixed top-0 left-0 w-full h-16 px-6 bg-[#131311]/80 backdrop-blur-md border-b border-[#2A2A28] flex items-center justify-between z-50">
        <div
          onClick={() => onNavigate?.('/entry')}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-[#D6A85F] flex items-center justify-center font-bold text-sm text-[#11110F] shadow-md shadow-[#D6A85F]/20 group-hover:scale-105 transition-transform">
            HG
          </div>
          <span className="text-base font-bold text-[#F4F1E9] tracking-tight">HireGenie AI</span>
        </div>

        <button
          onClick={() => onNavigate?.('/candidate')}
          className="text-xs font-mono text-[#A1A19A] hover:text-[#F4F1E9]"
        >
          Skip to Candidate Dashboard →
        </button>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-[520px] px-6 pt-28 pb-20 flex flex-col items-center relative z-10">
        
        {/* Onboarding Progress Track */}
        <div className="w-full flex gap-2 mb-10">
          <div className="h-1 flex-1 bg-[#D6A85F] rounded-full" />
          <div className={`h-1 flex-1 rounded-full transition-all ${step !== 'upload' ? 'bg-[#D6A85F]' : 'bg-[#2A2A28]'}`} />
          <div className={`h-1 flex-1 rounded-full transition-all ${step === 'review' ? 'bg-[#D6A85F]' : 'bg-[#2A2A28]'}`} />
          <div className="h-1 flex-1 bg-[#2A2A28] opacity-40 rounded-full" />
        </div>

        {/* Upload State */}
        {step === 'upload' && (
          <div className="w-full space-y-8 animate-fadeIn text-center">
            <div>
              <p className="text-xs font-mono font-bold text-[#F4C377] uppercase tracking-widest mb-2">Step 02</p>
              <h2 className="text-3xl font-bold text-[#F4F1E9] tracking-tight mb-2">Upload Your Resume</h2>
              <p className="text-xs text-[#A1A19A] font-mono leading-relaxed max-w-sm mx-auto">
                Let's build your AI candidate vector profile. Upload your latest resume, and our parser will extract key technical competencies instantly.
              </p>
            </div>

            {/* Drop Zone */}
            <div
              onClick={handleSimulateUpload}
              className="w-full rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer border border-dashed border-[#4F4538] hover:border-[#D6A85F] bg-[#1C1C19]/60 hover:bg-[#D6A85F]/5 transition-all group relative"
            >
              <div className="w-16 h-16 rounded-full bg-[#20201D] border border-[#2A2A28] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[#F4C377] text-3xl">upload_file</span>
              </div>
              <h3 className="text-sm font-bold text-[#F4F1E9] mb-1">Drop your resume here</h3>
              <p className="text-xs text-[#A1A19A] font-mono">or click to browse (PDF, DOCX)</p>
              <span className="text-[9px] font-mono text-[#D6A85F] mt-3 font-bold">Auto-Parsing Enabled</span>
            </div>

            <button
              type="button"
              onClick={handleSimulateUpload}
              className="text-xs font-mono text-[#A1A19A] hover:text-[#F4C377] transition-colors"
            >
              I'll enter my details manually →
            </button>
          </div>
        )}

        {/* Parsing State */}
        {step === 'parsing' && (
          <div className="w-full space-y-8 animate-fadeIn text-center flex flex-col items-center">
            <div className="w-20 h-20 relative flex items-center justify-center my-4">
              <div className="w-16 h-16 rounded-full bg-[#D6A85F]/20 border border-[#D6A85F] flex items-center justify-center animate-pulse">
                <span className="material-symbols-outlined text-[#F4C377] text-3xl">document_scanner</span>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-[#F4F1E9]">Parsing resume...</h3>
              <p className="text-xs font-mono text-[#A1A19A] mt-1">Extracting skills, experience timeline, and project artifacts.</p>
            </div>

            {/* Checklist */}
            <div className="w-full bg-[#1A1C1A] border border-[#2A2A28] rounded-xl p-5 space-y-3 font-mono text-xs text-left">
              <div className="flex items-center justify-between p-2 rounded bg-[#11110F]">
                <span className="text-[#E3E2DF]">Experience Timeline</span>
                {parsedChecks.exp ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span> Found
                  </span>
                ) : (
                  <span className="text-[#A1A19A]">Scanning...</span>
                )}
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-[#11110F]">
                <span className="text-[#E3E2DF]">Education & Credentials</span>
                {parsedChecks.edu ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span> Found
                  </span>
                ) : (
                  <span className="text-[#A1A19A]">Scanning...</span>
                )}
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-[#11110F]">
                <span className="text-[#E3E2DF]">Skills & Frameworks</span>
                {parsedChecks.skills ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span> Found
                  </span>
                ) : (
                  <span className="text-[#A1A19A]">Scanning...</span>
                )}
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-[#11110F]">
                <span className="text-[#E3E2DF]">Key Projects & Publications</span>
                {parsedChecks.proj ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span> Found
                  </span>
                ) : (
                  <span className="text-[#A1A19A]">Scanning...</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Review State */}
        {step === 'review' && (
          <div className="w-full space-y-6 animate-fadeIn text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">verified</span>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#F4F1E9]">Profile Extracted Successfully</h2>
              <p className="text-xs text-[#A1A19A] font-mono mt-1">Review your parsed AI candidate vector profile before proceeding.</p>
            </div>

            {/* Extracted Profile Card */}
            <div className="w-full bg-[#181815] border border-[#79A89A]/40 rounded-xl p-5 text-left space-y-4 font-mono text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#79A89A]/20 border border-[#79A89A]/40 flex items-center justify-center font-bold text-xs text-[#79A89A]">
                  PS
                </div>
                <div>
                  <div className="text-sm font-bold text-[#F4F1E9]">Priya Sharma</div>
                  <div className="text-[10px] text-[#A1A19A]">Senior AI Engineer • 5 Years Exp</div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-[#2A2A28]">
                <div className="text-[10px] uppercase text-[#A1A19A] font-bold">Extracted Skill Stack</div>
                <div className="flex flex-wrap gap-1.5">
                  {['PyTorch', 'Transformers', 'Python', 'vLLM', 'WebRTC', 'MLOps'].map(skill => (
                    <span key={skill} className="px-2 py-0.5 rounded bg-[#79A89A]/15 text-[#79A89A] border border-[#79A89A]/30 text-[10px]">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCompleteOnboarding}
              className="w-full py-3.5 rounded-xl bg-[#D6A85F] text-[#11110F] font-bold text-xs shadow-xl hover:bg-[#F4C377] transition-all flex items-center justify-center gap-2"
            >
              <span>Confirm & Explore Jobs</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          </div>
        )}

      </main>
    </div>
  );
};
