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

/** Empty strings from JSON/forms break Prisma enums; strip them before update */
function emptyToUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out = { ...obj } as Record<string, unknown>;
  for (const k of Object.keys(out)) {
    if (out[k] === "") delete out[k];
  }
  return out as T;
}

/** Prisma throws if any Date field is Invalid Date */
function sanitizeProfileUpdateData(data: Record<string, unknown>) {
  for (const key of Object.keys(data)) {
    const v = data[key];
    if (v instanceof Date && Number.isNaN(v.getTime())) delete data[key];
    if (typeof v === "number" && Number.isNaN(v)) delete data[key];
  }
}

const onboardingSchema = z.object({
  housingType: z.enum(["ON_CAMPUS", "OFF_CAMPUS"]).optional(),
  preferredAreas: z.array(z.string()).optional(),
  dormRanking: z.array(z.string()).optional(),
  budgetMin: z.number().int().min(0).nullable().optional(),
  budgetMax: z.number().int().min(0).nullable().optional(),
  leaseDuration: z.enum(["6_MONTHS", "9_MONTHS", "12_MONTHS"]).optional(),
  moveInDate: z.string().optional(),
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
  avatarUrl: z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    z.string().url().optional()
  ),
  preferences: z.array(preferenceSchema).optional(),
  onboardingComplete: z.boolean().optional(),
});

profileRouter.use(requireAuth);

profileRouter.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user!.userId },
      include: { preferences: true },
    });
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    return res.json(profile);
  } catch (err) {
    console.error("[profile GET]", err);
    const message = err instanceof Error ? err.message : "Server error";
    return res.status(500).json({ error: "Failed to load profile", detail: message });
  }
});

profileRouter.patch("/", async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = onboardingSchema.safeParse(emptyToUndefined(req.body as Record<string, unknown>));
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { preferences: prefs, moveInDate: moveInStr, ...rest } = parsed.data;
    const allowedKeys = [
      "housingType", "preferredAreas", "dormRanking", "budgetMin", "budgetMax", "leaseDuration", "genderPreference",
      "sleepSchedule", "cleanlinessLevel", "guestsFrequency", "studyEnvironment", "noiseTolerance",
      "smokingStance", "drinkingStance", "petsStance", "introvertExtrovert", "socialHabits",
      "conflictStyle", "sharedActivities", "bio", "tags", "avatarUrl", "onboardingComplete",
    ] as const;
    const updateData: Record<string, unknown> = {};
    for (const key of allowedKeys) {
      const val = rest[key as keyof typeof rest];
      if (val !== undefined) updateData[key] = val;
    }
    if (moveInStr && String(moveInStr).trim()) {
      const d = new Date(moveInStr);
      if (!Number.isNaN(d.getTime())) updateData.moveInDate = d;
    }

    sanitizeProfileUpdateData(updateData);

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
  } catch (err) {
    console.error("[profile PATCH]", err);
    const message = err instanceof Error ? err.message : "Server error";
    return res.status(500).json({ error: "Failed to update profile", detail: message });
  }
});

profileRouter.post("/onboarding-complete", async (req: AuthenticatedRequest, res) => {
  try {
    await prisma.profile.update({
      where: { userId: req.user!.userId },
      data: { onboardingComplete: true },
    });
    return res.json({ onboardingComplete: true });
  } catch (err) {
    console.error("[onboarding-complete]", err);
    const message = err instanceof Error ? err.message : "Server error";
    return res.status(500).json({ error: "Failed to complete onboarding", detail: message });
  }
});

export { profileRouter };
