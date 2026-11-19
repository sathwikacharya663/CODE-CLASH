const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { parse } = require('csv-parse');
const adminOnly = require('../middleware/adminOnly');
const User = require('../models/User');
const Submission = require('../models/Submission');
const RoundState = require('../models/RoundState');
const ActivityLog = require('../models/ActivityLog');
const Question = require('../models/Question');
const { BCRYPT_SALT_ROUNDS } = require('../config/constants');
const timerService = require('../services/timer');

const upload = multer({ storage: multer.memoryStorage() });

// Helper: generate next teamId
async function generateTeamId() {
  const teams = await User.find({ role: 'participant' }).sort({ teamId: -1 });
  if (teams.length === 0) return 'TEAM001';
  const nums = teams
    .map(t => parseInt(t.teamId.replace('TEAM', ''), 10))
    .filter(n => !isNaN(n));
  const max = Math.max(...nums, 0);
  return `TEAM${String(max + 1).padStart(3, '0')}`;
}

// Helper: generate random 8-char password
function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pass = '';
  for (let i = 0; i < 8; i++) pass += chars[Math.floor(Math.random() * chars.length)];
  return pass;
}

// Helper: compute best score per question for a team (prevents double-counting on resubmission)
function bestScorePerQuestion(subs) {
  const best = {};
  for (const s of subs) {
    const key = String(s.questionId);
    if (best[key] === undefined || s.pointsEarned > best[key]) {
      best[key] = s.pointsEarned || 0;
    }
  }
  return Object.values(best).reduce((sum, pts) => sum + pts, 0);
}

// Helper: compute team scores from submissions — uses best score per question
async function computeTeamScores(teams) {
  const results = await Promise.all(teams.map(async (team) => {
    const finalSubs = await Submission.find({ teamId: team.teamId, isFinalSubmission: true });
    const r1Subs = finalSubs.filter(s => s.round === 1);
    const r2Subs = finalSubs.filter(s => s.round === 2);
    const r3Subs = finalSubs.filter(s => s.round === 3);
    const r1Score = bestScorePerQuestion(r1Subs);
    const r2Score = bestScorePerQuestion(r2Subs);
    const r3Score = bestScorePerQuestion(r3Subs);
    const totalScore = r1Score + r2Score + r3Score + (team.manualPointsAdjustment || 0);
    // Final Score formula: [(R1+R2)/200 * 30] + [R3 * 70%]
    // Only show if team has played (has any submission)
    const hasR3 = r3Subs.length > 0;
    const finalScore = finalSubs.length === 0
      ? null
      : hasR3
        ? Math.round(((r1Score + r2Score) / 200) * 30 + r3Score * 0.7)
        : null;
    return {
      teamId: team.teamId,
      teamName: team.teamName,
      members: team.members,
      role: team.role,
      isEliminated: team.isEliminated,
      isQualifiedRound3: team.isQualifiedRound3,
      isOnline: team.isOnline,
      lastActivity: team.lastActivity,
      tabSwitchCount: team.tabSwitchCount,
      manualPointsAdjustment: team.manualPointsAdjustment,
      totalScore,
      r1Score,
      r2Score,
      r3Score,
      finalScore,
    };
  }));
  return results;
}

// All admin routes require adminOnly
router.use(adminOnly);

// ---- TEAMS ----

// GET /api/admin/teams
router.get('/teams', async (req, res) => {
  try {
    const teams = await User.find({ role: 'participant' });
    const withScores = await computeTeamScores(teams);
    return res.json(withScores);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/teams
router.post('/teams', async (req, res) => {
  try {
    const { teamName, members } = req.body;
    if (!teamName) return res.status(400).json({ message: 'teamName is required' });
    const teamId = await generateTeamId();
    const plainPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, BCRYPT_SALT_ROUNDS);
    const user = new User({
      teamId,
      teamName,
      members: members || [],
      password: hashedPassword,
      role: 'participant',
    });
    await user.save();
    return res.status(201).json({ teamId, teamName, password: plainPassword, members: user.members });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/admin/teams/:id
router.put('/teams/:id', async (req, res) => {
  try {
    const { teamName, members, password, manualPointsAdjustment } = req.body;
    const updateData = {};
    if (teamName !== undefined) updateData.teamName = teamName;
    if (members !== undefined) updateData.members = members;
    if (manualPointsAdjustment !== undefined) updateData.manualPointsAdjustment = manualPointsAdjustment;
    if (password) {
      updateData.password = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    }
    const user = await User.findOneAndUpdate({ teamId: req.params.id }, updateData, { new: true }).select('-password -sessionToken');
    if (!user) return res.status(404).json({ message: 'Team not found' });
    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/admin/teams/:id
router.delete('/teams/:id', async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ teamId: req.params.id, role: 'participant' });
    if (!user) return res.status(404).json({ message: 'Team not found' });
    return res.json({ message: 'Team deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/teams/bulk-import (CSV)
router.post('/teams/bulk-import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'CSV file required' });
    const csvContent = req.file.buffer.toString('utf-8');
    const records = await new Promise((resolve, reject) => {
      parse(csvContent, { columns: true, skip_empty_lines: true, trim: true }, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    const created = [];
    for (const row of records) {
      const teamName = row.teamName;
      if (!teamName) continue;
      const members = [row.member1, row.member2, row.member3].filter(Boolean);
      const teamId = await generateTeamId();
      const plainPassword = generatePassword();
      const hashedPassword = await bcrypt.hash(plainPassword, BCRYPT_SALT_ROUNDS);
      const user = new User({ teamId, teamName, members, password: hashedPassword, role: 'participant' });
      await user.save();
      created.push({ teamId, teamName, password: plainPassword, members });
    }
    return res.status(201).json({ created, count: created.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ---- LEADERBOARD ----

// GET /api/admin/leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const teams = await User.find({ role: 'participant' });
    const leaderboard = await Promise.all(teams.map(async (team) => {
      const finalSubs = await Submission.find({ teamId: team.teamId, isFinalSubmission: true })
        .populate('questionId', 'round title totalPoints')
        .sort({ submittedAt: 1 });

      const r1Subs = finalSubs.filter(s => s.round === 1);
      const r2Subs = finalSubs.filter(s => s.round === 2);
      const r3Subs = finalSubs.filter(s => s.round === 3);

      // Use best score per question to avoid double-counting resubmissions
      const r1Score = bestScorePerQuestion(r1Subs);
      const r2Score = bestScorePerQuestion(r2Subs);
      const r3Score = bestScorePerQuestion(r3Subs);
      const totalScore = r1Score + r2Score + r3Score + (team.manualPointsAdjustment || 0);

      // Final Score = [(R1+R2)/200 * 30] + [R3 * 70%]  — only if team played R3
      const hasR3 = r3Subs.length > 0;
      const finalScore = hasR3
        ? Math.round(((r1Score + r2Score) / 200) * 30 + r3Score * 0.7)
        : null;

      // Last submission time
      const lastSub = finalSubs[finalSubs.length - 1];

      return {
        teamId: team.teamId,
        teamName: team.teamName,
        members: team.members,
        isEliminated: team.isEliminated,
        isQualifiedRound3: team.isQualifiedRound3,
        isOnline: team.isOnline,
        totalScore,
        r1Score,
        r2Score,
        r3Score,
        finalScore,
        manualPointsAdjustment: team.manualPointsAdjustment,
        lastSubmittedAt: lastSub ? lastSub.submittedAt : null,
      };
    }));

    leaderboard.sort((a, b) => b.totalScore - a.totalScore);
    return res.json(leaderboard);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ---- ROUNDS ----

// GET /api/admin/rounds
router.get('/rounds', async (req, res) => {
  try {
    const rounds = await RoundState.find({}).sort({ round: 1 });
    const formatted = rounds.map(r => {
      const remaining = timerService.getRemaining(r.round);
      return {
        ...r.toObject(),
        remainingMs: remaining,
      };
    });
    return res.json({ rounds: formatted });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/winners
router.get('/winners', async (req, res) => {
  try {
    const teams = await User.find({ role: 'participant' });
    const leaderboard = await Promise.all(teams.map(async (team) => {
      const finalSubs = await Submission.find({ teamId: team.teamId, isFinalSubmission: true });
      const totalScore = finalSubs.reduce((sum, s) => sum + (s.pointsEarned || 0), 0) + (team.manualPointsAdjustment || 0);
      return {
        teamId: team.teamId,
        teamName: team.teamName,
        members: team.members,
        totalScore,
      };
    }));

    leaderboard.sort((a, b) => b.totalScore - a.totalScore);
    const firstPlace = leaderboard[0] || null;
    const secondPlace = leaderboard[1] || null;

    const result = {
      firstPlace: firstPlace ? { ...firstPlace, prize: 'Rs. 2,500' } : null,
      secondPlace: secondPlace ? { ...secondPlace, prize: 'Rs. 1,500' } : null,
      prizePool: 'Rs. 4,000',
    };

    if (req.io) {
      req.io.emit('winners:revealed', result);
    }

    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/rounds/:round/unlock
router.post('/rounds/:round/unlock', async (req, res) => {
  try {
    const round = parseInt(req.params.round, 10);
    if (![1, 2, 3].includes(round)) return res.status(400).json({ message: 'Invalid round' });
    const { durationMinutes } = req.body;

    // Enforce order
    if (round === 2) {
      const r1 = await RoundState.findOne({ round: 1 });
      if (!r1 || r1.status !== 'ended') return res.status(400).json({ message: 'Round 1 must be ended before unlocking Round 2' });
    }
    if (round === 3) {
      const r2 = await RoundState.findOne({ round: 2 });
      if (!r2 || r2.status !== 'ended') return res.status(400).json({ message: 'Round 2 must be ended before unlocking Round 3' });
    }

    const roundState = await RoundState.findOne({ round });
    if (!roundState) return res.status(404).json({ message: 'Round state not found' });
    if (roundState.status === 'active') return res.status(400).json({ message: 'Round is already active' });

    if (durationMinutes) roundState.durationMinutes = durationMinutes;
    roundState.status = 'active';
    roundState.startedAt = new Date();
    roundState.totalPausedMs = 0;
    roundState.pausedAt = null;
    await roundState.save();

    // Start server-side timer
    timerService.startTimer(round, roundState, req.io);

    req.io.emit('round:unlocked', { round, durationMinutes: roundState.durationMinutes, startedAt: roundState.startedAt });
    return res.json({ message: `Round ${round} unlocked`, roundState });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/rounds/:round/pause
router.post('/rounds/:round/pause', async (req, res) => {
  try {
    const round = parseInt(req.params.round, 10);
    const roundState = await RoundState.findOne({ round });
    if (!roundState || roundState.status !== 'active') return res.status(400).json({ message: 'Round is not active' });

    roundState.status = 'paused';
    roundState.pausedAt = new Date();
    await roundState.save();

    timerService.pauseTimer(round);
    req.io.emit('round:paused', { round, pausedAt: roundState.pausedAt });
    return res.json({ message: `Round ${round} paused`, roundState });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/rounds/:round/resume
router.post('/rounds/:round/resume', async (req, res) => {
  try {
    const round = parseInt(req.params.round, 10);
    const roundState = await RoundState.findOne({ round });
    if (!roundState || roundState.status !== 'paused') return res.status(400).json({ message: 'Round is not paused' });

    const now = new Date();
    roundState.totalPausedMs += (now - roundState.pausedAt);
    roundState.pausedAt = null;
    roundState.status = 'active';
    await roundState.save();

    timerService.resumeTimer(round, roundState, req.io);
    req.io.emit('round:resumed', { round });
    return res.json({ message: `Round ${round} resumed`, roundState });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/rounds/:round/end
router.post('/rounds/:round/end', async (req, res) => {
  try {
    const round = parseInt(req.params.round, 10);
    const roundState = await RoundState.findOne({ round });
    if (!roundState || (roundState.status !== 'active' && roundState.status !== 'paused')) {
      return res.status(400).json({ message: 'Round is not active or paused' });
    }

    roundState.status = 'ended';
    roundState.endedAt = new Date();
    roundState.pausedAt = null;
    await roundState.save();

    timerService.stopTimer(round);
    await timerService.autoSubmitAll(round, req.io);

    req.io.emit('round:ended', { round });
    return res.json({ message: `Round ${round} ended` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/rounds/reset-all  ← must come BEFORE /:round/reset
router.post('/rounds/reset-all', async (req, res) => {
  try {
    [1, 2, 3].forEach(r => timerService.stopTimer(r));

    await RoundState.updateMany({}, {
      status: 'locked',
      startedAt: null,
      pausedAt: null,
      endedAt: null,
      totalPausedMs: 0,
    });
    await RoundState.findOneAndUpdate({ round: 1 }, { durationMinutes: 30 });
    await RoundState.findOneAndUpdate({ round: 2 }, { durationMinutes: 30 });
    await RoundState.findOneAndUpdate({ round: 3 }, { durationMinutes: 60, qualifiedTeams: [] });

    // Reset teams qualification and tab switch counters
    await User.updateMany({ role: 'participant' }, {
      isQualifiedRound3: false,
      isEliminated: false,
      tabSwitchCount: 0,
      manualPointsAdjustment: 0,
    });

    // Clear submissions so all scores reset cleanly
    await Submission.deleteMany({});

    if (req.io) {
      req.io.emit('round:reset', { all: true });
      req.io.emit('timer:tick', { round: 1, remainingMs: 0 });
      req.io.emit('team:status', {});
    }

    return res.json({ message: 'Competition reset successfully. All rounds locked and scores cleared.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/rounds/:round/extend
router.post('/rounds/:round/extend', async (req, res) => {
  try {
    const round = parseInt(req.params.round, 10);
    const { minutes } = req.body;
    if (!minutes || minutes <= 0) return res.status(400).json({ message: 'Valid minutes required' });

    const roundState = await RoundState.findOne({ round });
    if (!roundState) return res.status(404).json({ message: 'Round state not found' });

    roundState.durationMinutes += parseInt(minutes, 10);
    await roundState.save();

    req.io.emit('round:extended', { round, durationMinutes: roundState.durationMinutes });
    return res.json({ message: `Round ${round} extended by ${minutes} minutes`, roundState });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/rounds/select-top10 (auto select)
router.post('/rounds/select-top10', async (req, res) => {
  try {
    const teams = await User.find({ role: 'participant', isEliminated: false });
    const scored = await Promise.all(teams.map(async (team) => {
      const finalSubs = await Submission.find({ teamId: team.teamId, isFinalSubmission: true, round: { $in: [1, 2] } });
      const score = finalSubs.reduce((sum, s) => sum + (s.pointsEarned || 0), 0);
      return { teamId: team.teamId, score };
    }));

    scored.sort((a, b) => b.score - a.score);
    const top10 = scored.slice(0, 10).map(t => t.teamId);
    const eliminated = scored.slice(10).map(t => t.teamId);

    await User.updateMany({ teamId: { $in: top10 } }, { isQualifiedRound3: true, isEliminated: false });
    await User.updateMany({ teamId: { $in: eliminated }, role: 'participant' }, { isEliminated: true, isQualifiedRound3: false });

    // Update RoundState qualifiedTeams
    await RoundState.findOneAndUpdate({ round: 3 }, { qualifiedTeams: top10 });

    // Emit socket events to each team
    for (const teamId of top10) {
      req.io.to(`team:${teamId}`).emit('round3:qualified', { teamId });
    }
    for (const teamId of eliminated) {
      req.io.to(`team:${teamId}`).emit('round3:eliminated', { teamId });
    }

    return res.json({ qualified: top10, eliminated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/admin/rounds/select-top10 (manual override)
router.put('/rounds/select-top10', async (req, res) => {
  try {
    const { teamIds } = req.body;
    if (!Array.isArray(teamIds) || teamIds.length === 0) {
      return res.status(400).json({ message: 'teamIds array required' });
    }

    // Reset all first
    await User.updateMany({ role: 'participant' }, { isQualifiedRound3: false, isEliminated: false });
    // Qualify selected
    await User.updateMany({ teamId: { $in: teamIds } }, { isQualifiedRound3: true });
    // Eliminate rest
    await User.updateMany({ role: 'participant', teamId: { $nin: teamIds } }, { isEliminated: true });

    await RoundState.findOneAndUpdate({ round: 3 }, { qualifiedTeams: teamIds });

    for (const teamId of teamIds) {
      req.io.to(`team:${teamId}`).emit('round3:qualified', { teamId });
    }

    return res.json({ message: 'Manual selection applied', qualifiedTeams: teamIds });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ---- SUBMISSIONS ----

// GET /api/admin/submissions — only final (clicked Submit) submissions, newest first
router.get('/submissions', async (req, res) => {
  try {
    const { teamId, round, questionId } = req.query;
    const filter = { isFinalSubmission: true }; // exclude auto-saves and run results
    if (teamId) filter.teamId = teamId;
    if (round) filter.round = parseInt(round, 10);
    if (questionId) filter.questionId = questionId;

    const submissions = await Submission.find(filter)
      .populate('questionId', 'title round order')
      .sort({ submittedAt: -1 })
      .limit(500);
    return res.json(submissions);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/submissions/:id/adjust-points
router.post('/submissions/:id/adjust-points', async (req, res) => {
  try {
    const { delta } = req.body;
    if (delta === undefined || isNaN(delta)) return res.status(400).json({ message: 'delta required' });

    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    submission.pointsEarned = Math.max(0, (submission.pointsEarned || 0) + parseFloat(delta));
    await submission.save();
    return res.json({ message: 'Points adjusted', pointsEarned: submission.pointsEarned });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ---- ACTIVITY LOGS ----

// GET /api/admin/activity-logs
router.get('/activity-logs', async (req, res) => {
  try {
    const { teamId, event, limit = 100 } = req.query;
    const filter = {};
    if (teamId) filter.teamId = teamId;
    if (event) filter.event = event;
    const logs = await ActivityLog.find(filter).sort({ timestamp: -1 }).limit(parseInt(limit, 10));
    return res.json(logs);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ---- SETTINGS (simple in-memory/db stub) ----
let globalSettings = {
  copyPasteEnabled: true,
  tabSwitchWarningEnabled: true,
};

// GET /api/admin/settings
router.get('/settings', (_req, res) => {
  return res.json(globalSettings);
});

// POST /api/admin/settings
router.post('/settings', (req, res) => {
  globalSettings = { ...globalSettings, ...req.body };
  // Emit to all clients
  req.io.emit('settings:updated', globalSettings);
  return res.json(globalSettings);
});

module.exports = router;
