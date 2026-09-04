import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { ScoreTimeline, ScoreRadar } from '../components/SessionChart';
import FeedbackPanel from '../components/FeedbackPanel';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Trophy, TrendingDown, TrendingUp, Star, ChevronDown, ChevronUp,
  RotateCcw, LayoutDashboard, Sparkles, BookOpen, Target, Cpu,
  MessageSquare, Brain, CheckCircle2, AlertTriangle, Award,
} from 'lucide-react';

const getScoreColor = (s) => s >= 8 ? 'text-emerald-400' : s >= 6 ? 'text-blue-400' : s >= 4 ? 'text-yellow-400' : 'text-red-400';
const getScoreBg = (s) => s >= 8 ? 'bg-emerald-500/10 border-emerald-500/20' : s >= 6 ? 'bg-blue-500/10 border-blue-500/20' : s >= 4 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-red-500/10 border-red-500/20';

const getReadinessBadge = (readiness) => {
  if (readiness === 'Interview Ready') return { color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: CheckCircle2 };
  if (readiness === 'Moderately Ready') return { color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', icon: Target };
  return { color: 'bg-red-500/15 text-red-400 border-red-500/30', icon: AlertTriangle };
};

const CategoryBar = ({ label, value, icon: Icon, color }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="text-xs text-slate-400 font-medium">{label}</span>
      </div>
      <span className={`text-xs font-bold ${color}`}>{value}%</span>
    </div>
    <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700`}
        style={{ width: `${Math.min(100, value)}%`, background: value >= 75 ? '#10b981' : value >= 50 ? '#3b82f6' : value >= 35 ? '#f59e0b' : '#ef4444' }}
      />
    </div>
  </div>
);

const ReportPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [responses, setResponses] = useState([]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedResponse, setExpandedResponse] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const { data } = await api.get(`/session/${sessionId}/report`);
        setReport(data.report);
        setResponses(data.responses || []);
        setSession(data.session);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load report.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [sessionId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" text="Loading your report..." /></div>;
  if (error) return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <p className="text-red-400 mb-4">{error}</p>
      <button onClick={() => navigate('/dashboard')} className="btn-secondary">Back to Dashboard</button>
    </div>
  );

  const {
    avg_score, avg_relevance, avg_structure, avg_clarity,
    weak_areas, strengths, score_timeline, total_responses,
    readiness, category_scores, topic_scores, recommendations, ai_summary,
  } = report;

  const readinessBadge = getReadinessBadge(readiness);
  const ReadinessIcon = readinessBadge.icon;

  // Convert topic_scores Map/object to sortable array
  const topicScoresArr = topic_scores
    ? Object.entries(topic_scores).sort(([, a], [, b]) => b - a)
    : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <span className="section-label">Session Report</span>
          <h1 className="text-3xl font-bold text-white mt-1">
            Interview <span className="gradient-text">Analysis</span>
          </h1>
          {session && (
            <p className="text-slate-400 mt-1 text-sm">
              {session.role} · {session.experience?.replace('_', ' ')} · {session.interview_type} · {total_responses} questions
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-col sm:flex-row">
          <Link to="/interview/setup" className="btn-secondary text-sm flex items-center gap-2 py-2">
            <RotateCcw className="w-3.5 h-3.5" /> New Session
          </Link>
          <Link to="/dashboard" className="btn-ghost text-sm flex items-center gap-2">
            <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
          </Link>
        </div>
      </div>

      {/* Readiness Banner */}
      {readiness && (
        <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border mb-6 ${readinessBadge.color}`}>
          <ReadinessIcon className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-bold text-sm">{readiness}</p>
            <p className="text-xs opacity-75 mt-0.5">
              {readiness === 'Interview Ready'
                ? 'You are well-prepared. Keep practicing to maintain your edge.'
                : readiness === 'Moderately Ready'
                ? 'Good progress! Focus on the weak areas to boost your readiness.'
                : 'Focus on the recommendations below before your next interview.'}
            </p>
          </div>
          <div className={`ml-auto text-3xl font-black ${getScoreColor(avg_score)}`}>
            {avg_score}<span className="text-sm font-normal opacity-60">/10</span>
          </div>
        </div>
      )}

      {/* Score Cards */}
      <div className="glass-card p-6 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Overall */}
          <div className={`col-span-2 sm:col-span-1 p-4 rounded-xl border ${getScoreBg(avg_score)} text-center`}>
            <div className={`text-4xl font-black mb-1 ${getScoreColor(avg_score)}`}>{avg_score}</div>
            <p className="text-xs text-slate-500 font-medium">Overall Score</p>
            <div className="flex justify-center mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-3 h-3 ${i < Math.round(avg_score / 2) ? 'text-brand-400 fill-brand-400' : 'text-slate-700'}`} />
              ))}
            </div>
          </div>
          {[
            { label: 'Relevance', value: avg_relevance },
            { label: 'Structure', value: avg_structure },
            { label: 'Clarity', value: avg_clarity },
          ].map(({ label, value }) => (
            <div key={label} className={`p-4 rounded-xl border ${getScoreBg(value)} text-center`}>
              <div className={`text-2xl font-bold mb-1 ${getScoreColor(value)}`}>{value}</div>
              <p className="text-xs text-slate-500 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Category Scores */}
      {category_scores && (
        <div className="glass-card p-5 mb-6">
          <p className="section-label mb-4">Category Performance</p>
          <div className="space-y-4">
            <CategoryBar label="Technical" value={category_scores.technical || 0} icon={Cpu} color="text-blue-400" />
            <CategoryBar label="Communication" value={category_scores.communication || 0} icon={MessageSquare} color="text-violet-400" />
            <CategoryBar label="Problem Solving" value={category_scores.problem_solving || 0} icon={Brain} color="text-emerald-400" />
          </div>
        </div>
      )}

      {/* Topic Scores */}
      {topicScoresArr.length > 0 && (
        <div className="glass-card p-5 mb-6">
          <p className="section-label mb-4">Topic Performance</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {topicScoresArr.map(([topic, score]) => (
              <div key={topic} className={`p-3 rounded-xl border text-center ${getScoreBg(score)}`}>
                <div className={`text-xl font-bold mb-0.5 ${getScoreColor(score)}`}>{score}</div>
                <p className="text-xs text-slate-500 font-medium truncate">{topic}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="glass-card p-5">
          <p className="section-label mb-4">Score Timeline</p>
          <ScoreTimeline data={score_timeline} />
        </div>
        <div className="glass-card p-5">
          <p className="section-label mb-4">Skill Radar</p>
          <ScoreRadar avgRelevance={avg_relevance} avgStructure={avg_structure} avgClarity={avg_clarity} />
        </div>
      </div>

      {/* AI Summary */}
      {ai_summary && (
        <div className="glass-card p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <p className="section-label text-brand-600">AI Coach Summary</p>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{ai_summary}</p>
        </div>
      )}

      {/* Strengths & Weak Areas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {strengths?.length > 0 && (
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <p className="section-label text-emerald-600">Strengths</p>
            </div>
            <ul className="space-y-2">
              {strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-emerald-300">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span> {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {weak_areas?.length > 0 && (
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <p className="section-label text-red-600">Areas to Improve</p>
            </div>
            <ul className="space-y-2">
              {weak_areas.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-red-300">
                  <span className="text-red-500 font-bold mt-0.5">→</span> {w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {recommendations?.length > 0 && (
        <div className="glass-card p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-yellow-400" />
            <p className="section-label text-yellow-600">Recommendations</p>
          </div>
          <ul className="space-y-2.5">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Per-question breakdown */}
      <div className="glass-card p-5 mb-6">
        <p className="section-label mb-4">Per-Question Breakdown</p>
        <div className="space-y-3">
          {responses.map((resp, i) => {
            const isExpanded = expandedResponse === i;
            const score = resp.llm_eval?.overall_score;
            const topic = resp.question_id?.topic;
            return (
              <div key={resp._id} className="border border-white/8 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedResponse(isExpanded ? null : i)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left"
                >
                  <div className={`flex-shrink-0 w-9 h-9 rounded-lg border text-sm font-bold flex items-center justify-center ${getScoreBg(score)} ${getScoreColor(score)}`}>
                    {score ?? '—'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 font-medium truncate">
                      Q{i + 1}: {resp.question_id?.text || 'Question'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {topic && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400">{topic}</span>}
                      <span className="text-xs text-slate-500">
                        {resp.metrics?.word_count} words · <span className="capitalize">{resp.question_id?.category}</span>
                      </span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />}
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-white/5 pt-3">
                    <p className="text-xs text-slate-500 mb-2 font-medium">Your Answer</p>
                    <p className="text-sm text-slate-300 mb-4 bg-dark-900 rounded-lg p-3 leading-relaxed">{resp.transcript}</p>
                    {resp.llm_eval?.overall_score ? (
                      <FeedbackPanel evaluation={{
                        score: resp.llm_eval.overall_score,
                        relevance: resp.llm_eval.relevance_score,
                        structure: resp.llm_eval.structure_score,
                        communication: resp.llm_eval.clarity_score,
                        feedback: resp.llm_eval.feedback_text,
                        strengths: resp.llm_eval.strengths,
                        improvements: resp.llm_eval.improvements,
                        is_mock: resp.llm_eval.is_mock,
                      }} />
                    ) : (
                      <p className="text-xs text-slate-600 italic">No evaluation available for this response.</p>
                    )}
                    {resp.question_id?.ideal_answer && (
                      <div className="mt-3 px-3 py-2 rounded-lg bg-emerald-500/8 border border-emerald-500/15">
                        <p className="text-xs text-slate-500 font-medium mb-1">💡 Ideal Answer Key Points</p>
                        <p className="text-xs text-emerald-300 leading-relaxed">{resp.question_id.ideal_answer}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="flex gap-4 mt-6">
        <Link to="/interview/setup" className="btn-primary flex items-center gap-2 flex-1 justify-center">
          <RotateCcw className="w-4 h-4" /> Practice Again
        </Link>
        <Link to="/dashboard" className="btn-secondary flex items-center gap-2 flex-1 justify-center">
          <LayoutDashboard className="w-4 h-4" /> Dashboard
        </Link>
      </div>
    </div>
  );
};

export default ReportPage;
