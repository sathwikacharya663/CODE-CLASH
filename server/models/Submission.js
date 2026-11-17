const mongoose = require('mongoose');

const testCaseResultSchema = new mongoose.Schema({
  input: { type: String, default: '' },
  expectedOutput: { type: String, default: '' },
  actualOutput: { type: String, default: '' },
  passed: { type: Boolean, default: false },
  timeTaken: { type: Number, default: 0 },
}, { _id: false });

const submissionSchema = new mongoose.Schema({
  teamId: { type: String, required: true },
  round: { type: Number, required: true },
  language: { type: String, required: true },
  code: { type: String, required: true },
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  submittedAt: { type: Date, default: Date.now },
  isAutoSave: { type: Boolean, default: false },
  isFinalSubmission: { type: Boolean, default: false },
  testCaseResults: { type: [testCaseResultSchema], default: [] },
  totalTestsPassed: { type: Number, default: 0 },
  totalTests: { type: Number, default: 0 },
  wrongSubmissions: { type: Number, default: 0 },
  pointsEarned: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'running', 'accepted', 'wrong_answer', 'error', 'tle'],
    default: 'pending',
  },
}, { timestamps: true });

// Index for fast lookups
submissionSchema.index({ teamId: 1, round: 1, questionId: 1 });
submissionSchema.index({ teamId: 1, isFinalSubmission: 1 });

module.exports = mongoose.model('Submission', submissionSchema);
