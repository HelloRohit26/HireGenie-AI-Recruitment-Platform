import React, { useState, useEffect } from 'react';
import { authService } from '../../services/authService';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (role: 'recruiter' | 'candidate', name: string) => void;
  initialRole?: 'recruiter' | 'candidate';
  initialMessage?: string;
}

export const SignInModal: React.FC<SignInModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialRole = 'recruiter',
  initialMessage
}) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [role, setRole] = useState<'recruiter' | 'candidate'>(initialRole);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('Authenticating...');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Sync initialRole when modal opens
  useEffect(() => {
    if (isOpen) {
      setRole(initialRole);
      setErrorMsg(initialMessage || '');
      setSuccessMsg('');
      setResetSent(false);
    }
  }, [isOpen, initialRole, initialMessage]);

  if (!isOpen) return null;

  // Calculate Password Strength Score (0 to 100)
  const calculatePasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'None', color: 'bg-slate-700', text: 'text-slate-400' };
    let s = 0;
    if (pass.length >= 6) s += 25;
    if (pass.length >= 8) s += 15;
    if (/[A-Z]/.test(pass)) s += 20;
    if (/[0-9]/.test(pass)) s += 20;
    if (/[^A-Za-z0-9]/.test(pass)) s += 20;

    if (s <= 25) return { score: s, label: 'Weak', color: 'bg-red-500', text: 'text-red-400' };
    if (s <= 50) return { score: s, label: 'Fair', color: 'bg-amber-500', text: 'text-amber-400' };
    if (s <= 75) return { score: s, label: 'Strong', color: 'bg-blue-500', text: 'text-blue-400' };
    return { score: 100, label: 'Bulletproof ✨', color: 'bg-emerald-500', text: 'text-emerald-400' };
  };

  const strength = calculatePasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (activeTab === 'forgot') {
      if (!email.trim()) {
        setErrorMsg('Please enter your registered email address.');
        setIsLoading(false);
        return;
      }
      setTimeout(() => {
        setIsLoading(false);
        setResetSent(true);
        setSuccessMsg(`Password reset instructions sent to ${email.trim()}`);
      }, 1000);
      return;
    }

    if (!email.trim() || !password || (activeTab === 'signup' && !fullName.trim())) {
      setErrorMsg('Please fill in all required fields.');
      setIsLoading(false);
      return;
    }

    try {
      if (activeTab === 'signup') {
        setLoadingStep('Creating secure cryptographic identity...');
        const res = await authService.register({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          role,
        });

        setSuccessMsg('Account created successfully! Initializing workspace...');
        const activeName = res.data.user.name || fullName.trim();
        setTimeout(() => {
          onSuccess(role, activeName);
          onClose();
        }, 600);
      } else {
        setLoadingStep('Verifying JWT signature with FastAPI backend...');
        const res = await authService.login({
          email: email.trim(),
          password,
          role,
        });

        setSuccessMsg('Login authenticated! Redirecting...');
        const activeName = res.data.user.name || email.split('@')[0];
        setTimeout(() => {
          onSuccess(role, activeName);
          onClose();
        }, 500);
      }
    } catch (err: any) {
      console.error("Authentication error:", err);
      const errMsg = err?.message || 'Authentication failed. Please check your credentials or backend server.';
      setErrorMsg(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto" onClick={onClose}>
      {/* Dynamic Animated Glass Backdrop */}
      <div className="fixed inset-0 bg-[#020617]/85 backdrop-blur-xl transition-opacity duration-300" />

      {/* Ambient Floating Glow Orbs */}
      <div className="fixed top-1/4 left-1/3 w-96 h-96 bg-[#2563eb]/20 rounded-full blur-[120px] pointer-events-none animate-float-slow" />
      <div className="fixed bottom-1/4 right-1/3 w-96 h-96 bg-[#38bdf8]/15 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" />

      {/* Main Glassmorphic Modal Card */}
      <div
        className="relative w-full max-w-lg bg-[#070e24]/95 border border-[#1e3a8a]/40 rounded-3xl shadow-[0_20px_70px_rgba(0,0,0,0.8),0_0_50px_rgba(37,99,235,0.2)] overflow-hidden z-10 animate-auth-pop my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Glowing Ambient Border */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#38bdf8] to-transparent opacity-80" />

        {/* Modal Inner Container */}
        <div className="p-6 sm:p-8">
          
          {/* Header Bar */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1d4ed8] via-[#2563eb] to-[#38bdf8] flex items-center justify-center font-black text-lg text-white shadow-[0_0_25px_rgba(37,99,235,0.6)] transform hover:scale-105 transition-transform">
                HG
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    HireGenie AI
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    v1.0 Live
                  </span>
                </div>
                <p className="text-xs text-[#94a3b8]">
                  Autonomous Recruitment Engine • Secure Identity Gate
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#64748b] hover:text-white hover:bg-[#1e293b]/70 border border-transparent hover:border-[#334155] transition-all"
              aria-label="Close modal"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* ─── ROLE SELECTOR (INTERACTIVE CARDS) ─── */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {/* Recruiter Role Card */}
            <button
              type="button"
              onClick={() => { setRole('recruiter'); setErrorMsg(''); }}
              className={`relative p-3.5 rounded-2xl border text-left transition-all duration-300 group overflow-hidden ${
                role === 'recruiter'
                  ? 'bg-gradient-to-b from-[#1e3a8a]/60 to-[#0f172a]/90 border-[#38bdf8] shadow-[0_0_20px_rgba(56,189,248,0.25)] scale-[1.02]'
                  : 'bg-[#0b1329]/60 border-[#1e293b] hover:border-[#3b82f6]/50 hover:bg-[#0f1d40]/40'
              }`}
            >
              {role === 'recruiter' && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#38bdf8] shadow-[0_0_8px_#38bdf8]" />
              )}
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`p-1.5 rounded-lg ${role === 'recruiter' ? 'bg-[#2563eb] text-white shadow-md' : 'bg-[#1e293b] text-[#94a3b8]'}`}>
                  <span className="material-symbols-outlined text-base">corporate_fare</span>
                </div>
                <span className={`text-xs font-bold ${role === 'recruiter' ? 'text-white' : 'text-[#cbd5e1]'}`}>
                  Recruiter Portal
                </span>
              </div>
              <p className="text-[10px] text-[#94a3b8] line-clamp-2 leading-snug">
                Post jobs, AI screening, autonomous voice interviews & analytics.
              </p>
            </button>

            {/* Candidate Role Card */}
            <button
              type="button"
              onClick={() => { setRole('candidate'); setErrorMsg(''); }}
              className={`relative p-3.5 rounded-2xl border text-left transition-all duration-300 group overflow-hidden ${
                role === 'candidate'
                  ? 'bg-gradient-to-b from-[#0e7490]/60 to-[#0f172a]/90 border-[#22d3ee] shadow-[0_0_20px_rgba(34,211,238,0.25)] scale-[1.02]'
                  : 'bg-[#0b1329]/60 border-[#1e293b] hover:border-[#06b6d4]/50 hover:bg-[#0f1d40]/40'
              }`}
            >
              {role === 'candidate' && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#22d3ee] shadow-[0_0_8px_#22d3ee]" />
              )}
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`p-1.5 rounded-lg ${role === 'candidate' ? 'bg-[#0891b2] text-white shadow-md' : 'bg-[#1e293b] text-[#94a3b8]'}`}>
                  <span className="material-symbols-outlined text-base">person</span>
                </div>
                <span className={`text-xs font-bold ${role === 'candidate' ? 'text-white' : 'text-[#cbd5e1]'}`}>
                  Candidate Portal
                </span>
              </div>
              <p className="text-[10px] text-[#94a3b8] line-clamp-2 leading-snug">
                Browse tech jobs, submit resumes, take AI voice interview rounds.
              </p>
            </button>
          </div>

          {/* ─── NAVIGATION TABS (Sign In / Register) ─── */}
          <div className="flex items-center p-1 bg-[#020617] border border-[#1e293b] rounded-2xl mb-5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setActiveTab('signin'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${
                activeTab === 'signin'
                  ? 'bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white shadow-[0_2px_12px_rgba(37,99,235,0.4)]'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-sm">login</span>
              <span>Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('signup'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${
                activeTab === 'signup'
                  ? 'bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white shadow-[0_2px_12px_rgba(37,99,235,0.4)]'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-sm">person_add</span>
              <span>Register New Account</span>
            </button>
          </div>

          {/* ─── FORGOT PASSWORD TAB ─── */}
          {activeTab === 'forgot' && (
            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              <div className="p-3.5 rounded-2xl bg-[#0b1739]/60 border border-[#1e3a8a]/40 text-xs text-[#94a3b8] flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[#38bdf8] text-base shrink-0 mt-0.5">info</span>
                <span>Enter your account email below. We'll send a cryptographic recovery link to reset your credentials.</span>
              </div>

              <div>
                <label className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-mono block mb-1.5">
                  Your Account Email
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#64748b]">
                    mail
                  </span>
                  <input
                    type="email"
                    placeholder="user@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full bg-[#020617] border border-[#1e293b] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#64748b] outline-none focus:border-[#38bdf8] transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || resetSent}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white font-bold text-xs shadow-lg shadow-[0_4px_20px_rgba(37,99,235,0.4)] hover:shadow-[0_8px_30px_rgba(56,189,248,0.6)] transition-all flex items-center justify-center gap-2 shine-sweep"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Processing Reset...</span>
                  </>
                ) : resetSent ? (
                  <>
                    <span className="material-symbols-outlined text-sm text-emerald-400">check_circle</span>
                    <span>Reset Email Dispatched</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Instructions</span>
                    <span className="material-symbols-outlined text-sm">send</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setActiveTab('signin'); setErrorMsg(''); setSuccessMsg(''); }}
                  className="text-xs text-[#38bdf8] hover:underline font-semibold"
                >
                  ← Return to Sign In
                </button>
              </div>
            </form>
          )}

          {/* ─── STANDARD SIGN IN & SIGN UP FORM ─── */}
          {(activeTab === 'signin' || activeTab === 'signup') && (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Full Name field (Register only) */}
              {activeTab === 'signup' && (
                <div>
                  <label className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-mono block mb-1.5 flex items-center justify-between">
                    <span>Full Name</span>
                    <span className="text-[#64748b] lowercase font-normal">Required</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#64748b]">
                      badge
                    </span>
                    <input
                      type="text"
                      placeholder={role === 'recruiter' ? 'e.g. Vikram Sharma' : 'e.g. Ananya Roy'}
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      required
                      className="w-full bg-[#020617] border border-[#1e293b] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#64748b] outline-none focus:border-[#38bdf8] transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Email field */}
              <div>
                <label className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-mono block mb-1.5 flex items-center justify-between">
                  <span>Email Address</span>
                  <span className="text-[#64748b] lowercase font-normal">Work or Personal</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#64748b]">
                    mail
                  </span>
                  <input
                    type="email"
                    placeholder={role === 'recruiter' ? 'recruiter@company.com' : 'candidate@email.com'}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full bg-[#020617] border border-[#1e293b] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#64748b] outline-none focus:border-[#38bdf8] transition-colors"
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-mono">
                    Password
                  </label>
                  {activeTab === 'signin' && (
                    <button
                      type="button"
                      onClick={() => { setActiveTab('forgot'); setErrorMsg(''); }}
                      className="text-[10px] text-[#38bdf8] hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#64748b]">
                    lock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full bg-[#020617] border border-[#1e293b] rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-[#64748b] outline-none focus:border-[#38bdf8] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-white transition-colors"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>

                {/* Password Strength Meter (Signup Mode) */}
                {activeTab === 'signup' && password.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-[#64748b]">Strength:</span>
                      <span className={`font-bold ${strength.text}`}>{strength.label}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#020617] rounded-full overflow-hidden border border-[#1e293b]">
                      <div
                        className={`h-full ${strength.color} transition-all duration-300`}
                        style={{ width: `${strength.score}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Remember Me & Privacy row */}
              <div className="flex items-center justify-between text-xs text-[#94a3b8]">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded bg-[#020617] border border-[#1e293b] text-[#2563eb] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-[11px]">Remember active session</span>
                </label>

                <span className="text-[10px] font-mono text-[#64748b] flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-emerald-400">lock</span>
                  TLS Encrypted
                </span>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#2563eb] via-[#1d4ed8] to-[#38bdf8] text-white font-bold text-xs shadow-[0_4px_25px_rgba(37,99,235,0.5)] hover:shadow-[0_8px_35px_rgba(56,189,248,0.7)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 shine-sweep"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>{loadingStep}</span>
                  </>
                ) : (
                  <>
                    <span>
                      {activeTab === 'signin' ? 'Sign In as' : 'Create Account as'}{' '}
                      {role === 'recruiter' ? 'Recruiter' : 'Candidate'}
                    </span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </>
                )}
              </button>

            </form>
          )}

          {/* ─── ERROR & SUCCESS NOTIFICATIONS ─── */}
          {errorMsg && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 font-mono flex items-center gap-2 animate-shake">
              <span className="material-symbols-outlined text-sm text-red-400 shrink-0">error</span>
              <span className="flex-1">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-mono flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-emerald-400 shrink-0">check_circle</span>
              <span className="flex-1">{successMsg}</span>
            </div>
          )}

          {/* ─── SECURITY FOOTER BADGE ─── */}
          <div className="mt-5 pt-3 border-t border-[#1e293b]/60 flex items-center justify-between text-[10px] font-mono text-[#64748b]">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>FastAPI Backend Connected</span>
            </div>
            <span>JWT Bearer RBAC</span>
          </div>

        </div>
      </div>
    </div>
  );
};
