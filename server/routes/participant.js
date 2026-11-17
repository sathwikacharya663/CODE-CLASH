const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const RoundState = require('../models/RoundState');
const Submission = require('../models/Submission');
const timerService = require('../services/timer');

// All participant routes require auth
router.use(auth);

// GET /api/participant/round-status
router.get('/round-status', async (req, res) => {
  try {
    const rounds = await RoundState.find({}).sort({ round: 1 });
    const result = rounds.map(r => {
      const remaining = timerService.getRemaining(r.round);
      return {
        round: r.round,
        status: r.status,
        durationMinutes: r.durationMinutes,
        startedAt: r.startedAt,
        remainingMs: remaining,
      };
    });
    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/participant/my-submissions/:round
router.get('/my-submissions/:round', async (req, res) => {
  try {
    const round = parseInt(req.params.round, 10);
    const submissions = await Submission.find({
      teamId: req.user.teamId,
      round,
      isFinalSubmission: true,
    }).select('questionId status submittedAt language -_id');
    return res.json(submissions);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/participant/autosave
router.post('/autosave', async (req, res) => {
  try {
    const { questionId, code, language, round } = req.body;
    if (!questionId || !code || !language || !round) {
      return res.status(400).json({ message: 'questionId, code, language, and round are required' });
    }

    const submission = new Submission({
      teamId: req.user.teamId,
      round: parseInt(round, 10),
      language,
      code,
      questionId,
      isAutoSave: true,
      isFinalSubmission: false,
      status: 'pending',
    });
    await submission.save();
    return res.json({ message: 'Auto-saved successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
