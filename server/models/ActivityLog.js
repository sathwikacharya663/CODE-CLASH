const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  teamId: { type: String, required: true },
  event: { type: String, required: true },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now },
});

activityLogSchema.index({ teamId: 1, timestamp: -1 });
activityLogSchema.index({ event: 1, timestamp: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
