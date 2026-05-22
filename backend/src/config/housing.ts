/**
 * CMU housing configuration — edit lists here to update product copy and validation.
 * First-year vs upperclass lists drive onboarding and dorm-ranking validation.
 */

export const OFF_CAMPUS_NEIGHBORHOODS = [
  { id: "SHADYSIDE", label: "Shadyside" },
  { id: "SQUIRREL_HILL", label: "Squirrel Hill" },
  { id: "NORTH_OAKLAND", label: "North Oakland" },
  { id: "SOUTH_OAKLAND", label: "South Oakland" },
  { id: "BLOOMFIELD", label: "Bloomfield" },
  { id: "EAST_LIBERTY", label: "East Liberty" },
  { id: "POINT_B", label: "Point Breeze" },
] as const;

/** Typical first-year residence — aligns with CMU first-year housing assignments. */
export const FIRST_YEAR_DORMS = [
  { id: "MOREWOOD_GARDENS", label: "Morewood Gardens" },
  { id: "STEVER_HOUSE", label: "Stever House" },
  { id: "MUDGE_HOUSE", label: "Mudge House" },
  { id: "DONNER_HOUSE", label: "Donner House" },
  { id: "BOSS_HOUSE", label: "Boss House" },
  { id: "MCGILL_HOUSE", label: "McGill House" },
  { id: "SCOVELL_HOUSE", label: "Scovell House" },
] as const;

/** Upperclass on-campus — apartments & suites (illustrative; adjust with Housing office data). */
export const UPPERCLASS_ON_CAMPUS = [
  { id: "RESNIK_HOUSE", label: "Resnik House" },
  { id: "WEST_WING", label: "West Wing" },
  { id: "FIFTH_CLYDE", label: "Fifth & Clyde" },
  { id: "HENDERSON_HOUSE", label: "Henderson House" },
  { id: "WELCH_HOUSE", label: "Welch House" },
  { id: "HAMMERSCHLAG", label: "Hammerschlag House" },
  { id: "E_TOWER", label: "E-Tower" },
  { id: "MOREWOOD_TOWERS", label: "Morewood Towers" },
] as const;

export const ROOM_STYLE_OPTIONS = [
  { id: "SINGLE", label: "Single" },
  { id: "DOUBLE", label: "Double" },
  { id: "SUITE", label: "Suite-style" },
  { id: "APARTMENT", label: "Apartment-style" },
] as const;

export const OFF_CAMPUS_ROOM_TYPES = [
  { id: "PRIVATE_ROOM_SHARED_UNIT", label: "Private room in shared apartment" },
  { id: "SHARED_ROOM", label: "Shared room" },
  { id: "STUDIO", label: "Studio" },
  { id: "ENTIRE_UNIT", label: "Entire unit / house" },
] as const;

export type DormId = (typeof FIRST_YEAR_DORMS)[number]["id"] | (typeof UPPERCLASS_ON_CAMPUS)[number]["id"];

const ALL_DORM_IDS = new Set<string>([
  ...FIRST_YEAR_DORMS.map((d) => d.id),
  ...UPPERCLASS_ON_CAMPUS.map((d) => d.id),
]);

export function dormListForUser(isFirstYear: boolean): { id: string; label: string }[] {
  return isFirstYear ? [...FIRST_YEAR_DORMS] : [...UPPERCLASS_ON_CAMPUS];
}

export function labelForDormId(id: string): string {
  const all = [...FIRST_YEAR_DORMS, ...UPPERCLASS_ON_CAMPUS];
  return all.find((d) => d.id === id)?.label ?? id;
}

/** Validate ranked list contains only allowed dorms for cohort, no dupes. */
export function validateDormRanking(
  ranking: string[],
  isFirstYear: boolean
): { ok: true } | { ok: false; error: string } {
  const allowed = new Set(dormListForUser(isFirstYear).map((d) => d.id));
  if (ranking.length === 0) return { ok: false, error: "Rank at least one dorm" };
  const seen = new Set<string>();
  for (const id of ranking) {
    if (!allowed.has(id)) return { ok: false, error: "Invalid dorm in ranking for your year" };
    if (seen.has(id)) return { ok: false, error: "Duplicate dorm in ranking" };
    seen.add(id);
  }
  return { ok: true };
}

export function isValidDormId(id: string): boolean {
  return ALL_DORM_IDS.has(id);
}
