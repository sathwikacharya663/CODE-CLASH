const RoundState = require('../models/RoundState');
const timerService = require('../services/timer');

const roundEvents = (socket, io) => {
  // Client can request current round status
  socket.on('round:get-status', async () => {
    try {
      const rounds = await RoundState.find({}).sort({ round: 1 });
      const result = rounds.map(r => ({
        round: r.round,
        status: r.status,
        durationMinutes: r.durationMinutes,
        startedAt: r.startedAt,
        remainingMs: timerService.getRemaining(r.round),
      }));
      socket.emit('round:status', result);
    } catch (err) {
      console.error('round:get-status error:', err);
    }
  });
};

module.exports = roundEvents;
