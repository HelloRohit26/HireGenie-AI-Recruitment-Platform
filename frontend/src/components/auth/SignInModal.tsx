import React, { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

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
  initialMessage,
}) => {
  const { login: contextLogin, register: contextRegister } = useAuth();

  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [role, setRole] = useState<'recruiter' | 'candidate'>(initialRole);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [telemetryStep, setTelemetryStep] = useState('Authenticating...');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setRole(initialRole);
      setErrorMsg(initialMessage || '');
      setSuccessMsg('');
      setResetSent(false);
    }
  }, [isOpen, initialRole, initialMessage]);

  if (!isOpen) return null;

  // Real-time password criteria evaluation
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const calculatePasswordStrength = () => {
    if (!password) return { score: 0, label: 'None', color: 'bg-slate-700', text: 'text-slate-400' };
    let s = 0;
    if (password.length >= 6) s += 25;
    if (hasMinLength) s += 25;
    if (hasUpper) s += 15;
    if (hasNumber) s += 15;
    if (hasSpecial) s += 20;

    if (s <= 30) return { score: s, label: 'Weak', color: 'bg-red-500', text: 'text-red-400' };
    if (s <= 65) return { score: s, label: 'Moderate', color: 'bg-amber-500', text: 'text-amber-400' };
    if (s <= 85) return { score: s, label: 'Strong', color: 'bg-blue-500', text: 'text-blue-400' };
    return { score: 100, label: 'Bulletproof ✨', color: 'bg-emerald-500', text: 'text-emerald-400' };
  };

  const strength = calculatePasswordStrength();

  // Quick fill for demo / testing
  const fillDemoCredentials = (demoRole: 'recruiter' | 'admin') => {
    if (demoRole === 'recruiter') {
      setEmail('hr@hiregenie.ai');
      setPassword('mockhashedpassword');
      setRole('recruiter');
      setActiveTab('signin');
      setErrorMsg('');
    } else {
      setEmail('admin@hiregenie.ai');
      setPassword('mockhashedpassword');
      setRole('recruiter');
      setActiveTab('signin');
      setErrorMsg('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    // Handle Forgot Password
    if (activeTab === 'forgot') {
      if (!email.trim()) {
        setErrorMsg('Please enter your registered email address.');
        setIsLoading(false);
        return;
      }
      try {
        setTelemetryStep('Querying PostgreSQL database...');
        const res = await authService.forgotPassword(email.trim());
        setResetSent(true);
        setSuccessMsg(res.data?.message || `Password reset instructions dispatched to ${email.trim()}`);
      } catch (err: any) {
        setErrorMsg(err?.message || 'Unable to dispatch reset instructions. Please try again.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Input Validation
    if (!email.trim() || !password || (activeTab === 'signup' && !fullName.trim())) {
      setErrorMsg('Please fill in all required fields.');
      setIsLoading(false);
      return;
    }

    try {
      if (activeTab === 'signup') {
        setTelemetryStep('Writing user identity to PostgreSQL...');
        await new Promise((r) => setTimeout(r, 200));

        setTelemetryStep('Hashing credentials with bcrypt & generating JWT...');
        const authData = await contextRegister({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          role,
        });

        setSuccessMsg('Account created & stored in PostgreSQL! Initializing workspace...');
        const activeName = authData.user.name || fullName.trim();
        const effectiveRole = authData.role || role;

        setTimeout(() => {
          onSuccess(effectiveRole, activeName);
          onClose();
        }, 500);
      } else {
        setTelemetryStep('Verifying credentials against PostgreSQL...');
        await new Promise((r) => setTimeout(r, 200));

        setTelemetryStep('Validating cryptographic token...');
        const authData = await contextLogin({
          email: email.trim(),
          password,
          role,
        });

        setSuccessMsg('Session authenticated! Redirecting to workspace...');
        const activeName = authData.user.name || email.split('@')[0];
        const effectiveRole = authData.role || role;

        setTimeout(() => {
          onSuccess(effectiveRole, activeName);
          onClose();
        }, 400);
      }
    } catch (err: any) {
      console.error('[SignInModal] Auth error:', err);
      const msg = err?.message || err?.details?.detail || 'Authentication failed. Please verify credentials.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      {/* Dynamic Animated Glass Backdrop */}
      <div className="fixed inset-0 bg-[#020617]/85 backdrop-blur-xl transition-opacity duration-300" />

      {/* Ambient Floating Glow Orbs */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none animate-float-slow" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" />

      {/* Main Glassmorphic Modal Card */}
      <div
        className="relative w-full max-w-lg bg-[#070e24]/95 border border-[#1e3a8a]/40 rounded-3xl shadow-[0_20px_70px_rgba(0,0,0,0.8),0_0_50px_rgba(37,99,235,0.2)] overflow-hidden z-10 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Shimmering Gradient Border */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#38bdf8] to-transparent opacity-80" />

        {/* Modal Content */}
        <div className="p-6 sm:p-8">
          {/* Header Bar */}
          <div className="flex items-start justify-between gap-4 mb-5">
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
                    PostgreSQL Live
                  </span>
                </div>
                <p className="text-xs text-[#94a3b8]">
                  TalentOS Identity Gate • Encrypted RBAC
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

          {/* ─── ROLE SELECTOR CARDS ─── */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {/* Recruiter Role */}
            <button
              type="button"
              onClick={() => {
                setRole('recruiter');
                setErrorMsg('');
              }}
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
                <div
                  className={`p-1.5 rounded-lg ${
                    role === 'recruiter'
                      ? 'bg-[#2563eb] text-white shadow-md'
                      : 'bg-[#1e293b] text-[#94a3b8]'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">corporate_fare</span>
                </div>
                <span
                  className={`text-xs font-bold ${
                    role === 'recruiter' ? 'text-white' : 'text-[#cbd5e1]'
                  }`}
                >
                  Recruiter Portal
                </span>
              </div>
              <p className="text-[10px] text-[#94a3b8] line-clamp-2 leading-snug">
                Post jobs, AI candidate screening & autonomous voice rooms.
              </p>
            </button>

            {/* Candidate Role */}
            <button
              type="button"
              onClick={() => {
                setRole('candidate');
                setErrorMsg('');
              }}
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
                <div
                  className={`p-1.5 rounded-lg ${
                    role === 'candidate'
                      ? 'bg-[#0891b2] text-white shadow-md'
                      : 'bg-[#1e293b] text-[#94a3b8]'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">person</span>
                </div>
                <span
                  className={`text-xs font-bold ${
                    role === 'candidate' ? 'text-white' : 'text-[#cbd5e1]'
                  }`}
                >
                  Candidate Portal
                </span>
              </div>
              <p className="text-[10px] text-[#94a3b8] line-clamp-2 leading-snug">
                Browse tech jobs, submit resumes, take AI interview rounds.
              </p>
            </button>
          </div>

          {/* ─── SLIDING TAB SELECTOR ─── */}
          <div className="relative flex items-center p-1 bg-[#020617] border border-[#1e293b] rounded-2xl mb-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('signin');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 z-10 ${
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
              onClick={() => {
                setActiveTab('signup');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 z-10 ${
                activeTab === 'signup'
                  ? 'bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white shadow-[0_2px_12px_rgba(37,99,235,0.4)]'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-sm">person_add</span>
              <span>Create Account</span>
            </button>
          </div>

          {/* ─── QUICK DEMO LOGIN CHIPS (DEVELOPMENT SHORTCUT) ─── */}
          {activeTab === 'signin' && (
            <div className="flex items-center justify-between gap-2 p-2 mb-4 bg-[#0a122e]/60 border border-[#1e293b] rounded-xl text-[11px]">
              <span className="text-[#64748b] font-mono flex items-center gap-1">
                <span className="material-symbols-outlined text-xs text-amber-400">bolt</span>
                Quick Demo:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('recruiter')}
                  className="px-2.5 py-1 rounded-lg bg-[#1e293b]/80 hover:bg-[#2563eb]/30 border border-[#334155] hover:border-[#38bdf8] text-[#38bdf8] font-mono text-[10px] transition-colors"
                  title="Fill Recruiter Credentials (hr@hiregenie.ai)"
                >
                  Recruiter
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('admin')}
                  className="px-2.5 py-1 rounded-lg bg-[#1e293b]/80 hover:bg-[#8b5cf6]/30 border border-[#334155] hover:border-[#a78bfa] text-[#a78bfa] font-mono text-[10px] transition-colors"
                  title="Fill Admin Credentials (admin@hiregenie.ai)"
                >
                  Admin
                </button>
              </div>
            </div>
          )}

          {/* ─── FORGOT PASSWORD TAB ─── */}
          {activeTab === 'forgot' && (
            <form onSubmit={handleSubmit} className="space-y-4 py-1">
              <div className="p-3.5 rounded-2xl bg-[#0b1739]/60 border border-[#1e3a8a]/40 text-xs text-[#94a3b8] flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[#38bdf8] text-base shrink-0 mt-0.5">
                  info
                </span>
                <span>
                  Enter your registered account email. If registered in PostgreSQL, recovery
                  instructions will be dispatched immediately.
                </span>
              </div>

              <div>
                <label className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-mono block mb-1.5">
                  Account Email
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#64748b]">
                    mail
                  </span>
                  <input
                    type="email"
                    placeholder="user@hiregenie.ai"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-[#020617] border border-[#1e293b] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#64748b] outline-none focus:border-[#38bdf8] transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || resetSent}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white font-bold text-xs shadow-lg shadow-[0_4px_20px_rgba(37,99,235,0.4)] hover:shadow-[0_8px_30px_rgba(56,189,248,0.6)] transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>{telemetryStep}</span>
                  </>
                ) : resetSent ? (
                  <>
                    <span className="material-symbols-outlined text-sm text-emerald-400">
                      check_circle
                    </span>
                    <span>Reset Instructions Dispatched</span>
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
                  onClick={() => {
                    setActiveTab('signin');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
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
                      placeholder={role === 'recruiter' ? 'e.g. Vikram Sharma' : 'e.g. Rohit Maurya'}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
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
                  <span className="text-[#64748b] lowercase font-normal">Stored in PostgreSQL</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#64748b]">
                    mail
                  </span>
                  <input
                    type="email"
                    placeholder={
                      role === 'recruiter' ? 'recruiter@hiregenie.ai' : 'candidate@email.com'
                    }
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                      onClick={() => {
                        setActiveTab('forgot');
                        setErrorMsg('');
                      }}
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
                    onChange={(e) => setPassword(e.target.value)}
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

                {/* Password Strength Meter & Badges (Signup Mode) */}
                {activeTab === 'signup' && password.length > 0 && (
                  <div className="mt-2.5 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-[#64748b]">Security Strength:</span>
                      <span className={`font-bold ${strength.text}`}>{strength.label}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#020617] rounded-full overflow-hidden border border-[#1e293b]">
                      <div
                        className={`h-full ${strength.color} transition-all duration-300`}
                        style={{ width: `${strength.score}%` }}
                      />
                    </div>
                    {/* Live Criteria Indicators */}
                    <div className="grid grid-cols-2 gap-1 pt-1 text-[10px] font-mono">
                      <div
                        className={`flex items-center gap-1 ${
                          hasMinLength ? 'text-emerald-400' : 'text-[#64748b]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xs">
                          {hasMinLength ? 'check' : 'circle'}
                        </span>
                        <span>8+ Characters</span>
                      </div>
                      <div
                        className={`flex items-center gap-1 ${
                          hasUpper ? 'text-emerald-400' : 'text-[#64748b]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xs">
                          {hasUpper ? 'check' : 'circle'}
                        </span>
                        <span>Uppercase letter</span>
                      </div>
                      <div
                        className={`flex items-center gap-1 ${
                          hasNumber ? 'text-emerald-400' : 'text-[#64748b]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xs">
                          {hasNumber ? 'check' : 'circle'}
                        </span>
                        <span>Number (0-9)</span>
                      </div>
                      <div
                        className={`flex items-center gap-1 ${
                          hasSpecial ? 'text-emerald-400' : 'text-[#64748b]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xs">
                          {hasSpecial ? 'check' : 'circle'}
                        </span>
                        <span>Special symbol</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Remember Me & TLS row */}
              <div className="flex items-center justify-between text-xs text-[#94a3b8]">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded bg-[#020617] border border-[#1e293b] text-[#2563eb] focus:ring-0 cursor-pointer"
                  />
                  <span className="text-[11px]">Remember session (7 days)</span>
                </label>

                <span className="text-[10px] font-mono text-[#64748b] flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-emerald-400">lock</span>
                  Bcrypt + JWT
                </span>
              </div>

              {/* Submit CTA Button with Dynamic Shimmer */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#2563eb] via-[#1d4ed8] to-[#38bdf8] text-white font-bold text-xs shadow-[0_4px_25px_rgba(37,99,235,0.5)] hover:shadow-[0_8px_35px_rgba(56,189,248,0.7)] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>{telemetryStep}</span>
                  </>
                ) : (
                  <>
                    <span>
                      {activeTab === 'signin' ? 'Sign In as' : 'Register Account as'}{' '}
                      {role === 'recruiter' ? 'Recruiter' : 'Candidate'}
                    </span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ─── ERROR & SUCCESS ALERTS ─── */}
          {errorMsg && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 font-mono flex items-center gap-2 animate-shake">
              <span className="material-symbols-outlined text-sm text-red-400 shrink-0">error</span>
              <span className="flex-1">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-mono flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-emerald-400 shrink-0">
                check_circle
              </span>
              <span className="flex-1">{successMsg}</span>
            </div>
          )}

          {/* ─── SECURITY FOOTER BADGE ─── */}
          <div className="mt-5 pt-3 border-t border-[#1e293b]/60 flex items-center justify-between text-[10px] font-mono text-[#64748b]">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>PostgreSQL 16+ Connected</span>
            </div>
            <span>FastAPI RBAC Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
};
