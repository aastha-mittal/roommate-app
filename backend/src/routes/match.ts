import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { compatibilityScore } from "../matching-engine/index.js";
import {
  profileToSwipePayload,
  scorePair,
  toProfileForScore,
} from "../lib/swipeProfilePayload.js";

const matchRouter = Router();
matchRouter.use(requireAuth);

// Get candidates for swiping (exclude self, liked, passed, matches; same housing cohort)
matchRouter.get("/candidates", async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const limit = Math.min(Number(req.query.limit) || 20, 50);

  const [profile, likedIds, passedIds, matchUserIds] = await Promise.all([
    prisma.profile.findUnique({
      where: { userId },
      include: { preferences: true },
    }),
    prisma.like.findMany({ where: { likerId: userId }, select: { likedId: true } }).then((r) => r.map((x) => x.likedId)),
    prisma.pass.findMany({ where: { passerId: userId }, select: { passedId: true } }).then((r) => r.map((x) => x.passedId)),
    prisma.match.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      select: { userAId: true, userBId: true },
    }).then((rows) => rows.flatMap((r) => (r.userAId === userId ? r.userBId : r.userAId))),
  ]);

  if (!profile?.onboardingComplete) {
    return res.status(403).json({ error: "Complete onboarding first" });
  }

  if (!profile.housingType) {
    return res.status(403).json({ error: "Set housing preferences in your profile first" });
  }

  const excludeIds = new Set([userId, ...likedIds, ...passedIds, ...matchUserIds]);

  const cohortWhere =
    profile.housingType === "ON_CAMPUS"
      ? {
          housingType: "ON_CAMPUS" as const,
          isFirstYear: profile.isFirstYear,
        }
      : { housingType: "OFF_CAMPUS" as const };

  const where = {
    userId: { notIn: [...excludeIds] },
    onboardingComplete: true,
    ...cohortWhere,
  };

  /** Scale: score a random sample, not the full user table (10k–20k safe) */
  const SAMPLE_POOL = Math.min(64, Math.max(limit * 3, 40));
  const poolCount = await prisma.profile.count({ where });
  const skip =
    poolCount > SAMPLE_POOL ? Math.floor(Math.random() * (poolCount - SAMPLE_POOL)) : 0;

  const candidates = await prisma.profile.findMany({
    where,
    include: {
      user: { select: { id: true, email: true } },
      preferences: true,
    },
    skip,
    take: SAMPLE_POOL,
  });

  const profileForScore = toProfileForScore(profile);
  if (!profileForScore) return res.status(500).json({ error: "Profile error" });

  const withScore = candidates.map((c) => {
    const cForScore = toProfileForScore(c);
    const result = compatibilityScore(profileForScore, cForScore!);
    return { profile: c, compatibility: result };
  });

  const filtered = withScore.filter((x) => x.compatibility.passedDealbreakers);
  const sorted = filtered.sort((a, b) => b.compatibility.score - a.compatibility.score);
  const slice = sorted.slice(0, limit);

  const payload = slice.map(({ profile: p, compatibility }) =>
    profileToSwipePayload(p, compatibility)
  );

  return res.json({
    candidates: payload,
    meta: { poolSampled: SAMPLE_POOL, cohortSize: poolCount },
  });
});

matchRouter.get("/stats", async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const [likesGiven, passesGiven, matchCount, profile] = await Promise.all([
    prisma.like.count({ where: { likerId: userId } }),
    prisma.pass.count({ where: { passerId: userId } }),
    prisma.match.count({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
    }),
    prisma.profile.findUnique({
      where: { userId },
      select: { onboardingComplete: true, housingType: true, displayName: true },
    }),
  ]);
  return res.json({
    likesGiven,
    passesGiven,
    matchCount,
    onboardingComplete: profile?.onboardingComplete ?? false,
    housingType: profile?.housingType,
    displayName: profile?.displayName,
  });
});

matchRouter.post("/like/:userId", async (req: AuthenticatedRequest, res) => {
  const likerId = req.user!.userId;
  const likedId = req.params.userId;
  if (likerId === likedId) return res.status(400).json({ error: "Cannot like yourself" });

  const [liker, liked] = await Promise.all([
    prisma.user.findUnique({ where: { id: likerId } }),
    prisma.user.findUnique({ where: { id: likedId } }),
  ]);
  if (!liker || !liked) return res.status(404).json({ error: "User not found" });

  const existing = await prisma.like.findUnique({
    where: { likerId_likedId: { likerId, likedId } },
  });
  if (existing) return res.json({ alreadyLiked: true, match: null });

  await prisma.like.create({ data: { likerId, likedId } });

  const mutual = await prisma.like.findUnique({
    where: { likerId_likedId: { likerId: likedId, likedId: likerId } },
  });
  let match = null;
  if (mutual) {
    const [userAId, userBId] = [likerId, likedId].sort();
    match = await prisma.match.create({
      data: { userAId, userBId },
      include: { userA: { select: { id: true, email: true } }, userB: { select: { id: true, email: true } } },
    });
  }

  return res.json({ like: true, match });
});

matchRouter.post("/pass/:userId", async (req: AuthenticatedRequest, res) => {
  const passerId = req.user!.userId;
  const passedId = req.params.userId;
  if (passerId === passedId) return res.status(400).json({ error: "Invalid" });
  await prisma.pass.upsert({
    where: { passerId_passedId: { passerId, passedId } },
    create: { passerId, passedId },
    update: {},
  });
  return res.json({ pass: true });
});

/** People you liked — pending until they like you back; matched ones include matchId */
matchRouter.get("/likes", async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;

  const [likes, matches, myProfile] = await Promise.all([
    prisma.like.findMany({
      where: { likerId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        liked: {
          include: {
            profile: { include: { preferences: true } },
          },
        },
      },
    }),
    prisma.match.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      select: { id: true, userAId: true, userBId: true },
    }),
    prisma.profile.findUnique({
      where: { userId },
      include: { preferences: true },
    }),
  ]);

  const matchByOtherId = new Map<string, string>();
  for (const m of matches) {
    const otherId = m.userAId === userId ? m.userBId : m.userAId;
    matchByOtherId.set(otherId, m.id);
  }

  const list = likes
    .filter((l) => l.liked.profile)
    .map((l) => {
      const p = l.liked.profile!;
      const matchId = matchByOtherId.get(l.likedId) ?? null;
      const compat =
        myProfile && p
          ? scorePair(
              { ...myProfile, preferences: myProfile.preferences },
              { ...p, preferences: p.preferences, user: l.liked }
            )
          : null;
      return {
        likedAt: l.createdAt,
        status: matchId ? ("matched" as const) : ("pending" as const),
        matchId,
        ...profileToSwipePayload(
          { ...p, user: l.liked },
          compat && compat.passedDealbreakers
            ? { score: compat.score, explanation: compat.explanation }
            : undefined
        ),
      };
    });

  return res.json({ likes: list });
});

matchRouter.get("/", async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const matches = await prisma.match.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    include: {
      userA: {
        select: {
          id: true,
          email: true,
          profile: { select: { displayName: true, avatarUrl: true, bio: true, housingType: true } },
        },
      },
      userB: {
        select: {
          id: true,
          email: true,
          profile: { select: { displayName: true, avatarUrl: true, bio: true, housingType: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const myProfile = await prisma.profile.findUnique({
    where: { userId },
    include: { preferences: true },
  });

  const list = await Promise.all(
    matches.map(async (m) => {
      const other = m.userAId === userId ? m.userB : m.userA;
      let compatibilityScoreVal: number | null = null;
      let compatibilityExplanation: string[] = [];
      if (myProfile && other.profile) {
        const a = toProfileForScore({ ...myProfile, preferences: myProfile.preferences });
        const b = await prisma.profile.findUnique({
          where: { userId: other.id },
          include: { preferences: true },
        });
        if (a && b) {
          const bScore = toProfileForScore(b);
          if (bScore) {
            const r = compatibilityScore(a, bScore);
            if (r.passedDealbreakers) {
              compatibilityScoreVal = r.score;
              compatibilityExplanation = r.explanation;
            }
          }
        }
      }
      return {
        matchId: m.id,
        otherUserId: other.id,
        otherEmail: other.email,
        otherProfile: other.profile,
        compatibilityScore: compatibilityScoreVal,
        compatibilityExplanation,
        createdAt: m.createdAt,
      };
    })
  );

  return res.json({ matches: list });
});

export { matchRouter };
