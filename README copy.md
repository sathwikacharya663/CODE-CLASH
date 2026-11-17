# ⚡ CODE VOLT — College Coding Competition Platform

## Overview
CODE VOLT is a full-stack web application for running college coding competitions with 3 rounds:
- **Round 1**: Code Replication (30 min)
- **Round 2**: Code Debugging (30 min)  
- **Round 3**: Coding from Scratch (60 min, top 10 teams only)

## Prize Pool: Rs. 4,000
- 🥇 1st Place: Rs. 2,500
- 🥈 2nd Place: Rs. 1,500

## Tech Stack
- **Frontend**: React 18 (Vite) + Tailwind CSS + Monaco Editor
- **Backend**: Node.js + Express + Socket.IO + MongoDB
- **Code Execution**: Piston API (self-hosted or public)
- **Auth**: JWT + bcrypt

## Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or pnpm

## Quick Start (Local Development)

### 1. Clone / Download
```bash
# Navigate to the project directory
cd CODE-VOLT
```

### 2. Backend Setup
```bash
cd server
cp .env.example .env
# Edit .env: set MONGODB_URI, JWT_SECRET
npm install
npm run seed    # Creates admin + 5 sample teams + questions
npm run dev     # Starts on port 5000
```

### 3. Frontend Setup (new terminal)
```bash
cd client
cp .env.example .env
npm install
npm run dev     # Starts on port 5173
```

### 4. Access
- **Participant/Admin Login**: http://localhost:5173
- **Admin credentials**: Team ID: `ADMIN`, Password: `admin123`
- **Sample team**: Team ID: `TEAM001`, Password: `password123`

## Default Credentials

| Role | Team ID | Password |
|------|---------|----------|
| Admin | ADMIN | admin123 |
| Team Alpha | TEAM001 | password123 |
| Team Beta | TEAM002 | password123 |
| Team Gamma | TEAM003 | password123 |
| Team Delta | TEAM004 | password123 |
| Team Epsilon | TEAM005 | password123 |

## Environment Variables

### server/.env
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/codevolt
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
CLIENT_URL=http://localhost:5173
PISTON_API_URL=https://emkc.org/api/v2/piston
NODE_ENV=development
```

### client/.env
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

## Competition Flow (Admin Guide)

### Before the Event
1. Log in as Admin
2. Go to **Teams** tab → Import CSV or add teams manually
3. Go to **Questions** tab → Review/edit questions per round
4. Test login with a sample team account

### During Round 1
1. Go to **Round Control** → Click **Unlock Round 1**
2. Timer starts (30 minutes), all teams can now see Round 1 questions
3. Monitor the **Overview** tab for team activity
4. At end: timer auto-ends, or click **End Round 1**

### Between Rounds
1. Click **Select Top 10** to pick top teams for Round 3
2. Use manual override if needed for ties
3. Other teams see "Eliminated" message

### Round 2 & 3
- Same flow, unlock when ready
- Round 2 auto-loads buggy code for each language
- Round 3: only top 10 teams can participate

### After Competition
1. Go to **Leaderboard** → Export CSV/PDF
2. Click **Reveal Winners** for celebration screen
3. Winners get Rs. 2,500 (1st) and Rs. 1,500 (2nd)

## LAN Deployment (College Wi-Fi)

### Option A: Run on a Laptop (Recommended)
```bash
# Find your laptop's LAN IP (Windows)
ipconfig
# Look for IPv4 Address (e.g., 192.168.1.100)

# Update server/.env
CLIENT_URL=http://192.168.1.100:5173

# Update client/.env
VITE_API_URL=http://192.168.1.100:5000
VITE_SOCKET_URL=http://192.168.1.100:5000

# Start server (accessible on LAN)
cd server && node server.js

# Start client (accessible on LAN)
cd client && npx vite --host 0.0.0.0
```
Teams connect via: `http://192.168.1.100:5173`

### Option B: Docker Compose
```bash
docker-compose up -d
```

## Security Notes
- Change JWT_SECRET before production
- Hash all passwords (already done by seed)
- One session per team (second login logs out first)
- Code runs in sandboxed Piston environment

## Code Execution
Uses Piston API for safe sandboxed execution:
- Supported: Python 3, C (gcc), C++ (g++), Java
- Time limit: 5 seconds per test case
- Memory: Limited by Piston sandbox
- No network/filesystem access inside sandbox

## Troubleshooting

### MongoDB not connecting
```bash
# Start MongoDB service
net start MongoDB  # Windows
# or
mongod --dbpath C:\data\db  # Manual start
```

### Port already in use
```bash
# Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Code execution failing
- Check if Piston API is reachable: https://emkc.org/api/v2/piston/runtimes
- The public Piston API may have rate limits; consider self-hosting

## Folder Structure
```
CODE-VOLT/
├── server/              # Node.js backend
│   ├── config/         # DB and constants
│   ├── models/         # Mongoose schemas
│   ├── routes/         # Express routes
│   ├── middleware/      # Auth, rate limiting
│   ├── socket/         # Socket.IO events
│   ├── services/       # Business logic
│   ├── utils/          # Helpers
│   └── seed/           # Seed data script
├── client/             # React frontend
│   └── src/
│       ├── api/        # Axios API calls
│       ├── context/    # React context
│       ├── hooks/      # Custom hooks
│       ├── components/ # UI components
│       └── pages/      # Route pages
└── docker-compose.yml   # Docker setup
```
