require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Question = require('../models/Question');
const RoundState = require('../models/RoundState');
const Submission = require('../models/Submission');
const ActivityLog = require('../models/ActivityLog');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/codeclash';

async function seed() {
  try {
    console.log('Connecting to MongoDB at:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    console.log('Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Question.deleteMany({}),
      RoundState.deleteMany({}),
      Submission.deleteMany({}),
      ActivityLog.deleteMany({}),
    ]);

    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const teamPasswordHash = await bcrypt.hash('password123', 10);

    console.log('Creating Admin & Teams...');
    const users = [
      {
        teamId: 'ADMIN',
        teamName: 'System Administrator',
        password: adminPasswordHash,
        members: ['Administrator'],
        role: 'admin',
      },
      {
        teamId: 'TEAM001',
        teamName: 'Team Alpha',
        password: teamPasswordHash,
        members: ['Alice Johnson', 'Bob Smith', 'Charlie Lee'],
        role: 'participant',
      },
      {
        teamId: 'TEAM002',
        teamName: 'Team Beta',
        password: teamPasswordHash,
        members: ['David Miller', 'Eve Adams'],
        role: 'participant',
      },
      {
        teamId: 'TEAM003',
        teamName: 'Team Gamma',
        password: teamPasswordHash,
        members: ['Frank Wright', 'Grace Hopper', 'Henry Ford'],
        role: 'participant',
      },
      {
        teamId: 'TEAM004',
        teamName: 'Team Delta',
        password: teamPasswordHash,
        members: ['Ivy Chen', 'Jack Ryan'],
        role: 'participant',
      },
      {
        teamId: 'TEAM005',
        teamName: 'Team Epsilon',
        password: teamPasswordHash,
        members: ['Kate Bush', 'Leo Messi', 'Mia Wong'],
        role: 'participant',
      },
    ];
    await User.insertMany(users);
    console.log(`Created ${users.length} users.`);

    console.log('Creating Round States...');
    const roundStates = [
      { round: 1, status: 'locked', durationMinutes: 30, totalPausedMs: 0, qualifiedTeams: [] },
      { round: 2, status: 'locked', durationMinutes: 30, totalPausedMs: 0, qualifiedTeams: [] },
      { round: 3, status: 'locked', durationMinutes: 60, totalPausedMs: 0, qualifiedTeams: [] },
    ];
    await RoundState.insertMany(roundStates);
    console.log('Initialized Round States (1, 2, 3 all locked).');

    console.log('Creating Questions...');
    const questions = [

      // ================= Round 1: Code Replication =================
      // NOTE: No starterCode — the editor starts empty. Participants write everything themselves.
      {
        round: 1,
        order: 1,
        title: 'Star Triangle Pattern',
        description:
          'Given an integer N as input, print a right-angled triangle pattern of asterisks (*) with N rows. Each row i (1 <= i <= N) should contain exactly i asterisks with no trailing spaces.',
        inputFormat: 'A single integer N.',
        outputFormat: 'N lines containing asterisks forming a right-angled triangle.',
        constraints: '1 <= N <= 20',
        sampleInput: '5',
        sampleOutput: '*\n**\n***\n****\n*****',
        expectedOutput: '*\n**\n***\n****\n*****',
        testCases: [
          { input: '3', expectedOutput: '*\n**\n***', points: 30 },
          { input: '5', expectedOutput: '*\n**\n***\n****\n*****', points: 40 },
          { input: '1', expectedOutput: '*', points: 30 },
        ],
        totalPoints: 100,
        timeBonusEnabled: true,
        penaltyPerWrongSubmission: 5,
      },
      {
        round: 1,
        order: 2,
        title: 'Number Pyramid Pattern',
        description:
          'Given an integer N as input, print a pyramid where the i-th row contains the number i repeated i times with no spaces between digits.',
        inputFormat: 'A single integer N.',
        outputFormat: 'N lines of numbers according to the pattern.',
        constraints: '1 <= N <= 9',
        sampleInput: '4',
        sampleOutput: '1\n22\n333\n4444',
        expectedOutput: '1\n22\n333\n4444',
        testCases: [
          { input: '3', expectedOutput: '1\n22\n333', points: 40 },
          { input: '4', expectedOutput: '1\n22\n333\n4444', points: 60 },
          { input: '1', expectedOutput: '1', points: 50 },
        ],
        totalPoints: 150,
        timeBonusEnabled: true,
        penaltyPerWrongSubmission: 5,
      },

      // ================= Round 2: Code Debugging =================
      // NOTE: buggyCode is clean — no comments, no hints about the bug location.
      {
        round: 2,
        order: 1,
        title: 'Fix the Fibonacci Generator',
        description:
          'The program below is supposed to compute the N-th Fibonacci number where F(1)=1, F(2)=1, F(3)=2, F(4)=3, F(5)=5, F(6)=8. It currently produces wrong output for most inputs. Find and fix the bug.',
        inputFormat: 'A single positive integer N.',
        outputFormat: 'The N-th Fibonacci number.',
        constraints: '1 <= N <= 30',
        sampleInput: '6',
        sampleOutput: '8',
        expectedOutput: '8',
        buggyCode: {
          python: `def fibonacci(n):
    if n <= 0:
        return 0
    if n == 1:
        return 1
    a, b = 0, 1
    for i in range(n - 2):
        a, b = b, a + b
    return b

n = int(input())
print(fibonacci(n))
`,
          c: `#include <stdio.h>
int fibonacci(int n) {
    if (n <= 0) return 0;
    if (n == 1) return 1;
    int a = 0, b = 1;
    for (int i = 0; i < n - 2; i++) {
        int t = a + b;
        a = b;
        b = t;
    }
    return b;
}

int main() {
    int n;
    if (scanf("%d", &n) == 1) {
        printf("%d\\n", fibonacci(n));
    }
    return 0;
}
`,
          cpp: `#include <iostream>
using namespace std;

int fibonacci(int n) {
    if (n <= 0) return 0;
    if (n == 1) return 1;
    int a = 0, b = 1;
    for (int i = 0; i < n - 2; i++) {
        int t = a + b;
        a = b;
        b = t;
    }
    return b;
}

int main() {
    int n;
    if (cin >> n) {
        cout << fibonacci(n) << "\\n";
    }
    return 0;
}
`,
          java: `import java.util.Scanner;

public class Solution {
    public static int fibonacci(int n) {
        if (n <= 0) return 0;
        if (n == 1) return 1;
        int a = 0, b = 1;
        for (int i = 0; i < n - 2; i++) {
            int t = a + b;
            a = b;
            b = t;
        }
        return b;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) {
            int n = sc.nextInt();
            System.out.println(fibonacci(n));
        }
    }
}
`,
        },
        testCases: [
          { input: '1', expectedOutput: '1', points: 60 },
          { input: '6', expectedOutput: '8', points: 70 },
          { input: '10', expectedOutput: '55', points: 70 },
        ],
        totalPoints: 200,
        timeBonusEnabled: true,
        penaltyPerWrongSubmission: 10,
      },
      {
        round: 2,
        order: 2,
        title: 'Fix the Factorial Function',
        description:
          'The program below is supposed to compute N! (the factorial of N). It currently produces wrong output for certain input values. Find and fix the bug.',
        inputFormat: 'A single non-negative integer N.',
        outputFormat: 'The factorial value of N.',
        constraints: '0 <= N <= 12',
        sampleInput: '5',
        sampleOutput: '120',
        expectedOutput: '120',
        buggyCode: {
          python: `def factorial(n):
    if n == 1:
        return 1
    return n * factorial(n - 1)

n = int(input())
print(factorial(n))
`,
          c: `#include <stdio.h>
long long factorial(int n) {
    if (n == 1) return 1;
    return n * factorial(n - 1);
}

int main() {
    int n;
    if (scanf("%d", &n) == 1) {
        printf("%lld\\n", factorial(n));
    }
    return 0;
}
`,
          cpp: `#include <iostream>
using namespace std;

long long factorial(int n) {
    if (n == 1) return 1;
    return n * factorial(n - 1);
}

int main() {
    int n;
    if (cin >> n) {
        cout << factorial(n) << "\\n";
    }
    return 0;
}
`,
          java: `import java.util.Scanner;

public class Solution {
    public static long factorial(int n) {
        if (n == 1) return 1;
        return n * factorial(n - 1);
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) {
            int n = sc.nextInt();
            System.out.println(factorial(n));
        }
    }
}
`,
        },
        testCases: [
          { input: '0', expectedOutput: '1', points: 60 },
          { input: '5', expectedOutput: '120', points: 70 },
          { input: '10', expectedOutput: '3628800', points: 70 },
        ],
        totalPoints: 200,
        timeBonusEnabled: true,
        penaltyPerWrongSubmission: 10,
      },

      // ================= Round 3: Coding from Scratch =================
      // NOTE: No starterCode — the editor starts empty. Participants write everything themselves.
      {
        round: 3,
        order: 1,
        title: 'Two Sum Target Indices',
        description:
          'Given an array of integers and an integer target, return the 1-based indices of the two numbers such that they add up to target. You may assume each input has exactly one solution, and you may not use the same element twice. Output the two indices separated by a single space, smaller index first.',
        inputFormat:
          'First line: integer N (array size)\nSecond line: N space-separated integers\nThird line: integer target',
        outputFormat: 'Two 1-based indices separated by a space.',
        constraints: '2 <= N <= 10^4\n-10^9 <= nums[i], target <= 10^9',
        sampleInput: '4\n2 7 11 15\n9',
        sampleOutput: '1 2',
        expectedOutput: '1 2',
        testCases: [
          { input: '4\n2 7 11 15\n9', expectedOutput: '1 2', points: 50 },
          { input: '3\n3 2 4\n6', expectedOutput: '2 3', points: 50 },
          { input: '2\n3 3\n6', expectedOutput: '1 2', points: 50 },
        ],
        totalPoints: 150,
        timeBonusEnabled: true,
        penaltyPerWrongSubmission: 5,
      },
      {
        round: 3,
        order: 2,
        title: 'Palindrome Validator',
        description:
          'Write a program to determine if an input string is a valid palindrome. A string is considered a palindrome if it reads the same forward and backward. The check should be case-sensitive. Print "YES" if it is a palindrome, or "NO" otherwise.',
        inputFormat: 'A single non-empty word/string S without whitespace.',
        outputFormat: '"YES" or "NO" (without quotes).',
        constraints: '1 <= length(S) <= 10^5',
        sampleInput: 'racecar',
        sampleOutput: 'YES',
        expectedOutput: 'YES',
        testCases: [
          { input: 'racecar', expectedOutput: 'YES', points: 50 },
          { input: 'hello', expectedOutput: 'NO', points: 50 },
          { input: 'madam', expectedOutput: 'YES', points: 50 },
        ],
        totalPoints: 150,
        timeBonusEnabled: true,
        penaltyPerWrongSubmission: 5,
      },
    ];

    await Question.insertMany(questions);
    console.log(`Created ${questions.length} sample competition questions.`);

    console.log('\n===========================================');
    console.log('✅ SEED COMPLETED SUCCESSFULLY');
    console.log('Admin login: ADMIN / admin123');
    console.log('Sample team login: TEAM001 / password123');
    console.log('===========================================\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error during seeding:', err);
    process.exit(1);
  }
}

seed();
