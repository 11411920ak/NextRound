import { ThumbsUp, TrendingUp, AlertCircle, Star } from 'lucide-react';

const getScoreStyle = (score) => {
  if (score >= 8) return 'score-excellent';
  if (score >= 6) return 'score-good';
  if (score >= 4) return 'score-average';
  return 'score-poor';
};

const getScoreLabel = (score) => {
  if (score >= 8) return 'Excellent';
  if (score >= 6) return 'Good';
  if (score >= 4) return 'Average';
  return 'Needs Work';
};

const ScoreMeter = ({ label, score, description }) => {
  const pct = (score / 10) * 100;
  const colorClass = score >= 8 ? 'bg-emerald-500' : score >= 6 ? 'bg-blue-500' : score >= 4 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        <span className={`text-sm font-bold ${score >= 8 ? 'text-emerald-400' : score >= 6 ? 'text-blue-400' : score >= 4 ? 'text-yellow-400' : 'text-red-400'}`}>
          {score}/10
        </span>
      </div>
      <div className="progress-bar">
        <div className={`h-full rounded-full transition-all duration-700 ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
      {description && <p className="text-[11px] text-slate-600 mt-1">{description}</p>}
    </div>
  );
};

const FeedbackPanel = ({ evaluation }) => {
  if (!evaluation) return null;

  // Support both old shape (overall_score, relevance_score…) and new shape (score, relevance, communication…)
  const overall_score = evaluation.overall_score ?? evaluation.score ?? 0;
  const relevance_score = evaluation.relevance_score ?? evaluation.relevance ?? 0;
  const structure_score = evaluation.structure_score ?? evaluation.structure ?? 0;
  const clarity_score = evaluation.clarity_score ?? evaluation.clarity_score ?? evaluation.communication ?? 0;
  const feedback_text = evaluation.feedback_text ?? evaluation.feedback ?? '';
  const strengths = evaluation.strengths ?? [];
  const improvements = evaluation.improvements ?? [];
  const is_mock = evaluation.is_mock ?? false;

  return (
    <div className="glass-card p-6 space-y-6 animate-slide-up">
      {/* Mock badge */}
      {is_mock && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs">
          <AlertCircle className="w-3.5 h-3.5" />
          Using mock evaluator — add your Gemini or Anthropic API key in server/.env for real AI feedback.
        </div>
      )}

      {/* Overall score hero */}
      <div className="flex items-center gap-5">
        <div className={`score-badge text-2xl ${getScoreStyle(overall_score)} rounded-2xl w-16 h-16`}>
          {overall_score}
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mb-1">Overall Score</p>
          <p className={`text-xl font-bold ${getScoreStyle(overall_score).split(' ')[0]}`}>{getScoreLabel(overall_score)}</p>
          <div className="flex mt-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <Star key={i} className={`w-3 h-3 ${i < Math.round(overall_score) ? 'text-brand-400 fill-brand-400' : 'text-slate-700'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="space-y-3">
        <p className="section-label">Score Breakdown</p>
        <ScoreMeter label="Relevance" score={relevance_score} description="How directly your answer addressed the question" />
        <ScoreMeter label="Structure (STAR)" score={structure_score} description="Use of Situation → Task → Action → Result framework" />
        <ScoreMeter label="Clarity" score={clarity_score} description="Clear, confident, and professional communication" />
      </div>

      {/* AI Feedback */}
      <div>
        <p className="section-label mb-2">AI Feedback</p>
        <p className="text-slate-300 text-sm leading-relaxed bg-dark-900 rounded-xl p-4 border border-white/5">
          {feedback_text}
        </p>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-2 gap-4">
        {strengths?.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
              <p className="section-label text-emerald-600">Strengths</p>
            </div>
            <ul className="space-y-1.5">
              {strengths.map((s, i) => (
                <li key={i} className="text-xs text-emerald-300 flex items-start gap-1.5">
                  <span className="text-emerald-500 mt-0.5">✓</span> {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {improvements?.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              <p className="section-label text-amber-600">To Improve</p>
            </div>
            <ul className="space-y-1.5">
              {improvements.map((imp, i) => (
                <li key={i} className="text-xs text-amber-300 flex items-start gap-1.5">
                  <span className="text-amber-500 mt-0.5">→</span> {imp}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackPanel;
