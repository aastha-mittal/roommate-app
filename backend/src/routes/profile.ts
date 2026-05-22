import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { parseArray, toArrayJson } from "../lib/profileArrays.js";
import { validateDormRanking } from "../config/housing.js";
import { mergePreferenceValues } from "../lib/preferencesSync.js";

const profileRouter = Router();

const preferenceSchema = z.object({
  category: z.string(),
  value: z.string(),
  strength: z.number().min(1).max(10).default(5),
  dealbreaker: z.boolean().default(false),
});

function emptyToUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out = { ...obj } as Record<string, unknown>;
  for (const k of Object.keys(out)) {
    if (out[k] === "") delete out[k];
  }
  return out as T;
}

function sanitizeProfileUpdateData(data: Record<string, unknown>) {
  for (const key of Object.keys(data)) {
    const v = data[key];
    if (v instanceof Date && Number.isNaN(v.getTime())) delete data[key];
    if (typeof v === "number" && Number.isNaN(v)) delete data[key];
  }
}

const onboardingSchema = z.object({
  displayName: z.string().min(1).max(80).optional(),
  schoolYear: z.enum(["FRESHMAN", "SOPHOMORE", "JUNIOR", "SENIOR", "GRAD", "OTHER"]).optional(),
  isFirstYear: z.boolean().optional(),
  housingType: z.enum(["ON_CAMPUS", "OFF_CAMPUS"]).optional(),
  preferredAreas: z.array(z.string()).optional(),
  dormRanking: z.array(z.string()).optional(),
  roomStylePreferences: z.array(z.string()).optional(),
  budgetMin: z.number().int().min(0).nullable().optional(),
  budgetMax: z.number().int().min(0).nullable().optional(),
  leaseDuration: z.enum(["6_MONTHS", "9_MONTHS", "12_MONTHS"]).optional(),
  moveInDate: z.string().optional(),
  offCampusRoomType: z
    .enum(["PRIVATE_ROOM_SHARED_UNIT", "SHARED_ROOM", "STUDIO", "ENTIRE_UNIT"])
    .optional()
    .nullable(),
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

function profileToApi(profile: {
  preferredAreas: string;
  dormRanking: string;
  roomStylePreferences: string;
  sharedActivities: string;
  tags: string;
  [k: string]: unknown;
}) {
  return {
    ...profile,
    preferredAreas: parseArray(profile.preferredAreas),
    dormRanking: parseArray(profile.dormRanking),
    roomStylePreferences: parseArray(profile.roomStylePreferences),
    sharedActivities: parseArray(profile.sharedActivities),
    tags: parseArray(profile.tags),
  };
}

profileRouter.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user!.userId },
      include: { preferences: true },
    });
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    return res.json(profileToApi(profile));
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
    const { preferences: prefsIn, moveInDate: moveInStr, ...rest } = parsed.data;

    const existing = await prisma.profile.findUnique({ where: { userId: req.user!.userId } });
    if (!existing) return res.status(404).json({ error: "Profile not found" });

    const isFirstYear = rest.isFirstYear ?? existing.isFirstYear;
    const housingType = rest.housingType ?? existing.housingType;

    if (rest.dormRanking && housingType === "ON_CAMPUS") {
      const v = validateDormRanking(rest.dormRanking, isFirstYear);
      if (!v.ok) return res.status(400).json({ error: v.error });
    }

    const allowedKeys = [
      "displayName",
      "schoolYear",
      "isFirstYear",
      "housingType",
      "preferredAreas",
      "dormRanking",
      "roomStylePreferences",
      "budgetMin",
      "budgetMax",
      "leaseDuration",
      "offCampusRoomType",
      "genderPreference",
      "sleepSchedule",
      "cleanlinessLevel",
      "guestsFrequency",
      "studyEnvironment",
      "noiseTolerance",
      "smokingStance",
      "drinkingStance",
      "petsStance",
      "introvertExtrovert",
      "socialHabits",
      "conflictStyle",
      "sharedActivities",
      "bio",
      "tags",
      "avatarUrl",
      "onboardingComplete",
    ] as const;
    const arrayKeys = ["preferredAreas", "dormRanking", "roomStylePreferences", "sharedActivities", "tags"] as const;

    const updateData: Record<string, unknown> = {};
    for (const key of allowedKeys) {
      const val = rest[key as keyof typeof rest];
      if (val !== undefined) {
        updateData[key] = arrayKeys.includes(key as (typeof arrayKeys)[number])
          ? toArrayJson(val as string[])
          : val;
      }
    }
    if (moveInStr && String(moveInStr).trim()) {
      const d = new Date(moveInStr);
      if (!Number.isNaN(d.getTime())) updateData.moveInDate = d;
    }

    if (rest.housingType === "ON_CAMPUS") {
      updateData.preferredAreas = toArrayJson([]);
      updateData.budgetMin = null;
      updateData.budgetMax = null;
      updateData.leaseDuration = null;
      updateData.moveInDate = null;
      updateData.offCampusRoomType = null;
    }
    if (rest.housingType === "OFF_CAMPUS") {
      updateData.dormRanking = toArrayJson([]);
      updateData.roomStylePreferences = toArrayJson([]);
    }

    sanitizeProfileUpdateData(updateData);

    await prisma.profile.update({
      where: { userId: req.user!.userId },
      data: updateData as never,
    });

    const profile = await prisma.profile.findUnique({
      where: { userId: req.user!.userId },
      include: { preferences: true },
    });
    if (!profile) return res.status(500).json({ error: "Profile missing after update" });

    if (Array.isArray(prefsIn) && prefsIn.length) {
      const merged = mergePreferenceValues(profile, prefsIn);
      await prisma.preference.deleteMany({ where: { profileId: profile.id } });
      for (const p of merged) {
        await prisma.preference.create({
          data: {
            profileId: profile.id,
            category: p.category,
            value: p.value,
            strength: p.strength,
            dealbreaker: p.dealbreaker,
          },
        });
      }
    }

    const updated = await prisma.profile.findUnique({
      where: { id: profile.id },
      include: { preferences: true },
    });
    return res.json(updated ? profileToApi(updated) : updated);
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
