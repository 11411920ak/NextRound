const Session = require('../models/Session');
const Question = require('../models/Question');
const Response = require('../models/Response');
const { generateReport } = require('../utils/reportGenerator');
const { selectNextQuestion } = require('../services/questionSelector');
const { ALLOWED_ROLES } = require('../config/roles');

const VALID_EXPERIENCES = ['fresher', '1-2_years', '3+_years'];
const VALID_TYPES = ['technical', 'hr', 'mixed'];
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard', 'adaptive'];
const VALID_MODES = ['practice', 'mock'];

// ── POST /api/session/start ───────────────────────────────────────────────────
const startSession = async (req, res, next) => {
  try {
    const {
      role,
      experience = 'fresher',
      interview_type = 'technical',
      difficulty = 'adaptive',
      total_questions = 10,
      mode = 'practice',
    } = req.body;

    // Validation
    if (!role) return res.status(400).json({ error: 'Role is required.' });
    if (!ALLOWED_ROLES.includes(role)) return res.status(400).json({ error: 'Invalid role specified.' });
    if (!VALID_EXPERIENCES.includes(experience)) return res.status(400).json({ error: 'Invalid experience level.' });
    if (!VALID_TYPES.includes(interview_type)) return res.status(400).json({ error: 'Invalid interview type.' });
    if (!VALID_DIFFICULTIES.includes(difficulty)) return res.status(400).json({ error: 'Invalid difficulty.' });
    if (!VALID_MODES.includes(mode)) return res.status(400).json({ error: 'Invalid mode.' });

    const numQuestions = Math.min(20, Math.max(1, parseInt(total_questions) || 10));

    // Starting difficulty for adaptive mode
    const startingDifficulty = difficulty === 'adaptive' ? 'medium' : difficulty;
    const userId = req.user ? req.user._id : null;

    // Create the session first (no pre-selected questions)
    const session = await Session.create({
      user_id: userId,
      role,
      experience,
      interview_type,
      difficulty,
      total_questions: numQuestions,
      mode,
      current_difficulty: startingDifficulty,
      current_question_number: 0,
      questions_asked: [],
      asked_question_ids: [],
      topic_performance: {},
      recent_topics: [],        // rolling window for topic rotation
      sub_difficulty: 'basic', // progression within selected difficulty pool
      status: 'active',
    });

    // Select the first question
    const { question, source } = await selectNextQuestion(session, null);

    if (!question) {
      await Session.findByIdAndDelete(session._id);
      return res.status(404).json({ error: `No questions available for role: ${role}. Please seed the database.` });
    }

    // Record the first question in the session
    session.questions_asked.push(question._id);
    session.asked_question_ids.push(question._id);
    session.current_question_number = 1;
    session.current_topic = question.topic || null;
    // Seed recent_topics with the first question's topic (selector may have set this already)
    if (question.topic && !session.recent_topics.includes(question.topic)) {
      session.recent_topics = [question.topic];
    }
    await session.save();

    console.log(
      `[Session] Started: role=${role}, experience=${experience}, type=${interview_type}, ` +
      `difficulty=${difficulty}, mode=${mode}, total=${numQuestions}, firstTopic=${question.topic}`
    );

    res.status(201).json({
      message: 'Session started.',
      session: {
        _id: session._id,
        role: session.role,
        experience: session.experience,
        interview_type: session.interview_type,
        difficulty: session.difficulty,
        mode: session.mode,
        total_questions: session.total_questions,
        current_question_number: 1,
        status: session.status,
        started_at: session.started_at,
      },
      question: {
        _id: question._id,
        text: question.text,
        topic: question.topic || 'General',
        category: question.category,
        difficulty: question.difficulty,
        question_type: question.question_type || 'conceptual',
        question_number: 1,
        total_questions: numQuestions,
        source,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/session/:id/end ────────────────────────────────────────────────
const endSession = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id : null;
    const query = userId ? { _id: req.params.id, user_id: userId } : { _id: req.params.id };
    const session = await Session.findOne(query);
    if (!session) return res.status(404).json({ error: 'Session not found.' });
    if (session.status === 'completed') {
      return res.status(400).json({ error: 'Session is already completed.' });
    }

    session.status = 'completed';
    session.ended_at = new Date();
    await session.save();

    // Generate enhanced report (non-blocking, but we wait for it)
    let report = null;
    try {
      report = await generateReport(session._id, userId);
    } catch (err) {
      console.warn('[Report] Could not generate report on end:', err.message);
    }

    res.json({
      message: 'Session ended.',
      session_id: session._id,
      report_id: report?._id || null,
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/session/:id ──────────────────────────────────────────────────────
const getSession = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id : null;
    const query = userId ? { _id: req.params.id, user_id: userId } : { _id: req.params.id };
    const session = await Session.findOne(query).populate('questions_asked', 'text category difficulty topic question_type');

    if (!session) return res.status(404).json({ error: 'Session not found.' });

    const responses = await Response.find({ session_id: session._id })
      .populate('question_id', 'text topic')
      .sort({ question_index: 1 });

    res.json({ session, responses });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/session (list user sessions) ────────────────────────────────────
const getUserSessions = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id : null;
    const query = userId ? { user_id: userId } : {};
    const sessions = await Session.find(query)
      .sort({ created_at: -1 })
      .limit(20)
      .select('-questions_asked -asked_question_ids -topic_performance')
      .lean();
    res.json({ sessions });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/session/:id/report ───────────────────────────────────────────────
const getSessionReport = async (req, res, next) => {
  try {
    const Report = require('../models/Report');
    const userId = req.user ? req.user._id : null;
    const query = userId ? { _id: req.params.id, user_id: userId } : { _id: req.params.id };
    const session = await Session.findOne(query);
    if (!session) return res.status(404).json({ error: 'Session not found.' });

    let report = await Report.findOne({ session_id: session._id });

    if (!report) {
      if (session.status !== 'completed') {
        return res.status(400).json({ error: 'Session must be completed before generating a report.' });
      }
      report = await generateReport(session._id, userId);
    }

    const responses = await Response.find({ session_id: session._id })
      .populate('question_id', 'text category difficulty topic question_type ideal_answer')
      .sort({ question_index: 1 });

    res.json({ report, responses, session });
  } catch (error) {
    next(error);
  }
};

module.exports = { startSession, endSession, getSession, getUserSessions, getSessionReport };
