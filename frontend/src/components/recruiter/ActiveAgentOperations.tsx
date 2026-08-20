import React from 'react';
import { AIAgentStatus } from '../../types';
import { InteractiveTiltCard } from '../ui/InteractiveTiltCard';

interface ActiveAgentOperationsProps {
  agents: AIAgentStatus[];
  onSelectAgent?: (agent: AIAgentStatus) => void;
}

export const ActiveAgentOperations: React.FC<ActiveAgentOperationsProps> = ({ agents, onSelectAgent }) => {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 theme-transition shadow-[var(--shadow-sm)]">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--accent-secondary)] text-lg">smart_toy</span>
            Active AI Operations
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-mono">
            5 autonomous agents conducting real-time candidate processing & evaluation
          </p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--accent-secondary)]/15 text-[var(--accent-secondary)] border border-[var(--accent-secondary)]/30">
          Agent Engine Live
        </span>
      </div>

      {/* AGENTS LIST GRID */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {agents.map((agent) => {
          const statusStr = String(agent.status);
          const isProcessing = statusStr === 'Processing' || statusStr === 'Active' || statusStr === 'Conducting' || statusStr === 'Analyzing' || statusStr === 'Running';
          const isIdle = statusStr === 'Idle' || statusStr === 'Standby';
          const isError = statusStr === 'Error' || statusStr === 'Failed';

          return (
            <InteractiveTiltCard
              key={agent.id}
              onClick={() => onSelectAgent?.(agent)}
              className="p-4 flex flex-col justify-between cursor-pointer group hover:border-[var(--accent-secondary)]"
            >
              <div tabIndex={0} role="button" aria-label={`AI Agent ${agent.name}: ${agent.status}. Current task: ${agent.currentTask}`}>
                {/* TOP STATUS HEADER */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase text-[var(--text-secondary)] font-semibold">
                    {agent.role}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium flex items-center gap-1 ${
                    isProcessing ? 'bg-[var(--accent-secondary)]/20 text-[var(--accent-secondary)]' :
                    isIdle ? 'bg-[var(--surface-elevated)] text-[var(--text-muted)]' :
                    isError ? 'bg-[var(--status-error)]/20 text-[var(--status-error)]' :
                    'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      isProcessing ? 'bg-[var(--accent-secondary)] animate-ping' :
                      isIdle ? 'bg-[var(--text-muted)] animate-pulseQuiet' :
                      isError ? 'bg-[var(--status-error)]' :
                      'bg-[var(--accent-primary)]'
                    }`} />
                    {agent.status}
                  </span>
                </div>

                {/* AGENT NAME */}
                <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-secondary)] transition-colors flex items-center justify-between">
                  <span>{agent.name}</span>
                  {isProcessing && (
                    <span className="material-symbols-outlined text-xs text-[var(--accent-secondary)] animate-spinSlow">sync</span>
                  )}
                </h3>

                {/* CURRENT TASK */}
                <p className="text-[11px] text-[var(--text-secondary)] mt-2 line-clamp-2 leading-relaxed font-mono">
                  {agent.currentTask}
                </p>
              </div>

              {/* BOTTOM METRICS & PROGRESS BAR */}
              <div className="mt-4 pt-3 border-t border-[var(--border)]">
                <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-secondary)] mb-1.5">
                  <span>{agent.processedCount}</span>
                  <span className="text-[var(--accent-secondary)] font-bold">{agent.activityPercentage}%</span>
                </div>
                <div className="h-1.5 w-full bg-[var(--surface-elevated)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--accent-secondary)] to-[var(--accent-primary)] rounded-full transition-all duration-500"
                    style={{ width: `${agent.activityPercentage}%` }}
                  ></div>
                </div>
              </div>
            </InteractiveTiltCard>
          );
        })}
      </div>
    </div>
  );
};
