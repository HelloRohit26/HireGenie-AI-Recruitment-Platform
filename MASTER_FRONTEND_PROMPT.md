# 🚀 HireGenie AI – Master Frontend & Motion Design Prompt

Copy and use this master prompt to generate, extend, or recreate the **HireGenie AI TalentOS UI** frontend with full motion graphics, Awwwards-grade glassmorphic aesthetics, and zero-recruiter autonomous pipeline workflows.

---

### 📝 MASTER SYSTEM PROMPT

```markdown
Act as a Principal System Architect, Lead UI/UX Motion Engineer, and Staff Full-Stack AI Developer.

I want you to build an Awwwards-Grade, Billion-Dollar Production AI Hiring Platform named "HireGenie AI" (powered by TalentOS UI). The frontend must connect Recruiters and Job Seekers through two distinct, highly optimized interfaces driven by a 100% Autonomous Multi-Agent Pipeline.

---

### 🏛️ 1. ARCHITECTURE & DUAL-PORTAL SYSTEM

1. RECRUITER PORTAL (TalentOS UI Command Center):
   - Fullscreen Edge-to-Edge Fluid Layout (`w-full min-h-screen bg-[#03040a]`).
   - 9-Item Left Sidebar Navigation: Dashboard, Jobs, Candidates, AI Agents, Interviews, Analytics, Messages (Badge: 12), Calendar, Settings.
   - Autonomous AI Execution Hero Banner: `⚡ 100% AUTONOMOUS AI PIPELINE: Zero Recruiter Manual Intervention Required`.
   - Multi-Agent Live Stream Banner: Connected neon cards for Resume Screener (78%), Skill Matcher (92%), Candidate Ranker (64%), Interview Scheduler (41%), and Offer Generator (27%).
   - Connected SVG Laser Particle Cables: Continuous flowing dashoffset particle loop connecting all 5 AI agent cards.
   - Top Shortlisted Candidate Motion Cards: Displays candidate match score (96%, 93%), experience tags, skill chips, Twilio Phone Call trigger, and View Dossier button.
   - Hiring Analytics & Funnel: Chevron stage pipeline (Applied 2,543 ➔ Hired 15), Applications Over Time SVG line chart (↗ 24.5%), AI Match Score Circular Donut Gauge (89%), and Sources Performance progress bars (LinkedIn 45%, Company 25%, Referral 15%, Others 15%).
   - Right Sidebar Live Activity Feed: Real-time event timeline with pinging status dots, category filter chips (ALL, SCREENER, INTERVIEW, RANKER), and "Stream Event" simulation button.

2. CANDIDATE PORTAL (Job Seeker View):
   - Job Discovery Feed with search and filters.
   - Instant Resume Parser & Custom Screening Question form.
   - Magic Access Token generator.
   - Autonomous AI Interview Launcher: Instantly fires WebRTC Voice Room or Twilio Cellular Phone Call based on job configuration with 0% Recruiter Manual Intervention.

3. INTERACTIVE MODALS & WORKSPACES:
   - 3-Step Job Creation Wizard: Role details, Interview Channel Choice (WebRTC Browser Audio vs Telephonic Twilio Call), and Custom Screening Questions with skill weight multipliers.
   - Candidate Intelligence Dossier Modal: Score breakdown, AI recommendation ("STRONGLY RECOMMEND"), audio scrubber player (05:00 / 15:00), timestamped speech transcript, and HR action controls.
   - WebRTC Speech-to-Speech Voice Room Modal: Real-time 15-minute voice interview room simulation.
   - Twilio Telephonic Outbound Phone Call Modal: Phone dialer input (+91 98765 43210), live call state machine (QUEUED ➔ RINGING ➔ TWILIO CONNECTED ➔ EVALUATING ➔ COMPLETED), green radar audio frequency bars, and live cellular speech transcript.

---

### 🎨 2. AESTHETICS, THEME TOKENS & COLOR PALETTE

1. DARK OBSIDIAN MODE (Default):
   - Background: `#03040a` (Deep Obsidian Space).
   - Cards: `backdrop-blur-2xl bg-[#090b17]/80 border border-purple-500/20 shadow-2xl`.
   - Floating 3D Orbs: Bouncing mesh particle aura spheres (`radial-gradient`) animated via CSS floaters.
   - Accent Gradients: Vibrant neon purples (`#a855f7`), cyans (`#3b82f6`), pinks (`#ec4899`), and emeralds (`#10b981`).

2. WARM LUXURY LIGHT MODE:
   - Background: `#f4f5fa` (Soft Lavender Gray, NO stark pure white).
   - Sidebar & Header: `#f1f3f9`.
   - Cards: `#ffffff` / `rgba(255,255,255,0.95)` with soft `shadow-slate-200` and metallic borders.
   - Text: `#0f172a` (Crisp Dark Slate for maximum contrast and legibility).

---

### ⚡ 3. MOTION GRAPHICS & ANIMATION ENGINE

1. CSS KEYFRAMES (`index.css`):
   - `@keyframes dash`: Continuous dashoffset loop (`animate-dash-flow`) for laser cables.
   - `@keyframes float-slow`: 3D floating orb mesh animation.
   - `@keyframes glow-pulse`: Neon border glowing pulse effect.
   - `@keyframes radar-sweep`: Radar scan line animation for telephony.

2. FRAMER MOTION MICRO-INTERACTIONS:
   - Candidate Cards: `whileHover={{ scale: 1.04, y: -6 }}` with `type: "spring", stiffness: 300, damping: 22`.
   - Entrance Stagger: Staggered list fade-in with slide-up offset (`initial={{ opacity: 0, y: 25 }}`).
   - Live Audio Equalizer: Animated frequency height bars pulsing on active AI Agent cards and phone call modals.

---

### 🛠️ 4. TECH STACK & REQUIREMENTS

- **Framework**: React + Vite + TypeScript
- **Styling**: Tailwind CSS + Vanilla CSS Keyframes
- **Motion Library**: Framer Motion (`framer-motion ^11.0.0`)
- **State Management**: TanStack React Query (`@tanstack/react-query`)
- **Icons**: Lucide React (`lucide-react`)
```
