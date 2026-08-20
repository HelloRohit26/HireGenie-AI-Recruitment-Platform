import React from 'react';

interface RecruiterSidebarProps {
  activeRoute: string;
  onNavigate?: (route: string) => void;
  collapsed?: boolean;
}

export const RecruiterSidebar: React.FC<RecruiterSidebarProps> = ({
  activeRoute = '/recruiter',
  onNavigate,
  collapsed = false
}) => {
  const storedName = localStorage.getItem('hg_user_name') || 'Recruiter Admin';
  const storedEmail = localStorage.getItem('hg_user_email') || 'recruiter@hiregenie.ai';
  const initials = storedName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'RA';

  const handleLogout = () => {
    localStorage.removeItem('hg_token');
    localStorage.removeItem('hg_user_name');
    localStorage.removeItem('hg_user_email');
    localStorage.removeItem('hg_user_role');
    if (onNavigate) onNavigate('/');
  };

  const mainMenuItems = [
    { id: '/recruiter', label: 'Command Center', icon: 'dashboard', badge: 'Live' },
    { id: '/recruiter/jobs', label: 'Jobs', icon: 'work', count: '12' },
    { id: '/recruiter/candidates', label: 'Candidates', icon: 'groups', count: '10.8k' },
    { id: '/recruiter/screening', label: 'AI Screening', icon: 'psychology', badge: 'Auto' },
    { id: '/recruiter/interviews', label: 'Interviews', icon: 'video_camera_front', count: '96' },
    { id: '/recruiter/insights', label: 'Insights', icon: 'analytics' },
    { id: '/recruiter/trust-safety', label: 'Trust & Safety', icon: 'verified_user', badge: '10/10' }
  ];

  const bottomMenuItems = [
    { id: '/recruiter/settings', label: 'Settings', icon: 'settings' },
    { id: '/help', label: 'Help & Docs', icon: 'help_outline' }
  ];

  const handleItemClick = (id: string) => {
    if (onNavigate) {
      onNavigate(id);
    }
  };

  return (
    <aside className={`border-r border-[var(--border)] bg-[var(--bg-primary)]/90 backdrop-blur-md flex flex-col justify-between transition-all duration-300 z-30 theme-transition ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      {/* TOP SECTION: BRAND & NAVIGATION */}
      <div className="p-4">
        {/* BRAND HEADER */}
        <div
          onClick={() => handleItemClick('/recruiter')}
          className="flex items-center gap-3 cursor-pointer group mb-6 px-1"
        >
          <div className="w-9 h-9 rounded-xl bg-[var(--accent-primary)] flex items-center justify-center font-bold text-sm text-[#171815] shadow-md group-hover:scale-105 transition-transform shrink-0">
            HG
          </div>
          {!collapsed && (
            <div className="truncate">
              <span className="text-sm font-bold text-[var(--text-primary)] tracking-tight block truncate">HireGenie AI</span>
              <span className="text-[10px] text-[var(--accent-primary)] font-mono block truncate">Recruiter Portal</span>
            </div>
          )}
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="space-y-1">
          {mainMenuItems.map(item => {
            const isActive = activeRoute === item.id || (item.id !== '/recruiter' && activeRoute.startsWith(item.id));
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`material-symbols-outlined text-[20px] shrink-0 ${
                    isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
                  }`}>
                    {item.icon}
                  </span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!collapsed && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.badge && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]">
                        {item.badge}
                      </span>
                    )}
                    {item.count && (
                      <span className="text-[10px] font-mono text-[var(--text-muted)] px-1.5 py-0.5 rounded bg-[var(--surface-elevated)]">
                        {item.count}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* BOTTOM SECTION: SETTINGS & RECRUITER PROFILE */}
      <div className="p-3 border-t border-[var(--border)] space-y-1">
        {bottomMenuItems.map(item => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item.id)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-all group"
          >
            <span className="material-symbols-outlined text-[20px] text-[var(--text-secondary)] group-hover:translate-x-0.5 transition-transform">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}

        {/* RECRUITER PROFILE CARD */}
        <div className="pt-2 mt-2 border-t border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/40 flex items-center justify-center font-bold text-xs text-[var(--accent-primary)] shrink-0">
              {initials}
            </div>
            {!collapsed && (
              <div className="truncate">
                <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{storedName}</p>
                <p className="text-[10px] text-[var(--text-secondary)] truncate">{storedEmail}</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-red-400 hover:bg-[var(--surface-elevated)] transition-colors"
              title="Sign Out"
            >
              <span className="material-symbols-outlined text-base">logout</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
