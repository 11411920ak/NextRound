import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, SignUpButton, SignInButton } from '@clerk/clerk-react';
import aiOrb from '../assets/ai-orb.png';
import {
  BrainCircuit,
  FileText,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Target,
  Zap,
  Award,
  Layers,
  ChevronRight,
  TrendingUp,
  Compass,
  Play,
  Pause,
} from 'lucide-react';

const LandingPage = () => {
  const { isSignedIn, isLoaded } = useUser();
  const navigate = useNavigate();
  const [isMarqueePaused, setIsMarqueePaused] = useState(false);

  // Route directly to dashboard if already authenticated
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoaded, isSignedIn, navigate]);

  // Scroll Trigger Observer: reveal elements as they enter the viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    const revealElements = document.querySelectorAll('.reveal-init');
    revealElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Infinite Scroll Steps Data (6 comprehensive steps looped seamlessly)
  const journeySteps = [
    {
      step: '01',
      title: 'Authenticate with Clerk',
      desc: 'Instant, secure 1-click authentication via biometric, email, or Google sign-in.',
      tag: 'Zero Friction',
    },
    {
      step: '02',
      title: 'Upload Resume & ATS Match',
      desc: 'Automated skill extraction compares your background with target job requirements.',
      tag: 'Skill Gap Radar',
    },
    {
      step: '03',
      title: 'Practice Live with AI Voice',
      desc: 'Experience dynamic, adaptive mock interview questions with speech-to-text input.',
      tag: 'Real-time Audio',
    },
    {
      step: '04',
      title: 'Instant 4-Factor STAR Scoring',
      desc: 'Detailed breakdown across Situation, Task, Action, and measurable Results.',
      tag: 'Deep STAR Model',
    },
    {
      step: '05',
      title: 'Tailored Study Roadmap',
      desc: 'Actionable bullet points and personalized study drills to close conceptual gaps.',
      tag: 'Targeted Growth',
    },
    {
      step: '06',
      title: 'Interview Confident & Win Offer',
      desc: 'Arrive at your real interview completely prepared, articulate, and poised to succeed.',
      tag: 'Offer Secured',
    },
  ];

  // Double the steps to ensure continuous 100% smooth infinite looping
  const infiniteSteps = [...journeySteps, ...journeySteps];

  return (
    <div className="min-h-screen bg-[#f8f9fd] text-slate-800 font-sans overflow-hidden relative">
      {/* Subtle Grayish / Neutral Ambient Backdrop Aura */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-slate-300/25 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[35%] right-[-80px] w-[450px] h-[450px] bg-slate-200/40 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-[55%] left-[-80px] w-[450px] h-[450px] bg-slate-200/35 rounded-full blur-[130px] pointer-events-none" />

      {/* ── HERO SECTION ───────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-14 lg:pt-20 lg:pb-20 text-center relative z-10">
        {/* Main Headline with Grayish / Graphite Typography */}
        <div className="reveal-init">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.15] max-w-4xl mx-auto">
            Revolutionize{' '}
            <span className="inline-flex items-center gap-2.5 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-slate-100/90 border border-slate-200/90 shadow-xs align-middle mx-1 sm:mx-2">
              {/* Neutral / Grayish Equalizer Waveform Bars */}
              <span className="flex items-center gap-0.5">
                <span className="w-1 h-3 bg-slate-400 rounded-full animate-pulse" />
                <span className="w-1 h-5 bg-slate-600 rounded-full animate-pulse delay-75" />
                <span className="w-1 h-6 bg-slate-800 rounded-full animate-pulse delay-150" />
                <span className="w-1 h-4 bg-slate-500 rounded-full animate-pulse delay-100" />
              </span>
              <span className="text-sm sm:text-base font-bold tracking-tight text-slate-800">
                Conversations
              </span>
              {/* Right Equalizer Waveform Bars */}
              <span className="flex items-center gap-0.5">
                <span className="w-1 h-4 bg-slate-500 rounded-full animate-pulse delay-100" />
                <span className="w-1 h-6 bg-slate-800 rounded-full animate-pulse delay-150" />
                <span className="w-1 h-5 bg-slate-600 rounded-full animate-pulse delay-75" />
                <span className="w-1 h-3 bg-slate-400 rounded-full animate-pulse" />
              </span>
            </span>{' '}
            with <span className="text-slate-800 font-extrabold tracking-tight">AI-Powered</span>
            <br className="hidden sm:inline" /> Voice Chat
          </h1>

          <p className="text-slate-500 text-sm sm:text-base font-normal max-w-xl mx-auto mt-4 leading-relaxed">
            Practice realistic AI mock interviews and conduct deep ATS resume skill gap analysis concurrently from one elegant workspace.
          </p>
        </div>

        {/* CTA Button in Sleek Grayish / Charcoal Tone */}
        <div className="mt-8 flex justify-center reveal-init">
          <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard" forceRedirectUrl="/dashboard">
            <button className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm flex items-center gap-2.5 px-8 py-3.5 rounded-full border border-slate-700/60 shadow-lg shadow-slate-900/10 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
              <span>Let's get started</span>
              <ArrowRight className="w-4 h-4 text-slate-300" />
            </button>
          </SignUpButton>
        </div>

        {/* ── Central Hero Graphic & Connected Callout Cards ─────── */}
        <div className="mt-14 sm:mt-18 relative max-w-4xl mx-auto flex items-center justify-center min-h-[360px] sm:min-h-[440px] reveal-init">
          {/* Central 3D AI Orb */}
          <div className="relative group">
            {/* Ambient subtle aura behind orb */}
            <div className="absolute -inset-8 bg-slate-400/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative w-56 h-56 sm:w-72 sm:h-72 rounded-full overflow-hidden border-2 border-slate-200/90 shadow-[0_20px_50px_rgba(15,23,42,0.12)] bg-black">
              <img
                src={aiOrb}
                alt="AI Voice Orb"
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>

          {/* ── Left Side Floating Callouts & Connector Lines ── */}
          <div className="absolute left-0 top-6 sm:top-10 flex flex-col items-start text-left max-w-[200px] sm:max-w-[250px] z-20 animate-float">
            {/* Stat Pill */}
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900 mb-1.5">
              <Zap className="w-4 h-4 text-slate-700 fill-slate-700" />
              <span>92%</span>
            </div>
            <div className="text-slate-500 text-xs font-medium mb-3">
              More Streamlined & Productive
            </div>

            {/* SVG Connector 1 */}
            <svg className="w-24 h-12 -ml-1 text-slate-300" viewBox="0 0 96 48" fill="none">
              <path d="M12 0 V30 Q12 40 24 40 H96" stroke="currentColor" strokeWidth="1.5" />
            </svg>

            {/* Floating White Card */}
            <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-md shadow-slate-200/50 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                <Award className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Humanistic Respond</div>
                <div className="text-[11px] text-slate-600 font-semibold">Guarantee</div>
              </div>
            </div>
          </div>

          {/* ── Right Side Floating Callouts & Connector Lines ─ */}
          <div className="absolute right-0 top-6 sm:top-10 flex flex-col items-end text-right max-w-[200px] sm:max-w-[250px] z-20 animate-float-delayed">
            {/* Floating White Card: Model Badge */}
            <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-md shadow-slate-200/50 flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                <BrainCircuit className="w-5 h-5 text-slate-200" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Chat GPT 4.0</div>
                <div className="text-[11px] text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
                  Ready
                </div>
              </div>
            </div>

            {/* SVG Connector 2 */}
            <svg className="w-24 h-12 -mr-1 text-slate-300" viewBox="0 0 96 48" fill="none">
              <path d="M84 0 V30 Q84 40 72 40 H0" stroke="currentColor" strokeWidth="1.5" />
            </svg>

            {/* Quote Caption */}
            <p className="text-slate-500 text-[11px] sm:text-xs leading-relaxed max-w-[220px] text-right">
              Engaging with artificial intelligence used to seem challenging, daunting, and somewhat mechanical.
            </p>
          </div>
        </div>
      </section>

      {/* ── CORE CAPABILITIES SECTION (Two Main Pillars) ─────────── */}
      <section id="capabilities" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 border-t border-slate-200/70 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-14 reveal-init">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 border border-slate-200/80 px-3 py-1 rounded-full">
            Concurrent Core Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
            Two Powerful Systems In One Unified Hub
          </h2>
          <p className="text-slate-600 text-sm mt-3 leading-relaxed">
            Once signed in, access both real-time voice interview coaching and deep ATS resume gap analysis concurrently from your dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: AI Mock Interview Simulator */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-lg shadow-slate-200/30 hover:border-slate-400 hover:shadow-xl transition-all duration-300 flex flex-col justify-between reveal-init">
            <div>
              <div className="w-13 h-13 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 mb-6">
                <BrainCircuit className="w-6 h-6" />
              </div>

              <div className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 mb-3">
                Capability 1 • Live Practice
              </div>

              <h3 className="text-2xl font-bold text-slate-900 mb-2.5 tracking-tight">
                AI Mock Interview Simulator
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Step into an adaptive technical or behavioral interview. Speak your answer, get real-time audio analysis, and receive structured STAR feedback scored across 4 core dimensions.
              </p>

              <ul className="space-y-3 text-xs text-slate-700 mb-8">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-slate-800 flex-shrink-0" />
                  Adaptive difficulty engine (Easy, Medium, Hard, Dynamic)
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-slate-800 flex-shrink-0" />
                  Microphone audio recording & Speech-to-Text transcription
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-slate-800 flex-shrink-0" />
                  STAR structure coaching and topic breakdown radar
                </li>
              </ul>
            </div>

            <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard" forceRedirectUrl="/dashboard">
              <button className="w-full py-3.5 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer">
                <span>Start Interview Session</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
              </button>
            </SignUpButton>
          </div>

          {/* Card 2: Resume Analyzer */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-lg shadow-slate-200/30 hover:border-slate-400 hover:shadow-xl transition-all duration-300 flex flex-col justify-between reveal-init">
            <div>
              <div className="w-13 h-13 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 mb-6">
                <FileText className="w-6 h-6" />
              </div>

              <div className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 mb-3">
                Capability 2 • ATS Intelligence
              </div>

              <h3 className="text-2xl font-bold text-slate-900 mb-2.5 tracking-tight">
                Smart Resume ATS Analyzer
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Upload your PDF, DOC, or DOCX resume. Our intelligence engine extracts verified skills, compares them against target job descriptions, and provides actionable recommendations.
              </p>

              <ul className="space-y-3 text-xs text-slate-700 mb-8">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-slate-800 flex-shrink-0" />
                  Automated skill extraction with AI confidence scores
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-slate-800 flex-shrink-0" />
                  Target role gap comparison (SDE, Frontend, Data & HR)
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-slate-800 flex-shrink-0" />
                  Tailored study roadmap and resume improvement bullet points
                </li>
              </ul>
            </div>

            <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard" forceRedirectUrl="/dashboard">
              <button className="w-full py-3.5 rounded-xl text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 flex items-center justify-center gap-2 shadow-xs hover:shadow-sm transition-all cursor-pointer">
                <span>Upload & Analyze Resume</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
              </button>
            </SignUpButton>
          </div>
        </div>
      </section>

      {/* ── STEP 3: INFINITE SCROLL SECTION ("From Practice to Offer Letter") ── */}
      <section id="how-it-works" className="py-20 border-t border-slate-200/70 relative z-10 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-10 text-center reveal-init">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-slate-600" />
            <span>Continuous Infinite Flow</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            From Practice to Offer Letter
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-2 max-w-md mx-auto">
            Hover over any step to pause the flow and explore how NextRound accelerates your interview readiness.
          </p>
        </div>

        {/* Infinite Scrolling Track with Edge Gradient Fade Masks */}
        <div className="relative w-full overflow-hidden py-4">
          {/* Left Gradient Fade Mask */}
          <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-40 bg-gradient-to-r from-[#f8f9fd] to-transparent z-20 pointer-events-none" />

          {/* Right Gradient Fade Mask */}
          <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-40 bg-gradient-to-l from-[#f8f9fd] to-transparent z-20 pointer-events-none" />

          {/* Scrolling Marquee Container */}
          <div
            className={`marquee-track flex gap-6 ${isMarqueePaused ? '[animation-play-state:paused]' : ''}`}
            onMouseEnter={() => setIsMarqueePaused(true)}
            onMouseLeave={() => setIsMarqueePaused(false)}
          >
            {infiniteSteps.map((item, idx) => (
              <div
                key={`${item.step}-${idx}`}
                className="w-[300px] sm:w-[340px] flex-shrink-0 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-400 transition-all duration-300 flex flex-col justify-between group cursor-default"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl font-black text-slate-400 group-hover:text-slate-700 transition-colors">
                      {item.step}
                    </span>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {item.tag}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                    {item.title}
                  </h4>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
                  <span>Step {item.step} of 06</span>
                  <span className="text-slate-700 font-semibold group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Infinite Scroll Control Indicator */}
        <div className="flex items-center justify-center gap-2 mt-8 text-xs text-slate-500">
          <button
            onClick={() => setIsMarqueePaused(!isMarqueePaused)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200/80 shadow-xs hover:bg-slate-50 text-slate-600 transition-all cursor-pointer"
          >
            {isMarqueePaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            <span>{isMarqueePaused ? 'Resume scroll' : 'Pause on hover'}</span>
          </button>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200/80 py-10 text-center text-xs text-slate-500 bg-white/60 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center shadow-xs">
              <span className="w-0.5 h-3 bg-white rounded-full" />
            </div>
            <span className="font-bold text-slate-800 text-sm tracking-tight">NextRound</span>
          </div>
          <p>© 2026 NextRound. All rights reserved. Practice smart, interview confident.</p>
          <div className="flex items-center gap-5 text-xs text-slate-500 font-medium">
            <a href="#capabilities" className="hover:text-slate-800 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-slate-800 transition-colors">How it works</a>
            <SignInButton mode="modal">
              <button className="hover:text-slate-800 transition-colors cursor-pointer">Sign In</button>
            </SignInButton>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
