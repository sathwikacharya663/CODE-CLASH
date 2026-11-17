const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { runLimiter, submitLimiter } = require('../middleware/rateLimiter');
const Question = require('../models/Question');
const Submission = require('../models/Submission');
const RoundState = require('../models/RoundState');
const codeExecutor = require('../services/codeExecutor');
const evaluator = require('../services/evaluator');
const timerService = require('../services/timer');

// All submission routes require auth
router.use(auth);

// POST /api/submissions/run - run code (no scoring)
router.post('/run', runLimiter, async (req, res) => {
  try {
    const { code, language, stdin } = req.body;
    if (!code || !language) {
      return res.status(400).json({ message: 'code and language are required' });
    }

    const result = await codeExecutor.execute(code, language, stdin || '');
    return res.json({
      output: result.output,
      error: result.error,
      timedOut: result.timedOut,
    });
  } catch (err) {
    console.error('Run error:', err);
    return res.status(500).json({ message: 'Execution failed', error: err.message });
  }
});

// POST /api/submissions/submit - final submission with scoring
router.post('/submit', submitLimiter, async (req, res) => {
  try {
    const { questionId, code, language, round } = req.body;
    if (!questionId || !code || !language || !round) {
      return res.status(400).json({ message: 'questionId, code, language, and round are required' });
    }

    const roundNum = parseInt(round, 10);

    // Check round is active
    const roundState = await RoundState.findOne({ round: roundNum });
    if (!roundState || roundState.status !== 'active') {
      return res.status(400).json({ message: 'Round is not active' });
    }

    const question = await Question.findById(questionId);
    if (!question || !question.isActive) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Count previous wrong submissions for this question by this team
    const wrongSubmissions = await Submission.countDocuments({
      teamId: req.user.teamId,
      questionId,
      isFinalSubmission: true,
      status: { $in: ['wrong_answer', 'error', 'tle'] },
    });

    // Compute remaining time for time bonus
    const remainingMs = timerService.getRemaining(roundNum);
    const totalMs = roundState.durationMinutes * 60 * 1000;
    const inFirstHalf = remainingMs > totalMs / 2;

    // Evaluate
    const evalResult = await evaluator.evaluate(question, code, language, wrongSubmissions, inFirstHalf, roundNum);

    // Store final submission
    const submission = new Submission({
      teamId: req.user.teamId,
      round: roundNum,
      language,
      code,
      questionId,
      isFinalSubmission: true,
      isAutoSave: false,
      testCaseResults: evalResult.testCaseResults,
      totalTestsPassed: evalResult.totalTestsPassed,
      totalTests: evalResult.totalTests,
      wrongSubmissions,
      pointsEarned: evalResult.pointsEarned,
      status: evalResult.status,
    });
    await submission.save();

    // Notify admin via socket
    if (req.io) {
      req.io.to('admin').emit('submission:new', {
        teamId: req.user.teamId,
        teamName: req.user.teamName,
        round: roundNum,
        questionId,
        status: evalResult.status,
      });
    }

    // NEVER return pointsEarned to participant
    return res.json({
      message: 'Your solution has been submitted successfully',
      status: evalResult.status,
    });
  } catch (err) {
    console.error('Submit error:', err);
    return res.status(500).json({ message: 'Submission failed', error: err.message });
  }
});

module.exports = router;
