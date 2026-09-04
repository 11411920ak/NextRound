const Report = require('../models/Report');
const Response = require('../models/Response');
const Session = require('../models/Session');
const { generateFinalReport } = require('./llm');

/**
 * Generate an enhanced aggregate report for a completed session.
 * Includes: topic scores, readiness label, category scores, AI summary, recommendations.
 */
const generateReport = async (sessionId, userId) => {
  // Fetch session for context
  const session = await Session.findById(sessionId).lean();

  // Fetch all responses populated with question data
  const responses = await Response.find({ session_id: sessionId })
    .populate('question_id', 'text category difficulty topic question_type')
    .sort({ question_index: 1 });

  if (!responses.length) {
    throw new Error('No responses found for this session');
  }

  const evaluated = responses.filter((r) => r.llm_eval?.overall_score != null);
  if (!evaluated.length) {
    throw new Error('No evaluated responses found for this session');
  }

  // ── Compute average scores ────────────────────────────────────────────────
  const avg = (arr) => arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;

  const overallScores = evaluated.map((r) => r.llm_eval.overall_score);
  const relevanceScores = evaluated.map((r) => r.llm_eval.relevance_score);
  const structureScores = evaluated.map((r) => r.llm_eval.structure_score);
  const clarityScores = evaluated.map((r) => r.llm_eval.clarity_score);
  const techScores = evaluated.map((r) => r.llm_eval.technical_accuracy || r.llm_eval.overall_score);

  const avgOverall = Math.round(avg(overallScores) * 10) / 10;
  const avgRelevance = Math.round(avg(relevanceScores) * 10) / 10;
  const avgStructure = Math.round(avg(structureScores) * 10) / 10;
  const avgClarity = Math.round(avg(clarityScores) * 10) / 10;
  const avgTech = Math.round(avg(techScores) * 10) / 10;

  // ── Category scores (convert 1-10 → 0-100) ──────────────────────────────
  const category_scores = {
    technical: Math.round(avgTech * 10),
    communication: Math.round(avgClarity * 10),
    problem_solving: Math.round(avg([avgRelevance, avgStructure]) * 10),
  };

  // ── Topic scores ─────────────────────────────────────────────────────────
  const topicMap = {};
  for (const r of evaluated) {
    const topic = r.question_id?.topic || 'General';
    if (!topicMap[topic]) topicMap[topic] = [];
    topicMap[topic].push(r.llm_eval.overall_score);
  }
  const topic_scores = {};
  for (const [topic, scores] of Object.entries(topicMap)) {
    topic_scores[topic] = Math.round(avg(scores) * 10) / 10;
  }

  // ── Weak areas and strengths ─────────────────────────────────────────────
  const WEAK_THRESHOLD = 5.5;
  const STRONG_THRESHOLD = 7.5;

  const weak_areas = [];
  const strengths = [];

  // Topic-based
  for (const [topic, score] of Object.entries(topic_scores)) {
    if (score < WEAK_THRESHOLD) weak_areas.push(`${topic} (needs improvement)`);
    else if (score >= STRONG_THRESHOLD) strengths.push(`Strong ${topic} knowledge`);
  }

  // Category-based (fallback if no topic data)
  if (avgRelevance < WEAK_THRESHOLD) weak_areas.push('Answer Relevance');
  else if (avgRelevance >= STRONG_THRESHOLD) strengths.push('Excellent Answer Relevance');

  if (avgStructure < WEAK_THRESHOLD) weak_areas.push('Response Structure (STAR method)');
  else if (avgStructure >= STRONG_THRESHOLD) strengths.push('Well-Structured Answers');

  if (avgClarity < WEAK_THRESHOLD) weak_areas.push('Clarity & Communication');
  else if (avgClarity >= STRONG_THRESHOLD) strengths.push('Clear Communication');

  if (avgOverall >= 8) strengths.push('Consistently High Performance');
  if (avgOverall < 4) weak_areas.push('Overall Performance Needs Significant Improvement');

  // Trend analysis
  if (overallScores.length >= 3) {
    const firstHalf = avg(overallScores.slice(0, Math.floor(overallScores.length / 2)));
    const secondHalf = avg(overallScores.slice(Math.floor(overallScores.length / 2)));
    if (secondHalf - firstHalf > 1) strengths.push('Improving Performance Throughout Session');
    if (firstHalf - secondHalf > 1.5) weak_areas.push('Performance Declined During Session');
  }

  // Deduplicate
  const uniqueWeak = [...new Set(weak_areas)].slice(0, 5);
  const uniqueStrengths = [...new Set(strengths)].slice(0, 5);

  // ── Readiness label ───────────────────────────────────────────────────────
  let readiness = 'Needs More Practice';
  if (avgOverall >= 7.5) readiness = 'Interview Ready';
  else if (avgOverall >= 5.5) readiness = 'Moderately Ready';

  // ── Score timeline ────────────────────────────────────────────────────────
  const score_timeline = evaluated.map((r) => ({
    question_index: r.question_index,
    question_text: (r.question_id?.text?.substring(0, 60) || `Q${r.question_index + 1}`) + '...',
    topic: r.question_id?.topic || 'General',
    overall_score: r.llm_eval.overall_score,
    relevance_score: r.llm_eval.relevance_score,
    structure_score: r.llm_eval.structure_score,
    clarity_score: r.llm_eval.clarity_score,
  }));

  // ── AI Summary & Recommendations ─────────────────────────────────────────
  let ai_summary = '';
  let recommendations = [];

  try {
    // topic_performance is a Mongoose Map. When fetched with .lean(), it's a
    // plain object already. When it's a real Map instance, use Object.fromEntries(map).
    const rawTopicPerf = session?.topic_performance;
    const topicPerf = rawTopicPerf
      ? (rawTopicPerf instanceof Map
          ? Object.fromEntries(rawTopicPerf)
          : (typeof rawTopicPerf === 'object' ? rawTopicPerf : {}))
      : {};

    const aiReport = await generateFinalReport(
      {
        role: session?.role || 'Software Engineer',
        experience: session?.experience || 'fresher',
        interview_type: session?.interview_type || 'technical',
        total_questions: session?.total_questions || evaluated.length,
      },
      topicPerf,
      avgOverall
    );
    ai_summary = aiReport.ai_summary || '';
    recommendations = aiReport.recommendations || [];
  } catch (err) {
    console.warn('[Report] AI summary generation failed:', err.message);
    ai_summary = `You completed ${evaluated.length} questions with an overall score of ${avgOverall}/10. ${
      readiness === 'Interview Ready'
        ? 'You are well-prepared for your interview!'
        : readiness === 'Moderately Ready'
        ? 'Keep practicing to boost your confidence and technical depth.'
        : 'Focus on the weak areas identified and practice more before your interview.'
    }`;
    recommendations = uniqueWeak.slice(0, 3).map((w) => `Practice and review: ${w}`);
    if (!recommendations.length) {
      recommendations = ['Review core concepts for your role', 'Practice the STAR method for behavioral answers'];
    }
  }

  // ── Save / upsert report ──────────────────────────────────────────────────
  const report = await Report.findOneAndUpdate(
    { session_id: sessionId },
    {
      session_id: sessionId,
      user_id: userId,
      avg_score: avgOverall,
      avg_relevance: avgRelevance,
      avg_structure: avgStructure,
      avg_clarity: avgClarity,
      total_responses: evaluated.length,
      readiness,
      category_scores,
      topic_scores,
      strengths: uniqueStrengths,
      weak_areas: uniqueWeak,
      recommendations,
      ai_summary,
      score_timeline,
      generated_at: new Date(),
    },
    { upsert: true, new: true, runValidators: true }
  );

  return report;
};

module.exports = { generateReport };
