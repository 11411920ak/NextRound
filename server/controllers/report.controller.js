const Report = require('../models/Report');
const Session = require('../models/Session');
const { generateReport } = require('../utils/reportGenerator');

// ── GET /api/report/session/:session_id ───────────────────────────────────────
const getReport = async (req, res, next) => {
  try {
    const { session_id } = req.params;
    const userId = req.user ? req.user._id : null;
    const query = userId ? { _id: session_id, user_id: userId } : { _id: session_id };
    const session = await Session.findOne(query);
    if (!session) return res.status(404).json({ error: 'Session not found.' });

    let report = await Report.findOne({ session_id });
    if (!report) {
      if (session.status !== 'completed') {
        return res.status(400).json({ error: 'Session must be completed to view report.' });
      }
      report = await generateReport(session._id, userId);
    }

    res.json({ report });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/report/dashboard ─────────────────────────────────────────────────
const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id : null;
    const query = userId ? { user_id: userId } : {};
    const reports = await Report.find(query)
      .populate('session_id', 'role difficulty started_at ended_at status')
      .sort({ generated_at: -1 })
      .limit(20)
      .lean();

    res.json({ reports });
  } catch (error) {
    next(error);
  }
};

module.exports = { getReport, getDashboard };
