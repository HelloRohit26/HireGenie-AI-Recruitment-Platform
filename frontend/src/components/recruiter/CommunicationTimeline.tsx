import React, { useState, useEffect } from "react";

interface CommLog {
  id: number;
  stage: string;
  channel: string;
  subject: string;
  delivery_status: string;
  sent_at: string | null;
  created_at: string;
}

interface CommunicationTimelineProps {
  applicationId: number;
}

const STAGE_CONFIG: Record<string, { label: string; icon: string }> = {
  APPLICATION_RECEIVED: { label: "Application Received", icon: "inbox" },
  SHORTLISTED: { label: "Shortlisted Announcement", icon: "star" },
  INTERVIEW_INVITATION: { label: "Interview Invitation & Magic Link", icon: "event" },
  INTERVIEW_REMINDER: { label: "1-Hour Interview Reminder", icon: "alarm" },
  INTERVIEW_COMPLETED: { label: "Interview Completed Acknowledgment", icon: "task_alt" },
  HR_DECISION: { label: "HR Decision Update", icon: "badge" },
  OFFER: { label: "Offer Letter Sent", icon: "mark_email_read" },
  REJECTION: { label: "Empathetic Rejection", icon: "mail" },
};

const ALL_STAGES = ["APPLICATION_RECEIVED", "SHORTLISTED", "INTERVIEW_INVITATION", "INTERVIEW_REMINDER", "INTERVIEW_COMPLETED", "HR_DECISION", "OFFER"];

export const CommunicationTimeline: React.FC<CommunicationTimelineProps> = ({ applicationId }) => {
  const [timeline, setTimeline] = useState<CommLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);

  const fetchTimeline = () => {
    fetch(`http://localhost:8000/api/v1/communication/log/${applicationId}`)
      .then((r) => r.json())
      .then((d) => { setTimeline(d.timeline || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchTimeline(); }, [applicationId]);

  const sendComm = async (stage: string) => {
    setSending(stage);
    try {
      await fetch("http://localhost:8000/api/v1/communication/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          application_id: applicationId,
          stage,
          template_vars: {},
        }),
      });
      fetchTimeline();
    } catch (e) {}
    setSending(null);
  };

  const sentStages = new Set(timeline.map((t) => t.stage));

  if (loading) {
    return <div className="animate-pulse bg-[#181815] rounded-xl p-5 border border-[#2A2A28] h-32" />;
  }

  return (
    <div className="bg-[#181815] rounded-xl border border-[#2A2A28] overflow-hidden text-xs">
      {/* Header */}
      <div className="px-5 py-3.5 flex items-center gap-3 border-b border-[#2A2A28]/50">
        <div className="w-8 h-8 rounded-lg bg-[#D6A85F]/15 border border-[#D6A85F]/30 flex items-center justify-center">
          <span className="material-symbols-outlined text-[#F4C377] text-lg">mail</span>
        </div>
        <div>
          <h3 className="font-bold text-[#F4F1E9]">📧 Multi-Stage Communication Agent</h3>
          <p className="text-[10px] text-[#A1A19A]">{timeline.length} stage communications dispatched</p>
        </div>
      </div>

      <div className="p-5 space-y-2">
        {ALL_STAGES.map((stage) => {
          const config = STAGE_CONFIG[stage] || { label: stage, icon: "mail" };
          const isSent = sentStages.has(stage);

          return (
            <div key={stage} className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
              isSent ? "bg-[#11110F] border-[#79A89A]/30" : "bg-[#11110F]/50 border-[#2A2A28] opacity-60"
            }`}>
              <div className="flex items-center gap-2.5">
                <span className={`material-symbols-outlined text-base ${isSent ? "text-[#79A89A]" : "text-[#A1A19A]"}`}>
                  {config.icon}
                </span>
                <span className={`font-semibold ${isSent ? "text-[#F4F1E9]" : "text-[#A1A19A]"}`}>
                  {config.label}
                </span>
              </div>

              <div>
                {isSent ? (
                  <span className="text-[10px] font-mono text-[#79A89A] font-bold bg-[#79A89A]/15 px-2 py-0.5 rounded border border-[#79A89A]/30 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">check_circle</span> Dispatched
                  </span>
                ) : (
                  <button
                    onClick={() => sendComm(stage)}
                    disabled={sending === stage}
                    className="text-[10px] font-bold px-2.5 py-1 rounded bg-[#20201C] text-[#F4C377] border border-[#D6A85F]/30 hover:bg-[#D6A85F]/20 transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-xs">send</span>
                    {sending === stage ? "Sending..." : "Trigger Email"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
