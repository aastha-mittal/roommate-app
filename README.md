# Roommate Match

A Tinder-style roommate matching web app for college students (initially CMU). Find roommates based on housing preferences, lifestyle, and dealbreakers—then chat after a mutual match.

## Features

- **Structured onboarding** — Housing (on/off campus, areas, budget, lease), lifestyle (sleep, cleanliness, guests, noise, smoking, pets), personality, and roommate preference strength + dealbreakers
- **Compatibility engine** — Dealbreaker filtering + weighted soft scoring; location and housing overlap boost
- **Swipe interface** — Like / pass with smooth animations; mutual likes create a match
- **Chat** — Unlocked after mutual match; real-time messaging via WebSocket + REST persistence
- **Profile dashboard** — View and edit preferences; re-use onboarding flow to update

## Tech stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite, React Router, Socket.IO client
- **Backend:** Node.js, Express, TypeScript, JWT auth
- **Database:** PostgreSQL with Prisma (migrations, seed, type-safe client)
- **Real-time:** Socket.IO for chat

## Prerequisites

- Node.js 18+
- PostgreSQL (local or hosted)

## Setup

### 1. Install dependencies

```bash
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 2. Database

Create a PostgreSQL database and set its URL in `backend/.env`:

```bash
cp backend/.env.example backend/.env
# Edit backend/.env: set DATABASE_URL, JWT_SECRET (e.g. a long random string)
```

Run migrations and seed:

```bash
npm run db:migrate   # from repo root (runs backend migration)
npm run db:seed      # seeds sample users: alice@cmu.edu, bob@cmu.edu, etc. — password: password123
```

### 3. Run the app

From repo root:

```bash
npm run dev
```

This starts:

- **Backend** at http://localhost:3001 (API + Socket.IO at path `/ws`)
- **Frontend** at http://localhost:5173 (proxies `/api` and `/ws` to backend)

Open http://localhost:5173 in a browser. Register a new account or log in as `alice@cmu.edu` / `password123`, complete onboarding, then use Swipe and Matches/Chat.

## Project structure

```
frontend/          # React + TypeScript + Tailwind
backend/           # Express API, auth, matching, chat socket
  prisma/          # Schema, migrations, seed
  src/
    matching-engine/  # Compatibility scoring + dealbreaker logic
    chat/             # Socket.IO server for real-time messages
database/          # Schema docs (Prisma lives in backend/prisma)
```

## API overview

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/profile`, `PATCH /api/profile`, `POST /api/profile/onboarding-complete`
- `GET /api/match/candidates`, `POST /api/match/like/:userId`, `POST /api/match/pass/:userId`, `GET /api/match`
- `GET /api/chat/matches/:matchId/messages`, `POST /api/chat/matches/:matchId/messages`

Socket.IO: connect with `path: "/ws"` and `auth: { token: "<jwt>" }`; emit `message:send` with `{ matchId, body }`; listen for `message:new`.

## License

Private — all rights reserved.
