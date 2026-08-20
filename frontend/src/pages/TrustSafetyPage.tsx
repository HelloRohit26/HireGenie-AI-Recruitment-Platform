import React from "react";
import { RecruiterShell } from "../components/layout/RecruiterShell";
import { TrustSafetyDashboard } from "../components/recruiter/TrustSafetyDashboard";

interface TrustSafetyPageProps {
  onNavigate?: (route: string) => void;
}

export const TrustSafetyPage: React.FC<TrustSafetyPageProps> = ({ onNavigate }) => {
  return (
    <RecruiterShell
      activeRoute="/recruiter/trust-safety"
      onNavigate={onNavigate}
    >
      <div className="p-2 space-y-6">
        <TrustSafetyDashboard applicationId={1} jobId={1} />
      </div>
    </RecruiterShell>
  );
};
