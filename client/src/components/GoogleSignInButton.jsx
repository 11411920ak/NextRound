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
