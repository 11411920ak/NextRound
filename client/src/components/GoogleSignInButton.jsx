import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useState } from 'react';

/**
 * Google Sign-In button — matches the dark glassmorphism theme.
 * Uses the authorization code flow via useGoogleLogin (implicit → credential).
 * Actually uses the One Tap / popup flow with GoogleLogin for ID token.
 */
const GoogleSignInButton = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/google', {
        credential: credentialResponse.credential,
      });

      login(data.token, data.user);

      if (data.isNewUser) {
        toast.success('Account created with Google! 🎉');
        navigate('/profile/complete', { replace: true });
      } else if (!data.user.profileComplete) {
        toast.success(`Welcome back, ${data.user.name.split(' ')[0]}! 👋`);
        navigate('/profile/complete', { replace: true });
      } else {
        toast.success(`Welcome back, ${data.user.name.split(' ')[0]}! 👋`);
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="google-signin-btn">
      {/* Using the @react-oauth/google GoogleLogin component for ID token flow */}
      <GoogleLoginButton onSuccess={handleGoogleSuccess} loading={loading} />
    </div>
  );
};

/**
 * Custom-styled Google button that triggers the popup via useGoogleLogin.
 * We use the 'implicit' flow which gives us an access_token, then we need
 * to call the userinfo endpoint. Instead, we'll use the GoogleLogin component
 * with custom rendering.
 */
import { GoogleLogin } from '@react-oauth/google';

const GoogleLoginButton = ({ onSuccess, loading }) => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    const handleMissingConfig = () => {
      toast.error('Google OAuth is not configured! Please add VITE_GOOGLE_CLIENT_ID to your client/.env file.', {
        duration: 5000,
      });
    };

    return (
      <div className="w-full">
        <button
          type="button"
          onClick={handleMissingConfig}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-full bg-[#131314] hover:bg-[#1f1f20] border border-dark-600 text-slate-200 text-sm font-medium transition-all shadow-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
          Continue with Google
        </button>
        <p className="text-[11px] text-amber-400/80 text-center mt-1.5">
          ⚠️ Requires Google OAuth Client ID setup in .env
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <GoogleLogin
        onSuccess={onSuccess}
        onError={() => {
          toast.error('Google sign-in was cancelled or failed.');
        }}
        theme="filled_black"
        shape="pill"
        size="large"
        width="100%"
        text="continue_with"
        logo_alignment="center"
      />
      {loading && (
        <div className="flex justify-center mt-3">
          <span className="w-5 h-5 border-2 border-brand-400/30 border-t-brand-400 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default GoogleSignInButton;
