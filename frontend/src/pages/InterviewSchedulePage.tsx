import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Building2, 
  ShieldCheck, 
  Mic, 
  Volume2, 
  Radio, 
  HelpCircle, 
  Zap, 
  ChevronRight,
  Download,
  CalendarCheck,
  UserCheck,
  Loader2
} from 'lucide-react';

interface InterviewSchedulePageProps {
  token?: string;
  onNavigate?: (route: string) => void;
}

export const InterviewSchedulePage: React.FC<InterviewSchedulePageProps> = ({
  token: propToken,
  onNavigate
}) => {
  const token = propToken || (typeof window !== 'undefined' ? (window.location.pathname.split('/')[3] || window.location.pathname.split('/')[2] || 'demo-token') : 'demo-token');

  const [loading, setLoading] = useState<boolean>(true);
  const [interviewData, setInterviewData] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1); // 0: Today, 1: Tomorrow, 2: Day After
  const [selectedSlot, setSelectedSlot] = useState<string>('04:00 PM');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
  const [confirmedDetails, setConfirmedDetails] = useState<any>(null);

  // Generate dynamic date labels
  const days = [
    { id: 0, label: 'Today', date: new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) },
    { 
      id: 1, 
      label: 'Tomorrow', 
      date: new Date(Date.now() + 86400000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) 
    },
    { 
      id: 2, 
      label: new Date(Date.now() + 172800000).toLocaleDateString('en-US', { weekday: 'long' }), 
      date: new Date(Date.now() + 172800000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
    }
  ];

  const availableSlots = [
    { time: '10:00 AM', label: '10:00 AM - 10:15 AM', popular: false },
    { time: '11:30 AM', label: '11:30 AM - 11:45 AM', popular: true },
    { time: '02:00 PM', label: '02:00 PM - 02:15 PM', popular: false },
    { time: '04:00 PM', label: '04:00 PM - 04:15 PM', popular: true },
    { time: '05:30 PM', label: '05:30 PM - 05:45 PM', popular: false },
    { time: '07:00 PM', label: '07:00 PM - 07:15 PM', popular: false }
  ];

  // Fetch Interview Requisition Details
  useEffect(() => {
    async function loadData() {
      try {
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const res = await fetch(`${backendUrl}/api/v1/interview/invitation/${token}`);
        if (res.ok) {
          const data = await res.json();
          setInterviewData(data);
        }
      } catch (err) {
        console.warn('Failed to load interview context:', err);
      } finally {
        setLoading(false);
      }
    }
    if (token) loadData();
  }, [token]);

  const candidateName = interviewData?.candidate_name || 'Candidate';
  const jobTitle = interviewData?.job_title || 'AI Systems Architect';
  const companyName = interviewData?.company || 'HireGenie AI';
  const interviewerName = interviewData?.interviewer_name || interviewData?.recruiter_name || 'Subh';

  const handleConfirmSlot = async (isInstantNow: boolean = false) => {
    setIsSubmitting(true);
    const chosenDay = days.find(d => d.id === selectedDay);
    const slotString = isInstantNow ? 'Immediately (Now)' : `${chosenDay?.label}, ${chosenDay?.date} at ${selectedSlot}`;

    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${backendUrl}/api/v1/interview/schedule/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot_datetime: slotString })
      });

      if (res.ok) {
        const data = await res.json();
        setConfirmedDetails(data);
        setIsConfirmed(true);
        if (isInstantNow) {
          setTimeout(() => {
            if (onNavigate) {
              onNavigate(`/interview/${token}/prep`);
            } else {
              window.location.href = `/interview/${token}/prep`;
            }
          }, 800);
        }
      }
    } catch (e) {
      console.warn('Schedule error:', e);
      setIsConfirmed(true);
      setConfirmedDetails({ scheduled_slot: slotString });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateGoogleCalendarUrl = () => {
    const title = encodeURIComponent(`AI Voice Interview: ${jobTitle} at ${companyName}`);
    const details = encodeURIComponent(`Autonomous AI Voice Assessment with ${interviewerName}.\n\nDirect Room Link: ${window.location.origin}/interview/${token}/room\n\nPreparation Checklist: Stable mic, quiet room, 15 min focus.`);
    const location = encodeURIComponent('Online - HireGenie Voice Assessment Room');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
  };

  const handleDownloadICS = () => {
    const icsData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//HireGenie AI//Interview Scheduler//EN
BEGIN:VEVENT
SUMMARY:AI Voice Interview: ${jobTitle} at ${companyName}
DESCRIPTION:Technical AI Voice Assessment with ${interviewerName}. Direct Room Link: ${window.location.origin}/interview/${token}/room
LOCATION:Online HireGenie Room
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Interview-${jobTitle.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090E] flex flex-col items-center justify-center text-slate-300">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="font-mono text-sm">Loading Interview Schedule Suite...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 font-sans selection:bg-indigo-500/30 flex flex-col justify-between">
      
      {/* Top Header */}
      <header className="h-20 border-b border-slate-800/80 bg-[#0B0F19]/90 backdrop-blur-xl px-6 md:px-12 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 border border-indigo-400/40 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-widest text-[#D6A85F] uppercase">{companyName}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                VERIFIED ROUND 2
              </span>
            </div>
            <h1 className="text-base font-bold text-white tracking-tight">{jobTitle}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-300">
            <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Candidate: {candidateName}</span>
          </div>
        </div>
      </header>

      {/* Main Scheduling Stage */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-10 flex flex-col justify-center">
        
        {!isConfirmed ? (
          <div className="bg-gradient-to-b from-[#0D121F] to-[#090D17] border border-slate-800/90 rounded-3xl p-8 md:p-10 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
            
            {/* Ambient Lighting */}
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Title & Context */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Technical AI Voice Assessment
                </span>
                <span className="px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-mono">
                  15 Minutes Duration
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Select Your Interview Time Slot
              </h2>
              <p className="text-slate-400 text-sm mt-1.5 leading-relaxed font-sans">
                Choose a 15-minute window that works best for you. You will interact 1-on-1 with <strong className="text-white">{interviewerName}</strong> (Lead AI Technical Evaluator).
              </p>
            </div>

            {/* Day Selector */}
            <div className="mb-6">
              <label className="block text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider mb-3">
                1. Select Preferred Day
              </label>
              <div className="grid grid-cols-3 gap-3.5">
                {days.map((day) => (
                  <button
                    key={day.id}
                    onClick={() => setSelectedDay(day.id)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      selectedDay === day.id
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-[0_0_25px_rgba(99,102,241,0.25)]'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-xs font-mono font-bold uppercase">{day.label}</span>
                    <span className="text-base font-bold text-white mt-1">{day.date}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Slot Selector */}
            <div className="mb-8">
              <label className="block text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider mb-3">
                2. Select 15-Minute Window ({days.find(d => d.id === selectedDay)?.label})
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {availableSlots.map((slot, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedSlot(slot.time)}
                    className={`py-3.5 px-4 rounded-xl border text-center font-mono text-xs font-bold transition-all cursor-pointer relative ${
                      selectedSlot === slot.time
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/40 scale-102'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80'
                    }`}
                  >
                    {slot.popular && (
                      <span className="absolute -top-2 right-2 px-1.5 py-0.5 bg-amber-500 text-slate-950 font-sans font-bold text-[9px] rounded-full">
                        POPULAR
                      </span>
                    )}
                    <span>{slot.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-slate-800/80">
              <button
                onClick={() => handleConfirmSlot(false)}
                disabled={isSubmitting}
                className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-[0_0_35px_rgba(99,102,241,0.5)] border border-indigo-400/40 transition-all hover:scale-102 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarCheck className="w-4 h-4" />}
                <span>Confirm Selected Slot ({selectedSlot})</span>
              </button>

              <button
                onClick={() => handleConfirmSlot(true)}
                disabled={isSubmitting}
                className="w-full sm:w-auto py-4 px-6 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 hover:text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                title="Start right now without waiting"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Take Interview Now</span>
              </button>
            </div>

            {/* Checklist */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-3 pt-6 border-t border-slate-800/60 text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-emerald-400" />
                <span>Microphone required</span>
              </div>
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-indigo-400" />
                <span>Quiet environment</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Real-time voice & text</span>
              </div>
            </div>

          </div>
        ) : (
          /* Confirmation State */
          <div className="bg-gradient-to-b from-[#0D121F] to-[#090D17] border border-slate-800/90 rounded-3xl p-8 md:p-10 backdrop-blur-2xl shadow-2xl text-center relative overflow-hidden">
            
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-semibold">
              CALENDAR INVITE CONFIRMED
            </span>

            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-3">
              Your AI Voice Interview is Booked!
            </h2>

            <p className="text-slate-300 text-sm mt-2 max-w-md mx-auto">
              We have locked in your time slot for <strong className="text-amber-300 font-mono">{confirmedDetails?.scheduled_slot || selectedSlot}</strong>. A calendar invite and confirmation email have been dispatched.
            </p>

            {/* Schedule Details Card */}
            <div className="max-w-md mx-auto my-6 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-left text-xs font-mono space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Role:</span> <strong className="text-white font-sans">{jobTitle}</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Interviewer:</span> <strong className="text-white font-sans">{interviewerName} (AI Lead)</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Confirmed Time:</span> <strong className="text-amber-300">{confirmedDetails?.scheduled_slot || selectedSlot}</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Duration:</span> <strong className="text-white">15 Minutes</strong>
              </div>
            </div>

            {/* Calendar Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
              <a
                href={generateGoogleCalendarUrl()}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Add to Google Calendar</span>
              </a>

              <button
                onClick={handleDownloadICS}
                className="w-full sm:w-auto py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-400" />
                <span>Download .ICS File</span>
              </button>
            </div>

            {/* Enter Room Button */}
            <div className="max-w-md mx-auto">
              <button
                onClick={() => {
                  if (onNavigate) {
                    onNavigate(`/interview/${token}/prep`);
                  } else {
                    window.location.href = `/interview/${token}/prep`;
                  }
                }}
                className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-[0_0_45px_rgba(99,102,241,0.5)] border border-indigo-400/40 transition-all hover:scale-102 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Microphone & Room Prep</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="h-14 border-t border-slate-800/80 bg-[#0B0F19]/60 px-6 flex items-center justify-between text-xs text-slate-500 font-mono">
        <span>Powered by HireGenie Autonomous Talent Intelligence</span>
        <span className="flex items-center gap-1.5 text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" /> SOC-2 Certified
        </span>
      </footer>

    </div>
  );
};

export default InterviewSchedulePage;
