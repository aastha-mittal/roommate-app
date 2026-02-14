import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { compatibilityScore } from "../matching-engine/index.js";

const matchRouter = Router();
matchRouter.use(requireAuth);

// Get candidates for swiping (exclude self, already liked, already passed, and existing matches)
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

  const excludeIds = new Set([userId, ...likedIds, ...passedIds, ...matchUserIds]);
  const candidates = await prisma.profile.findMany({
    where: {
      userId: { notIn: [...excludeIds] },
      onboardingComplete: true,
    },
    include: {
      user: { select: { id: true, email: true } },
      preferences: true,
    },
    take: limit * 3,
  });

  const withScore = candidates.map((c) => {
    const result = compatibilityScore(profile as Parameters<typeof compatibilityScore>[0], c as Parameters<typeof compatibilityScore>[1]);
    return {
      profile: c,
      compatibility: result,
    };
  });

  const filtered = withScore.filter((x) => x.compatibility.passedDealbreakers);
  const sorted = filtered.sort((a, b) => b.compatibility.score - a.compatibility.score);
  const slice = sorted.slice(0, limit);

  const payload = slice.map(({ profile: p, compatibility }) => ({
    userId: p.userId,
    email: p.user?.email,
    avatarUrl: p.avatarUrl,
    bio: p.bio,
    tags: p.tags,
    housingType: p.housingType,
    preferredAreas: p.preferredAreas,
    budgetMin: p.budgetMin,
    budgetMax: p.budgetMax,
    sleepSchedule: p.sleepSchedule,
    cleanlinessLevel: p.cleanlinessLevel,
    compatibilityScore: compatibility.score,
    compatibilityExplanation: compatibility.explanation,
  }));

  return res.json({ candidates: payload });
});

// Swipe right = like
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

// Swipe left = pass
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

// List my matches
matchRouter.get("/", async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const matches = await prisma.match.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    include: {
      userA: { select: { id: true, email: true }, include: { profile: { select: { avatarUrl: true, bio: true } } } },
      userB: { select: { id: true, email: true }, include: { profile: { select: { avatarUrl: true, bio: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  const list = matches.map((m) => {
    const other = m.userAId === userId ? m.userB : m.userA;
    return { matchId: m.id, otherUserId: other.id, otherEmail: other.email, otherProfile: other.profile, createdAt: m.createdAt };
  });
  return res.json({ matches: list });
});

export { matchRouter };
