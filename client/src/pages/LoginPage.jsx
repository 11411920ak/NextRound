import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { BrainCircuit, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import GoogleSignInButton from '../components/GoogleSignInButton';

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const EMAIL_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/;

  const validateEmail = (val) => {
    if (!val) return 'Email is required.';
    if (!EMAIL_REGEX.test(val)) return 'Please enter a valid email address.';
    return '';
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    if (e.target.name === 'email') setEmailError('');
  };

  const handleEmailBlur = () => {
    setEmailError(validateEmail(form.email));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailErr = validateEmail(form.email);
    if (emailErr) { setEmailError(emailErr); return; }
    if (!form.password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);

      // Handle unverified email — redirect to verification
      if (data.requiresVerification) {
        login(data.token, data.user);
        toast('Please verify your email first.', { icon: '📩' });
        navigate('/verify-email', { replace: true });
        return;
      }

      login(data.token, data.user);
      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}! 👋`);
      // Redirect to profile completion if first login
      if (!data.user.profileComplete) {
        navigate('/profile/complete', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-brand-500/30 mb-4">
            <BrainCircuit className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-slate-400 mt-1 text-sm">Sign in to continue your interview prep</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-slate-300 mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleEmailBlur}
                  placeholder="you@example.com"
                  className={`input-field pl-10 ${emailError ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                  autoComplete="email"
                  required
                />
              </div>
              {emailError && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <span>⚠</span> {emailError}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input-field pl-10 pr-10"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Google Sign-In */}
          <div className="mt-6 pt-6 border-t border-white/8">
            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-dark-900 px-3 text-slate-500">or continue with</span>
              </div>
            </div>

            <GoogleSignInButton />

            <p className="text-slate-400 text-sm text-center mt-5">
              Don't have an account?{' '}
              <Link to="/signup" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
                Create one free →
              </Link>
            </p>
          </div>
        </div>

        {/* Demo credentials hint */}
        <p className="text-center text-xs text-slate-600 mt-4">
          New here? Create a free account — no credit card required.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
