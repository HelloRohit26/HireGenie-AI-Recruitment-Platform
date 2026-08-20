import React, { useState } from 'react';
import { CandidateFlowShader } from '../3d/CandidateFlowShader';
import { CommandPalette } from '../ui/CommandPalette';
import { MobileDrawer } from '../ui/MobileDrawer';
import { SignInModal } from '../auth/SignInModal';
import { useTheme } from '../../context/ThemeContext';

interface CandidateShellProps {
  children: React.ReactNode;
  activeRoute?: string;
  onNavigate?: (route: string) => void;
}

export const CandidateShell: React.FC<CandidateShellProps> = ({
  children,
  activeRoute = '/candidate',
  onNavigate
}) => {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [recruiterAuthModalOpen, setRecruiterAuthModalOpen] = useState(false);

  const handleSwitchToRecruiter = () => {
    const token = localStorage.getItem('hg_auth_token');
    const userRole = localStorage.getItem('hg_user_role');
    if (token && (userRole === 'recruiter' || userRole === 'admin')) {
      onNavigate?.('/recruiter');
    } else {
      setRecruiterAuthModalOpen(true);
    }
  };

  const navItems = [
    { id: '/candidate', label: 'Dashboard', icon: 'dashboard' },
    { id: '/candidate/jobs', label: 'Find Jobs', icon: 'search' },
    { id: '/candidate/applications', label: 'My Applications', icon: 'assignment', badge: '1 Active' }
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans flex flex-col relative theme-transition">
      {/* GLSL Organic Flow Shader Background */}
      <CandidateFlowShader opacity={0.35} />

      {/* Candidate Header */}
      <header className="h-16 sm:h-20 border-b border-[var(--border)] bg-[var(--bg-primary)]/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20 theme-transition">
        
        {/* Brand & Nav */}
        <div className="flex items-center gap-6">
          <div
            onClick={() => onNavigate?.('/candidate')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-secondary)] flex items-center justify-center font-bold text-sm text-[var(--bg-primary)] group-hover:scale-105 transition-transform shadow-sm">
              HG
            </div>
            <div>
              <span className="text-sm font-bold text-[var(--text-primary)] tracking-tight block">HireGenie AI</span>
              <span className="text-[9px] text-[var(--accent-secondary)] font-mono block">Candidate Portal</span>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-[var(--border)]">
            {navItems.map(item => {
              const isActive = activeRoute === item.id || (item.id !== '/candidate' && activeRoute.startsWith(item.id));
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate?.(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-[var(--accent-secondary)]/15 text-[var(--accent-secondary)] border border-[var(--accent-secondary)]/30 shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]'
                  }`}
                >
                  <span className="material-symbols-outlined text-base group-hover:translate-x-0.5 transition-transform">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--accent-secondary)]/20 text-[var(--accent-secondary)]">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Global Search */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-all"
          >
            <span className="material-symbols-outlined text-sm">search</span>
            <span className="hidden sm:inline">Search jobs...</span>
            <kbd className="hidden sm:inline-block text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface-elevated)] text-[var(--text-muted)]">
              ⌘K
            </kbd>
          </button>

          {/* Global Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--accent-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-secondary)] transition-all duration-300 active:scale-90 hover:rotate-12"
            title={`Active mode: ${theme}. Click to switch.`}
          >
            <span className="material-symbols-outlined text-[18px] transition-transform duration-500 ease-out inline-block" style={{ transform: theme === 'dark' ? 'rotate(0deg)' : 'rotate(180deg)' }}>
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {/* Recruiter Switcher (Protected) */}
          <button
            onClick={handleSwitchToRecruiter}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 text-xs font-bold hover:bg-[var(--accent-primary)]/25 transition-all active:scale-95"
            title="Switch to Recruiter Command Center (Requires Recruiter Credentials)"
          >
            <span className="material-symbols-outlined text-sm">badge</span>
            Recruiter Portal
          </button>

          {/* Candidate Profile Avatar & Logout */}
          {(() => {
            const storedName = localStorage.getItem('hg_user_name') || 'Candidate User';
            const initials = storedName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'CU';
            return (
              <div className="flex items-center gap-2 pl-2 border-l border-[var(--border)]">
                <div 
                  className="w-8 h-8 rounded-full bg-[var(--accent-secondary)]/20 border border-[var(--accent-secondary)]/40 flex items-center justify-center font-bold text-xs text-[var(--accent-secondary)] shrink-0"
                  title={storedName}
                >
                  {initials}
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem('hg_auth_token');
                    localStorage.removeItem('hg_user_name');
                    localStorage.removeItem('hg_user_email');
                    localStorage.removeItem('hg_user_role');
                    if (onNavigate) onNavigate('/');
                  }}
                  className="p-1 rounded-md text-[var(--text-secondary)] hover:text-red-400 hover:bg-[var(--surface-elevated)] transition-colors"
                  title="Sign Out"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                </button>
              </div>
            );
          })()}

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <span className="material-symbols-outlined text-xl">menu</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-[1400px] w-full mx-auto relative z-10 space-y-6">
        {children}
      </main>

      {/* Mobile Drawer */}
      <MobileDrawer isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} side="left">
        <div className="w-64 h-full bg-[var(--surface)] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <span className="text-sm font-bold text-[var(--text-primary)]">Candidate Menu</span>
            <button onClick={() => setMobileMenuOpen(false)} className="text-[var(--text-secondary)]">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          <div className="space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => { onNavigate?.(item.id); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]"
              >
                <span className="material-symbols-outlined text-base">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-[var(--border)]">
            <button
              onClick={() => { setMobileMenuOpen(false); handleSwitchToRecruiter(); }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 text-xs font-bold"
            >
              <span className="material-symbols-outlined text-sm">badge</span>
              Switch to Recruiter Portal
            </button>
          </div>
        </div>
      </MobileDrawer>

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={onNavigate}
      />

      {/* Recruiter Authentication Protection Modal */}
      <SignInModal
        isOpen={recruiterAuthModalOpen}
        onClose={() => setRecruiterAuthModalOpen(false)}
        onSuccess={(role, name) => {
          if (role === 'recruiter') {
            onNavigate?.('/recruiter');
          }
        }}
        initialRole="recruiter"
        initialMessage="Recruiter Portal Protected: Please authenticate with recruiter credentials to enter the Recruiter Command Center."
      />
    </div>
  );
};
