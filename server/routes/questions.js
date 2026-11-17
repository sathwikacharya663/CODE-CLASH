const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const Question = require('../models/Question');

// Helper: sanitize question for participant (strip sensitive data)
function sanitizeForParticipant(question) {
  const q = question.toObject ? question.toObject() : { ...question };
  // Strip test case expected outputs and points
  if (q.testCases) {
    q.testCases = q.testCases.map(tc => ({
      input: tc.input,
      // Do NOT send expectedOutput or points
    }));
  }
  // Strip buggyCode (participants see it via the question UI, it's given directly in description/frontend)
  // Actually buggyCode should be provided to the participant so they can debug, but DO NOT send hidden test cases
  // Strip only testCase expected outputs
  return q;
}

// GET /api/questions?round=N
router.get('/', auth, async (req, res) => {
  try {
    const { round } = req.query;
    const filter = { isActive: true };
    if (round) filter.round = parseInt(round, 10);
    const questions = await Question.find(filter).sort({ round: 1, order: 1 });

    if (req.user.role === 'admin') {
      return res.json(questions);
    }
    // Participant: strip test case expected outputs and points
    const sanitized = questions.map(sanitizeForParticipant);
    return res.json(sanitized);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/questions/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question || !question.isActive) return res.status(404).json({ message: 'Question not found' });
    if (req.user.role === 'admin') return res.json(question);
    return res.json(sanitizeForParticipant(question));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/questions [admin]
router.post('/', adminOnly, async (req, res) => {
  try {
    const question = new Question(req.body);
    await question.save();
    return res.status(201).json(question);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/questions/:id [admin]
router.put('/:id', adminOnly, async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!question) return res.status(404).json({ message: 'Question not found' });
    return res.json(question);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/questions/:id [admin]
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!question) return res.status(404).json({ message: 'Question not found' });
    return res.json({ message: 'Question deactivated' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
