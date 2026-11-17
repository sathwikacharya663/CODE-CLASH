const auth = require('./auth');

const adminOnly = async (req, res, next) => {
  // Run base auth first
  auth(req, res, (err) => {
    if (err) return next(err);
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  });
};

module.exports = adminOnly;
