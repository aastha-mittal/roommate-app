/**
 * Compatibility: dealbreakers first, then weighted soft score.
 * On-campus: dorm rank overlap + room style weigh heavily.
 * Off-campus: budget + neighborhood weigh heavily.
 */

import type { Profile, Preference } from "@prisma/client";
import { parseArray } from "../lib/profileArrays.js";
import { labelForDormId } from "../config/housing.js";

/** Runtime scoring view: JSON array fields may be pre-parsed. */
export type ProfileWithPrefs = Omit<Profile, "preferredAreas" | "dormRanking" | "roomStylePreferences"> & {
  preferredAreas: string | string[];
  dormRanking: string | string[];
  roomStylePreferences: string | string[];
  preferences: Preference[];
};

export interface CompatibilityResult {
  score: number;
  passedDealbreakers: boolean;
  explanation: string[];
}

const SOFT_CATEGORIES = [
  "CLEANLINESS",
  "SLEEP_SCHEDULE",
  "GUESTS",
  "NOISE_TOLERANCE",
  "SMOKING",
  "PETS",
  "BUDGET",
  "ROOM_STYLE",
] as const;

function getPref(profile: ProfileWithPrefs, category: string): Preference | undefined {
  return profile.preferences.find((p) => p.category === category);
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

function parseRooms(p: Pick<ProfileWithPrefs, "roomStylePreferences">): string[] {
  return parseArray(p.roomStylePreferences);
}

function roomStyleOverlap(a: ProfileWithPrefs, b: ProfileWithPrefs): boolean {
  const ra = parseRooms(a);
  const rb = parseRooms(b);
  if (ra.length === 0 || rb.length === 0) return true;
  return ra.some((x) => rb.includes(x));
}

/** Rank similarity: shared top choices with similar rank get higher contribution. */
export function dormRankScore(rankA: string[], rankB: string[]): { score: number; max: number; snippets: string[] } {
  const snippets: string[] = [];
  const topN = 5;
  const a = rankA.slice(0, topN);
  const b = rankB.slice(0, topN);
  if (a.length === 0 || b.length === 0) return { score: 0, max: 1, snippets };

  let raw = 0;
  const maxRaw = topN;
  const shared = new Set(a.filter((d) => b.includes(d)));
  for (const dorm of shared) {
    const ia = a.indexOf(dorm);
    const ib = b.indexOf(dorm);
    const rankSim = 1 - Math.min(Math.abs(ia - ib), topN) / topN;
    raw += rankSim;
    if (snippets.length < 2) {
      snippets.push(`both ranked ${labelForDormId(dorm)} highly`);
    }
  }
  return { score: raw, max: Math.max(maxRaw, 1), snippets };
}

function cleanlinessDealbreakerOk(a: ProfileWithPrefs, b: ProfileWithPrefs): boolean {
  if (a.cleanlinessLevel == null || b.cleanlinessLevel == null) return true;
  return Math.abs(a.cleanlinessLevel - b.cleanlinessLevel) <= 1;
}

function enumMatch(
  av: string | null | undefined,
  bv: string | null | undefined
): boolean {
  if (!av || !bv) return true;
  return av === bv;
}

export function compatibilityScore(
  profileA: ProfileWithPrefs,
  profileB: ProfileWithPrefs
): CompatibilityResult {
  const explanation: string[] = [];

  const areasA = parseArray(profileA.preferredAreas);
  const areasB = parseArray(profileB.preferredAreas);
  const dormsA = parseArray(profileA.dormRanking);
  const dormsB = parseArray(profileB.dormRanking);

  const bothOn = profileA.housingType === "ON_CAMPUS" && profileB.housingType === "ON_CAMPUS";
  const bothOff = profileA.housingType === "OFF_CAMPUS" && profileB.housingType === "OFF_CAMPUS";

  // —— Dealbreakers ——
  for (const category of SOFT_CATEGORIES) {
    const prefA = getPref(profileA, category);
    const prefB = getPref(profileB, category);
    if (!prefA?.dealbreaker && !prefB?.dealbreaker) continue;

    if (category === "BUDGET") {
      if (bothOn || profileA.housingType === "ON_CAMPUS" || profileB.housingType === "ON_CAMPUS") {
        continue;
      }
      if (!budgetOverlap(profileA.budgetMin, profileA.budgetMax, profileB.budgetMin, profileB.budgetMax)) {
        return {
          score: 0,
          passedDealbreakers: false,
          explanation: ["Dealbreaker: budget ranges do not overlap"],
        };
      }
      continue;
    }

    if (category === "ROOM_STYLE") {
      if (!bothOn) continue;
      if (!roomStyleOverlap(profileA, profileB)) {
        return {
          score: 0,
          passedDealbreakers: false,
          explanation: ["Dealbreaker: room style preferences do not overlap"],
        };
      }
      continue;
    }

    if (category === "CLEANLINESS") {
      if (!cleanlinessDealbreakerOk(profileA, profileB)) {
        return {
          score: 0,
          passedDealbreakers: false,
          explanation: ["Dealbreaker: cleanliness expectations differ too much"],
        };
      }
      continue;
    }

    if (category === "SLEEP_SCHEDULE") {
      if (!enumMatch(profileA.sleepSchedule, profileB.sleepSchedule)) {
        return {
          score: 0,
          passedDealbreakers: false,
          explanation: ["Dealbreaker: sleep schedules do not match"],
        };
      }
      continue;
    }

    if (category === "GUESTS") {
      if (!enumMatch(profileA.guestsFrequency, profileB.guestsFrequency)) {
        return {
          score: 0,
          passedDealbreakers: false,
          explanation: ["Dealbreaker: guest expectations differ"],
        };
      }
      continue;
    }

    if (category === "NOISE_TOLERANCE") {
      if (!enumMatch(profileA.noiseTolerance, profileB.noiseTolerance)) {
        return {
          score: 0,
          passedDealbreakers: false,
          explanation: ["Dealbreaker: noise tolerance differs"],
        };
      }
      continue;
    }

    if (category === "SMOKING") {
      if (!enumMatch(profileA.smokingStance, profileB.smokingStance)) {
        return {
          score: 0,
          passedDealbreakers: false,
          explanation: ["Dealbreaker: smoking preferences differ"],
        };
      }
      continue;
    }

    if (category === "PETS") {
      if (!enumMatch(profileA.petsStance, profileB.petsStance)) {
        return {
          score: 0,
          passedDealbreakers: false,
          explanation: ["Dealbreaker: pet preferences differ"],
        };
      }
      continue;
    }
  }

  // —— Soft score (weighted sum → 0–100) ——
  let soft = 0;
  let max = 0;

  if (bothOn && dormsA.length && dormsB.length) {
    const dorm = dormRankScore(dormsA, dormsB);
    const w = 35;
    soft += (dorm.score / dorm.max) * w;
    max += w;
    explanation.push(...dorm.snippets.slice(0, 2));
  }

  if (bothOn) {
    const w = 20;
    max += w;
    if (roomStyleOverlap(profileA, profileB) && parseRooms(profileA).length && parseRooms(profileB).length) {
      soft += w * 0.85;
      explanation.push("Similar room style preferences");
    } else if (roomStyleOverlap(profileA, profileB)) {
      soft += w * 0.5;
    }
  }

  if (bothOff) {
    const wB = 28;
    max += wB;
    if (
      budgetOverlap(profileA.budgetMin, profileA.budgetMax, profileB.budgetMin, profileB.budgetMax) &&
      profileA.budgetMin != null &&
      profileB.budgetMin != null
    ) {
      soft += wB * 0.9;
      explanation.push("Similar budget range");
    } else if (budgetOverlap(profileA.budgetMin, profileA.budgetMax, profileB.budgetMin, profileB.budgetMax)) {
      soft += wB * 0.55;
      explanation.push("Overlapping budget");
    }

    const wN = 22;
    max += wN;
    const neighOverlap = areasA.length && areasB.length && areasA.some((x) => areasB.includes(x));
    if (neighOverlap) {
      soft += wN;
      const sample = areasA.find((x) => areasB.includes(x));
      if (sample) {
        explanation.push(`Both interested in ${sample.replace(/_/g, " ")}`);
      }
    }

    if (profileA.offCampusRoomType && profileB.offCampusRoomType && profileA.offCampusRoomType === profileB.offCampusRoomType) {
      soft += 8;
      max += 8;
      explanation.push("Same off-campus room type preference");
    }
  }

  // Lifestyle alignment
  const lifeW = 18;
  max += lifeW;
  let lifeHits = 0;
  if (enumMatch(profileA.sleepSchedule, profileB.sleepSchedule)) lifeHits++;
  if (profileA.cleanlinessLevel != null && profileB.cleanlinessLevel != null) {
    lifeHits += 1 - Math.min(1, Math.abs(profileA.cleanlinessLevel - profileB.cleanlinessLevel) / 4);
  }
  if (enumMatch(profileA.guestsFrequency, profileB.guestsFrequency)) lifeHits++;
  if (enumMatch(profileA.noiseTolerance, profileB.noiseTolerance)) lifeHits++;
  soft += (lifeHits / 4) * lifeW;
  if (enumMatch(profileA.sleepSchedule, profileB.sleepSchedule)) {
    explanation.push("Similar sleep schedules");
  }

  // Preference table (strength-weighted)
  for (const category of SOFT_CATEGORIES) {
    const prefA = getPref(profileA, category);
    const prefB = getPref(profileB, category);
    if (!prefA || !prefB) continue;
    if (category === "BUDGET" && !bothOff) continue;
    if (category === "ROOM_STYLE" && !bothOn) continue;

    const weight = (Math.max(prefA.strength, prefB.strength) / 10) * 8;
    max += weight;
    if (category === "BUDGET" && bothOff) {
      if (
        budgetOverlap(profileA.budgetMin, profileA.budgetMax, profileB.budgetMin, profileB.budgetMax)
      ) {
        soft += weight;
      }
    } else if (category === "ROOM_STYLE" && bothOn) {
      if (roomStyleOverlap(profileA, profileB)) soft += weight;
    } else if (prefA.value === prefB.value && prefA.value && prefB.value) {
      soft += weight;
    }
  }

  // Personality
  const pW = 10;
  max += pW;
  if (profileA.socialHabits && profileA.socialHabits === profileB.socialHabits) {
    soft += pW * 0.5;
  }
  if (
    profileA.introvertExtrovert != null &&
    profileB.introvertExtrovert != null
  ) {
    const diff = Math.abs(profileA.introvertExtrovert - profileB.introvertExtrovert);
    soft += (pW * 0.5) * (1 - Math.min(diff, 9) / 9);
  }

  const score = max > 0 ? Math.round((soft / max) * 100) : 55;
  const clamped = Math.min(100, Math.max(35, score));

  const unique = [...new Set(explanation)].slice(0, 4);
  return {
    score: clamped,
    passedDealbreakers: true,
    explanation: unique.length ? unique : ["Solid overall alignment"],
  };
}
