/**
 * Question Selector Service  v2
 *
 * selectNextQuestion(session, lastEval) → { question, source }
 *
 * Core rules (in priority order):
 *  1. Respect the user's chosen difficulty as a HARD POOL BOUNDARY.
 *       easy   → only easy questions
 *       medium → only medium questions
 *       hard   → only hard questions
 *       adaptive → current_difficulty (AI-driven)
 *  2. Within the pool, progress sub-difficulty: basic → intermediate → advanced
 *  3. Rotate topics — avoid topics in session.recent_topics (last 4)
 *  4. Exclude already-asked question IDs
 *  5. Detect semantically similar questions (keyword Jaccard overlap)
 *  6. If nothing in DB matches → ask AI to generate one, strictly in the allowed pool
 */

const mongoose = require('mongoose');
const Question = require('../models/Question');
const { generateQuestion } = require('../utils/llm');

// ── Constants ─────────────────────────────────────────────────────────────────

// How many recent topics to avoid repeating back-to-back
const RECENT_TOPICS_WINDOW = 3;

// Jaccard similarity threshold above which two questions are "duplicates"
const SIMILARITY_THRESHOLD = 0.40;

// Stop-words stripped before similarity check
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for',
  'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
  'what', 'how', 'why', 'when', 'where', 'which', 'who', 'whom',
  'this', 'that', 'these', 'those', 'it', 'its', 'you', 'your',
  'and', 'or', 'but', 'if', 'then', 'so', 'because', 'about',
  'explain', 'describe', 'define', 'give', 'example', 'examples',
  'tell', 'me', 'us', 'difference', 'between', 'use', 'used', 'using',
]);

// Map interview_type → category field in Question model
const typeToCategory = {
  technical: ['technical'],
  hr: ['hr', 'behavioral'],
  mixed: ['technical', 'hr', 'behavioral'],
};

// Map experience label → experience_level values in Question model
const expToLevels = {
  fresher: ['fresher', 'all'],
  '1-2_years': ['1-2_years', 'all'],
  '3+_years': ['3+_years', 'all'],
};

// Sub-difficulty ordering for progression
const SUB_LEVELS = ['basic', 'intermediate', 'advanced'];

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Extract meaningful keyword tokens from a question string.
 */
const tokenise = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

/**
 * Jaccard similarity between two token sets.
 */
const jaccardSimilarity = (tokensA, tokensB) => {
  if (!tokensA.length || !tokensB.length) return 0;
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  let intersection = 0;
  for (const t of setA) if (setB.has(t)) intersection++;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
};

/**
 * Returns true if candidate question is semantically too similar to any
 * question whose text is in askedTexts.
 */
const isSemanticallyDuplicate = (candidateText, askedTexts) => {
  if (!candidateText || !askedTexts || !askedTexts.length) return false;
  const candidateTokens = tokenise(candidateText);
  return askedTexts.some((asked) => {
    const sim = jaccardSimilarity(candidateTokens, tokenise(asked));
    return sim >= SIMILARITY_THRESHOLD;
  });
};

/**
 * Determine the allowed difficulty pool from the session config.
 * For non-adaptive sessions this is a HARD BOUNDARY.
 * For adaptive sessions: use AI-scored difficulty, but also ramp up based on
 * how far through the interview we are (easy → medium → hard over time).
 */
const getAllowedDifficulty = (session) => {
  if (session.difficulty !== 'adaptive') {
    return session.difficulty; // hard boundary
  }

  // Adaptive: blend score-based and progress-based difficulty
  const scoreBased = session.current_difficulty || 'easy';

  // Time-based ramp: question 1-3 = easy, 4-7 = medium, 8+ = hard
  const qNum = session.current_question_number || 1;
  const totalQ = session.total_questions || 10;
  const progress = qNum / totalQ; // 0 to 1

  let timeBased = 'easy';
  if (progress >= 0.7) timeBased = 'hard';
  else if (progress >= 0.35) timeBased = 'medium';

  // Take the higher of the two (never go easier than time-based ramp)
  const levels = { easy: 0, medium: 1, hard: 2 };
  const rLevels = ['easy', 'medium', 'hard'];
  const maxLevel = Math.max(levels[scoreBased] ?? 0, levels[timeBased] ?? 0);
  return rLevels[maxLevel];
};

/**
 * Compute next sub-difficulty based on the candidate's last score.
 *   score >= 8  → advance one level (cap at 'advanced')
 *   score <= 4  → drop one level (floor at 'basic')
 *   otherwise   → keep current
 */
const computeNextSubDifficulty = (currentSub, score) => {
  if (score == null) return currentSub || 'basic';
  const idx = SUB_LEVELS.indexOf(currentSub || 'basic');
  if (score >= 8) return SUB_LEVELS[Math.min(idx + 1, SUB_LEVELS.length - 1)];
  if (score <= 4) return SUB_LEVELS[Math.max(idx - 1, 0)];
  return SUB_LEVELS[idx];
};

/**
 * Get topics recently used in the session (last RECENT_TOPICS_WINDOW).
 */
const getRecentTopics = (session) =>
  (session.recent_topics || []).slice(0, RECENT_TOPICS_WINDOW);

/**
 * Weak topics from topic_performance (avg score < 5).
 */
const getWeakTopics = (topicPerformance) => {
  if (!topicPerformance || topicPerformance.size === 0) return [];
  const weak = [];
  for (const [topic, perf] of topicPerformance.entries()) {
    const avg = perf.attempts > 0 ? perf.totalScore / perf.attempts : 0;
    if (avg < 5 && perf.attempts >= 1) weak.push(topic);
  }
  return weak;
};

// ── Database Query ────────────────────────────────────────────────────────────

/**
 * Convert a Mongoose filter object to a plain MongoDB $match-compatible object
 * with strict ObjectId typing for _id: { $nin: [...] }.
 */
const buildAggregationFilter = (filter) => {
  const clone = { ...filter };
  if (clone._id && clone._id.$nin) {
    clone._id = {
      $nin: clone._id.$nin.map((id) => {
        try {
          return typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
        } catch (_) {
          return id;
        }
      }).filter(Boolean),
    };
  }
  return [clone];
};

/**
 * Query DB for a suitable question with strict difficulty boundary.
 * Returns a question document or null.
 *
 * Priority cascade:
 *  P1 — exact allowedDifficulty + topic NOT in recentTopics (prefer fresh target or unasked topic)
 *  P2 — exact allowedDifficulty + specific target topic
 *  P3 — exact allowedDifficulty + any unasked question
 */
const findFromDB = async (session, targetTopic, allowedDifficulty, recentTopics, askedTexts) => {
  const categories = typeToCategory[session.interview_type] || ['technical'];
  const experienceLevels = expToLevels[session.experience] || ['all', 'fresher'];
  
  // Ensure all excluded IDs are converted to native mongoose ObjectIds
  const excludeObjectIds = (session.asked_question_ids || [])
    .map((id) => {
      try {
        return typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
      } catch (_) {
        return id;
      }
    })
    .filter(Boolean);

  const baseFilter = {
    role: session.role,
    category: { $in: categories },
    experience_level: { $in: experienceLevels },
    difficulty: allowedDifficulty,   // ← HARD BOUNDARY
    is_active: true,
    _id: { $nin: excludeObjectIds },
  };

  /**
   * Pick a random non-duplicate using $sample for true randomisation.
   * Falls back to first result if all are semantically similar.
   */
  const pickNonDuplicate = async (filter, sampleSize = 15) => {
    const [matchStage] = buildAggregationFilter(filter);
    const candidates = await Question.aggregate([
      { $match: matchStage },
      { $sample: { size: sampleSize } },
    ]);
    for (const q of candidates) {
      if (!isSemanticallyDuplicate(q.text, askedTexts)) return q;
    }
    return candidates[0] || null;
  };

  // P1: Topic NOT in recentTopics (rotate to fresh topic)
  if (recentTopics.length > 0) {
    const freshFilter = {
      ...baseFilter,
      topic: { $nin: recentTopics },
    };

    if (targetTopic && !recentTopics.some((t) => t.toLowerCase() === targetTopic.toLowerCase())) {
      const freshTarget = await pickNonDuplicate({
        ...freshFilter,
        topic: { $regex: new RegExp(`^${targetTopic.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') },
      });
      if (freshTarget) return freshTarget;
    }

    const fresh = await pickNonDuplicate(freshFilter);
    if (fresh) return fresh;
  }

  // P2: Target topic (if P1 couldn't find a fresh topic)
  if (targetTopic) {
    const q2 = await pickNonDuplicate({
      ...baseFilter,
      topic: { $regex: new RegExp(`^${targetTopic.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') },
    });
    if (q2) return q2;
  }

  // P3: Fallback to any remaining question for this role & difficulty
  const q3 = await pickNonDuplicate(baseFilter);
  return q3 || null;
};

// ── Main Export ───────────────────────────────────────────────────────────────

/**
 * Select the next question for a session.
 *
 * @param {Object} session  — Mongoose session document
 * @param {Object|null} lastEval — AI evaluation from the last submitted answer
 * @returns {{ question: Object, source: 'database'|'ai_generated' }}
 */
const selectNextQuestion = async (session, lastEval = null) => {
  // ── 0. Re-fetch asked_question_ids for freshness (race-condition guard) ──
  // If two submits race, the in-memory session may have stale exclusion IDs.
  try {
    const Session = require('../models/Session');
    const freshSession = await Session.findById(session._id).select('asked_question_ids').lean();
    if (freshSession?.asked_question_ids?.length) {
      // Merge any IDs the concurrent request already added
      const existingSet = new Set(session.asked_question_ids.map(String));
      for (const id of freshSession.asked_question_ids) {
        if (!existingSet.has(String(id))) {
          session.asked_question_ids.push(id);
          session.questions_asked.push(id);
        }
      }
    }
  } catch (_) { /* proceed with current data if re-fetch fails */ }

  // ── 1. Determine allowed difficulty pool ─────────────────────────────────
  const allowedDifficulty = getAllowedDifficulty(session);

  // ── 2. Compute & update sub-difficulty ───────────────────────────────────
  const nextSubDifficulty = computeNextSubDifficulty(
    session.sub_difficulty || 'basic',
    lastEval?.overall_score ?? null
  );
  // Update the session document in memory (caller saves)
  session.sub_difficulty = nextSubDifficulty;

  // ── 3. Determine target topic (rotation logic) ───────────────────────────
  const recentTopics = getRecentTopics(session);
  const weakTopics = getWeakTopics(session.topic_performance);

  let targetTopic = null;

  if (lastEval?.nextTopic && !recentTopics.includes(lastEval.nextTopic)) {
    // AI recommends a fresh topic → use it
    targetTopic = lastEval.nextTopic;
  } else {
    // Prefer a weak topic that is not recently used
    const freshWeakTopics = weakTopics.filter((t) => !recentTopics.includes(t));
    if (freshWeakTopics.length > 0) {
      targetTopic = freshWeakTopics[Math.floor(Math.random() * freshWeakTopics.length)];
    } else if (weakTopics.length > 0) {
      // All weak topics recently used → pick any weak topic
      targetTopic = weakTopics[Math.floor(Math.random() * weakTopics.length)];
    }
    // else targetTopic = null → P3 fallback (any topic)
  }

  console.log(
    `[QSelector] pool=${allowedDifficulty} | subLevel=${nextSubDifficulty} | ` +
    `targetTopic=${targetTopic || 'any'} | recentTopics=[${recentTopics.join(', ')}]`
  );

  // ── 4. Fetch asked question texts for semantic dedup ────────────────────
  let askedTexts = [];
  try {
    const askedDocs = await Question.find({ _id: { $in: session.asked_question_ids } })
      .select('text')
      .lean();
    askedTexts = askedDocs.map((q) => q.text);
  } catch (_) {}

  // ── 5. Try database ──────────────────────────────────────────────────────
  const dbQuestion = await findFromDB(
    session,
    targetTopic,
    allowedDifficulty,
    recentTopics,
    askedTexts
  );

  if (dbQuestion) {
    // Update recent_topics rolling window
    session.recent_topics = [
      dbQuestion.topic,
      ...recentTopics,
    ].slice(0, RECENT_TOPICS_WINDOW);

    console.log(
      `[QSelector] DB hit: "${dbQuestion.text.substring(0, 70)}..." ` +
      `(topic=${dbQuestion.topic}, diff=${dbQuestion.difficulty})`
    );
    return { question: dbQuestion, source: 'database' };
  }

  // ── 6. Fallback: AI generation with strict pool ──────────────────────────
  console.log(
    `[QSelector] No DB match. Requesting AI generation ` +
    `(pool=${allowedDifficulty}, subLevel=${nextSubDifficulty}, topic=${targetTopic || 'General'})...`
  );

  const aiQuestion = await generateQuestion(
    session.role,
    session.experience,
    session.interview_type,
    targetTopic || session.current_topic || 'General',
    allowedDifficulty,
    askedTexts,
    nextSubDifficulty,    // ← new arg: sub-level hint
    recentTopics          // ← new arg: topics to avoid
  );

  // Save AI-generated question to DB for future reuse
  const categories = typeToCategory[session.interview_type] || ['technical'];
  let savedQuestion;
  try {
    savedQuestion = await Question.create({
      role: session.role,
      topic: aiQuestion.topic || targetTopic || 'General',
      category: categories[0],
      question_type: aiQuestion.question_type || 'conceptual',
      text: aiQuestion.text,
      ideal_answer: aiQuestion.ideal_answer || '',
      difficulty: allowedDifficulty,  // ← always store under allowed pool difficulty
      experience_level: session.experience || 'all',
      tags: aiQuestion.tags || [],
      source: 'ai_generated',
      is_active: true,
    });
    console.log(`[QSelector] AI question saved: ${savedQuestion._id}`);
  } catch (err) {
    console.warn(`[QSelector] Could not save AI question: ${err.message}`);
    savedQuestion = {
      _id: new (require('mongoose').Types.ObjectId)(),
      text: aiQuestion.text,
      topic: aiQuestion.topic || targetTopic || 'General',
      category: categories[0],
      question_type: aiQuestion.question_type || 'conceptual',
      difficulty: allowedDifficulty,
      ideal_answer: aiQuestion.ideal_answer || '',
      tags: aiQuestion.tags || [],
    };
  }

  // Update recent_topics
  session.recent_topics = [
    savedQuestion.topic,
    ...recentTopics,
  ].slice(0, RECENT_TOPICS_WINDOW);

  return { question: savedQuestion, source: 'ai_generated' };
};

module.exports = { selectNextQuestion };
