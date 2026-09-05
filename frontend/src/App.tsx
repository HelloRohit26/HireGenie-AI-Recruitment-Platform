import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
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
import { InterviewSchedulePage } from './pages/InterviewSchedulePage';
import { VoiceInterviewRoomPage } from './pages/VoiceInterviewRoomPage';
import { CandidateOnboardingPage } from './pages/CandidateOnboardingPage';
import { RecruiterOnboardingPage } from './pages/RecruiterOnboardingPage';
import { OfferPortalPage } from './pages/OfferPortalPage';

export function AppContent() {
  const { role: contextRole, user: contextUser, isAuthenticated } = useAuth();

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
      const savedRole = (localStorage.getItem('hg_user_role') || '').toLowerCase();
      const token = localStorage.getItem('hg_auth_token');
      if (token && (savedRole === 'recruiter' || savedRole === 'admin' || savedRole === 'candidate')) {
        return (savedRole === 'admin' || savedRole === 'recruiter') ? 'recruiter' : 'candidate';
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
    if (contextRole === 'recruiter') return true;
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
    // Smoothly route to target portal after authentication
    if (currentRoute === '/' || currentRoute === '/entry') {
      if (role === 'recruiter') {
        handleNavigate('/recruiter');
      } else {
        handleNavigate('/candidate');
      }
    }
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

  // Parse clean path and query parameters
  const [routePath, rawQuery] = currentRoute.split('?');
  const routeQueryParams = new URLSearchParams(rawQuery || '');
  const isAutoStart = routeQueryParams.get('autostart') === 'true';

  // Candidate Offer Portal: /offer/:token
  const offerPortalMatch = routePath.match(/^\/offer\/([^/]+)$/);
  if (offerPortalMatch) {
    return <OfferPortalPage token={offerPortalMatch[1]} onNavigate={handleNavigate} />;
  }

  // Candidate Interview Schedule: /interview/schedule/:token or /interview/:token/schedule
  const scheduleMatch = routePath.match(/^\/interview\/(?:schedule\/([^/]+)|([^/]+)\/schedule)$/);
  if (scheduleMatch) {
    const sessionToken = scheduleMatch[1] || scheduleMatch[2];
    return <InterviewSchedulePage token={sessionToken} onNavigate={handleNavigate} />;
  }

  // Candidate Interview Prep: /interview/prep/:token or /interview/:token/prep
  const prepMatch = routePath.match(/^\/interview\/(?:prep\/([^/]+)|([^/]+)\/prep)$/);
  if (prepMatch) {
    const sessionToken = prepMatch[1] || prepMatch[2];
    return <InterviewPrepPage token={sessionToken} onNavigate={handleNavigate} />;
  }

  // Voice Interview Room: /interview/room/:token or /interview/:token/room or /interview/room
  const roomMatch = routePath.match(/^\/interview\/(?:room\/([^/]+)|([^/]+)\/room|room)$/);
  if (roomMatch) {
    const sessionToken = roomMatch[1] || roomMatch[2] || 'demo-token';
    return <VoiceInterviewRoomPage token={sessionToken} autoStart={isAutoStart} onNavigate={handleNavigate} />;
  }

  // Candidate Interview Entry: /interview or /interview/:token
  const interviewMatch = routePath.match(/^\/interview(?:\/([^/]+))?$/);
  if (interviewMatch) {
    const sessionToken = interviewMatch[1] || '';
    return <InterviewEntryPage token={sessionToken} onNavigate={handleNavigate} />;
  }

  // Candidate Job Detail: /candidate/jobs/:id
  const jobDetailMatch = currentRoute.match(/^\/candidate\/jobs\/(.+)$/);
  if (jobDetailMatch) {
    return <CandidateJobDetailPage jobId={jobDetailMatch[1]} onNavigate={handleNavigate} />;
  }

  // Candidate Jobs Feed
  if (currentRoute === '/candidate/jobs') {
    return <CandidateJobsPage onNavigate={handleNavigate} />;
  }

  // Candidate Applications
  if (currentRoute === '/candidate/applications') {
    return <MyApplicationsPage onNavigate={handleNavigate} />;
  }

  // Candidate Home
  if (currentRoute === '/candidate') {
    return <CandidateHomePage onNavigate={handleNavigate} />;
  }

  // Recruiter Job Workspace: /recruiter/jobs/:id
  const recruiterJobMatch = currentRoute.match(/^\/recruiter\/jobs\/(.+)$/);
  if (recruiterJobMatch) {
    return <JobWorkspacePage jobId={recruiterJobMatch[1]} onNavigate={handleNavigate} />;
  }

  // Recruiter Jobs Management
  if (currentRoute === '/recruiter/jobs') {
    return <RecruiterJobsPage onNavigate={handleNavigate} />;
  }

  // Recruiter Candidates Pipeline
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
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
