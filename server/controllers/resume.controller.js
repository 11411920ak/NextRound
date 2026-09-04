const path = require('path');
const fs = require('fs');
const Resume = require('../models/Resume');

// ── POST /api/resume/upload ───────────────────────────────────────────────────
const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const { originalname, mimetype, path: filePath, size } = req.file;
    const ext = path.extname(originalname).toLowerCase().replace('.', '');

    // Server-side file type enforcement
    const allowedTypes = ['pdf', 'doc', 'docx'];
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(ext) || !allowedMimes.includes(mimetype)) {
      // Remove the file if type is invalid
      fs.unlinkSync(filePath);
      return res.status(400).json({
        error: 'Invalid file type. Only PDF, DOC, and DOCX files are accepted.',
      });
    }

    // Save resume reference in DB (user_id optional for guests)
    const userId = req.user ? req.user._id : null;
    const resume = await Resume.create({
      user_id: userId,
      original_name: originalname,
      file_path: filePath,
      file_type: ext,
      mime_type: mimetype,
      file_size: size,
    });

    console.log(`[Resume] Uploaded: ${originalname} (${(size / 1024).toFixed(1)} KB) for ${userId ? `user ${userId}` : 'guest'}`);

    res.status(201).json({
      message: 'Resume uploaded successfully.',
      resume: {
        _id: resume._id,
        original_name: resume.original_name,
        file_type: resume.file_type,
        file_size: resume.file_size,
        uploaded_at: resume.uploaded_at,
      },
    });
  } catch (error) {
    // Clean up file on unexpected error
    if (req.file?.path) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }
    next(error);
  }
};

// ── GET /api/resume/mine ──────────────────────────────────────────────────────
const getMyResumes = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ user_id: req.user._id })
      .sort({ uploaded_at: -1 })
      .select('-file_path -__v') // don't expose internal file path
      .lean();

    res.json({ resumes });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadResume, getMyResumes };
