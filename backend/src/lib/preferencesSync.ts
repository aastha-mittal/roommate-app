import type { Profile, Preference } from "@prisma/client";

/** Keeps Preference rows aligned with structured profile fields for dealbreaker checks. */
export function preferenceValuesFromProfile(p: Pick<
  Profile,
  | "cleanlinessLevel"
  | "sleepSchedule"
  | "guestsFrequency"
  | "noiseTolerance"
  | "smokingStance"
  | "petsStance"
  | "housingType"
>): Record<string, string> {
  const cleanliness =
    p.cleanlinessLevel != null ? String(Math.min(5, Math.max(1, p.cleanlinessLevel))) : "3";
  return {
    CLEANLINESS: cleanliness,
    SLEEP_SCHEDULE: p.sleepSchedule ?? "FLEXIBLE",
    GUESTS: p.guestsFrequency ?? "SOMETIMES",
    NOISE_TOLERANCE: p.noiseTolerance ?? "MEDIUM",
    SMOKING: p.smokingStance ?? "NO",
    PETS: p.petsStance ?? "NO",
    BUDGET: p.housingType === "OFF_CAMPUS" ? "OVERLAP" : "N_A",
    ROOM_STYLE: "OVERLAP",
  };
}

export function mergePreferenceValues(
  profile: Profile,
  prefs: { category: string; value: string; strength: number; dealbreaker: boolean }[]
): { category: string; value: string; strength: number; dealbreaker: boolean }[] {
  const fromProfile = preferenceValuesFromProfile(profile);
  return prefs.map((p) => ({
    ...p,
    value: fromProfile[p.category] ?? p.value,
  }));
}

export function defaultPreferencesForHousing(
  housingType: string | null | undefined
): Omit<Preference, "id" | "profileId" | "createdAt" | "updatedAt">[] {
  const off = housingType === "OFF_CAMPUS";
  return [
    { category: "CLEANLINESS", value: "3", strength: 6, dealbreaker: false },
    { category: "SLEEP_SCHEDULE", value: "FLEXIBLE", strength: 6, dealbreaker: false },
    { category: "GUESTS", value: "SOMETIMES", strength: 5, dealbreaker: false },
    { category: "NOISE_TOLERANCE", value: "MEDIUM", strength: 5, dealbreaker: false },
    { category: "SMOKING", value: "NO", strength: 8, dealbreaker: true },
    { category: "PETS", value: "NO", strength: 6, dealbreaker: false },
    { category: "BUDGET", value: off ? "OVERLAP" : "N_A", strength: off ? 8 : 3, dealbreaker: off },
    { category: "ROOM_STYLE", value: "OVERLAP", strength: housingType === "ON_CAMPUS" ? 7 : 3, dealbreaker: false },
  ];
}
