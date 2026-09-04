import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ChevronRight, Zap, Target, Trophy, Sparkles, MessageSquare, Layers, BookOpen, Repeat, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { ROLES, ROLE_CATEGORIES } from '../constants/roles';

const DIFFICULTIES = [
  { id: 'adaptive', label: 'Adaptive', icon: Sparkles, desc: 'AI adjusts difficulty', color: 'text-brand-400 border-brand-500/30 bg-brand-500/5' },
  { id: 'easy', label: 'Easy', icon: Zap, desc: 'Foundational questions', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5' },
  { id: 'medium', label: 'Medium', icon: Target, desc: 'Industry standard', color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5' },
  { id: 'hard', label: 'Hard', icon: Trophy, desc: 'FAANG-level prep', color: 'text-red-400 border-red-500/30 bg-red-500/5' },
];

const EXPERIENCES = [
  { id: 'fresher', label: 'Fresher', desc: '< 1 year' },
  { id: '1-2_years', label: '1–2 Years', desc: 'Junior level' },
  { id: '3+_years', label: '3+ Years', desc: 'Senior level' },
];

const INTERVIEW_TYPES = [
  { id: 'technical', label: '⚙️ Technical', desc: 'Coding, DSA, System Design' },
  { id: 'hr', label: '🤝 HR / Behavioral', desc: 'Soft skills & culture fit' },
  { id: 'mixed', label: '🔀 Mixed', desc: 'Technical + HR combined' },
];

const QUESTION_COUNTS = [5, 10, 15, 20];

const RoleSelectPage = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState('adaptive');
  const [selectedExperience, setSelectedExperience] = useState('fresher');
  const [selectedType, setSelectedType] = useState('technical');
  const [selectedCount, setSelectedCount] = useState(10);
  const [mode, setMode] = useState('practice');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const filteredRoles = activeCategory === 'all'
    ? ROLES
    : ROLES.filter((r) => r.category === activeCategory);

  const handleStart = async () => {
    if (!selectedRole) { toast.error('Please select a role first.'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/session/start', {
        role: selectedRole,
        experience: selectedExperience,
        interview_type: selectedType,
        difficulty: selectedDifficulty,
        total_questions: selectedCount,
        mode,
      });
      toast.success('Session started! Good luck! 💪');
      navigate(`/interview/${data.session._id}`, {
        state: {
          session: data.session,
          firstQuestion: data.question,
          mode,
        },
      });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roleName = selectedRole ? ROLES.find((r) => r.id === selectedRole)?.label : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 animate-slide-up">
      {/* Header */}
      <div className="text-center mb-8">
        <span className="section-label">Interview Setup</span>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mt-2">
          Configure Your <span className="gradient-text">Interview</span>
        </h1>
        <p className="text-slate-400 mt-2 text-sm sm:text-base max-w-xl mx-auto">
          Select from 16 specialized roles. AI adapts questions to your experience level and performance.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center justify-center flex-wrap gap-2 mb-8">
        {ROLE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              activeCategory === cat.id
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25 scale-105'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 border border-white/5'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {filteredRoles.map((role) => {
          const Icon = role.icon;
          const isSelected = selectedRole === role.id;
          return (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={`relative p-5 rounded-2xl border-2 text-left flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] ${
                isSelected
                  ? `border-transparent bg-gradient-to-br ${role.color} shadow-xl ${role.glow}`
                  : `bg-white/5 ${role.border} hover:bg-white/8 hover:border-opacity-60`
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isSelected ? 'bg-white/20' : `bg-gradient-to-br ${role.color} opacity-90`
                  }`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </div>
                <h3 className={`font-bold text-base mb-1 ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                  {role.label}
                </h3>
                <p className={`text-xs mb-3 line-clamp-2 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                  {role.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-1 mt-auto">
                {role.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-white/8 text-slate-400'
                  }`}>
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Configuration Panel */}
      <div className="glass-card p-6 mb-8 max-w-4xl mx-auto space-y-6">

        {/* Row 1: Experience + Interview Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Experience */}
          <div>
            <p className="section-label mb-3">Experience Level</p>
            <div className="flex gap-2">
              {EXPERIENCES.map((exp) => (
                <button
                  key={exp.id}
                  onClick={() => setSelectedExperience(exp.id)}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-3 px-2 rounded-xl border-2 text-center transition-all duration-200 ${
                    selectedExperience === exp.id
                      ? 'border-brand-500 bg-brand-500/10 text-brand-300'
                      : 'border-white/10 bg-transparent text-slate-400 hover:border-white/20'
                  }`}
                >
                  <span className="font-semibold text-sm">{exp.label}</span>
                  <span className="text-[11px] opacity-70">{exp.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Interview Type */}
          <div>
            <p className="section-label mb-3">Interview Type</p>
            <div className="flex flex-col gap-2">
              {INTERVIEW_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 text-left transition-all duration-200 ${
                    selectedType === type.id
                      ? 'border-violet-500/60 bg-violet-500/10 text-violet-300'
                      : 'border-white/10 bg-transparent text-slate-400 hover:border-white/20'
                  }`}
                >
                  <div className="flex-1">
                    <span className="font-semibold text-sm block">{type.label}</span>
                    <span className="text-[11px] opacity-70">{type.desc}</span>
                  </div>
                  {selectedType === type.id && (
                    <div className="w-2 h-2 rounded-full bg-violet-400 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Difficulty */}
        <div>
          <p className="section-label mb-3">Difficulty Level</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {DIFFICULTIES.map((diff) => {
              const Icon = diff.icon;
              return (
                <button
                  key={diff.id}
                  onClick={() => setSelectedDifficulty(diff.id)}
                  className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all duration-200 ${
                    selectedDifficulty === diff.id
                      ? `${diff.color} border-opacity-100`
                      : 'border-white/10 bg-transparent hover:border-white/20 text-slate-400'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${selectedDifficulty === diff.id ? '' : 'text-slate-500'}`} />
                  <span className="font-semibold text-sm">{diff.label}</span>
                  <span className="text-[11px] opacity-75">{diff.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 3: Question Count + Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Question Count */}
          <div>
            <p className="section-label mb-3">Number of Questions</p>
            <div className="flex gap-2">
              {QUESTION_COUNTS.map((count) => (
                <button
                  key={count}
                  onClick={() => setSelectedCount(count)}
                  className={`flex-1 py-2.5 rounded-xl border-2 font-bold text-sm transition-all duration-200 ${
                    selectedCount === count
                      ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'
                      : 'border-white/10 bg-transparent text-slate-400 hover:border-white/20'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-600 mt-2 text-center">
              ~{Math.round(selectedCount * 2.5)} minutes estimated
            </p>
          </div>

          {/* Mode Toggle */}
          <div>
            <p className="section-label mb-3">Interview Mode</p>
            <div className="flex gap-3">
              <button
                onClick={() => setMode('practice')}
                className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all duration-200 ${
                  mode === 'practice'
                    ? 'border-blue-500/60 bg-blue-500/10 text-blue-300'
                    : 'border-white/10 bg-transparent text-slate-400 hover:border-white/20'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span className="font-semibold text-sm">Practice</span>
                <span className="text-[10px] opacity-70">See feedback after each answer</span>
              </button>
              <button
                onClick={() => setMode('mock')}
                className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all duration-200 ${
                  mode === 'mock'
                    ? 'border-orange-500/60 bg-orange-500/10 text-orange-300'
                    : 'border-white/10 bg-transparent text-slate-400 hover:border-white/20'
                }`}
              >
                <EyeOff className="w-4 h-4" />
                <span className="font-semibold text-sm">Mock</span>
                <span className="text-[10px] opacity-70">Real interview, feedback at end</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Session Summary */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 px-1 max-w-4xl mx-auto gap-2">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <span>📋</span>
          <span>{selectedCount} questions · ~{Math.round(selectedCount * 2.5)} min · AI-powered evaluation</span>
        </div>
        <div className="text-slate-500 text-sm">
          {mode === 'mock' ? '🎯 Mock mode — feedback revealed at end' : '📚 Practice mode — real-time feedback'}
        </div>
      </div>

      {/* Start Button */}
      <div className="max-w-4xl mx-auto">
        <button
          onClick={handleStart}
          disabled={!selectedRole || loading}
          className="btn-primary w-full flex items-center justify-center gap-2 text-base py-4 shadow-lg shadow-brand-500/20"
        >
          {loading ? (
            <LoadingSpinner size="sm" text="" />
          ) : (
            <>
              {roleName ? `Start ${mode === 'mock' ? 'Mock' : 'Practice'} Interview — ${roleName}` : 'Select a Role to Begin'}
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default RoleSelectPage;
