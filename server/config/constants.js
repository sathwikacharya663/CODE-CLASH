module.exports = {
  JWT_EXPIRY: '24h',
  BCRYPT_SALT_ROUNDS: 10,
  ROUND_STATUS: {
    LOCKED: 'locked',
    ACTIVE: 'active',
    PAUSED: 'paused',
    ENDED: 'ended',
  },
  SUBMISSION_STATUS: {
    PENDING: 'pending',
    RUNNING: 'running',
    ACCEPTED: 'accepted',
    WRONG_ANSWER: 'wrong_answer',
    ERROR: 'error',
    TLE: 'tle',
  },
  ROLES: {
    PARTICIPANT: 'participant',
    ADMIN: 'admin',
  },
  PISTON_LANGUAGE_MAP: {
    python: 'python',
    c: 'c',
    cpp: 'cpp',
    java: 'java',
  },
  TIME_BONUS_PERCENT: 10,
  PISTON_RUN_TIMEOUT: 5000,
  PISTON_COMPILE_TIMEOUT: 10000,
};
