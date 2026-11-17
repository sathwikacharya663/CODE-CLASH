const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({ teamId: decoded.teamId });
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Single-session enforcement
    if (!user.sessionToken || user.sessionToken !== decoded.sessionToken) {
      return res.status(401).json({ message: 'Session expired. Please login again.' });
    }

    // Update last activity
    user.lastActivity = new Date();
    user.isOnline = true;
    await user.save();

    req.user = {
      teamId: user.teamId,
      teamName: user.teamName,
      role: user.role,
      sessionToken: user.sessionToken,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = auth;
