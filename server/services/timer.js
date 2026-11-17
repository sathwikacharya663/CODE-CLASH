const RoundState = require('../models/RoundState');
const Submission = require('../models/Submission');
const Question = require('../models/Question');
const User = require('../models/User');
const evaluator = require('./evaluator');

// In-memory map of active timers: round -> intervalId
const roundTimers = new Map();

// In-memory round state cache (supplementing DB state)
const roundStateCache = new Map();

/**
 * Start the server-side timer for a round.
 * @param {number} round
 * @param {Object} roundState - Mongoose RoundState document
 * @param {Object} io - Socket.IO server instance
 */
function startTimer(round, roundState, io) {
  // Clear any existing timer for this round
  if (roundTimers.has(round)) {
    clearInterval(roundTimers.get(round));
  }

  // Cache state
  roundStateCache.set(round, {
    startedAt: roundState.startedAt,
    totalPausedMs: roundState.totalPausedMs || 0,
    durationMinutes: roundState.durationMinutes,
    pausedAt: null,
  });

  const intervalId = setInterval(async () => {
    const cached = roundStateCache.get(round);
    if (!cached) {
      clearInterval(intervalId);
      return;
    }

    const now = Date.now();
    const elapsed = now - new Date(cached.startedAt).getTime() - (cached.totalPausedMs || 0);
    const totalMs = cached.durationMinutes * 60 * 1000;
    const remainingMs = totalMs - elapsed;

    if (remainingMs <= 0) {
      // Auto-end round
      clearInterval(intervalId);
      roundTimers.delete(round);
      roundStateCache.delete(round);

      try {
        await RoundState.findOneAndUpdate(
          { round },
          { status: 'ended', endedAt: new Date(), pausedAt: null }
        );
        await autoSubmitAll(round, io);
        io.emit('round:ended', { round });
        io.emit('timer:tick', { round, remainingMs: 0 });
      } catch (err) {
        console.error(`Auto-end round ${round} error:`, err);
      }
      return;
    }

    io.emit('timer:tick', { round, remainingMs });
  }, 1000);

  roundTimers.set(round, intervalId);
}

/**
 * Pause the timer for a round.
 * @param {number} round
 */
function pauseTimer(round) {
  if (roundTimers.has(round)) {
    clearInterval(roundTimers.get(round));
    roundTimers.delete(round);
  }
  const cached = roundStateCache.get(round);
  if (cached) {
    cached.pausedAt = Date.now();
    roundStateCache.set(round, cached);
  }
}

/**
 * Resume the timer for a round.
 * @param {number} round
 * @param {Object} roundState - Updated Mongoose RoundState document
 * @param {Object} io
 */
function resumeTimer(round, roundState, io) {
  const cached = roundStateCache.get(round) || {};
  cached.totalPausedMs = roundState.totalPausedMs;
  cached.pausedAt = null;
  cached.durationMinutes = roundState.durationMinutes;
  roundStateCache.set(round, cached);
  startTimer(round, { ...roundState, totalPausedMs: roundState.totalPausedMs }, io);
}

/**
 * Stop (clear) the timer for a round.
 * @param {number} round
 */
function stopTimer(round) {
  if (roundTimers.has(round)) {
    clearInterval(roundTimers.get(round));
    roundTimers.delete(round);
  }
  roundStateCache.delete(round);
}

/**
 * Get remaining milliseconds for a round.
 * @param {number} round
 * @returns {number}
 */
function getRemaining(round) {
  const cached = roundStateCache.get(round);
  if (!cached) return 0;
  if (cached.pausedAt) {
    // Timer is paused - compute at pause point
    const elapsed = cached.pausedAt - new Date(cached.startedAt).getTime() - (cached.totalPausedMs || 0);
    const totalMs = cached.durationMinutes * 60 * 1000;
    return Math.max(0, totalMs - elapsed);
  }
  const now = Date.now();
  const elapsed = now - new Date(cached.startedAt).getTime() - (cached.totalPausedMs || 0);
  const totalMs = cached.durationMinutes * 60 * 1000;
  return Math.max(0, totalMs - elapsed);
}

/**
 * Auto-submit all teams' latest autosave for each question in the round.
 * @param {number} round
 * @param {Object} io
 */
async function autoSubmitAll(round, io) {
  try {
    const questions = await Question.find({ round, isActive: true });
    const teams = await User.find({ role: 'participant' });
    const roundState = await RoundState.findOne({ round });

    for (const team of teams) {
      for (const question of questions) {
        // Check if already has a final submission
        const existing = await Submission.findOne({
          teamId: team.teamId,
          questionId: question._id,
          isFinalSubmission: true,
        });
        if (existing) continue;

        // Find latest autosave
        const autoSave = await Submission.findOne({
          teamId: team.teamId,
          questionId: question._id,
          isAutoSave: true,
          isFinalSubmission: false,
        }).sort({ submittedAt: -1 });

        if (!autoSave) continue;

        // Count previous wrong submissions
        const wrongSubmissions = await Submission.countDocuments({
          teamId: team.teamId,
          questionId: question._id,
          isFinalSubmission: true,
          status: { $in: ['wrong_answer', 'error', 'tle'] },
        });

        // Evaluate
        let evalResult;
        try {
          evalResult = await evaluator.evaluate(question, autoSave.code, autoSave.language, wrongSubmissions, false, round);
        } catch (err) {
          console.error(`Auto-evaluate error for team ${team.teamId} Q ${question._id}:`, err);
          evalResult = {
            testCaseResults: [],
            totalTestsPassed: 0,
            totalTests: question.testCases.length,
            pointsEarned: 0,
            status: 'error',
          };
        }

        // Create final submission
        const finalSub = new Submission({
          teamId: team.teamId,
          round,
          language: autoSave.language,
          code: autoSave.code,
          questionId: question._id,
          isFinalSubmission: true,
          isAutoSave: false,
          testCaseResults: evalResult.testCaseResults,
          totalTestsPassed: evalResult.totalTestsPassed,
          totalTests: evalResult.totalTests,
          wrongSubmissions,
          pointsEarned: evalResult.pointsEarned,
          status: evalResult.status,
        });
        await finalSub.save();
      }
    }
    console.log(`Auto-submit complete for round ${round}`);
  } catch (err) {
    console.error(`autoSubmitAll error for round ${round}:`, err);
  }
}

module.exports = { startTimer, pauseTimer, resumeTimer, stopTimer, getRemaining, autoSubmitAll };
