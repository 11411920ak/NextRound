const Resume = require('../models/Resume');
const Analysis = require('../models/Analysis');
const { extractText } = require('../utils/resumeExtractor');
const { analyseResumeSkills, analyseRoleGap } = require('../utils/llm');

// ── Helper: get resume text for a user or guest ───────────────────────────────────────
const getLatestResumeText = async (userId, resumeId) => {
  let query = {};
  if (resumeId) {
    query = { _id: resumeId };
  } else if (userId) {
    query = { user_id: userId };
  } else {
    throw { status: 404, message: 'No resume found. Please upload your resume first.' };
  }

  const resume = await Resume.findOne(query).sort({ uploaded_at: -1 });
  if (!resume) throw { status: 404, message: 'No resume found. Please upload your resume first.' };

  const text = await extractText(resume.file_path, resume.mime_type);
  if (!text || text.trim().length < 50) {
    throw { status: 422, message: 'Could not extract enough text from your resume. Please ensure the file is not scanned/image-only.' };
  }
  return { resume, text };
};

// ── POST /api/analysis/skill ──────────────────────────────────────────────────
const analyseSkills = async (req, res, next) => {
  try {
    const { resume_id } = req.body;
    const userId = req.user ? req.user._id : null;
    const { resume, text } = await getLatestResumeText(userId, resume_id);

    console.log(`[Analysis] Running skill analysis for ${userId ? `user ${userId}` : 'guest'}, resume ${resume._id}`);

    const result = await analyseResumeSkills(text);

    const analysis = await Analysis.create({
      user_id: userId,
      resume_id: resume._id,
      type: 'skill_recommendation',
      target_role: null,
      result,
    });

    res.status(201).json({
      message: 'Skill analysis complete.',
      analysis: {
        _id: analysis._id,
        resume_id: resume._id,
        type: analysis.type,
        result: analysis.result,
        created_at: analysis.created_at,
      },
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    next(error);
  }
};

// ── POST /api/analysis/gap ────────────────────────────────────────────────────
const analyseGap = async (req, res, next) => {
  try {
    const { target_role, resume_id } = req.body;

    if (!target_role || target_role.trim().length < 2) {
      return res.status(400).json({ error: 'Target role is required.' });
    }

    const userId = req.user ? req.user._id : null;
    const { resume, text } = await getLatestResumeText(userId, resume_id);

    console.log(`[Analysis] Running gap analysis for ${userId ? `user ${userId}` : 'guest'}, role="${target_role}"`);

    const result = await analyseRoleGap(text, target_role.trim());

    const analysis = await Analysis.create({
      user_id: userId,
      resume_id: resume._id,
      type: 'role_gap',
      target_role: target_role.trim(),
      result,
    });

    res.status(201).json({
      message: 'Gap analysis complete.',
      analysis: {
        _id: analysis._id,
        resume_id: resume._id,
        type: analysis.type,
        target_role: analysis.target_role,
        result: analysis.result,
        created_at: analysis.created_at,
      },
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    next(error);
  }
};

// ── POST /api/analysis/claim-guest ──────────────────────────────────────────
const claimGuestAnalyses = async (req, res, next) => {
  try {
    const { resume_id, analysis_ids } = req.body;
    if (!req.user) {
      return res.status(401).json({ error: 'User must be authenticated to claim analyses.' });
    }

    if (resume_id) {
      await Resume.updateOne({ _id: resume_id, user_id: null }, { user_id: req.user._id });
    }

    if (Array.isArray(analysis_ids) && analysis_ids.length > 0) {
      await Analysis.updateMany(
        { _id: { $in: analysis_ids }, user_id: null },
        { user_id: req.user._id }
      );
    } else if (resume_id) {
      await Analysis.updateMany(
        { resume_id, user_id: null },
        { user_id: req.user._id }
      );
    }

    res.json({ message: 'Guest analysis successfully associated with user account.' });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/analysis/mine ────────────────────────────────────────────────────
const getMyAnalyses = async (req, res, next) => {
  try {
    const analyses = await Analysis.find({ user_id: req.user._id })
      .sort({ created_at: -1 })
      .populate('resume_id', 'original_name file_type uploaded_at')
      .select('-__v')
      .lean();

    res.json({ analyses });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/analysis/latest ──────────────────────────────────────────────────
// Returns the most recent of each type for the dashboard
const getLatestAnalyses = async (req, res, next) => {
  try {
    const [skillAnalysis, gapAnalysis] = await Promise.all([
      Analysis.findOne({ user_id: req.user._id, type: 'skill_recommendation' })
        .sort({ created_at: -1 })
        .populate('resume_id', 'original_name file_type uploaded_at')
        .lean(),
      Analysis.findOne({ user_id: req.user._id, type: 'role_gap' })
        .sort({ created_at: -1 })
        .populate('resume_id', 'original_name file_type uploaded_at')
        .lean(),
    ]);

    res.json({ skillAnalysis, gapAnalysis });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  analyseSkills,
  analyseGap,
  claimGuestAnalyses,
  getMyAnalyses,
  getLatestAnalyses,
};
