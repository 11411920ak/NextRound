import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import { BrainCircuit, Plus, FileText, ChevronRight, Trophy, Calendar, Target, TrendingUp, Clock } from 'lucide-react';
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
  if (s >= 6) return 'text-blue-400';
  if (s >= 4) return 'text-yellow-400';
  return 'text-red-400';
};

const getRoleBadge = (role) => {
  const found = ROLES.find((r) => r.id === role);
  return found?.badge || 'bg-slate-500/10 text-slate-400 border-slate-500/20';
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
    <div className="max-w-5xl mx-auto px-4 py-8 animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <span className="section-label">Dashboard</span>
          <h1 className="text-3xl font-bold text-white mt-1">
            Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0] || 'there'}</span> 👋
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Track your interview performance over time.</p>
        </div>
        <Link to="/interview/setup" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Session</span>
        </Link>
      </div>

      {/* Stats row */}
      {totalSessions > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { icon: FileText, label: 'Total Sessions', value: totalSessions, color: 'text-brand-400' },
            { icon: Target, label: 'Avg Score', value: `${avgScore}/10`, color: getScoreColor(avgScore) },
            { icon: Trophy, label: 'Best Score', value: `${bestScore}/10`, color: 'text-yellow-400' },
            { icon: TrendingUp, label: 'Trend', value: improving ? '↑ Improving' : '↓ Varies', color: improving ? 'text-emerald-400' : 'text-slate-400' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="glass-card p-4">
              <Icon className={`w-4 h-4 ${color} mb-2`} />
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sessions list */}
      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" text="Loading your sessions..." /></div>
      ) : reports.length === 0 ? (
        /* Empty state */
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500/20 to-violet-500/20 border border-brand-500/20 flex items-center justify-center mx-auto mb-5">
            <BrainCircuit className="w-10 h-10 text-brand-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No sessions yet</h2>
          <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">
            Start your first mock interview session and get AI-powered feedback on your answers.
          </p>
          <Link to="/interview/setup" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Start Your First Session
          </Link>
        </div>
      ) : (
        <div>
          <p className="section-label mb-4">Past Sessions</p>
          <div className="space-y-3">
            {reports.map((report) => {
              const sess = report.session_id;
              return (
                <Link
                  key={report._id}
                  to={`/report/${sess?._id || report.session_id}`}
                  className="glass-card-hover p-5 flex items-center gap-4 group block"
                >
                  {/* Score badge */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl border flex items-center justify-center font-bold text-lg ${
                    report.avg_score >= 8
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : report.avg_score >= 6
                      ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                      : report.avg_score >= 4
                      ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                      : 'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}>
                    {report.avg_score}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getRoleBadge(sess?.role)}`}>
                        {sess?.role || 'Interview'}
                      </span>
                      {sess?.difficulty && (
                        <span className="text-xs text-slate-500 capitalize">{sess.difficulty}</span>
                      )}
                      {report.total_responses && (
                        <span className="text-xs text-slate-600">{report.total_responses} questions</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(report.generated_at)}
                      </span>
                      {sess?.started_at && sess?.ended_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(sess.started_at, sess.ended_at)}
                        </span>
                      )}
                    </div>
                    {/* Strengths preview */}
                    {report.strengths?.length > 0 && (
                      <p className="text-xs text-emerald-400/70 mt-1 truncate">
                        ✓ {report.strengths[0]}
                      </p>
                    )}
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-brand-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
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
