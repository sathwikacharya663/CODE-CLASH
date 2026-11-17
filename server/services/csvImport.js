const { parse } = require('csv-parse');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { BCRYPT_SALT_ROUNDS } = require('../config/constants');

/**
 * Generate next teamId based on existing teams.
 */
async function generateTeamId() {
  const teams = await User.find({ role: 'participant' }).sort({ teamId: -1 });
  if (teams.length === 0) return 'TEAM001';
  const nums = teams
    .map(t => parseInt(t.teamId.replace('TEAM', ''), 10))
    .filter(n => !isNaN(n));
  const max = Math.max(...nums, 0);
  return `TEAM${String(max + 1).padStart(3, '0')}`;
}

/**
 * Generate a random 8-character password.
 */
function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pass = '';
  for (let i = 0; i < 8; i++) pass += chars[Math.floor(Math.random() * chars.length)];
  return pass;
}

/**
 * Import teams from a CSV buffer.
 * Expected columns: teamName, member1, member2, member3
 * @param {Buffer} csvBuffer
 * @returns {Array} created teams with plain passwords
 */
async function importFromCSV(csvBuffer) {
  const csvContent = csvBuffer.toString('utf-8');

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

    const user = new User({
      teamId,
      teamName,
      members,
      password: hashedPassword,
      role: 'participant',
    });
    await user.save();
    created.push({ teamId, teamName, password: plainPassword, members });
  }
  return created;
}

module.exports = { importFromCSV, generateTeamId, generatePassword };
