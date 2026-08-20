import React, { useState, useEffect } from "react";

interface FailedTaskData {
  id: number;
  task_type: string;
  application_id: number | null;
  job_id: number | null;
  error_message: string;
  retry_count: number;
  max_retries: number;
  status: string;
  resolved_by: string | null;
  resolution_notes: string | null;
  created_at: string;
}

export const FailureQueuePanel: React.FC = () => {
  const [failures, setFailures] = useState<FailedTaskData[]>([]);
  const [manualQueue, setManualQueue] = useState<FailedTaskData[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "manual">("all");
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    Promise.all([
      fetch("http://localhost:8000/api/v1/failures/all").then((r) => r.json()),
      fetch("http://localhost:8000/api/v1/failures/manual-queue").then((r) => r.json()),
    ])
      .then(([allData, mqData]) => {
        setFailures(allData.failures || []);
        setManualQueue(mqData.queue || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const retryTask = async (taskId: number) => {
    await fetch(`http://localhost:8000/api/v1/failures/${taskId}/retry`, { method: "POST" });
    fetchData();
  };

  const resolveTask = async (taskId: number) => {
    await fetch(`http://localhost:8000/api/v1/failures/${taskId}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolved_by: "Recruiter", notes: "Manually resolved in panel" }),
    });
    fetchData();
  };

  const displayData = activeTab === "manual" ? manualQueue : failures;

  return (
    <div className="bg-[#181815] rounded-xl border border-[#2A2A28] overflow-hidden text-xs">
      {/* Header */}
      <div className="px-5 py-3.5 flex items-center justify-between border-b border-[#2A2A28]/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#C97C5D]/15 border border-[#C97C5D]/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#C97C5D] text-lg">published_with_changes</span>
          </div>
          <div>
            <h3 className="font-bold text-[#F4F1E9]">🔄 Failure & Exponential Retry Queue</h3>
            <p className="text-[10px] text-[#A1A19A]">Automated error recovery system with human escalation</p>
          </div>
        </div>

        <div className="flex gap-1 bg-[#11110F] p-0.5 rounded border border-[#2A2A28]">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-2.5 py-1 text-[10px] font-bold rounded transition-colors ${
              activeTab === "all" ? "bg-[#20201C] text-[#F4F1E9]" : "text-[#A1A19A]"
            }`}
          >
            All Logs ({failures.length})
          </button>
          <button
            onClick={() => setActiveTab("manual")}
            className={`px-2.5 py-1 text-[10px] font-bold rounded transition-colors ${
              activeTab === "manual" ? "bg-[#C97C5D] text-[#11110F]" : "text-[#A1A19A]"
            }`}
          >
            Escalation Queue ({manualQueue.length})
          </button>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2].map((i) => <div key={i} className="h-14 bg-[#2A2A28] rounded-lg" />)}
          </div>
        ) : displayData.length === 0 ? (
          <div className="text-center py-6 text-[#A1A19A]">
            <span className="material-symbols-outlined text-3xl opacity-50 block mb-1">check_circle</span>
            <p className="text-xs">All AI agents functioning normally — 0 pending retries</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {displayData.map((task) => (
              <div key={task.id} className="bg-[#11110F] rounded-lg p-3 border border-[#2A2A28] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#F4F1E9]">{task.task_type}</span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#C97C5D]/20 text-[#C97C5D]">
                      {task.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A1A19A] mt-1">{task.error_message}</p>
                </div>
                <div className="flex items-center gap-2">
                  {task.status !== "RESOLVED" && (
                    <>
                      <button
                        onClick={() => retryTask(task.id)}
                        className="px-2 py-1 text-[10px] font-bold rounded bg-[#D6A85F]/20 text-[#F4C377] border border-[#D6A85F]/30 hover:bg-[#D6A85F]/30"
                      >
                        Retry Now
                      </button>
                      <button
                        onClick={() => resolveTask(task.id)}
                        className="px-2 py-1 text-[10px] font-bold rounded bg-[#79A89A]/20 text-[#79A89A] border border-[#79A89A]/30 hover:bg-[#79A89A]/30"
                      >
                        Mark Resolved
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
