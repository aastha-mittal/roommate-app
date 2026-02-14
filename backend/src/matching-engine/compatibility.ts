/**
 * Compatibility scoring: dealbreaker filter + weighted soft score.
 * Returns numeric score 0–100 and explanation for UI.
 */

import type { Profile, Preference } from "@prisma/client";

export interface ProfileWithPrefs extends Profile {
  preferences: Preference[];
}

export interface CompatibilityResult {
  score: number;
  passedDealbreakers: boolean;
  explanation: string[];
}

const PREF_CATEGORIES = [
  "CLEANLINESS",
  "SLEEP_SCHEDULE",
  "GUESTS",
  "NOISE_TOLERANCE",
  "SMOKING",
  "PETS",
  "BUDGET",
] as const;

function getPref(profile: ProfileWithPrefs, category: string): Preference | undefined {
  return profile.preferences.find((p) => p.category === category);
}

function valueMatch(a: string, b: string): boolean {
  if (!a || !b) return true;
  return a.toUpperCase() === b.toUpperCase();
}

function budgetOverlap(
  minA: number | null,
  maxA: number | null,
  minB: number | null,
  maxB: number | null
): boolean {
  if (minA == null || maxA == null || minB == null || maxB == null) return true;
  return !(maxA < minB || maxB < minA);
}

export function compatibilityScore(
  profileA: ProfileWithPrefs,
  profileB: ProfileWithPrefs
): CompatibilityResult {
  const explanation: string[] = [];
  let softScore = 0;
  let weightSum = 0;

  // —— Dealbreakers (hard filter) ——
  for (const category of PREF_CATEGORIES) {
    const prefA = getPref(profileA, category);
    const prefB = getPref(profileB, category);
    if (!prefA?.dealbreaker && !prefB?.dealbreaker) continue;

    let compatible = true;
    if (category === "BUDGET") {
      compatible = budgetOverlap(
        profileA.budgetMin,
        profileA.budgetMax,
        profileB.budgetMin,
        profileB.budgetMax
      );
    } else if (prefA && prefB) {
      compatible = valueMatch(prefA.value, prefB.value);
    }
    if (!compatible) {
      return {
        score: 0,
        passedDealbreakers: false,
        explanation: [`Dealbreaker: ${category.replace("_", " ")} mismatch`],
      };
    }
  }

  // —— Housing overlap boost ——
  if (profileA.housingType && profileB.housingType && profileA.housingType === profileB.housingType) {
    softScore += 15;
    weightSum += 15;
    explanation.push("Same housing type (on/off campus)");
  }
  const areaOverlap =
    profileA.preferredAreas.length && profileB.preferredAreas.length
      ? profileA.preferredAreas.some((a) => profileB.preferredAreas.includes(a))
      : false;
  if (areaOverlap) {
    softScore += 10;
    weightSum += 10;
    explanation.push("Overlapping preferred areas");
  }
  if (
    budgetOverlap(
      profileA.budgetMin,
      profileA.budgetMax,
      profileB.budgetMin,
      profileB.budgetMax
    ) &&
    (profileA.budgetMin != null || profileB.budgetMin != null)
  ) {
    softScore += 10;
    weightSum += 10;
    explanation.push("Budget range overlap");
  }

  // —— Preference alignment (soft) ——
  for (const category of PREF_CATEGORIES) {
    const prefA = getPref(profileA, category);
    const prefB = getPref(profileB, category);
    if (!prefA || !prefB) continue;
    const weight = Math.max(prefA.strength, prefB.strength) / 10;
    weightSum += weight * 10;
    if (valueMatch(prefA.value, prefB.value)) {
      softScore += weight * 10;
      explanation.push(`${category.replace("_", " ")} aligned`);
    }
  }

  // —— Lifestyle fields from profile (no dealbreaker in schema for these, use as soft) ——
  if (profileA.sleepSchedule && profileB.sleepSchedule && profileA.sleepSchedule === profileB.sleepSchedule) {
    softScore += 5;
    weightSum += 5;
  }
  if (profileA.cleanlinessLevel != null && profileB.cleanlinessLevel != null) {
    const diff = Math.abs(profileA.cleanlinessLevel - profileB.cleanlinessLevel);
    softScore += Math.max(0, 5 - diff);
    weightSum += 5;
  }

  const score = weightSum > 0 ? Math.round((softScore / weightSum) * 100) : 50;
  const clamped = Math.min(100, Math.max(0, score));

  return {
    score: clamped,
    passedDealbreakers: true,
    explanation: explanation.length ? explanation : ["Preferences align well"],
  };
}
