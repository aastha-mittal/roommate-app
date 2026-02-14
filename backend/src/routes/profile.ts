import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";

const profileRouter = Router();

const preferenceSchema = z.object({
  category: z.string(),
  value: z.string(),
  strength: z.number().min(1).max(10).default(5),
  dealbreaker: z.boolean().default(false),
});

const onboardingSchema = z.object({
  housingType: z.enum(["ON_CAMPUS", "OFF_CAMPUS"]).optional(),
  preferredAreas: z.array(z.string()).optional(),
  budgetMin: z.number().int().min(0).nullable().optional(),
  budgetMax: z.number().int().min(0).nullable().optional(),
  leaseDuration: z.enum(["6_MONTHS", "9_MONTHS", "12_MONTHS"]).optional(),
  moveInDate: z.string().datetime().optional().or(z.string()),
  genderPreference: z.enum(["MALE", "FEMALE", "ANY"]).nullable().optional(),
  sleepSchedule: z.enum(["EARLY_BIRD", "NIGHT_OWL", "FLEXIBLE"]).optional(),
  cleanlinessLevel: z.number().min(1).max(5).optional(),
  guestsFrequency: z.enum(["RARELY", "SOMETIMES", "OFTEN"]).optional(),
  studyEnvironment: z.enum(["QUIET", "MODERATE", "SOCIAL"]).optional(),
  noiseTolerance: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  smokingStance: z.enum(["NO", "OK_OUTSIDE", "OK"]).optional(),
  drinkingStance: z.enum(["NO", "OCCASIONAL", "YES"]).optional(),
  petsStance: z.enum(["NO", "YES", "HAVE_PET"]).optional(),
  introvertExtrovert: z.number().min(1).max(10).optional(),
  socialHabits: z.enum(["HOME_BODY", "BALANCED", "VERY_SOCIAL"]).optional(),
  conflictStyle: z.enum(["AVOID", "TALK_IT_OUT", "MEDIATE"]).optional(),
  sharedActivities: z.array(z.string()).optional(),
  bio: z.string().optional(),
  tags: z.array(z.string()).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  preferences: z.array(preferenceSchema).optional(),
  onboardingComplete: z.boolean().optional(),
});

profileRouter.use(requireAuth);

profileRouter.get("/", async (req: AuthenticatedRequest, res) => {
  const profile = await prisma.profile.findUnique({
    where: { userId: req.user!.userId },
    include: { preferences: true },
  });
  if (!profile) return res.status(404).json({ error: "Profile not found" });
  return res.json(profile);
});

profileRouter.patch("/", async (req: AuthenticatedRequest, res) => {
  const parsed = onboardingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { preferences: prefs, moveInDate: moveInStr, ...rest } = parsed.data;
  const updateData: Record<string, unknown> = { ...rest };
  if (moveInStr) {
    try {
      updateData.moveInDate = new Date(moveInStr);
    } catch {
      // ignore invalid date
    }
  }

  const profile = await prisma.profile.findUnique({ where: { userId: req.user!.userId } });
  if (!profile) return res.status(404).json({ error: "Profile not found" });

  await prisma.profile.update({
    where: { userId: req.user!.userId },
    data: updateData as never,
  });

  if (Array.isArray(prefs)) {
    await prisma.preference.deleteMany({ where: { profileId: profile.id } });
    for (const p of prefs) {
      await prisma.preference.create({
        data: { profileId: profile.id, category: p.category, value: p.value, strength: p.strength, dealbreaker: p.dealbreaker },
      });
    }
  }

  const updated = await prisma.profile.findUnique({
    where: { id: profile.id },
    include: { preferences: true },
  });
  return res.json(updated);
});

profileRouter.post("/onboarding-complete", async (req: AuthenticatedRequest, res) => {
  await prisma.profile.update({
    where: { userId: req.user!.userId },
    data: { onboardingComplete: true },
  });
  return res.json({ onboardingComplete: true });
});

export { profileRouter };
