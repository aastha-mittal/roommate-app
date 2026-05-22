# Roommate Match — architecture

## 1. Architecture

- **Clients:** React 18 SPA (Vite) talks to Express over HTTP (`/api`) and WebSocket (`/ws` for Socket.IO chat). JWT is stored in `localStorage` and sent as `Authorization: Bearer`.
- **Server:** Express handles REST; `http.Server` is shared with Socket.IO for real-time chat after match.
- **Data:** Prisma. Local dev uses **SQLite** (`file:./dev.db`); production typically uses **PostgreSQL**. Arrays (dorm ids, neighborhood ids, tags) are stored as JSON strings for portability.
- **Config:** CMU housing lists (first-year dorms, upperclass dorms, neighborhoods, room styles) live in `backend/src/config/housing.ts` so ops can update copy and validation in one place.
- **Boundaries:** Auth routes → user/session concerns; profile routes → onboarding + preferences; match routes → candidate discovery + likes; chat routes → persisted messages; housing route → read-only config for adaptive UI.

## 2. Database schema

- **User:** `email` (unique), `passwordHash`, timestamps.
- **Profile:** `displayName`, `schoolYear`, `isFirstYear`, `housingType` (`ON_CAMPUS` | `OFF_CAMPUS`), JSON strings for `dormRanking`, `preferredAreas`, `roomStylePreferences`, lifestyle enums/ints, `offCampusRoomType`, `bio`, `avatarUrl`, `onboardingComplete`.
- **Preference:** Normalized rows per category (`CLEANLINESS`, `SLEEP_SCHEDULE`, … `BUDGET`, `ROOM_STYLE`) with `strength` 1–10 and `dealbreaker`. Values are synced from structured profile fields on PATCH so dealbreaker checks use real answers, not stale strings.
- **Like / Pass / Match / Message:** Standard swipe + mutual match + threaded messages with `read` flag.

## 3. Dynamic onboarding logic

- **Flow:** Basics (name, year, first-year flag, on/off campus, bio, optional photo) → **housing branch** → lifestyle → personality → dealbreakers.
- **On-campus:** API `GET /api/housing/options?firstYear=&housingType=ON_CAMPUS` returns the allowed dorm list; first-years only see first-year buildings. User ranks dorms via drag-and-drop; selects room-style chips. No neighborhood or “distance from campus” questions.
- **Off-campus:** Same endpoint with `OFF_CAMPUS` loads neighborhoods (Shadyside, Squirrel Hill, Oakland, etc.), budget, lease, move-in, and off-campus room type. Budget + neighborhood drive matching.
- **Server validation:** `validateDormRanking` rejects ids outside the cohort list or duplicates.

## 4. API contract (selected)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/auth/register`, `/api/auth/login` | CMU email + password; returns JWT |
| GET | `/api/auth/me` | Current user + onboarding flag |
| GET | `/api/housing/options` | Config for onboarding UI |
| GET/PATCH | `/api/profile` | Load/update profile + preferences |
| POST | `/api/profile/onboarding-complete` | Flip `onboardingComplete` |
| GET | `/api/match/candidates` | Scored, filtered swipe deck |
| POST | `/api/match/like/:userId`, `/api/match/pass/:userId` | Swipe actions |
| GET | `/api/match` | Matches + compatibility summary |
| GET/POST | `/api/chat/matches/:matchId/messages` | History + send (REST); Socket.IO for realtime |

## 5. Matching algorithm design

1. **Cohort filter:** Candidates must match `housingType`. On-campus users must match `isFirstYear` (first-year housing pool vs upperclass pool).
2. **Dealbreakers:** For each category where either user marked `dealbreaker`, enforce alignment using **profile fields** (sleep, guests, noise, smoking, pets, cleanliness gap ≤ 1). Budget dealbreakers apply only when both are off-campus. Room-style dealbreakers require non-empty intersection of selected styles on-campus.
3. **Soft score (0–100):** Weighted blend — on-campus: dorm rank overlap (top-5 overlap and rank distance) + room-style overlap; off-campus: budget overlap + neighborhood overlap + optional same room-type; everyone: lifestyle similarity + preference table strength + personality proximity.
4. **Explanation:** Top distinct reasons (e.g. shared top dorm pick, overlapping neighborhood, similar sleep schedule) returned as string array for cards and match list.

## 6. Frontend structure

- **Pages:** `Login`, `Register`, `Onboarding` (multi-step, branch-aware), `Swipe`, `Matches`, `Chat`, `Dashboard` (profile view).
- **Components:** `Layout`, `SwipeCard`, `DormRankList` (dnd-kit sortable).
- **Context:** `AuthContext` for user + token.
- **API:** `src/api/client.ts` centralizes fetch + types.

## 7. Chat / Socket architecture

- Clients connect to Socket.IO with `path: "/ws"` and `auth: { token }`.
- Server verifies JWT, joins room per `matchId`, broadcasts `message:new` after persisting via Prisma.
- REST `POST /api/chat/.../messages` remains source of truth for history and replay on load.

## 8. Repository layout

```
frontend/          # Vite + React + Tailwind
backend/
  prisma/          # schema, migrations, seed
  src/
    config/        # housing.ts
    routes/        # auth, profile, match, chat, housing
    matching-engine/
    chat/
    lib/           # prisma, profile arrays, preference sync
docs/
  ARCHITECTURE.md
```
