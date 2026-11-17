const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  teamId: { type: String, required: true, unique: true },
  teamName: { type: String, required: true },
  password: { type: String, required: true },
  members: { type: [String], default: [] },
  role: { type: String, enum: ['participant', 'admin'], default: 'participant' },
  isEliminated: { type: Boolean, default: false },
  isQualifiedRound3: { type: Boolean, default: false },
  isOnline: { type: Boolean, default: false },
  lastActivity: { type: Date },
  tabSwitchCount: { type: Number, default: 0 },
  sessionToken: { type: String, default: null },
  manualPointsAdjustment: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
