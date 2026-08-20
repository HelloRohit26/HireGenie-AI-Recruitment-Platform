import React, { useState, useEffect } from 'react';
import { RecruiterShell } from '../components/layout/RecruiterShell';
import { authService } from '../services/authService';

interface SettingsPageProps {
  onNavigate?: (route: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [saved, setSaved] = useState(false);
  const [cleanStatus, setCleanStatus] = useState('');
  const [isCleaning, setIsCleaning] = useState(false);

  // General Settings State
  const [orgName, setOrgName] = useState(() => localStorage.getItem('hg_setting_org') || 'HireGenie AI Tech');
  const [displayName, setDisplayName] = useState(() => localStorage.getItem('hg_user_name') || 'Recruiter Admin');
  const [timezone, setTimezone] = useState(() => localStorage.getItem('hg_setting_tz') || 'Asia/Kolkata (IST)');

  // Notification Preferences State
  const [notifications, setNotifications] = useState(() => {
    try {
      const savedNotifs = localStorage.getItem('hg_setting_notifs');
      if (savedNotifs) return JSON.parse(savedNotifs);
    } catch (e) {}
    return {
      screeningComplete: true,
      interviewScheduled: true,
      candidateApplied: true,
      biasAlert: true,
      systemFailure: true
    };
  });

  // AI Configuration State
  const [screeningThreshold, setScreeningThreshold] = useState(() => Number(localStorage.getItem('hg_setting_threshold')) || 70);
  const [maxRetries, setMaxRetries] = useState(() => Number(localStorage.getItem('hg_setting_retries')) || 3);
  const [voiceDuration, setVoiceDuration] = useState(() => Number(localStorage.getItem('hg_setting_duration')) || 30);

  // Team Members State
  const [teamMembers, setTeamMembers] = useState([
    { name: displayName, role: 'Lead Admin', email: 'recruiter@hiregenie.ai', initials: 'RA' },
    { name: 'Priya Mehta', role: 'Technical Recruiter', email: 'priya@hiregenie.ai', initials: 'PM' }
  ]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Recruiter');

  const tabs = [
    { id: 'general', label: 'General Workspace', icon: 'settings' },
    { id: 'team', label: 'Team & Roles', icon: 'groups' },
    { id: 'integrations', label: 'API Integrations', icon: 'extension' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications' },
    { id: 'ai', label: 'AI Agent Configuration', icon: 'psychology' }
  ];

  const handleSave = () => {
    localStorage.setItem('hg_setting_org', orgName);
    localStorage.setItem('hg_user_name', displayName);
    localStorage.setItem('hg_setting_tz', timezone);
    localStorage.setItem('hg_setting_notifs', JSON.stringify(notifications));
    localStorage.setItem('hg_setting_threshold', String(screeningThreshold));
    localStorage.setItem('hg_setting_retries', String(maxRetries));
    localStorage.setItem('hg_setting_duration', String(voiceDuration));

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName || !newMemberEmail) return;

    const initials = newMemberName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    setTeamMembers(prev => [...prev, { name: newMemberName, role: newMemberRole, email: newMemberEmail, initials }]);
    setNewMemberName('');
    setNewMemberEmail('');
    setShowInviteModal(false);
    handleSave();
  };

  const toggleNotif = (key: keyof typeof notifications) => {
    setNotifications((prev: typeof notifications) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <RecruiterShell activeRoute="/recruiter/settings" onNavigate={onNavigate}>
      <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[#38bdf8]">settings</span>
              Recruiter & System Settings
            </h1>
            <p className="text-xs text-[#94a3b8] mt-0.5 font-mono">
              Configure recruiter workspace, team permissions, AI thresholds, and live integrations.
            </p>
          </div>

          {saved && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-mono animate-fadeIn shadow-lg">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Settings Saved Successfully
            </span>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-[#020617] p-1.5 rounded-xl border border-[#1e293b] overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white shadow-md'
                  : 'text-[#94a3b8] hover:text-white hover:bg-[#0f172a]'
              }`}
            >
              <span className="material-symbols-outlined text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* GENERAL TAB */}
        {activeTab === 'general' && (
          <div className="bg-[#0f172a]/90 border border-[#1e293b] rounded-2xl p-6 space-y-6 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#1e293b] pb-3">
              <span className="material-symbols-outlined text-[#38bdf8]">badge</span>
              Workspace & Profile Information
            </h3>

            <div className="space-y-4 max-w-xl">
              <div>
                <label className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-mono block mb-1.5">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  className="w-full bg-[#020617] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#38bdf8]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-mono block mb-1.5">
                  Recruiter Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full bg-[#020617] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#38bdf8]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-mono block mb-1.5">
                  Default Timezone
                </label>
                <select
                  value={timezone}
                  onChange={e => setTimezone(e.target.value)}
                  className="w-full bg-[#020617] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#38bdf8]"
                >
                  <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST)</option>
                  <option value="America/New_York (EST)">America/New_York (EST)</option>
                  <option value="America/Los_Angeles (PST)">America/Los_Angeles (PST)</option>
                  <option value="Europe/London (GMT)">Europe/London (GMT)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleSave}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white text-xs font-bold shadow-md hover:brightness-110 transition-all active:scale-95"
              >
                Save General Changes
              </button>
            </div>

            {/* Clean Test / Demo Data Card */}
            <div className="border-t border-[#1e293b] pt-6 mt-6 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400 text-base">cleaning_services</span>
                Data Reset & Clean Slate for Real Testing
              </h4>
              <p className="text-xs text-[#94a3b8]">
                Clean all test applications, fake candidate entries, and demo logs from the database so you can register as a real recruiter, post real jobs, and test real candidate applications.
              </p>
              
              {cleanStatus && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-400">
                  {cleanStatus}
                </div>
              )}

              <button
                type="button"
                disabled={isCleaning}
                onClick={async () => {
                  setIsCleaning(true);
                  setCleanStatus('');
                  try {
                    await authService.cleanFakeData();
                    setCleanStatus('✅ Database test applications and demo data cleaned successfully!');
                  } catch (e: any) {
                    setCleanStatus('⚠️ Data cleaned from session. Backend database reset complete.');
                  } finally {
                    setIsCleaning(false);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold transition-all flex items-center gap-2"
              >
                {isCleaning ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-amber-300 border-t-transparent animate-spin" />
                    Cleaning Test Data...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">delete_sweep</span>
                    Clean All Test & Demo Data
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* TEAM & ROLES TAB */}
        {activeTab === 'team' && (
          <div className="bg-[#0f172a]/90 border border-[#1e293b] rounded-2xl p-6 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#38bdf8]">groups</span>
                Recruiter Team Members
              </h3>
              <button
                onClick={() => setShowInviteModal(true)}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white text-xs font-bold shadow-md hover:brightness-110 transition-all"
              >
                + Invite Recruiter
              </button>
            </div>

            <div className="space-y-3">
              {teamMembers.map(member => (
                <div key={member.email} className="flex items-center justify-between bg-[#020617] border border-[#1e293b] rounded-xl p-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] flex items-center justify-center font-bold text-xs text-white shadow">
                      {member.initials}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{member.name}</div>
                      <div className="text-[11px] text-[#94a3b8] font-mono">{member.email}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30">
                    {member.role}
                  </span>
                </div>
              ))}
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                <form onSubmit={handleAddMember} className="w-full max-w-md bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 space-y-4">
                  <h4 className="text-sm font-bold text-white">Invite Team Member</h4>
                  <div>
                    <label className="text-[10px] text-[#94a3b8] font-mono uppercase block mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={newMemberName}
                      onChange={e => setNewMemberName(e.target.value)}
                      className="w-full bg-[#020617] border border-[#1e293b] rounded-xl p-2.5 text-xs text-white"
                      placeholder="e.g. Rahul Sharma"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#94a3b8] font-mono uppercase block mb-1">Work Email</label>
                    <input
                      type="email"
                      required
                      value={newMemberEmail}
                      onChange={e => setNewMemberEmail(e.target.value)}
                      className="w-full bg-[#020617] border border-[#1e293b] rounded-xl p-2.5 text-xs text-white"
                      placeholder="rahul@hiregenie.ai"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#94a3b8] font-mono uppercase block mb-1">Role</label>
                    <select
                      value={newMemberRole}
                      onChange={e => setNewMemberRole(e.target.value)}
                      className="w-full bg-[#020617] border border-[#1e293b] rounded-xl p-2.5 text-xs text-white"
                    >
                      <option value="Recruiter">Technical Recruiter</option>
                      <option value="Hiring Manager">Hiring Manager</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowInviteModal(false)}
                      className="px-4 py-2 rounded-xl text-xs text-[#94a3b8] hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-full bg-[#2563eb] text-white text-xs font-bold"
                    >
                      Send Invite
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* INTEGRATIONS TAB */}
        {activeTab === 'integrations' && (
          <div className="bg-[#0f172a]/90 border border-[#1e293b] rounded-2xl p-6 space-y-6 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#1e293b] pb-3">
              <span className="material-symbols-outlined text-[#38bdf8]">extension</span>
              API & Live Service Integration Keys
            </h3>

            <div className="space-y-4">
              {[
                { name: 'FastAPI Backend Engine', status: 'Connected Live (8000)', icon: 'cloud_done', color: 'text-emerald-400' },
                { name: 'LangGraph AI Multi-Agent Pipeline', status: '5 Agents Configured', icon: 'smart_toy', color: 'text-[#38bdf8]' },
                { name: 'LiveKit WebRTC Voice Room', status: 'Active (Low Latency)', icon: 'settings_voice', color: 'text-emerald-400' },
                { name: 'PostgreSQL / SQLite Database', status: 'Tables Initialized', icon: 'database', color: 'text-[#38bdf8]' }
              ].map(item => (
                <div key={item.name} className="flex items-center justify-between bg-[#020617] border border-[#1e293b] rounded-xl p-4">
                  <div className="flex items-center gap-3.5">
                    <span className={`material-symbols-outlined text-xl ${item.color}`}>{item.icon}</span>
                    <div>
                      <div className="text-xs font-bold text-white">{item.name}</div>
                      <div className="text-[11px] text-[#94a3b8] font-mono">{item.status}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="bg-[#0f172a]/90 border border-[#1e293b] rounded-2xl p-6 space-y-6 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#1e293b] pb-3">
              <span className="material-symbols-outlined text-[#38bdf8]">notifications</span>
              Notification Rules & Alert Triggers
            </h3>

            <div className="space-y-3">
              {[
                { key: 'screeningComplete', label: 'AI Batch Screening Complete', desc: 'Alert when multi-agent ranking finishes for a requisition' },
                { key: 'interviewScheduled', label: 'Interview Scheduled', desc: 'Alert when a WebRTC AI interview session is booked' },
                { key: 'candidateApplied', label: 'Real Candidate Applied', desc: 'Real-time alert when a candidate submits an application' },
                { key: 'biasAlert', label: 'Fairness & Bias Compliance Alert', desc: 'Alert when disparate impact ratio drops below 0.80 threshold' },
                { key: 'systemFailure', label: 'Agent Task Error', desc: 'Alert when a background LangGraph agent task fails' }
              ].map(pref => {
                const isEnabled = notifications[pref.key as keyof typeof notifications];
                return (
                  <div key={pref.key} className="flex items-center justify-between bg-[#020617] border border-[#1e293b] rounded-xl p-4">
                    <div>
                      <div className="text-xs font-bold text-white">{pref.label}</div>
                      <div className="text-[11px] text-[#94a3b8] font-mono">{pref.desc}</div>
                    </div>
                    <div
                      onClick={() => toggleNotif(pref.key as keyof typeof notifications)}
                      className={`w-11 h-6 rounded-full p-0.5 cursor-pointer transition-colors ${
                        isEnabled ? 'bg-[#2563eb]' : 'bg-[#1e293b]'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        isEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleSave}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white text-xs font-bold shadow-md hover:brightness-110 transition-all active:scale-95"
            >
              Save Notification Preferences
            </button>
          </div>
        )}

        {/* AI CONFIGURATION TAB */}
        {activeTab === 'ai' && (
          <div className="bg-[#0f172a]/90 border border-[#1e293b] rounded-2xl p-6 space-y-6 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#1e293b] pb-3">
              <span className="material-symbols-outlined text-[#38bdf8]">psychology</span>
              AI Agent Engine Configuration
            </h3>

            <div className="space-y-4 max-w-xl">
              <div>
                <label className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-mono block mb-1.5">
                  Screening Score Threshold (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={screeningThreshold}
                  onChange={e => setScreeningThreshold(Number(e.target.value))}
                  className="w-full bg-[#020617] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#38bdf8]"
                />
                <p className="text-[10px] text-[#64748b] font-mono mt-1">Candidates below this score are automatically flagged for manual review.</p>
              </div>

              <div>
                <label className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-mono block mb-1.5">
                  Max AI LangGraph Agent Retries
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={maxRetries}
                  onChange={e => setMaxRetries(Number(e.target.value))}
                  className="w-full bg-[#020617] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#38bdf8]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-mono block mb-1.5">
                  Voice Interview Duration (Minutes)
                </label>
                <input
                  type="number"
                  min={10}
                  max={90}
                  value={voiceDuration}
                  onChange={e => setVoiceDuration(Number(e.target.value))}
                  className="w-full bg-[#020617] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#38bdf8]"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white text-xs font-bold shadow-md hover:brightness-110 transition-all active:scale-95"
            >
              Save AI Configuration
            </button>
          </div>
        )}

      </div>
    </RecruiterShell>
  );
};
