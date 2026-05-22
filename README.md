# Roommate Match

A production-style web app for **CMU students** to find compatible roommates: Tinder-style discovery, a real compatibility engine, and chat only after a mutual match. Housing logic reflects **on-campus vs off-campus** paths — including **dorm ranking** for residence halls and **budget / neighborhood** matching for Pittsburgh areas near campus.

## Features

- **CMU official login** — Shibboleth SAML via [CMU Web Login](https://login.cmu.edu). Run `cd backend && npm run saml:setup`, set `CMU_SAML_ENABLED=true`, then register with IT: [docs/CMU_IT_REGISTRATION.md](docs/CMU_IT_REGISTRATION.md). Dev password fallback: `AUTH_DEV_PASSWORD=true`. See [docs/CMU_SSO.md](docs/CMU_SSO.md).
- **Scale-ready matching** — random cohort sampling (not full-table scans) for 10k–20k users. See [docs/SCALING.md](docs/SCALING.md).
- **Adaptive onboarding** — first-year vs upperclass dorm lists, drag-and-drop dorm ranking, off-campus neighborhoods (Shadyside, Squirrel Hill, Oakland, …), room-style and lifestyle questions, dealbreakers
- **Matching engine** — cohort filters (housing type + first-year flag), dealbreakers, weighted score with natural-language explanations
- **Swipe UI** — animated cards, no duplicate candidates in a batch, mutual like → match
- **Chat** — Socket.IO realtime + REST-persisted messages, read receipts on messages
- **Profile** — dashboard + reuse onboarding to edit preferences

## Tech stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite, React Router, Socket.IO client, `@dnd-kit` for dorm ordering
- **Backend:** Node.js, Express, TypeScript, JWT, Socket.IO
- **Database:** Prisma with **SQLite** for local dev (no install) or **PostgreSQL** in production / Docker

## Prerequisites

- Node.js 18+
- Nothing else for a quick start — SQLite is the default (`backend/.env` → `DATABASE_URL="file:./dev.db"`)

## Setup

### 1. Install dependencies

```bash
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 2. Database

```bash
cp backend/.env.example backend/.env
# Default uses SQLite at backend/prisma/dev.db — no Postgres required.
```

Apply migrations and seed sample CMU accounts:

```bash
cd backend && npx prisma migrate deploy && npx prisma generate && npm run db:seed
```

**PostgreSQL instead (optional):** Install Postgres or run `npm run db:up` (Docker) using `docker-compose.yml`, then set `DATABASE_URL` in `backend/.env` to your Postgres URL (see `backend/.env.example` comments). Run the same migrate + seed commands.

(Use `npm run db:migrate` in `backend` when authoring new migrations interactively.)

### 3. Run the app

From the repo root:

```bash
npm run dev
```

- **Web app (open this in the browser):** http://localhost:5173 — proxies `/api` and `/ws` to the backend
- **API + WebSocket:** http://localhost:3001 — if you open this in a browser, you are redirected to the web app; use `/api` and Socket.IO path `/ws` for requests

### 4. Try it

- Open **http://localhost:5173** → **Sign in with CMU** (requires SAML env + CMU IT registration) or, in dev with `AUTH_DEV_PASSWORD=true`, use **`alice@cmu.edu`** / **`password123`** (and other seeded users).
- First-year on-campus cohort: **`carol@cmu.edu`**, **`dave@cmu.edu`**. Off-campus: **`alice@cmu.edu`**, **`bob@cmu.edu`**, **`eve@cmu.edu`**.

## Project structure

```
frontend/           # React SPA
backend/
  prisma/           # Schema, migrations, seed
  src/
    config/housing.ts    # CMU dorms & neighborhoods (edit here)
    matching-engine/     # Compatibility + explanations
    routes/              # REST API
    chat/                # Socket.IO
docs/ARCHITECTURE.md     # Design: API, matching, sockets, onboarding
docs/CMU_SSO.md          # Official CMU login setup
docs/SCALING.md          # 10k–20k user notes
```

## API overview

- `GET /api/auth/config`, `GET /api/auth/cmu/login`, `POST /api/auth/cmu/callback`, `GET /api/auth/me`
- Dev only: `POST /api/auth/register`, `POST /api/auth/login` (when `AUTH_DEV_PASSWORD=true`)
- `GET /api/housing/options` — dorm/neighborhood config for the UI
- `GET/PATCH /api/profile`, `POST /api/profile/onboarding-complete`
- `GET /api/match/candidates`, `POST /api/match/like/:userId`, `POST /api/match/pass/:userId`, `GET /api/match`
- `GET/POST /api/chat/matches/:matchId/messages`

**Socket.IO:** connect with `path: "/ws"` and `auth: { token: "<jwt>" }`; emit `message:send` with `{ matchId, body }`; listen for `message:new`.

## Troubleshooting

- **Blank page or endless spinner** — Open the **Vite** URL: [http://localhost:5173](http://localhost:5173), not only the API port. From the repo root run `npm run dev` so **both** the backend (3001) and frontend (5173) start. If `/api/auth/me` hangs (often a bad `DATABASE_URL` or Postgres not running), startup auth now **times out after 12s** and sends you to login; fix the DB and restart the backend.
- **Proxy / API errors** — The dev server proxies `/api` and `/ws` to `http://127.0.0.1:3001`. Ensure nothing else uses port 3001 and that the backend log shows `Server running at http://localhost:3001`.
- **“Something went wrong”** — A runtime error is caught by the error boundary; check the browser **console** (F12 → Console) for the stack trace.
- **404 on `/src/main.jsx`** — Your `index.html` should load `main.tsx`. If the browser still requests `main.jsx`, it is usually **cached HTML** from an old build; do a hard refresh (⌘⇧R / Ctrl+Shift+R) or clear site data for `localhost:5173`. A small `main.jsx` shim is included so either entry works.
- **Login failed: Can’t reach database server at `localhost:5432`** — You pointed `DATABASE_URL` at Postgres but the server is not running. Either start Postgres / Docker (`npm run db:up`) or switch back to SQLite: `DATABASE_URL="file:./dev.db"` in `backend/.env`, then `cd backend && npx prisma migrate deploy && npm run db:seed`.

## License

Private — all rights reserved.
