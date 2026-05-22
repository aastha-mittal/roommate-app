import type { Preference, Profile, User } from "@prisma/client";
import { labelForDormId } from "../config/housing.js";
import { parseArray } from "./profileArrays.js";
import { compatibilityScore, type ProfileWithPrefs } from "../matching-engine/index.js";

type ProfileRow = Profile & {
  user?: Pick<User, "id" | "email"> | null;
  preferences?: Preference[];
};

export function toProfileForScore(
  p: ProfileRow & { preferences: Preference[] }
): ProfileWithPrefs | null {
  if (!p) return null;
  return {
    ...p,
    preferredAreas: parseArray(p.preferredAreas),
    dormRanking: parseArray(p.dormRanking),
    roomStylePreferences: parseArray(p.roomStylePreferences),
    preferences: p.preferences,
  };
}

export function profileToSwipePayload(
  p: ProfileRow,
  compatibility?: { score: number; explanation: string[] }
) {
  const dorms = parseArray(p.dormRanking);
  const dormLabels = dorms.map((id) => labelForDormId(id));
  return {
    userId: p.userId,
    email: p.user?.email,
    displayName: p.displayName,
    avatarUrl: p.avatarUrl,
    bio: p.bio,
    tags: parseArray(p.tags),
    housingType: p.housingType,
    isFirstYear: p.isFirstYear,
    schoolYear: p.schoolYear,
    preferredAreas: parseArray(p.preferredAreas),
    dormRanking: dorms,
    dormLabels,
    topDormLabel: dormLabels[0],
    budgetMin: p.budgetMin,
    budgetMax: p.budgetMax,
    leaseDuration: p.leaseDuration,
    offCampusRoomType: p.offCampusRoomType,
    sleepSchedule: p.sleepSchedule,
    cleanlinessLevel: p.cleanlinessLevel,
    guestsFrequency: p.guestsFrequency,
    studyEnvironment: p.studyEnvironment,
    noiseTolerance: p.noiseTolerance,
    smokingStance: p.smokingStance,
    drinkingStance: p.drinkingStance,
    petsStance: p.petsStance,
    introvertExtrovert: p.introvertExtrovert,
    socialHabits: p.socialHabits,
    conflictStyle: p.conflictStyle,
    sharedActivities: parseArray(p.sharedActivities),
    roomStylePreferences: parseArray(p.roomStylePreferences),
    compatibilityScore: compatibility?.score ?? 0,
    compatibilityExplanation: compatibility?.explanation ?? [],
  };
}

export function scorePair(
  viewer: ProfileRow & { preferences: Preference[] },
  other: ProfileRow & { preferences: Preference[] }
) {
  const a = toProfileForScore(viewer);
  const b = toProfileForScore(other);
  if (!a || !b) return null;
  return compatibilityScore(a, b);
}
