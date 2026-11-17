const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const auth = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { teamId, password } = req.body;
    if (!teamId || !password) {
      return res.status(400).json({ message: 'teamId and password are required' });
    }

    const user = await User.findOne({ teamId: teamId.toUpperCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate new sessionToken for single-session enforcement
    const sessionToken = uuidv4();
    user.sessionToken = sessionToken;
    user.isOnline = true;
    user.lastActivity = new Date();
    await user.save();

    const payload = {
      teamId: user.teamId,
      teamName: user.teamName,
      role: user.role,
      sessionToken,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

    return res.json({
      token,
      user: {
        teamId: user.teamId,
        teamName: user.teamName,
        role: user.role,
        members: user.members,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', auth, async (req, res) => {
  try {
    await User.findOneAndUpdate(
      { teamId: req.user.teamId },
      { sessionToken: null, isOnline: false }
    );
    return res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findOne({ teamId: req.user.teamId }).select('-password -sessionToken');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const response = {
      teamId: user.teamId,
      teamName: user.teamName,
      role: user.role,
      members: user.members,
      isEliminated: user.isEliminated,
      isQualifiedRound3: user.isQualifiedRound3,
    };

    return res.json({ user: response });
  } catch (err) {
    console.error('Me error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
