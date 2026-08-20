import React from 'react';
import { NotificationPanel } from '../ui/NotificationPanel';
import { ThemeMode } from '../../types';

interface RecruiterHeaderProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  onCreateJob?: () => void;
  onOpenSearch?: () => void;
  onToggleNotifications?: () => void;
  onToggleMobileMenu?: () => void;
  onToggleSidebar?: () => void;
  notificationsOpen?: boolean;
  onNavigate?: (route: string) => void;
}

export const RecruiterHeader: React.FC<RecruiterHeaderProps> = ({
  theme,
  onToggleTheme,
  onCreateJob,
  onOpenSearch,
  onToggleNotifications,
  onToggleMobileMenu,
  onToggleSidebar,
  notificationsOpen = false,
  onNavigate
}) => {
  const storedName = localStorage.getItem('hg_user_name') || 'Recruiter Admin';
  const firstName = storedName.split(' ')[0];

  return (
    <header className="h-16 sm:h-20 border-b border-[var(--border)] bg-[var(--bg-primary)]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 theme-transition">
      {/* LEFT: HAMBURGER (mobile) + SIDEBAR TOGGLE (desktop) + GREETING */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile hamburger */}
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-all active:scale-95"
          aria-label="Open menu"
        >
          <span className="material-symbols-outlined text-xl">menu</span>
        </button>

        {/* Desktop sidebar collapse */}
        <button
          onClick={onToggleSidebar}
          className="hidden md:flex p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-all active:scale-95"
          aria-label="Toggle sidebar"
        >
          <span className="material-symbols-outlined text-lg">menu</span>
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-base sm:text-xl font-bold tracking-tight text-[var(--text-primary)] truncate">
              Welcome, {firstName}.
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--status-success)]/15 text-[var(--status-success)] border border-[var(--status-success)]/30 text-[11px] font-mono shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-success)] animate-pulse" />
              AI Engine Operational
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 hidden sm:block truncate">
            Your autonomous hiring engine is live. Requisitions and multi-agent pipeline active.
          </p>
        </div>
      </div>

      {/* RIGHT: SEARCH, NOTIFICATIONS, THEME & PRIMARY ACTION */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* GLOBAL SEARCH TRIGGER */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:shadow-sm transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[16px] text-[var(--text-secondary)]">search</span>
          <span className="hidden lg:inline">Search candidates, jobs...</span>
          <kbd className="hidden lg:inline-block text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface-elevated)] text-[var(--text-muted)] border border-[var(--border)]">
            ⌘K
          </kbd>
        </button>

        {/* NOTIFICATIONS BUTTON */}
        <div className="relative">
          <button
            onClick={onToggleNotifications}
            aria-label="Notifications"
            className="relative p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--accent-primary)]" />
          </button>

          {/* Notification Panel */}
          <NotificationPanel
            isOpen={notificationsOpen}
            onClose={() => onToggleNotifications?.()}
            onNavigate={onNavigate}
          />
        </div>

        {/* THEME TOGGLE WITH ROTATING MOON/SUN ANIMATION */}
        <button
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--accent-primary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-all duration-300 active:scale-90 hover:rotate-12"
          title={`Active mode: ${theme}. Click to switch.`}
        >
          <span className="material-symbols-outlined text-[18px] transition-transform duration-500 ease-out inline-block" style={{ transform: theme === 'dark' ? 'rotate(0deg)' : 'rotate(180deg)' }}>
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>

        {/* PRIMARY ACTION BUTTON */}
        {onCreateJob && (
          <button
            onClick={onCreateJob}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-[#171815] text-xs font-bold shadow-md hover:brightness-110 transition-all duration-150 active:scale-95 hover:-translate-y-0.5"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Create Job</span>
          </button>
        )}
      </div>
    </header>
  );
};
