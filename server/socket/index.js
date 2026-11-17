const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const roundEvents = require('./roundEvents');

const initSocket = (io) => {
  // Middleware: authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        // Allow unauthenticated connections but mark them
        socket.user = null;
        return next();
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({ teamId: decoded.teamId });
      if (!user || user.sessionToken !== decoded.sessionToken) {
        socket.user = null;
        return next();
      }
      socket.user = { teamId: user.teamId, teamName: user.teamName, role: user.role };
      next();
    } catch (err) {
      socket.user = null;
      next();
    }
  });

  io.on('connection', (socket) => {
    // Admin joins admin room
    socket.on('join:admin', () => {
      if (socket.user && socket.user.role === 'admin') {
        socket.join('admin');
        socket.emit('joined', { room: 'admin' });
      } else {
        socket.emit('error', { message: 'Unauthorized' });
      }
    });

    // Team joins their room
    socket.on('join:team', async (data) => {
      if (!socket.user) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }
      const teamId = socket.user.teamId;
      const room = `team:${teamId}`;
      socket.join(room);

      // Mark user as online
      await User.findOneAndUpdate({ teamId }, { isOnline: true, lastActivity: new Date() });

      // Notify admin
      io.to('admin').emit('team:status', { teamId, isOnline: true });
      socket.emit('joined', { room });
    });

    // Handle tab switch event
    socket.on('tab:switch', async (data) => {
      if (!socket.user || socket.user.role === 'admin') return;
      const teamId = socket.user.teamId;
      try {
        const user = await User.findOneAndUpdate(
          { teamId },
          { $inc: { tabSwitchCount: 1 } },
          { new: true }
        );
        await ActivityLog.create({
          teamId,
          event: 'TAB_SWITCH',
          details: { count: user.tabSwitchCount, url: data?.url },
        });
        // Notify admin with updated count
        io.to('admin').emit('tab:switch', {
          teamId,
          teamName: socket.user.teamName,
          tabSwitchCount: user.tabSwitchCount,
          timestamp: new Date(),
        });
      } catch (err) {
        console.error('Tab switch error:', err);
      }
    });

    // Disconnect: mark offline
    socket.on('disconnect', async () => {
      if (socket.user && socket.user.role !== 'admin') {
        const teamId = socket.user.teamId;
        try {
          await User.findOneAndUpdate({ teamId }, { isOnline: false });
          io.to('admin').emit('team:status', { teamId, isOnline: false });
        } catch (err) {
          console.error('Disconnect cleanup error:', err);
        }
      }
    });

    // Round events
    roundEvents(socket, io);
  });
};

module.exports = initSocket;
