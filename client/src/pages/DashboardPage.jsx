import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  BrainCircuit,
  Plus,
  FileText,
  ChevronRight,
  Trophy,
  Calendar,
  Target,
  TrendingUp,
  Clock,
  ArrowRight,
  Sparkles,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { ROLES } from '../constants/roles';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

const formatDuration = (start, end) => {
  if (!start || !end) return '—';
  const diff = Math.round((new Date(end) - new Date(start)) / 60000);
  return `${diff} min`;
};

const getScoreColor = (s) => {
  if (!s && s !== 0) return 'text-slate-500';
  if (s >= 8) return 'text-emerald-400';
  if (s >= 6) return 'text-violet-400';
  if (s >= 4) return 'text-amber-400';
  return 'text-rose-400';
};

const getScoreBg = (s) => {
  if (!s && s !== 0) return 'bg-slate-500/10 border-slate-500/20 text-slate-400';
  if (s >= 8) return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400';
  if (s >= 6) return 'bg-violet-500/15 border-violet-500/30 text-violet-300';
  if (s >= 4) return 'bg-amber-500/15 border-amber-500/30 text-amber-300';
  return 'bg-rose-500/15 border-rose-500/30 text-rose-400';
};

const getRoleBadge = (role) => {
  const found = ROLES.find((r) => r.id === role);
  return found?.badge || 'bg-violet-500/10 text-violet-300 border-violet-500/20';
};

const DashboardPage = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await api.get('/report/dashboard');
        setReports(data.reports || []);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  // Stats
  const totalSessions = reports.length;
  const avgScore = totalSessions
    ? Math.round((reports.reduce((s, r) => s + (r.avg_score || 0), 0) / totalSessions) * 10) / 10
    : 0;
  const bestScore = totalSessions ? Math.max(...reports.map((r) => r.avg_score || 0)) : 0;
  const improving = reports.length >= 2
    ? reports[0].avg_score > reports[reports.length - 1].avg_score
    : false;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 animate-fade-in relative z-10">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-violet-400/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-10 w-80 h-80 bg-purple-400/8 rounded-full blur-[120px] pointer-events-none" />

      {/* ── Top Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-8 border-b border-slate-200/70">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 border border-violet-200/80 text-xs font-semibold text-violet-700 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>AI Practice Suite Ready</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">{user?.name?.split(' ')[0] || 'there'}</span> 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Conduct voice mock interviews and analyze your resume concurrently.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/interview/setup" className="btn-pill-primary text-xs font-semibold flex items-center gap-2 py-2.5 px-5 shadow-md shadow-violet-500/25">
            <Plus className="w-4 h-4" />
            <span>New Session</span>
          </Link>
          <Link to="/resume" className="btn-pill-outline text-xs font-semibold flex items-center gap-2 py-2 px-4">
            <FileText className="w-3.5 h-3.5 text-violet-600" />
            <span>Resume Analyzer</span>
          </Link>
        </div>
      </div>

      {/* ── Two Concurrent Core Capabilities ─────────────────────── */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Concurrent Capabilities
          </span>
          <span className="text-xs text-violet-600 font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Both tools ready simultaneously
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: AI Mock Interview Simulator */}
          <Link
            to="/interview/setup"
            className="p-7 rounded-3xl bg-white border border-slate-200/90 hover:border-violet-400 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-violet-500/10 group transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-200/80 flex items-center justify-center text-violet-600 group-hover:scale-105 transition-transform">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200/70">
                  Feature 1 • Voice Practice
                </span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-violet-600 transition-colors">
                AI Mock Interview Simulator
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed mb-6">
                Practice realistic technical & HR questions with adaptive difficulty, live microphone input, and real-time STAR evaluation scoring.
              </p>

              <div className="flex items-center gap-3 text-xs text-slate-600 mb-6 py-2 px-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 4-Factor Evaluation
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600">STAR Coaching</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs font-semibold text-violet-600 group-hover:text-violet-700">
              <span>Start Practice Session</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 2: Smart Resume ATS Analyzer */}
          <Link
            to="/resume"
            className="p-7 rounded-3xl bg-white border border-slate-200/90 hover:border-pink-400 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-pink-500/10 group transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-pink-50 border border-pink-200/80 flex items-center justify-center text-pink-600 group-hover:scale-105 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-pink-50 text-pink-700 border border-pink-200/70">
                  Feature 2 • ATS Skill Gap
                </span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-pink-600 transition-colors">
                Resume ATS Analyzer
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed mb-6">
                Upload your PDF/DOCX resume for automated AI skill extraction, target role requirement comparison, and customized study roadmaps.
              </p>

              <div className="flex items-center gap-3 text-xs text-slate-600 mb-6 py-2 px-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="flex items-center gap-1 text-pink-600 font-medium">
                  <Target className="w-3.5 h-3.5" /> 94% Accuracy Match
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600">Instant Gap Analysis</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs font-semibold text-pink-600 group-hover:text-pink-700">
              <span>Upload & Analyze Resume</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* ── Performance Stats Row ──────────────────────────────────── */}
      {totalSessions > 0 && (
        <div className="mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 block">
            Performance Overview
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: FileText, label: 'Total Sessions', value: totalSessions, color: 'text-violet-600', bg: 'bg-violet-50' },
              { icon: Target, label: 'Average Score', value: `${avgScore}/10`, color: getScoreColor(avgScore), bg: 'bg-slate-50' },
              { icon: Trophy, label: 'Highest Score', value: `${bestScore}/10`, color: 'text-amber-600', bg: 'bg-amber-50' },
              {
                icon: TrendingUp,
                label: 'Progress Trend',
                value: improving ? '↑ Improving' : 'Consistent',
                color: improving ? 'text-emerald-600' : 'text-slate-600',
                bg: 'bg-emerald-50',
              },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center ${color} mb-3`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className={`text-2xl font-black ${color}`}>{value}</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Sessions List ─────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" text="Loading your sessions..." />
        </div>
      ) : reports.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 px-4 rounded-3xl bg-white border border-slate-200/80 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center mx-auto mb-4 text-violet-600">
            <BrainCircuit className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">No interview sessions yet</h2>
          <p className="text-slate-500 text-xs sm:text-sm mb-6 max-w-sm mx-auto leading-relaxed">
            Start your first mock interview or upload your resume above to generate customized questions and feedback.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/interview/setup" className="btn-pill-primary text-xs font-semibold py-2.5 px-6 shadow-md shadow-violet-500/25">
              Start First Interview
            </Link>
            <Link to="/resume" className="btn-pill-outline text-xs font-semibold py-2.5 px-5">
              Analyze Resume
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 block">
            Recent Practice History
          </span>
          <div className="space-y-3">
            {reports.map((report) => {
              const sess = report.session_id;
              return (
                <Link
                  key={report._id}
                  to={`/report/${sess?._id || report.session_id}`}
                  className="p-5 rounded-2xl bg-white hover:bg-slate-50/80 border border-slate-200/80 hover:border-violet-300 shadow-sm transition-all flex items-center gap-4 group block"
                >
                  {/* Score badge */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl border flex items-center justify-center font-bold text-base ${getScoreBg(report.avg_score)}`}>
                    {report.avg_score}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${getRoleBadge(sess?.role)}`}>
                        {sess?.role || 'Interview'}
                      </span>
                      {sess?.difficulty && (
                        <span className="text-xs text-slate-500 capitalize">{sess.difficulty}</span>
                      )}
                      {report.total_responses && (
                        <span className="text-xs text-slate-500">• {report.total_responses} questions</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formatDate(report.generated_at)}
                      </span>
                      {sess?.started_at && sess?.ended_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {formatDuration(sess.started_at, sess.ended_at)}
                        </span>
                      )}
                    </div>
                    {report.strengths?.length > 0 && (
                      <p className="text-xs text-emerald-600 mt-1 truncate font-medium">
                        ✓ {report.strengths[0]}
                      </p>
                    )}
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-violet-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
