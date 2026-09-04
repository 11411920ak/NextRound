const mongoose = require('mongoose');
const { ALLOWED_ROLES } = require('../config/roles');

const questionSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
      enum: ALLOWED_ROLES,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
      // e.g. "JavaScript", "System Design", "DBMS", "OOP", "HR"
    },
    category: {
      type: String,
      required: true,
      enum: ['behavioral', 'technical', 'hr'],
    },
    question_type: {
      type: String,
      enum: ['conceptual', 'coding', 'debugging', 'scenario', 'system_design', 'project', 'hr', 'behavioral'],
      default: 'conceptual',
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    ideal_answer: {
      type: String,
      trim: true,
      default: '',
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    experience_level: {
      type: String,
      enum: ['fresher', '1-2_years', '3+_years', 'all'],
      default: 'all',
    },
    tags: [{ type: String }],
    is_active: {
      type: Boolean,
      default: true,
    },
    source: {
      type: String,
      enum: ['seed', 'ai_generated', 'manual'],
      default: 'seed',
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

// Indexes for efficient querying
questionSchema.index({ role: 1, difficulty: 1 });
questionSchema.index({ role: 1, category: 1 });
questionSchema.index({ role: 1, topic: 1, difficulty: 1 });
questionSchema.index({ role: 1, experience_level: 1, difficulty: 1 });

module.exports = mongoose.model('Question', questionSchema);
