# Scaling (10k–20k users)

This app is designed for a **single-university cohort** (CMU) with up to roughly **20,000** registered students, not global scale.

## Database

| Environment | Recommendation |
|-------------|----------------|
| Local dev | SQLite (`file:./dev.db`) — fine for demos |
| Production | **PostgreSQL** with connection pooling (PgBouncer or Prisma + pool URL) |

Indexes on `Profile` (`housingType`, `isFirstYear`, `onboardingComplete`, `userId`) and foreign keys on `Like`, `Pass`, `Match` support cohort queries.

## Match candidate discovery

`GET /api/match/candidates` does **not** score every profile in the database:

1. Filter to the user's **cohort** (on-campus + same first-year flag, or off-campus).
2. Exclude self, prior likes/passes, and existing matches.
3. `count` the cohort, then `skip` + `take` a **random sample** (~64 profiles).
4. Score only that sample, filter dealbreakers, sort by compatibility, return top N (default 20).

At 20k users with ~5k per cohort, each request touches O(64) rows for scoring instead of O(5000).

For even larger cohorts, consider:

- Precomputed compatibility buckets (Redis)
- Background nightly “suggested” lists per user
- Cursor-based pagination with seeded random offsets per session

## API protection

- `express-rate-limit` on `/api/auth/*` (100 requests / 15 min per IP)
- JWT on all protected routes
- Validate `limit` query caps (max 50 candidates per request)

## Realtime chat (Socket.IO)

Single Node process is fine for moderate traffic. For **multiple API instances**:

- Use the **Redis adapter** for Socket.IO
- Sticky sessions on the load balancer, or Redis pub/sub for cross-node events

## Operational checklist

- [ ] PostgreSQL in production with backups
- [ ] Strong `JWT_SECRET`, SAML keys in secrets manager (not git)
- [ ] `FRONTEND_URL` and `CMU_SAML_CALLBACK_URL` match deployed URLs
- [ ] Horizontal scale only after Redis adapter + shared DB
- [ ] Monitor slow queries on `Profile` cohort `count` / `findMany`
