import React, { useState } from 'react';
import { TalentConstellation } from '../components/3d/TalentConstellation';

interface RecruiterOnboardingPageProps {
  onNavigate?: (route: string) => void;
}

export const RecruiterOnboardingPage: React.FC<RecruiterOnboardingPageProps> = ({ onNavigate }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    workspaceName: 'Acme AI Engineering Workspace',
    companyName: 'Acme AI Technologies Inc.',
    websiteUrl: 'https://acme.ai',
    industry: 'tech',
    teamSize: '51-200',
    aiThreshold: 'Balanced (85% Match)',
    inviteEmails: 'hiring.manager@acme.ai'
  });

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    } else {
      if (onNavigate) {
        onNavigate('/recruiter');
      }
    }
  };

  return (
    <div className="bg-[#131311] text-[#E5E2DE] min-h-screen flex flex-col font-sans antialiased relative overflow-x-hidden">
      {/* Top Progress Track */}
      <div className="w-full flex h-1 bg-[#1A1C1A]">
        <div className={`flex-1 transition-all ${currentStep >= 1 ? 'bg-[#D6A85F]' : 'opacity-30'}`} />
        <div className={`flex-1 transition-all ${currentStep >= 2 ? 'bg-[#D6A85F]' : 'opacity-30'}`} />
        <div className={`flex-1 transition-all ${currentStep >= 3 ? 'bg-[#D6A85F]' : 'opacity-30'}`} />
        <div className={`flex-1 transition-all ${currentStep >= 4 ? 'bg-[#D6A85F]' : 'opacity-30'}`} />
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex flex-col md:flex-row w-full max-w-[1600px] mx-auto z-10 relative">
        
        {/* Left Panel: Editorial Context & Branding */}
        <div className="hidden md:flex flex-col justify-between w-1/3 min-w-[400px] p-12 md:p-16 border-r border-[#2A2A28] bg-[#0E0E0C]">
          <div>
            <div
              onClick={() => onNavigate?.('/entry')}
              className="flex items-center gap-3 mb-16 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-[#D6A85F] flex items-center justify-center font-bold text-sm text-[#11110F] shadow-lg shadow-[#D6A85F]/20 group-hover:scale-105 transition-transform">
                HG
              </div>
              <span className="text-lg font-bold text-[#F4F1E9] tracking-tight">HireGenie AI</span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold text-[#F4F1E9] leading-tight mb-6">
              Set up your<br />Workspace.
            </h1>
            <p className="text-sm text-[#A1A19A] font-mono leading-relaxed max-w-sm">
              Configure your primary environment. This acts as the command center for your autonomous recruiting operations.
            </p>
          </div>

          {/* Step Indicators */}
          <div className="space-y-4 font-mono">
            {[
              { step: 1, title: 'Workspace Setup' },
              { step: 2, title: 'Company & AI Parameters' },
              { step: 3, title: 'Team Permissions' },
              { step: 4, title: 'Launch Command Center' }
            ].map(item => (
              <div
                key={item.step}
                className={`flex items-center gap-4 transition-all ${
                  currentStep === item.step
                    ? 'text-[#F4C377] font-bold'
                    : currentStep > item.step
                    ? 'text-emerald-400 opacity-80'
                    : 'text-[#A1A19A] opacity-40'
                }`}
              >
                <span className="text-xs">0{item.step}</span>
                <span className="text-sm">{item.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden p-6 text-center border-b border-[#2A2A28]">
          <h1 className="text-xl font-bold text-[#F4F1E9]">Set up Workspace</h1>
          <p className="text-xs text-[#A1A19A] font-mono">Step {currentStep} of 4</p>
        </div>

        {/* Right Panel: Form Canvas */}
        <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-16 relative">
          
          {/* Ambient Constellation Effect */}
          <TalentConstellation opacity={0.2} />

          <div className="w-full max-w-[480px] z-10 space-y-6 animate-fadeIn">
            
            {/* Step 1: Workspace Basics */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-[#F4F1E9]">Workspace Details</h2>
                  <p className="text-xs text-[#A1A19A] font-mono">Enter your primary recruiting environment parameters.</p>
                </div>

                <div className="space-y-4 font-mono text-xs">
                  <div>
                    <label className="text-[10px] text-[#A1A19A] uppercase tracking-wider block mb-1">Workspace Name</label>
                    <input
                      type="text"
                      value={formData.workspaceName}
                      onChange={e => setFormData({ ...formData, workspaceName: e.target.value })}
                      className="w-full bg-[#181815] border border-[#2A2A28] rounded-xl px-4 py-3 text-xs text-[#F4F1E9] outline-none focus:border-[#D6A85F]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[#A1A19A] uppercase tracking-wider block mb-1">Company Name</label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full bg-[#181815] border border-[#2A2A28] rounded-xl px-4 py-3 text-xs text-[#F4F1E9] outline-none focus:border-[#D6A85F]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-[#A1A19A] uppercase tracking-wider block mb-1">Industry</label>
                      <select
                        value={formData.industry}
                        onChange={e => setFormData({ ...formData, industry: e.target.value })}
                        className="w-full bg-[#181815] border border-[#2A2A28] rounded-xl px-3 py-3 text-xs text-[#F4F1E9] outline-none"
                      >
                        <option value="tech">Technology & AI</option>
                        <option value="finance">Fintech / Banking</option>
                        <option value="health">Healthcare & Bio</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-[#A1A19A] uppercase tracking-wider block mb-1">Team Size</label>
                      <select
                        value={formData.teamSize}
                        onChange={e => setFormData({ ...formData, teamSize: e.target.value })}
                        className="w-full bg-[#181815] border border-[#2A2A28] rounded-xl px-3 py-3 text-xs text-[#F4F1E9] outline-none"
                      >
                        <option value="1-10">1-10 Employees</option>
                        <option value="11-50">11-50 Employees</option>
                        <option value="51-200">51-200 Employees</option>
                        <option value="201+">201+ Enterprise</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: AI Screening Thresholds */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-[#F4F1E9]">AI Screening Preferences</h2>
                  <p className="text-xs text-[#A1A19A] font-mono">Configure default vector matching thresholds for incoming candidates.</p>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  {['Aggressive (90% Match - Fast Filter)', 'Balanced (85% Match - Recommended)', 'Conservative (75% Match - High Volume)'].map(mode => (
                    <div
                      key={mode}
                      onClick={() => setFormData({ ...formData, aiThreshold: mode })}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        formData.aiThreshold === mode
                          ? 'bg-[#D6A85F]/15 border-[#D6A85F] text-[#F4C377]'
                          : 'bg-[#181815] border-[#2A2A28] text-[#A1A19A] hover:text-[#F4F1E9]'
                      }`}
                    >
                      <div className="font-bold">{mode}</div>
                      <div className="text-[10px] opacity-80 mt-1">Automatic advancement to AI voice screening queue.</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Team Invitations */}
            {currentStep === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-[#F4F1E9]">Invite Hiring Team</h2>
                  <p className="text-xs text-[#A1A19A] font-mono">Add hiring managers and recruiters to your workspace.</p>
                </div>

                <div>
                  <label className="text-[10px] text-[#A1A19A] uppercase tracking-wider font-mono block mb-1">Team Email Addresses</label>
                  <textarea
                    rows={3}
                    value={formData.inviteEmails}
                    onChange={e => setFormData({ ...formData, inviteEmails: e.target.value })}
                    placeholder="manager@company.ai, recruiter@company.ai"
                    className="w-full bg-[#181815] border border-[#2A2A28] rounded-xl px-4 py-3 text-xs text-[#F4F1E9] outline-none focus:border-[#D6A85F] resize-none font-mono"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Ready to Launch */}
            {currentStep === 4 && (
              <div className="space-y-5 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-3xl">verified</span>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-[#F4F1E9]">Workspace Configured</h2>
                  <p className="text-xs text-[#A1A19A] font-mono mt-1">Your autonomous recruiting environment is ready for operation.</p>
                </div>

                <div className="bg-[#181815] border border-[#2A2A28] rounded-xl p-4 text-left space-y-2 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#A1A19A]">Workspace</span>
                    <span className="text-[#F4F1E9] font-bold">{formData.workspaceName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A1A19A]">AI Threshold</span>
                    <span className="text-[#F4C377] font-bold">{formData.aiThreshold}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step Navigation Buttons */}
            <div className="flex items-center justify-between pt-4">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="px-4 py-2 rounded-lg bg-[#181815] text-[#A1A19A] text-xs font-mono font-bold hover:text-[#F4F1E9]"
                >
                  Back
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-3 rounded-xl bg-[#D6A85F] text-[#11110F] font-bold text-xs font-mono shadow-lg hover:bg-[#F4C377] transition-all flex items-center gap-2"
              >
                <span>{currentStep === 4 ? 'Launch Command Center' : 'Next Step'}</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
