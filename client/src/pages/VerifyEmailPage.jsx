import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Mail, RefreshCw, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const VerifyEmailPage = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef([]);
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  // If already verified, redirect
  useEffect(() => {
    if (user?.isVerified) {
      navigate(user.profileComplete ? '/dashboard' : '/profile/complete', { replace: true });
    }
  }, [user, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (value && index === 5 && newOtp.every((d) => d !== '')) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace: clear current and move back
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || '';
    }
    setOtp(newOtp);

    // Focus last filled or the next empty
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();

    // Auto-submit if complete
    if (pasted.length === 6) {
      handleVerify(pasted);
    }
  };

  const handleVerify = async (code) => {
    if (code.length !== 6) {
      setError('Please enter all 6 digits.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/verify-email', { otp: code });

      if (data.verified) {
        setVerified(true);
        toast.success('Email verified! 🎉');

        // Update user context
        if (data.user) {
          updateUser({ ...user, ...data.user, isVerified: true });
        }

        // Redirect after a brief celebration
        setTimeout(() => {
          navigate(user?.profileComplete ? '/dashboard' : '/profile/complete', { replace: true });
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Please try again.');
      // Clear OTP fields on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setResendLoading(true);
    try {
      const { data } = await api.post('/auth/resend-otp');
      toast.success(data.message || 'New code sent!');
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
      setError('');
      inputRefs.current[0]?.focus();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resend code.');
    } finally {
      setResendLoading(false);
    }
  };

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center animate-slide-up">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Email Verified!</h2>
          <p className="text-slate-400 text-sm">Redirecting you...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-600/12 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-brand-500/30 mb-4">
            <Mail className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Check your email</h1>
          <p className="text-slate-400 mt-2 text-sm text-center max-w-xs">
            We sent a 6-digit code to{' '}
            <span className="text-brand-400 font-medium">{user?.email || 'your email'}</span>.
            Enter it below to verify your account.
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          {/* OTP Inputs */}
          <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-12 h-14 text-center text-xl font-bold rounded-xl border transition-all duration-200 bg-white/5 text-white outline-none
                  ${error
                    ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                    : digit
                    ? 'border-brand-500/50 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
                    : 'border-white/15 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
                  }`}
                disabled={loading}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm text-center mb-4">
              {error}
            </div>
          )}

          {/* Verify Button */}
          <button
            onClick={() => handleVerify(otp.join(''))}
            disabled={loading || otp.some((d) => !d)}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Verify Email'
            )}
          </button>

          {/* Resend */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500 mb-2">Didn't receive the code?</p>
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0 || resendLoading}
              className="text-sm text-brand-400 hover:text-brand-300 font-medium transition-colors disabled:text-slate-600 disabled:cursor-not-allowed flex items-center gap-1.5 mx-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resendLoading ? 'animate-spin' : ''}`} />
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-4">
          Code expires in 10 minutes. Check your spam folder if you don't see it.
        </p>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
