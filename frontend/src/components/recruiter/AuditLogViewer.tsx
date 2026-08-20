import React, { useState, useEffect } from "react";

interface AuditEntry {
  id: number;
  actor_type: string;
  actor_name: string;
  action: string;
  target_type: string;
  target_id: number;
  details: Record<string, any>;
  ip_address: string;
  timestamp: string;
}

export const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("");
  const [viewMode, setViewMode] = useState<"all" | "agents">("all");

  const fetchLogs = () => {
    const endpoint = viewMode === "agents"
      ? "http://localhost:8000/api/v1/audit/agent-decisions"
      : "http://localhost:8000/api/v1/audit/logs";

    fetch(endpoint)
      .then((r) => r.json())
      .then((d) => {
        setLogs(d.logs || d.decisions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchLogs(); }, [viewMode]);

  const filteredLogs = logs.filter((log) => {
    if (filterAction && !log.action?.toLowerCase().includes(filterAction.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="bg-[#181815] rounded-xl border border-[#2A2A28] overflow-hidden text-xs">
      {/* Header */}
      <div className="px-5 py-3.5 flex items-center justify-between border-b border-[#2A2A28]/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#D6A85F]/15 border border-[#D6A85F]/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#F4C377] text-lg">shield</span>
          </div>
          <div>
            <h3 className="font-bold text-[#F4F1E9]">🛡️ Immutable Audit Trail & Compliance</h3>
            <p className="text-[10px] text-[#A1A19A]">{filteredLogs.length} verified system events</p>
          </div>
        </div>

        <div className="flex gap-1 bg-[#11110F] p-0.5 rounded border border-[#2A2A28]">
          <button
            onClick={() => setViewMode("all")}
            className={`px-2.5 py-1 text-[10px] font-bold rounded transition-colors ${
              viewMode === "all" ? "bg-[#20201C] text-[#F4F1E9]" : "text-[#A1A19A]"
            }`}
          >
            System Logs
          </button>
          <button
            onClick={() => setViewMode("agents")}
            className={`px-2.5 py-1 text-[10px] font-bold rounded transition-colors ${
              viewMode === "agents" ? "bg-[#D6A85F] text-[#11110F]" : "text-[#A1A19A]"
            }`}
          >
            AI Agent Decisions
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="px-5 py-2 border-b border-[#2A2A28]">
        <input
          type="text"
          placeholder="Filter audit events..."
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="w-full bg-[#11110F] border border-[#2A2A28] rounded px-3 py-1.5 text-xs text-[#F4F1E9] placeholder-[#A1A19A]"
        />
      </div>

      <div className="p-4 max-h-80 overflow-y-auto space-y-2 font-mono">
        {loading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-[#2A2A28] rounded" />)}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-6 text-[#A1A19A]">
            <p className="text-xs">No audit events match current filter.</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="bg-[#11110F] rounded p-2.5 border border-[#2A2A28] flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <span className="text-[#F4C377] font-bold">[{log.actor_type}]</span>
                <span className="text-[#E5E2DE]">{log.actor_name}</span>
                <span className="px-1.5 py-0.5 rounded bg-[#20201C] text-[#79A89A] border border-[#2A2A28]">
                  {log.action}
                </span>
              </div>
              <span className="text-[#A1A19A] text-[10px]">
                {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ""}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
