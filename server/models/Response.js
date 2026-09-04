const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema(
  {
    session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
    },
    question_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    transcript: {
      type: String,
      required: true,
      trim: true,
    },
    metrics: {
      filler_count: { type: Number, default: 0 },
      word_count: { type: Number, default: 0 },
      sentence_count: { type: Number, default: 0 },
    },
    llm_eval: {
      relevance_score: { type: Number, min: 1, max: 10, default: null },
      structure_score: { type: Number, min: 1, max: 10, default: null },
      clarity_score: { type: Number, min: 1, max: 10, default: null },
      overall_score: { type: Number, min: 1, max: 10, default: null },
      technical_accuracy: { type: Number, min: 1, max: 10, default: null },
      feedback_text: { type: String, default: '' },
      strengths: [{ type: String }],
      improvements: [{ type: String }],
      missing_concepts: [{ type: String }],
      next_difficulty: { type: String, default: null },
      next_topic: { type: String, default: null },
      evaluated_at: { type: Date, default: null },
      is_mock: { type: Boolean, default: false },
    },
    question_index: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

responseSchema.index({ session_id: 1 });
responseSchema.index({ session_id: 1, question_index: 1 });
// Prevent duplicate responses: one answer per question per session (race-condition safety net)
responseSchema.index({ session_id: 1, question_id: 1 }, { unique: true });

module.exports = mongoose.model('Response', responseSchema);
