const mongoose = require('mongoose');
const { ALLOWED_ROLES } = require('../config/roles');

const sessionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
    },
    role: {
      type: String,
      required: true,
      enum: ALLOWED_ROLES,
    },
    experience: {
      type: String,
      enum: ['fresher', '1-2_years', '3+_years'],
      default: 'fresher',
    },
    interview_type: {
      type: String,
      enum: ['technical', 'hr', 'mixed'],
      default: 'technical',
    },
    mode: {
      type: String,
      enum: ['practice', 'mock'],
      default: 'practice',
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'adaptive'],
      default: 'adaptive',
    },
    total_questions: {
      type: Number,
      default: 10,
      min: 1,
      max: 20,
    },
    current_question_number: {
      type: Number,
      default: 0,
    },
    started_at: {
      type: Date,
      default: Date.now,
    },
    ended_at: {
      type: Date,
      default: null,
    },
    // Questions dynamically added as session progresses
    questions_asked: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    // Track which question IDs have been asked to avoid repeats
    asked_question_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    // Topic performance map: { "JavaScript": { attempts: 3, totalScore: 21 } }
    topic_performance: {
      type: Map,
      of: new mongoose.Schema(
        {
          attempts: { type: Number, default: 0 },
          totalScore: { type: Number, default: 0 },
        },
        { _id: false }
      ),
      default: {},
    },
    // Current adaptive difficulty being used
    current_difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    // Last recommended topic from AI
    current_topic: {
      type: String,
      default: null,
    },
    // Rolling window of the last N topic names asked (for topic rotation)
    recent_topics: {
      type: [String],
      default: [],
    },
    // Sub-level progression within the selected difficulty pool
    // basic → intermediate → advanced
    sub_difficulty: {
      type: String,
      enum: ['basic', 'intermediate', 'advanced'],
      default: 'basic',
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'abandoned'],
      default: 'active',
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

sessionSchema.index({ user_id: 1, status: 1 });
sessionSchema.index({ user_id: 1, created_at: -1 });

module.exports = mongoose.model('Session', sessionSchema);
