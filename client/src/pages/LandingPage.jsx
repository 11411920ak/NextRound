import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignIn, SignUp, useUser } from '@clerk/clerk-react';
import {
  BrainCircuit,
  FileText,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Target,
  TrendingUp,
  Award,
} from 'lucide-react';

const LandingPage = () => {
  const { isSignedIn, isLoaded } = useUser();
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState('signup'); // Default to Sign Up for new visitors

  // If user is already signed in, immediately route to dashboard
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoaded, isSignedIn, navigate]);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 overflow-hidden relative">
      {/* Ambient glowing radial gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-brand-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[450px] h-[450px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Hero Section with Embedded Auth Container */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 lg:pt-16 lg:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Product Value Proposition */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-brand-300 shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>Next-Gen AI Interview Prep & Resume Intelligence</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
              Ace Your Next Round with{' '}
              <span className="gradient-text">Adaptive AI Coaching</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              Prepare for real-world tech & behavioral interviews with instant STAR scoring,
              and analyze your resume against industry roles to identify skill gaps before the recruiter does.
            </p>

            {/* Key feature pills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
              {[
                { title: 'AI Mock Interviews', desc: 'Adaptive difficulty with real-time STAR evaluation' },
                { title: 'Resume ATS Analyzer', desc: 'Skill extraction & role gap analysis for tech jobs' },
                { title: 'Question Deduplication', desc: 'Never repeat questions in the same session' },
                { title: 'Comprehensive Reports', desc: 'Strengths, weaknesses, and improvement radar' },
              ].map(({ title, desc }) => (
                <div key={title} className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <CheckCircle2 className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white">{title}</h4>
                    <p className="text-[11px] text-slate-400 leading-tight">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Social Proof */}
            <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Instant Clerk Authentication</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Target className="w-4 h-4 text-brand-400" />
                <span>Tailored for SDE, Frontend, Data & HR</span>
              </div>
            </div>
          </div>

          {/* Right Column: Direct Sign Up & Sign In Container */}
          <div id="auth-section" className="lg:col-span-5 flex flex-col items-center">
            <div className="w-full max-w-md glass-card p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl relative">
              {/* Tab Selector: Sign Up & Sign In contained on the page */}
              <div className="flex p-1 rounded-xl bg-white/5 border border-white/10 mb-6 shadow-inner">
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                    authMode === 'signup'
                      ? 'bg-gradient-to-r from-brand-500 to-violet-600 text-white shadow-md shadow-brand-500/25'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                    authMode === 'signin'
                      ? 'bg-gradient-to-r from-brand-500 to-violet-600 text-white shadow-md shadow-brand-500/25'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
              </div>

              {/* Clerk Sign Up / Sign In Form */}
              <div className="flex justify-center w-full">
                {authMode === 'signup' ? (
                  <SignUp
                    routing="hash"
                    signInUrl="#signin"
                    fallbackRedirectUrl="/dashboard"
                    forceRedirectUrl="/dashboard"
                  />
                ) : (
                  <SignIn
                    routing="hash"
                    signUpUrl="#signup"
                    fallbackRedirectUrl="/dashboard"
                    forceRedirectUrl="/dashboard"
                  />
                )}
              </div>

              <p className="text-[11px] text-center text-slate-500 mt-4">
                By continuing, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Two Core Capabilities Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="section-label">Main Functionality</span>
          <h2 className="text-3xl font-bold text-white mt-1">Two Powerful Tools In One Platform</h2>
          <p className="text-slate-400 text-sm mt-2">
            Sign in above to unlock both mock interview simulations and resume ATS intelligence concurrently.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Capability 1: AI Mock Interview */}
          <div className="glass-card p-8 rounded-3xl border border-brand-500/20 relative group hover:border-brand-500/40 transition-all">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500/20 to-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 mb-6">
              <BrainCircuit className="w-7 h-7" />
            </div>
            <div className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20 mb-3">
              Core Feature 1
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Interactive AI Mock Interviews</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Step into a simulated technical or behavioral interview. Our AI models evaluate your answers on relevance, STAR structure, clarity, and technical correctness.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-300 mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-400" />
                Adaptive difficulty scaling as you answer
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-400" />
                Audio recording & speech-to-text response options
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-400" />
                Post-interview radar charts and topic performance analysis
              </li>
            </ul>
          </div>

          {/* Capability 2: Resume Analyzer */}
          <div className="glass-card p-8 rounded-3xl border border-violet-500/20 relative group hover:border-violet-500/40 transition-all">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-6">
              <FileText className="w-7 h-7" />
            </div>
            <div className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20 mb-3">
              Core Feature 2
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Smart Resume ATS Analyzer</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Upload your PDF, DOC, or DOCX resume. Our intelligence engine extracts verified skills, compares them against target job descriptions, and gives actionable recommendations.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-300 mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-violet-400" />
                Skill extraction with AI confidence scores
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-violet-400" />
                Role gap analysis identifying missing competencies
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-violet-400" />
                Personalized study recommendations and roadmap
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-500">
        <p>© 2026 NextRound. All rights reserved. Practice smart, interview confident.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
