const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
  {
    skill: { type: String, required: true },
    confidence: { type: Number, min: 0, max: 100, default: 50 }, // 0–100
  },
  { _id: false }
);

const analysisResultSchema = new mongoose.Schema(
  {
    recommendedField: { type: String, default: null },  // Feature A only
    rationale: { type: String, default: '' },
    rankedSkills: { type: [skillSchema], default: [] },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    suggestions: { type: [String], default: [] },
    interviewQuestions: { type: [String], default: [] },
  },
  { _id: false }
);

const analysisSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
    },
    resume_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: true,
    },
    type: {
      type: String,
      enum: ['skill_recommendation', 'role_gap'],
      required: true,
    },
    target_role: {
      type: String,
      default: null, // Feature B only
    },
    result: {
      type: analysisResultSchema,
      required: true,
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

analysisSchema.index({ user_id: 1, type: 1, created_at: -1 });

module.exports = mongoose.model('Analysis', analysisSchema);
