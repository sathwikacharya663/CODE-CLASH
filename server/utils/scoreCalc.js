const Submission = require('../models/Submission');
const User = require('../models/User');

/**
 * Compute total score for a team across all rounds.
 * @param {string} teamId
 * @returns {number}
 */
async function getTeamTotalScore(teamId) {
  const finalSubs = await Submission.find({ teamId, isFinalSubmission: true });
  const submissionScore = finalSubs.reduce((sum, s) => sum + (s.pointsEarned || 0), 0);
  const user = await User.findOne({ teamId });
  const manualAdj = user ? (user.manualPointsAdjustment || 0) : 0;
  return submissionScore + manualAdj;
}

/**
 * Compute per-round score for a team.
 * @param {string} teamId
 * @param {number} round
 * @returns {number}
 */
async function getRoundScore(teamId, round) {
  const finalSubs = await Submission.find({ teamId, isFinalSubmission: true, round });
  return finalSubs.reduce((sum, s) => sum + (s.pointsEarned || 0), 0);
}

/**
 * Build a leaderboard array sorted by totalScore descending.
 * @returns {Array}
 */
async function buildLeaderboard() {
  const teams = await User.find({ role: 'participant' });
  const leaderboard = await Promise.all(teams.map(async (team) => {
    const finalSubs = await Submission.find({ teamId: team.teamId, isFinalSubmission: true });
    const r1 = finalSubs.filter(s => s.round === 1).reduce((sum, s) => sum + (s.pointsEarned || 0), 0);
    const r2 = finalSubs.filter(s => s.round === 2).reduce((sum, s) => sum + (s.pointsEarned || 0), 0);
    const r3 = finalSubs.filter(s => s.round === 3).reduce((sum, s) => sum + (s.pointsEarned || 0), 0);
    const total = r1 + r2 + r3 + (team.manualPointsAdjustment || 0);
    return {
      teamId: team.teamId,
      teamName: team.teamName,
      r1Score: r1,
      r2Score: r2,
      r3Score: r3,
      totalScore: total,
      isEliminated: team.isEliminated,
      isQualifiedRound3: team.isQualifiedRound3,
    };
  }));

  return leaderboard.sort((a, b) => b.totalScore - a.totalScore);
}

module.exports = { getTeamTotalScore, getRoundScore, buildLeaderboard };
