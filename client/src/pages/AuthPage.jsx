import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SignIn, SignUp, useUser } from '@clerk/clerk-react';
import { BrainCircuit, Sparkles, ShieldCheck } from 'lucide-react';

const AuthPage = ({ initialMode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useUser();

  const isSignupPath = location.pathname.includes('/signup') || initialMode === 'signup';
  const [mode, setMode] = useState(isSignupPath ? 'signup' : 'signin');

  useEffect(() => {
    if (location.pathname.includes('/signup')) {
      setMode('signup');
    } else if (location.pathname.includes('/login')) {
      setMode('signin');
    }
  }, [location.pathname]);

  // Once signed in, immediately redirect to dashboard
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoaded, isSignedIn, navigate]);

  const switchMode = (newMode) => {
    setMode(newMode);
    navigate(newMode === 'signup' ? '/signup' : '/login', { replace: true });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md flex flex-col items-center animate-slide-up">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-brand-500/30 mb-3">
            <BrainCircuit className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">NextRound</h1>
          <p className="text-slate-400 mt-1 text-sm flex items-center gap-1.5 justify-center">
            {mode === 'signin' ? (
              <>
                <ShieldCheck className="w-4 h-4 text-brand-400" />
                Sign in to access your interview dashboard
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-violet-400" />
                Create your account to start AI interview prep
              </>
            )}
          </p>
        </div>

        {/* Tab Switcher: Sign In & Sign Up on the same page */}
        <div className="flex p-1 rounded-xl bg-white/5 border border-white/10 mb-6 w-full max-w-xs shadow-inner">
          <button
            type="button"
            onClick={() => switchMode('signin')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
              mode === 'signin'
                ? 'bg-gradient-to-r from-brand-500 to-violet-600 text-white shadow-md shadow-brand-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
              mode === 'signup'
                ? 'bg-gradient-to-r from-brand-500 to-violet-600 text-white shadow-md shadow-brand-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Clerk Auth Component */}
        <div className="w-full flex justify-center">
          {mode === 'signin' ? (
            <SignIn
              routing="path"
              path="/login"
              signUpUrl="/signup"
              fallbackRedirectUrl="/dashboard"
              forceRedirectUrl="/dashboard"
            />
          ) : (
            <SignUp
              routing="path"
              path="/signup"
              signInUrl="/login"
              fallbackRedirectUrl="/dashboard"
              forceRedirectUrl="/dashboard"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
