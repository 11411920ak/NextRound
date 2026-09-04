const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
    },
    original_name: {
      type: String,
      required: true,
      trim: true,
    },
    file_path: {
      type: String,
      required: true,
    },
    file_type: {
      type: String,
      enum: ['pdf', 'doc', 'docx'],
      required: true,
    },
    mime_type: {
      type: String,
      required: true,
    },
    file_size: {
      type: Number, // bytes
      required: true,
    },
  },
  { timestamps: { createdAt: 'uploaded_at', updatedAt: 'updated_at' } }
);

resumeSchema.index({ user_id: 1, uploaded_at: -1 });

module.exports = mongoose.model('Resume', resumeSchema);
