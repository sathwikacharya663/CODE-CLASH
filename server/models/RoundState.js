const mongoose = require('mongoose');

const roundStateSchema = new mongoose.Schema({
  round: { type: Number, required: true, unique: true, enum: [1, 2, 3] },
  status: {
    type: String,
    enum: ['locked', 'active', 'paused', 'ended'],
    default: 'locked',
  },
  startedAt: { type: Date, default: null },
  pausedAt: { type: Date, default: null },
  endedAt: { type: Date, default: null },
  totalPausedMs: { type: Number, default: 0 },
  durationMinutes: { type: Number, required: true },
  qualifiedTeams: { type: [String], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('RoundState', roundStateSchema);
