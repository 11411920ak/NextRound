import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  User, Briefcase, Clock, ChevronRight, CheckCircle, Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const ProfileCompletePage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: user?.name || '',
    gender: '',
    workAs: '',
    experienceKind: 'fresher', // 'fresher' | 'experienced'
    experienceValue: '',
    experienceUnit: 'years',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.gender) e.gender = 'Please select your gender.';
    if (!form.workAs.trim()) e.workAs = 'Please enter your current or target role.';
    if (form.experienceKind === 'experienced') {
      const val = parseFloat(form.experienceValue);
      if (!form.experienceValue || isNaN(val) || val < 0) {
        e.experienceValue = 'Please enter a valid experience amount.';
      }
    }
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const experience = {
      kind: form.experienceKind,
      value: form.experienceKind === 'experienced' ? parseFloat(form.experienceValue) : null,
      unit: form.experienceKind === 'experienced' ? form.experienceUnit : null,
    };

    setLoading(true);
    try {
      const { data } = await api.patch('/auth/me', {
        name: form.name.trim(),
        gender: form.gender,
        workAs: form.workAs.trim(),
        experience,
      });
      updateUser(data.user);
      toast.success('Profile saved! 🎉');
      navigate('/resume', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      {/* Ambient glows */}
      <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-lg animate-slide-up">
        {/* Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-brand-500/30 mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Complete your profile</h1>
          <p className="text-slate-400 mt-2 text-sm max-w-xs">
            This helps us tailor interview questions and resume analysis to your background.
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {['Account created', 'Profile details', 'Resume analysis'].map((step, i) => (
            <div key={step} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                i === 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                i === 1 ? 'bg-brand-600/30 text-brand-300 border border-brand-500/50' :
                'bg-white/5 text-slate-500 border border-white/10'
              }`}>
                {i === 0 ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span className="text-xs text-slate-500 hidden sm:block">{step}</span>
              {i < 2 && <div className="absolute" />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* Name */}
            <div>
              <label htmlFor="pc-name" className="block text-sm font-medium text-slate-300 mb-2">
                Full name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="pc-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="input-field pl-10"
                  placeholder="Your full name"
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Gender</label>
              <div className="grid grid-cols-2 gap-2">
                {GENDER_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleChange('gender', value)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 text-left ${
                      form.gender === value
                        ? 'bg-brand-600/25 text-brand-300 border-brand-500/50'
                        : 'bg-white/4 text-slate-400 border-white/10 hover:bg-white/8 hover:text-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {errors.gender && <p className="text-xs text-red-400 mt-1">⚠ {errors.gender}</p>}
            </div>

            {/* Work As */}
            <div>
              <label htmlFor="pc-workAs" className="block text-sm font-medium text-slate-300 mb-2">
                Current or target job role
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="pc-workAs"
                  type="text"
                  value={form.workAs}
                  onChange={(e) => handleChange('workAs', e.target.value)}
                  className={`input-field pl-10 ${errors.workAs ? 'border-red-500/60' : ''}`}
                  placeholder="e.g. Frontend Developer, Data Analyst..."
                />
              </div>
              {errors.workAs && <p className="text-xs text-red-400 mt-1">⚠ {errors.workAs}</p>}
            </div>

            {/* Experience */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Experience level</label>
              {/* Toggle */}
              <div className="flex rounded-xl overflow-hidden border border-white/10 mb-3">
                <button
                  type="button"
                  onClick={() => handleChange('experienceKind', 'fresher')}
                  className={`flex-1 py-2.5 text-sm font-medium transition-all duration-200 ${
                    form.experienceKind === 'fresher'
                      ? 'bg-brand-600/30 text-brand-300'
                      : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'
                  }`}
                >
                  Fresher / Student
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('experienceKind', 'experienced')}
                  className={`flex-1 py-2.5 text-sm font-medium border-l border-white/10 transition-all duration-200 ${
                    form.experienceKind === 'experienced'
                      ? 'bg-brand-600/30 text-brand-300'
                      : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'
                  }`}
                >
                  Experienced
                </button>
              </div>

              {/* Experience input */}
              {form.experienceKind === 'experienced' && (
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="number"
                      min="0"
                      max="50"
                      step="0.5"
                      value={form.experienceValue}
                      onChange={(e) => handleChange('experienceValue', e.target.value)}
                      className={`input-field pl-10 ${errors.experienceValue ? 'border-red-500/60' : ''}`}
                      placeholder="e.g. 2"
                    />
                  </div>
                  <select
                    value={form.experienceUnit}
                    onChange={(e) => handleChange('experienceUnit', e.target.value)}
                    className="input-field w-28 cursor-pointer"
                  >
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                </div>
              )}
              {errors.experienceValue && (
                <p className="text-xs text-red-400 mt-1">⚠ {errors.experienceValue}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              id="profile-complete-submit"
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Save & Continue
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-4">
          You can update these details anytime from your profile settings.
        </p>
      </div>
    </div>
  );
};

export default ProfileCompletePage;
