import React from 'react';
import { AIAgentStatus } from '../../types';

interface AgentDetailsModalProps {
  agent: AIAgentStatus | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (route: string) => void;
}

export const AgentDetailsModal: React.FC<AgentDetailsModalProps> = ({
  agent,
  isOpen,
  onClose,
  onNavigate
}) => {
  if (!isOpen || !agent) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg bg-[#181815] border border-[#2A2A28] rounded-xl shadow-2xl shadow-black/60 overflow-hidden animate-fadeIn p-6 space-y-5"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#2A2A28] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D6A85F]/20 border border-[#D6A85F]/40 flex items-center justify-center text-[#F4C377]">
              <span className="material-symbols-outlined text-xl">psychology</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#F4F1E9]">{agent.name}</h2>
                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${agent.statusColor}`}>
                  {agent.status}
                </span>
              </div>
              <p className="text-xs text-[#A1A19A] font-mono">{agent.role}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#A1A19A] hover:text-[#F4F1E9] hover:bg-[#20201C] transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Current Execution Task */}
        <div className="bg-[#11110F] rounded-lg p-4 border border-[#2A2A28]">
          <div className="text-[9px] text-[#A1A19A] uppercase tracking-wider font-mono mb-1">
            Current Autonomous Task
          </div>
          <p className="text-xs text-[#E5E2DE] font-mono leading-relaxed">{agent.currentTask}</p>
        </div>

        {/* Activity & Load */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#A1A19A]">Agent Workload</span>
            <span className="text-[#F4C377] font-bold">{agent.activityPercentage}% Utilization</span>
          </div>
          <div className="w-full h-2 bg-[#2A2A28] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#D6A85F] to-[#79A89A] rounded-full transition-all duration-500"
              style={{ width: `${agent.activityPercentage}%` }}
            />
          </div>
        </div>

        {/* Operational Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#11110F] rounded-lg p-3 border border-[#2A2A28]">
            <div className="text-[9px] text-[#A1A19A] uppercase tracking-wider font-mono">Total Volume</div>
            <div className="text-sm font-mono font-bold text-[#F4F1E9] mt-0.5">{agent.processedCount}</div>
          </div>
          <div className="bg-[#11110F] rounded-lg p-3 border border-[#2A2A28]">
            <div className="text-[9px] text-[#A1A19A] uppercase tracking-wider font-mono">Last Active</div>
            <div className="text-sm font-mono font-bold text-[#79A89A] mt-0.5">{agent.lastActive}</div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[#2A2A28]">
          <button
            onClick={() => {
              if (onNavigate) onNavigate('/recruiter/trust-safety');
              onClose();
            }}
            className="text-xs text-[#D6A85F] hover:underline font-mono"
          >
            Inspect Audit Log →
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#20201C] text-[#F4F1E9] text-xs font-bold hover:bg-[#2A2A28] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
