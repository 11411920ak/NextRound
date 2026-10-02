import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserButton, SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/clerk-react';
import { LayoutDashboard, Plus, FileText, ArrowRight, Sparkles } from 'lucide-react';

const Navbar = () => {
  const { user } = useAuth();
  const location = useLocation();

  const navLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/resume', icon: FileText, label: 'Resume Analyzer' },
    { to: '/interview/setup', icon: Plus, label: 'New Session' },
  ];

  const landingNavLinks = [
    { href: '#features', label: 'Features' },
    { href: '#capabilities', label: 'Capabilities' },
    { href: '#how-it-works', label: 'How It Works' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center py-4 px-4 pointer-events-none">
      <div className="w-full max-w-6xl flex items-center justify-between px-5 py-2.5 rounded-full bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-lg shadow-slate-200/50 pointer-events-auto">
        {/* Brand Logo with Colorful Waveform Mark */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 via-purple-500 to-amber-400 flex items-center justify-center shadow-md shadow-purple-500/25 group-hover:scale-105 transition-transform">
            <span className="flex items-center gap-0.5">
              <span className="w-0.5 h-3 bg-white rounded-full animate-pulse" />
              <span className="w-0.5 h-4.5 bg-white rounded-full animate-pulse delay-75" />
              <span className="w-0.5 h-2.5 bg-white rounded-full animate-pulse delay-150" />
            </span>
          </div>
          <span className="font-bold text-base text-slate-900 tracking-tight">
            Next<span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">Round</span>
          </span>
        </Link>

        {/* Center Pill Menu */}
        <div className="hidden md:flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100/80 border border-slate-200/60">
          <SignedIn>
            {navLinks.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive(to)
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            ))}
          </SignedIn>

          <SignedOut>
            {landingNavLinks.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-white/80 transition-all"
              >
                {label}
              </a>
            ))}
          </SignedOut>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-2.5">
          <SignedIn>
            <span className="hidden sm:inline-block text-xs text-slate-700 font-medium px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200/60">
              {user?.name?.split(' ')[0] || 'User'}
            </span>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: 'w-7 h-7 ring-2 ring-slate-300 hover:ring-slate-500 transition-all',
                },
              }}
            />
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal" fallbackRedirectUrl="/dashboard" forceRedirectUrl="/dashboard">
              <button className="px-4 py-1.5 rounded-full text-xs font-medium text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer">
                Sign In
              </button>
            </SignInButton>

            <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard" forceRedirectUrl="/dashboard">
              <button className="bg-slate-900 hover:bg-slate-800 text-white py-1.5 px-4 text-xs font-semibold rounded-full flex items-center gap-1.5 shadow-sm border border-slate-700/60 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]">
                <span>Get Started</span>
                <ArrowRight className="w-3 h-3 text-slate-300" />
              </button>
            </SignUpButton>
          </SignedOut>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
