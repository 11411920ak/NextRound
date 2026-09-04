const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
      unique: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
    },
    // Core scores (1–10 scale)
    avg_score: { type: Number, min: 0, max: 10, default: 0 },
    avg_relevance: { type: Number, default: 0 },
    avg_structure: { type: Number, default: 0 },
    avg_clarity: { type: Number, default: 0 },
    total_responses: { type: Number, default: 0 },

    // Readiness label
    readiness: {
      type: String,
      enum: ['Interview Ready', 'Moderately Ready', 'Needs More Practice'],
      default: 'Needs More Practice',
    },

    // Category-level scores (0–100 scale for display)
    category_scores: {
      technical: { type: Number, default: 0 },
      communication: { type: Number, default: 0 },
      problem_solving: { type: Number, default: 0 },
    },

    // Per-topic average scores (Map: topic → avg score 0–10)
    topic_scores: {
      type: Map,
      of: Number,
      default: {},
    },

    // Strengths, weak areas, and AI recommendations
    strengths: [{ type: String }],
    weak_areas: [{ type: String }],
    recommendations: [{ type: String }],

    // AI-generated narrative summary
    ai_summary: { type: String, default: '' },

    // Per-response scores for timeline chart
    score_timeline: [
      {
        question_index: Number,
        question_text: String,
        topic: String,
        overall_score: Number,
        relevance_score: Number,
        structure_score: Number,
        clarity_score: Number,
      },
    ],

    generated_at: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

reportSchema.index({ user_id: 1, generated_at: -1 });

module.exports = mongoose.model('Report', reportSchema);
