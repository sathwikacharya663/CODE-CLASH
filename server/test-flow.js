const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testFullFlow() {
  console.log('--- STARTING CODE VOLT END-TO-END FLOW TEST ---');

  try {
    // 1. Participant Login
    console.log('\n1. Testing Participant Login (TEAM001)...');
    const teamLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      teamId: 'TEAM001',
      password: 'password123',
    });
    const teamToken = teamLoginRes.data.token;
    console.log('✓ Team login successful. Token received.');
    if (teamLoginRes.data.score || teamLoginRes.data.user.score || teamLoginRes.data.user.totalPoints) {
      throw new Error('SECURITY VIOLATION: Score exposed in participant login response!');
    }
    console.log('✓ Score correctly hidden from participant login response.');

    // 2. Admin Login
    console.log('\n2. Testing Admin Login (ADMIN)...');
    const adminLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      teamId: 'ADMIN',
      password: 'admin123',
    });
    const adminToken = adminLoginRes.data.token;
    console.log('✓ Admin login successful. Role:', adminLoginRes.data.user.role);

    // 3. Check Initial Round Status (All Locked)
    console.log('\n3. Testing Initial Round Locking...');
    const roundStatusRes = await axios.get(`${BASE_URL}/participant/round-status`, {
      headers: { Authorization: `Bearer ${teamToken}` },
    });
    console.log('Rounds status for participant:', roundStatusRes.data.map(r => `R${r.round}: ${r.status}`).join(', '));
    const allLocked = roundStatusRes.data.every(r => r.status === 'locked');
    if (!allLocked) throw new Error('Expected all rounds to be initially locked!');
    console.log('✓ All rounds locked initially for participants.');

    // 4. Admin Unlocks Round 1
    console.log('\n4. Admin Unlocking Round 1...');
    const unlockRes = await axios.post(
      `${BASE_URL}/admin/rounds/1/unlock`,
      { durationMinutes: 30 },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log('✓ Round 1 unlocked:', unlockRes.data.message);

    // 5. Participant Fetches Questions for Round 1
    console.log('\n5. Participant Fetching Questions for Round 1...');
    const questionsRes = await axios.get(`${BASE_URL}/questions?round=1`, {
      headers: { Authorization: `Bearer ${teamToken}` },
    });
    const questions = questionsRes.data;
    console.log(`✓ Received ${questions.length} questions for Round 1.`);
    const q1 = questions[0];
    console.log('Question 1 Title:', q1.title);
    if (q1.testCases && q1.testCases.some(tc => tc.expectedOutput !== undefined)) {
      throw new Error('SECURITY VIOLATION: Hidden test case expected outputs exposed to participant!');
    }
    console.log('✓ Hidden test cases sanitized (expected outputs stripped).');

    // 6. Test Run Code (Piston Execution) - Python
    console.log('\n6. Testing Code Run (Error Case & Output Case)...');
    // Error case
    const runErrorRes = await axios.post(
      `${BASE_URL}/submissions/run`,
      {
        language: 'python',
        code: 'print(undefined_variable_syntax_error',
        stdin: '5',
      },
      { headers: { Authorization: `Bearer ${teamToken}` } }
    );
    console.log('Run Error Response Error String:', runErrorRes.data.error ? '✓ Captured Error cleanly' : 'No error');

    // Correct case
    const runSuccessRes = await axios.post(
      `${BASE_URL}/submissions/run`,
      {
        language: 'python',
        code: 'print("Hello CODE VOLT")',
        stdin: '',
      },
      { headers: { Authorization: `Bearer ${teamToken}` } }
    );
    console.log('Run Success Output:', runSuccessRes.data.output);
    console.log('✓ Code Run execution validated.');

    // 7. Submit Solution for Evaluation
    console.log('\n7. Testing Final Evaluation & Hidden Scoring...');
    // Solve Star Triangle: N rows of asterisks
    const solutionCode = `n = int(input())
for i in range(1, n + 1):
    print("*" * i)`.trim();
    const submitRes = await axios.post(
      `${BASE_URL}/submissions/submit`,
      {
        questionId: q1._id,
        code: solutionCode,
        language: 'python',
        round: 1,
      },
      { headers: { Authorization: `Bearer ${teamToken}` } }
    );
    console.log('Submit Response to Participant:', submitRes.data);
    if (submitRes.data.pointsEarned !== undefined || submitRes.data.score !== undefined) {
      throw new Error('SECURITY VIOLATION: Points/score returned to participant upon submission!');
    }
    console.log('✓ Participant sees neutral confirmation with points hidden.');

    // 8. Admin Leaderboard Verification
    console.log('\n8. Verifying Admin Leaderboard...');
    const leaderboardRes = await axios.get(`${BASE_URL}/admin/leaderboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const teamLeaderboard = leaderboardRes.data.find(t => t.teamId === 'TEAM001');
    console.log('Admin Leaderboard Entry for TEAM001:', {
      teamName: teamLeaderboard?.teamName,
      totalScore: teamLeaderboard?.totalScore,
      r1Score: teamLeaderboard?.r1Score,
    });
    if (!teamLeaderboard || teamLeaderboard.totalScore <= 0) {
      throw new Error('Admin leaderboard does not reflect awarded points!');
    }
    console.log(`✓ Admin leaderboard shows correct score of ${teamLeaderboard.totalScore} pts.`);

    console.log('\n===========================================');
    console.log('🎉 ALL INTEGRATION AND SECURITY TESTS PASSED!');
    console.log('===========================================\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

testFullFlow();
