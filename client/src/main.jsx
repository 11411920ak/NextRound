import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import './index.css';
import App from './App.jsx';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

const ClerkAppWrapper = ({ children }) => {
  if (!clerkPubKey || !clerkPubKey.startsWith('pk_')) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full glass-card p-8 border border-violet-500/30 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-2xl shadow-xl shadow-brand-500/30">
            🔐
          </div>
          <h2 className="text-xl font-bold text-white">Clerk Configuration Required</h2>
          <p className="text-slate-400 text-sm">
            Please add your <code className="text-violet-300 bg-white/5 px-2 py-0.5 rounded">VITE_CLERK_PUBLISHABLE_KEY</code> in <code className="text-violet-300 bg-white/5 px-2 py-0.5 rounded">client/.env</code>.
          </p>
          <a
            href="https://dashboard.clerk.com"
            target="_blank"
            rel="noreferrer"
            className="btn-primary inline-flex items-center gap-2 py-2 px-5 text-sm"
          >
            Open Clerk Dashboard →
          </a>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      appearance={{
        variables: {
          colorPrimary: '#7c3aed',
          colorBackground: '#ffffff',
          colorInputBackground: '#f8fafc',
          colorInputText: '#0f172a',
          colorTextOnPrimaryBackground: '#ffffff',
          borderRadius: '0.875rem',
        },
        elements: {
          card: 'bg-white border border-slate-200 shadow-2xl rounded-2xl',
          formButtonPrimary:
            'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium shadow-lg shadow-violet-500/25 transition-all',
          socialButtonsBlockButton:
            'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-all shadow-sm',
          footerActionLink: 'text-violet-600 hover:text-violet-700 font-medium',
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkAppWrapper>
      <App />
    </ClerkAppWrapper>
  </StrictMode>
);


