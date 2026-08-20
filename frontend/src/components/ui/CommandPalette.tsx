import React, { useState, useEffect, useRef } from 'react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (route: string) => void;
}

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: string;
  route?: string;
  category: string;
}

const commands: CommandItem[] = [
  { id: 'cmd-1', label: 'Command Center', description: 'Dashboard overview', icon: 'dashboard', route: '/recruiter', category: 'Navigation' },
  { id: 'cmd-2', label: 'Jobs', description: 'Manage requisitions', icon: 'work', route: '/recruiter/jobs', category: 'Navigation' },
  { id: 'cmd-3', label: 'Candidates', description: 'Browse talent pool', icon: 'groups', route: '/recruiter/candidates', category: 'Navigation' },
  { id: 'cmd-4', label: 'AI Screening', description: 'View screening queue', icon: 'psychology', route: '/recruiter/screening', category: 'Navigation' },
  { id: 'cmd-5', label: 'Interviews', description: 'Manage interviews', icon: 'video_camera_front', route: '/recruiter/interviews', category: 'Navigation' },
  { id: 'cmd-6', label: 'Insights', description: 'Analytics & reports', icon: 'analytics', route: '/recruiter/insights', category: 'Navigation' },
  { id: 'cmd-7', label: 'Trust & Safety', description: 'Compliance controls', icon: 'verified_user', route: '/recruiter/trust-safety', category: 'Navigation' },
  { id: 'cmd-8', label: 'Settings', description: 'Platform configuration', icon: 'settings', route: '/recruiter/settings', category: 'Navigation' },
  { id: 'cmd-9', label: 'Help & Docs', description: 'Documentation center', icon: 'help_outline', route: '/help', category: 'Navigation' },
  { id: 'cmd-10', label: 'Priya Sharma', description: 'AI Engineer — Shortlisted (94%)', icon: 'person', route: '/recruiter/candidates', category: 'Candidates' },
  { id: 'cmd-11', label: 'Alex Chen', description: 'AI Engineer — Interview (91%)', icon: 'person', route: '/recruiter/candidates', category: 'Candidates' },
  { id: 'cmd-12', label: 'Sarah Johnson', description: 'Data Scientist — Final Review (96%)', icon: 'person', route: '/recruiter/candidates', category: 'Candidates' },
  { id: 'cmd-13', label: 'AI Engineer', description: '2,481 applicants · Active', icon: 'work', route: '/recruiter/jobs/job-1', category: 'Jobs' },
  { id: 'cmd-14', label: 'Data Scientist', description: '1,204 applicants · Active', icon: 'work', route: '/recruiter/jobs/job-2', category: 'Jobs' },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle handled by parent
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.description.toLowerCase().includes(query.toLowerCase())
  );

  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  const handleSelect = (cmd: CommandItem) => {
    if (cmd.route && onNavigate) {
      onNavigate(cmd.route);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Palette */}
      <div
        className="relative w-full max-w-lg mx-4 bg-[#181815] border border-[#2A2A28] rounded-xl shadow-2xl shadow-black/50 overflow-hidden animate-fadeIn"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2A2A28]">
          <span className="material-symbols-outlined text-[#D6A85F] text-xl">search</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search commands, candidates, jobs..."
            className="flex-1 bg-transparent text-sm text-[#F4F1E9] placeholder-[#A1A19A] outline-none font-sans"
          />
          <kbd className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#20201C] text-[#A1A19A] border border-[#2A2A28]">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {Object.keys(grouped).length === 0 ? (
            <div className="py-8 text-center text-[#A1A19A] text-xs">
              <span className="material-symbols-outlined text-2xl opacity-50 block mb-2">search_off</span>
              No results for "{query}"
            </div>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="mb-2">
                <div className="px-3 py-1.5 text-[9px] font-mono uppercase tracking-wider text-[#A1A19A] font-bold">
                  {category}
                </div>
                {items.map(cmd => (
                  <button
                    key={cmd.id}
                    onClick={() => handleSelect(cmd)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-[#20201C] transition-colors group"
                  >
                    <span className="material-symbols-outlined text-lg text-[#A1A19A] group-hover:text-[#F4C377] transition-colors">
                      {cmd.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-[#F4F1E9] truncate">{cmd.label}</div>
                      <div className="text-[10px] text-[#A1A19A] truncate">{cmd.description}</div>
                    </div>
                    <span className="material-symbols-outlined text-sm text-[#A1A19A] opacity-0 group-hover:opacity-100 transition-opacity">
                      arrow_forward
                    </span>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[#2A2A28] flex items-center justify-between text-[9px] text-[#A1A19A] font-mono">
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>ESC Close</span>
        </div>
      </div>
    </div>
  );
};
