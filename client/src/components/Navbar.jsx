import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserButton, SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { BrainCircuit, LayoutDashboard, Plus, FileText } from 'lucide-react';

const Navbar = () => {
  const { user } = useAuth();
  const location = useLocation();

  const navLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/resume', icon: FileText, label: 'Resume Analyzer' },
    { to: '/interview/setup', icon: Plus, label: 'New Session' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-950/80 backdrop-blur-md border-b border-white/8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-lg shadow-brand-500/25 group-hover:shadow-brand-500/40 transition-shadow">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white">
              Next<span className="gradient-text">Round</span>
            </span>
          </Link>

          {/* Signed In View: Full internal navigation bar */}
          <SignedIn>
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(({ to, icon: Icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(to)
                      ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/8'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-sm text-slate-300 font-medium">
                {user?.name?.split(' ')[0] || 'User'}
              </span>
              <div className="flex items-center justify-center">
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: 'w-8 h-8 ring-2 ring-brand-500/30 hover:ring-brand-500/60 transition-all',
                    },
                  }}
                />
              </div>
            </div>
          </SignedIn>

          {/* Signed Out View: Clean and minimal without internal nav bar, contains Sign In */}
          <SignedOut>
            <div className="flex items-center gap-3">
              <SignInButton mode="modal" fallbackRedirectUrl="/dashboard" forceRedirectUrl="/dashboard">
                <button className="btn-ghost text-sm font-medium hover:text-white">
                  Sign In
                </button>
              </SignInButton>
              <a
                href="#auth-section"
                className="btn-primary text-sm py-2 px-4 shadow-lg shadow-brand-500/25 hidden sm:inline-flex"
              >
                Get Started Free
              </a>
            </div>
          </SignedOut>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
