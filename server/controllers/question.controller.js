const Question = require('../models/Question');

// ── GET /api/questions ────────────────────────────────────────────────────────
const getQuestions = async (req, res, next) => {
  try {
    const { role, difficulty, category, limit = 20 } = req.query;

    const filter = { is_active: true };
    if (role) filter.role = role;
    if (difficulty) filter.difficulty = difficulty;
    if (category) filter.category = category;

    const questions = await Question.find(filter)
      .select('-__v')
      .limit(parseInt(limit))
      .lean();

    res.json({ questions, total: questions.length });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/questions/:id ────────────────────────────────────────────────────
const getQuestionById = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id).select('-__v');
    if (!question) return res.status(404).json({ error: 'Question not found' });
    res.json({ question });
  } catch (error) {
    next(error);
  }
};

module.exports = { getQuestions, getQuestionById };
