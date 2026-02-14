# Database

PostgreSQL schema is managed by Prisma in `backend/prisma/`.

## Entities

- **User** — Auth (email, password hash). One-to-one with Profile.
- **Profile** — Onboarding + housing, lifestyle, personality, bio. One-to-many Preferences.
- **Preference** — Category, value, strength (1–10), dealbreaker flag.
- **Like** — User A likes User B (swipe right). Mutual likes create a Match.
- **Match** — Mutual like; required for chat.
- **Message** — Chat messages within a match.

## Migrations

From repo root:

```bash
npm run db:migrate   # create/apply migrations
npm run db:seed     # seed sample users
npm run db:studio   # Prisma Studio UI
```

## Indexes

Indexes on: `profileId`, `category`, `likerId`, `likedId`, `matchId`, `senderId`, `receiverId`, and `(matchId, createdAt)` for fast chat queries.
