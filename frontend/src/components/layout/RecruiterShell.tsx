import React, { useState, useEffect } from 'react';
import { RecruiterSidebar } from './RecruiterSidebar';
import { RecruiterHeader } from './RecruiterHeader';
import { TalentConstellation } from '../3d/TalentConstellation';
import { CommandPalette } from '../ui/CommandPalette';
import { MobileDrawer } from '../ui/MobileDrawer';
import { useTheme } from '../../context/ThemeContext';

interface RecruiterShellProps {
  children: React.ReactNode;
  activeRoute?: string;
  onNavigate?: (route: string) => void;
  onCreateJob?: () => void;
}

export const RecruiterShell: React.FC<RecruiterShellProps> = ({
  children,
  activeRoute = '/recruiter',
  onNavigate,
  onCreateJob
}) => {
  const { theme, toggleTheme } = useTheme();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Subtle mouse position for ambient background parallax
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });



  // Throttled mouse move listener for background parallax
  useEffect(() => {
    let lastTime = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastTime < 30) return; // limit to ~30fps sampling
      lastTime = now;
      const x = (e.clientX / window.innerWidth - 0.5) * 20; // max ±10px
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // ⌘K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigate = (route: string) => {
    setMobileMenuOpen(false);
    onNavigate?.(route);
  };



  return (
    <div className="min-h-screen flex flex-col font-sans relative bg-[var(--bg-primary)] text-[var(--text-primary)] theme-transition">
      {/* 3D WEBGL TALENT CONSTELLATION AMBIENT BACKGROUND */}
      <TalentConstellation
        opacity={theme === 'dark' ? 0.35 : 0.15}
        theme={theme}
        parallaxX={mousePos.x}
        parallaxY={mousePos.y}
      />

      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* DESKTOP SIDEBAR */}
        <div className="hidden md:block">
          <RecruiterSidebar
            activeRoute={activeRoute}
            onNavigate={handleNavigate}
            collapsed={sidebarCollapsed}
          />
        </div>

        {/* MOBILE DRAWER SIDEBAR */}
        <MobileDrawer
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          side="left"
        >
          <div className="w-64 h-full relative">
            <RecruiterSidebar
              activeRoute={activeRoute}
              onNavigate={handleNavigate}
              collapsed={false}
            />
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors z-10"
              aria-label="Close menu"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </MobileDrawer>

        {/* MAIN WORKSPACE CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* HEADER */}
          <RecruiterHeader
            theme={theme}
            onToggleTheme={toggleTheme}
            onCreateJob={onCreateJob}
            onOpenSearch={() => setCommandPaletteOpen(true)}
            onToggleNotifications={() => setNotificationsOpen(!notificationsOpen)}
            onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
            onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
            notificationsOpen={notificationsOpen}
            onNavigate={handleNavigate}
          />

          {/* PAGE CONTENT */}
          <main className="flex-1 p-4 sm:p-6 md:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
            {children}
          </main>
        </div>
      </div>

      {/* COMMAND PALETTE */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={handleNavigate}
      />
    </div>
  );
};
