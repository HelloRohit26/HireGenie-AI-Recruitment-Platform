import React, { useState, useEffect } from "react";

interface IntegrationStatus {
  name: string;
  description: string;
  icon: string;
  connected: boolean;
  last_sync: string | null;
}

export const IntegrationsPanel: React.FC = () => {
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);

  const fetchIntegrations = () => {
    fetch("http://localhost:8000/api/v1/integrations/all")
      .then((r) => r.json())
      .then((d) => { setIntegrations(d.integrations || []); })
      .catch(() => {});
  };

  useEffect(() => { fetchIntegrations(); }, []);

  const toggleConnection = async (name: string, connected: boolean) => {
    setConnecting(name);
    const endpoint = connected ? "disconnect" : "connect";
    try {
      await fetch(`http://localhost:8000/api/v1/integrations/${name.toLowerCase().replace(/[^a-z]/g, "_")}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentials: {} }),
      });
      fetchIntegrations();
    } catch (e) {}
    setConnecting(null);
  };

  const displayIntegrations: IntegrationStatus[] = integrations.length > 0 ? integrations : [
    { name: "Email (Gmail/SMTP)", description: "Automated candidate emails", icon: "mail", connected: true, last_sync: null },
    { name: "Google Calendar", description: "Interview schedule sync", icon: "calendar_today", connected: true, last_sync: null },
    { name: "LinkedIn Recruiter", description: "Candidate sourcing & job post sync", icon: "work", connected: false, last_sync: null },
    { name: "ATS Connector", description: "Greenhouse / Lever webhook sync", icon: "sync", connected: true, last_sync: null },
    { name: "Twilio Telephony", description: "Outbound AI voice calls", icon: "call", connected: true, last_sync: null },
    { name: "WebRTC Audio Stream", description: "Browser real-time audio rooms", icon: "mic", connected: true, last_sync: null },
    { name: "Job Portals (Naukri/Indeed)", description: "Cross-platform requisition sync", icon: "language", connected: false, last_sync: null },
  ];

  return (
    <div className="bg-[#181815] rounded-xl border border-[#2A2A28] overflow-hidden text-xs">
      {/* Header */}
      <div className="px-5 py-3.5 flex items-center justify-between border-b border-[#2A2A28]/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#79A89A]/15 border border-[#79A89A]/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#79A89A] text-lg">extension</span>
          </div>
          <div>
            <h3 className="font-bold text-[#F4F1E9]">🔌 External Service Integrations Grid</h3>
            <p className="text-[10px] text-[#A1A19A]">
              {displayIntegrations.filter((i) => i.connected).length}/{displayIntegrations.length} integrations connected
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {displayIntegrations.map((item) => (
          <div key={item.name} className={`p-3 rounded-lg border flex items-center justify-between ${
            item.connected ? "bg-[#11110F] border-[#79A89A]/30" : "bg-[#11110F]/50 border-[#2A2A28]"
          }`}>
            <div className="flex items-center gap-3">
              <span className={`material-symbols-outlined text-xl ${item.connected ? "text-[#79A89A]" : "text-[#A1A19A]"}`}>
                {item.icon}
              </span>
              <div>
                <h4 className="font-bold text-[#F4F1E9] text-xs">{item.name}</h4>
                <p className="text-[10px] text-[#A1A19A]">{item.description}</p>
              </div>
            </div>

            <button
              onClick={() => toggleConnection(item.name, item.connected)}
              disabled={connecting === item.name}
              className={`px-2.5 py-1 text-[10px] font-bold rounded transition-colors ${
                item.connected
                  ? "bg-[#C97C5D]/20 text-[#C97C5D] border border-[#C97C5D]/30 hover:bg-[#C97C5D]/30"
                  : "bg-[#79A89A]/20 text-[#79A89A] border border-[#79A89A]/30 hover:bg-[#79A89A]/30"
              }`}
            >
              {connecting === item.name ? "..." : item.connected ? "Disconnect" : "Connect"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
