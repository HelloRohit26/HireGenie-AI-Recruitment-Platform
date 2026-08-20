import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { EntryLandingPage } from './pages/EntryLandingPage';
import { RecruiterCommandCenter } from './pages/RecruiterCommandCenter';
import { RecruiterJobsPage } from './pages/RecruiterJobsPage';
import { TrustSafetyPage } from './pages/TrustSafetyPage';
import { CandidatesPage } from './pages/CandidatesPage';
import { AIScreeningPage } from './pages/AIScreeningPage';
import { InterviewsPage } from './pages/InterviewsPage';
import { InsightsPage } from './pages/InsightsPage';
import { SettingsPage } from './pages/SettingsPage';
import { JobWorkspacePage } from './pages/JobWorkspacePage';
import { HelpPage } from './pages/HelpPage';
import { CandidateHomePage } from './pages/CandidateHomePage';
import { CandidateJobsPage } from './pages/CandidateJobsPage';
import { CandidateJobDetailPage } from './pages/CandidateJobDetailPage';
import { MyApplicationsPage } from './pages/MyApplicationsPage';
import { InterviewEntryPage } from './pages/InterviewEntryPage';
import { InterviewPrepPage } from './pages/InterviewPrepPage';
import { VoiceInterviewRoomPage } from './pages/VoiceInterviewRoomPage';
import { CandidateOnboardingPage } from './pages/CandidateOnboardingPage';
import { RecruiterOnboardingPage } from './pages/RecruiterOnboardingPage';
import { OfferPortalPage } from './pages/OfferPortalPage';

export function AppContent() {
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const routeParam = params.get('route');
      if (routeParam) return routeParam;
      const path = window.location.pathname;
      if (path && path !== '/') return path;
    }
    return '/'; // DEFAULT ROUTE MUST ALWAYS OPEN THE HIREGENIE LANDING PAGE
  });

  const [authRole, setAuthRole] = useState<'recruiter' | 'candidate' | null>(() => {
    if (typeof window !== 'undefined') {
      const savedRole = localStorage.getItem('hg_user_role');
      const token = localStorage.getItem('hg_auth_token');
      if (token && (savedRole === 'recruiter' || savedRole === 'candidate')) {
        return savedRole;
      }
    }
    return null;
  });
  const [userName, setUserName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hg_user_name') || '';
    }
    return '';
  });

  const isRecruiterAuthorized = (): boolean => {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('hg_auth_token');
    const role = (localStorage.getItem('hg_user_role') || '').toLowerCase();
    return Boolean(token && (role === 'recruiter' || role === 'admin'));
  };

  const handleNavigate = (route: string) => {
    setCurrentRoute(route);
    if (typeof window !== 'undefined') {
      window.history.pushState({ route }, '', `?route=${route}`);
    }
  };

  const handleAuthenticate = (role: 'recruiter' | 'candidate', name: string) => {
    setAuthRole(role);
    setUserName(name);
  };

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.route) {
        setCurrentRoute(e.state.route);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // ─── ROUTE MATCHING & AUTH GUARDS ──────────────────────────────

  // Protect all recruiter routes from unauthorized or candidate-only access
  if (currentRoute.startsWith('/recruiter') && !isRecruiterAuthorized()) {
    return (
      <EntryLandingPage
        onNavigate={handleNavigate}
        onAuthenticate={handleAuthenticate}
        initialAuthModalOpen={true}
        initialAuthRole="recruiter"
        initialMessage="Recruiter Portal Protected: Please authenticate with recruiter credentials to access this workspace."
      />
    );
  }

  // Entry Landing Page (DEFAULT ENTRY POINT)
  if (currentRoute === '/' || currentRoute === '/entry') {
    return <EntryLandingPage onNavigate={handleNavigate} onAuthenticate={handleAuthenticate} />;
  }

  // Recruiter Onboarding: /recruiter/onboarding
  if (currentRoute === '/recruiter/onboarding') {
    return <RecruiterOnboardingPage onNavigate={handleNavigate} />;
  }

  // Candidate Onboarding: /candidate/onboarding
  if (currentRoute === '/candidate/onboarding') {
    return <CandidateOnboardingPage onNavigate={handleNavigate} />;
  }

  // Candidate Offer Portal: /offer/:token
  const offerPortalMatch = currentRoute.match(/^\/offer\/([^/]+)$/);
  if (offerPortalMatch) {
    return <OfferPortalPage token={offerPortalMatch[1]} onNavigate={handleNavigate} />;
  }

  // Candidate Interview Entry: /interview/:token
  const interviewEntryMatch = currentRoute.match(/^\/interview\/([^/]+)$/);
  if (interviewEntryMatch) {
    return <InterviewEntryPage token={interviewEntryMatch[1]} onNavigate={handleNavigate} />;
  }

  // Candidate Interview Prep: /interview/:token/prep
  const interviewPrepMatch = currentRoute.match(/^\/interview\/([^/]+)\/prep$/);
  if (interviewPrepMatch) {
    return <InterviewPrepPage token={interviewPrepMatch[1]} onNavigate={handleNavigate} />;
  }

  // Candidate Voice Interview Room: /interview/:token/room
  const interviewRoomMatch = currentRoute.match(/^\/interview\/([^/]+)\/room$/);
  if (interviewRoomMatch) {
    return <VoiceInterviewRoomPage token={interviewRoomMatch[1]} onNavigate={handleNavigate} />;
  }

  // Candidate Job Detail: /candidate/jobs/:id
  const candidateJobDetailMatch = currentRoute.match(/^\/candidate\/jobs\/(.+)$/);
  if (candidateJobDetailMatch) {
    return <CandidateJobDetailPage jobId={candidateJobDetailMatch[1]} onNavigate={handleNavigate} />;
  }

  // Candidate Jobs List: /candidate/jobs
  if (currentRoute === '/candidate/jobs') {
    return <CandidateJobsPage onNavigate={handleNavigate} />;
  }

  // Candidate Applications: /candidate/applications
  if (currentRoute === '/candidate/applications') {
    return <MyApplicationsPage onNavigate={handleNavigate} />;
  }

  // Candidate Portal Home: /candidate
  if (currentRoute === '/candidate') {
    return <CandidateHomePage onNavigate={handleNavigate} />;
  }

  // Job Workspace: /recruiter/jobs/:id (must be before /recruiter/jobs)
  const jobWorkspaceMatch = currentRoute.match(/^\/recruiter\/jobs\/(.+)$/);
  if (jobWorkspaceMatch) {
    return <JobWorkspacePage jobId={jobWorkspaceMatch[1]} onNavigate={handleNavigate} />;
  }

  // Jobs list
  if (currentRoute === '/recruiter/jobs') {
    return <RecruiterJobsPage onNavigate={handleNavigate} />;
  }

  // Candidates
  if (currentRoute === '/recruiter/candidates') {
    return <CandidatesPage onNavigate={handleNavigate} />;
  }

  // AI Screening
  if (currentRoute === '/recruiter/screening') {
    return <AIScreeningPage onNavigate={handleNavigate} />;
  }

  // Interviews
  if (currentRoute === '/recruiter/interviews') {
    return <InterviewsPage onNavigate={handleNavigate} />;
  }

  // Insights
  if (currentRoute === '/recruiter/insights') {
    return <InsightsPage onNavigate={handleNavigate} />;
  }

  // Trust & Safety
  if (currentRoute === '/recruiter/trust-safety') {
    return <TrustSafetyPage onNavigate={handleNavigate} />;
  }

  // Settings
  if (currentRoute === '/recruiter/settings') {
    return <SettingsPage onNavigate={handleNavigate} />;
  }

  // Help
  if (currentRoute === '/help') {
    return <HelpPage onNavigate={handleNavigate} />;
  }

  // Recruiter Dashboard
  if (currentRoute === '/recruiter') {
    return <RecruiterCommandCenter onNavigate={handleNavigate} />;
  }

  // Default fallback: Landing Page
  return <EntryLandingPage onNavigate={handleNavigate} onAuthenticate={handleAuthenticate} />;
}

export function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
