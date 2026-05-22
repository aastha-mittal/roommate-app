import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { profile, housing, type ProfileUpdate, type HousingOptionsResponse } from "../api/client";
import DormRankList from "../components/DormRankList";

const STEPS = ["basics", "housing", "lifestyle", "personality", "preferences"] as const;

const SCHOOL_YEARS = [
  { value: "FRESHMAN", label: "Freshman" },
  { value: "SOPHOMORE", label: "Sophomore" },
  { value: "JUNIOR", label: "Junior" },
  { value: "SENIOR", label: "Senior" },
  { value: "GRAD", label: "Graduate" },
  { value: "OTHER", label: "Other" },
];

const HOUSING_OPTIONS = {
  leaseDuration: [
    { value: "6_MONTHS", label: "6 months" },
    { value: "9_MONTHS", label: "9 months" },
    { value: "12_MONTHS", label: "12 months" },
  ],
};

const LIFESTYLE_OPTIONS = {
  sleepSchedule: [
    { value: "EARLY_BIRD", label: "Early bird" },
    { value: "NIGHT_OWL", label: "Night owl" },
    { value: "FLEXIBLE", label: "Flexible" },
  ],
  guestsFrequency: [
    { value: "RARELY", label: "Rarely" },
    { value: "SOMETIMES", label: "Sometimes" },
    { value: "OFTEN", label: "Often" },
  ],
  studyEnvironment: [
    { value: "QUIET", label: "Quiet" },
    { value: "MODERATE", label: "Moderate" },
    { value: "SOCIAL", label: "Social" },
  ],
  noiseTolerance: [
    { value: "LOW", label: "Low" },
    { value: "MEDIUM", label: "Medium" },
    { value: "HIGH", label: "High" },
  ],
  smokingStance: [
    { value: "NO", label: "No" },
    { value: "OK_OUTSIDE", label: "OK outside" },
    { value: "OK", label: "OK" },
  ],
  drinkingStance: [
    { value: "NO", label: "No" },
    { value: "OCCASIONAL", label: "Occasional" },
    { value: "YES", label: "Yes" },
  ],
  petsStance: [
    { value: "NO", label: "No pets" },
    { value: "YES", label: "Open to pets" },
    { value: "HAVE_PET", label: "I have a pet" },
  ],
};

const PERSONALITY_OPTIONS = {
  socialHabits: [
    { value: "HOME_BODY", label: "Home body" },
    { value: "BALANCED", label: "Balanced" },
    { value: "VERY_SOCIAL", label: "Very social" },
  ],
  conflictStyle: [
    { value: "AVOID", label: "Avoid conflict" },
    { value: "TALK_IT_OUT", label: "Talk it out" },
    { value: "MEDIATE", label: "Mediate" },
  ],
};

function mergePreferences(
  defaults: NonNullable<ProfileUpdate["preferences"]>,
  current?: ProfileUpdate["preferences"]
): NonNullable<ProfileUpdate["preferences"]> {
  const map = new Map((current ?? []).map((p) => [p.category, p]));
  return defaults.map((d) => {
    const prev = map.get(d.category);
    return prev ? { ...d, ...prev, category: d.category } : d;
  });
}

function defaultPreferenceRows(housingType?: string) {
  const off = housingType === "OFF_CAMPUS";
  const rows = [
    { category: "CLEANLINESS", label: "Cleanliness", hint: "Matched to your slider in Lifestyle" },
    { category: "SLEEP_SCHEDULE", label: "Sleep schedule", hint: "" },
    { category: "GUESTS", label: "Guests", hint: "" },
    { category: "NOISE_TOLERANCE", label: "Noise", hint: "" },
    { category: "SMOKING", label: "Smoking", hint: "" },
    { category: "PETS", label: "Pets", hint: "" },
  ];
  if (housingType === "ON_CAMPUS") {
    rows.push({ category: "ROOM_STYLE", label: "Room style (suite vs double, etc.)", hint: "Requires overlap in room styles" });
  }
  if (off) {
    rows.push({ category: "BUDGET", label: "Budget", hint: "Ranges must overlap" });
  }
  return rows;
}

export default function Onboarding() {
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [housingOpts, setHousingOpts] = useState<HousingOptionsResponse | null>(null);
  const [data, setData] = useState<ProfileUpdate>({
    preferredAreas: [],
    sharedActivities: [],
    tags: [],
    dormRanking: [],
    roomStylePreferences: [],
    isFirstYear: false,
  });
  const [tagsInput, setTagsInput] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const navigate = useNavigate();

  const preferenceMeta = useMemo(() => defaultPreferenceRows(data.housingType), [data.housingType]);

  const buildDefaultPreferences = useCallback(() => {
    const off = data.housingType === "OFF_CAMPUS";
    const base: NonNullable<ProfileUpdate["preferences"]> = [
      { category: "CLEANLINESS", value: "3", strength: 6, dealbreaker: false },
      { category: "SLEEP_SCHEDULE", value: "FLEXIBLE", strength: 6, dealbreaker: false },
      { category: "GUESTS", value: "SOMETIMES", strength: 5, dealbreaker: false },
      { category: "NOISE_TOLERANCE", value: "MEDIUM", strength: 5, dealbreaker: false },
      { category: "SMOKING", value: "NO", strength: 8, dealbreaker: true },
      { category: "PETS", value: "NO", strength: 6, dealbreaker: false },
    ];
    if (data.housingType === "ON_CAMPUS") {
      base.push({ category: "ROOM_STYLE", value: "OVERLAP", strength: 7, dealbreaker: false });
    }
    if (off) {
      base.push({ category: "BUDGET", value: "OVERLAP", strength: 8, dealbreaker: true });
    }
    return base;
  }, [data.housingType]);

  useEffect(() => {
    profile
      .get()
      .then((p) => {
        setData({
          displayName: p.displayName ?? undefined,
          schoolYear: p.schoolYear ?? undefined,
          isFirstYear: p.isFirstYear ?? false,
          housingType: p.housingType ?? undefined,
          preferredAreas: Array.isArray(p.preferredAreas) ? p.preferredAreas : [],
          dormRanking: Array.isArray(p.dormRanking) ? p.dormRanking : [],
          roomStylePreferences: Array.isArray(p.roomStylePreferences) ? p.roomStylePreferences : [],
          budgetMin: p.budgetMin ?? undefined,
          budgetMax: p.budgetMax ?? undefined,
          leaseDuration: p.leaseDuration ?? undefined,
          moveInDate: p.moveInDate ? String(p.moveInDate).slice(0, 10) : undefined,
          offCampusRoomType: p.offCampusRoomType ?? undefined,
          genderPreference: p.genderPreference ?? undefined,
          sleepSchedule: p.sleepSchedule ?? undefined,
          cleanlinessLevel: p.cleanlinessLevel ?? undefined,
          guestsFrequency: p.guestsFrequency ?? undefined,
          studyEnvironment: p.studyEnvironment ?? undefined,
          noiseTolerance: p.noiseTolerance ?? undefined,
          smokingStance: p.smokingStance ?? undefined,
          drinkingStance: p.drinkingStance ?? undefined,
          petsStance: p.petsStance ?? undefined,
          introvertExtrovert: p.introvertExtrovert ?? undefined,
          socialHabits: p.socialHabits ?? undefined,
          conflictStyle: p.conflictStyle ?? undefined,
          sharedActivities: Array.isArray(p.sharedActivities) ? p.sharedActivities : [],
          bio: p.bio ?? undefined,
          tags: Array.isArray(p.tags) ? p.tags : [],
          avatarUrl: p.avatarUrl ?? undefined,
          preferences:
            p.preferences?.length && p.housingType
              ? p.preferences.map((pr) => ({
                  category: pr.category,
                  value: pr.value,
                  strength: pr.strength,
                  dealbreaker: pr.dealbreaker,
                }))
              : undefined,
        });
        setTagsInput((p.tags ?? []).join(", "));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!data.housingType || data.housingType !== "ON_CAMPUS") return;
    housing
      .options(data.isFirstYear ?? false, "ON_CAMPUS")
      .then((h) => {
        setHousingOpts(h);
        setData((d) => {
          if (d.dormRanking && d.dormRanking.length > 0) return d;
          const ids = h.onCampusDorms.map((x) => x.id);
          return { ...d, dormRanking: ids };
        });
      })
      .catch(() => {});
  }, [data.isFirstYear, data.housingType]);

  useEffect(() => {
    if (data.housingType !== "OFF_CAMPUS") return;
    housing
      .options(false, "OFF_CAMPUS")
      .then(setHousingOpts)
      .catch(() => {});
  }, [data.housingType]);

  useEffect(() => {
    if (!data.preferences?.length && data.housingType) {
      setData((d) => ({ ...d, preferences: buildDefaultPreferences() }));
    }
  }, [data.housingType, data.preferences?.length, buildDefaultPreferences]);

  const validateStep = (): string | null => {
    const id = STEPS[stepIndex];
    if (id === "basics") {
      if (!data.displayName?.trim()) return "Please enter your name";
      if (!data.schoolYear) return "Select your year in school";
      if (!data.housingType) return "Choose on-campus or off-campus housing";
      if (!data.bio?.trim()) return "Add a short bio";
    }
    if (id === "housing") {
      if (data.housingType === "ON_CAMPUS") {
        if (!data.dormRanking?.length) return "Rank at least one dorm";
        if (!data.roomStylePreferences?.length) return "Pick at least one room style preference";
      } else if (data.housingType === "OFF_CAMPUS") {
        if (!data.preferredAreas?.length) return "Pick at least one neighborhood";
        if (data.budgetMin == null || data.budgetMax == null) return "Enter budget range";
        if (data.budgetMin > data.budgetMax) return "Budget min cannot exceed max";
        if (!data.leaseDuration) return "Select a lease length";
        if (!data.offCampusRoomType) return "Select a room / unit type";
      }
    }
    return null;
  };

  const saveAndNext = async () => {
    const err = validateStep();
    if (err) {
      setSaveError(err);
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const prefs = mergePreferences(buildDefaultPreferences(), data.preferences);
      const payload: ProfileUpdate = {
        ...data,
        preferences: prefs,
        tags: tagsInput.split(",").map((s) => s.trim()).filter(Boolean),
      };
      if (payload.housingType === "ON_CAMPUS") {
        payload.preferredAreas = [];
        delete (payload as Record<string, unknown>).budgetMin;
        delete (payload as Record<string, unknown>).budgetMax;
        delete (payload as Record<string, unknown>).leaseDuration;
        delete (payload as Record<string, unknown>).moveInDate;
        delete (payload as Record<string, unknown>).offCampusRoomType;
      }
      if (payload.housingType === "OFF_CAMPUS") {
        payload.dormRanking = [];
        payload.roomStylePreferences = [];
      }
      await profile.update(payload);
      if (stepIndex === STEPS.length - 1) {
        await profile.onboardingComplete();
        navigate("/swipe", { replace: true });
      } else {
        setStepIndex((i) => i + 1);
      }
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-stone-100">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const stepId = STEPS[stepIndex];
  const onCampusDorms = housingOpts?.onCampusDorms ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/80 to-stone-100 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <h1 className="font-display text-2xl font-bold text-stone-900">Roommate Match</h1>
          <p className="text-sm text-stone-500 mt-1">CMU · find your people</p>
        </div>

        {saveError && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{saveError}</div>
        )}

        <div className="mb-8">
          <div className="flex gap-1 mb-2">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors ${i <= stepIndex ? "bg-amber-500" : "bg-stone-200"}`}
              />
            ))}
          </div>
          <p className="text-sm text-stone-500">
            Step {stepIndex + 1} of {STEPS.length}:{" "}
            {stepId === "basics" && "About you"}
            {stepId === "housing" && "Housing"}
            {stepId === "lifestyle" && "Lifestyle"}
            {stepId === "personality" && "Personality"}
            {stepId === "preferences" && "Dealbreakers"}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-stone-200/80 p-6 mb-6">
          {stepId === "basics" && (
            <div className="space-y-4">
              <div>
                <label className="block font-medium text-stone-700">Name</label>
                <input
                  type="text"
                  value={data.displayName ?? ""}
                  onChange={(e) => setData((d) => ({ ...d, displayName: e.target.value }))}
                  placeholder="How you want to appear"
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 outline-none"
                />
              </div>
              <div>
                <label className="block font-medium text-stone-700">Year in school</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {SCHOOL_YEARS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setData((d) => ({ ...d, schoolYear: o.value }))}
                      className={`py-2 px-3 rounded-xl border text-sm ${
                        data.schoolYear === o.value ? "border-amber-500 bg-amber-50 text-amber-900" : "border-stone-300"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block font-medium text-stone-700">Are you a first-year student?</label>
                <p className="text-xs text-stone-500 mb-2">First-year housing options differ from upperclass housing.</p>
                <div className="flex gap-2">
                  {[
                    { v: true, l: "Yes" },
                    { v: false, l: "No" },
                  ].map((o) => (
                    <button
                      key={String(o.v)}
                      type="button"
                      onClick={() =>
                        setData((d) => ({
                          ...d,
                          isFirstYear: o.v,
                          dormRanking: d.housingType === "ON_CAMPUS" ? [] : d.dormRanking,
                        }))
                      }
                      className={`flex-1 py-2.5 px-3 rounded-xl border text-sm font-medium ${
                        data.isFirstYear === o.v ? "border-amber-500 bg-amber-50 text-amber-900" : "border-stone-300"
                      }`}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block font-medium text-stone-700">Housing</label>
                <div className="flex gap-2 mt-2">
                  {[
                    { value: "ON_CAMPUS" as const, label: "On-campus" },
                    { value: "OFF_CAMPUS" as const, label: "Off-campus" },
                  ].map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() =>
                        setData((d) => ({
                          ...d,
                          housingType: o.value,
                          dormRanking: o.value === "ON_CAMPUS" ? d.dormRanking?.length ? d.dormRanking : [] : [],
                          preferences: undefined,
                        }))
                      }
                      className={`flex-1 py-2.5 px-3 rounded-xl border text-sm font-medium ${
                        data.housingType === o.value ? "border-amber-500 bg-amber-50 text-amber-900" : "border-stone-300"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block font-medium text-stone-700">Bio</label>
                <textarea
                  value={data.bio ?? ""}
                  onChange={(e) => setData((d) => ({ ...d, bio: e.target.value }))}
                  placeholder="Clubs, major, what you are looking for in a roommate…"
                  rows={4}
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-400/50 outline-none"
                />
              </div>
              <div>
                <label className="block font-medium text-stone-700">Profile photo (optional)</label>
                <input
                  type="url"
                  value={data.avatarUrl ?? ""}
                  onChange={(e) => setData((d) => ({ ...d, avatarUrl: e.target.value || undefined }))}
                  placeholder="https://…"
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm"
                />
              </div>
            </div>
          )}

          {stepId === "housing" && !data.housingType && (
            <p className="text-sm text-red-600">Go back to step 1 and select on-campus or off-campus housing.</p>
          )}

          {stepId === "housing" && data.housingType === "ON_CAMPUS" && (
            <div className="space-y-5">
              <p className="text-sm text-stone-600">
                Rank <span className="font-medium text-stone-800">CMU residence halls</span> for your cohort — most preferred
                at the top. Drag to reorder.
              </p>
              {onCampusDorms.length > 0 && data.dormRanking && data.dormRanking.length > 0 ? (
                <DormRankList
                  dorms={onCampusDorms}
                  order={data.dormRanking}
                  onOrderChange={(next) => setData((d) => ({ ...d, dormRanking: next }))}
                />
              ) : (
                <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                  Loading dorm list… go back and confirm housing if this persists.
                </p>
              )}
              <div>
                <label className="block font-medium text-stone-700 mb-2">Room style preferences</label>
                <p className="text-xs text-stone-500 mb-2">Select all that you would consider.</p>
                <div className="flex flex-wrap gap-2">
                  {(housingOpts?.roomStyles ?? []).map((o) => {
                    const sel = data.roomStylePreferences?.includes(o.id);
                    return (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() =>
                          setData((d) => {
                            const cur = d.roomStylePreferences ?? [];
                            const next = sel ? cur.filter((x) => x !== o.id) : [...cur, o.id];
                            return { ...d, roomStylePreferences: next };
                          })
                        }
                        className={`py-2 px-3 rounded-xl border text-sm ${
                          sel ? "border-amber-500 bg-amber-50 text-amber-900" : "border-stone-300"
                        }`}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {stepId === "housing" && data.housingType === "OFF_CAMPUS" && (
            <div className="space-y-4">
              <p className="text-sm text-stone-600">
                Off-campus search — budget, lease, and Pittsburgh neighborhoods near CMU.
              </p>
              <div>
                <label className="block font-medium text-stone-700 mb-2">Preferred neighborhoods</label>
                <div className="flex flex-wrap gap-2">
                  {(housingOpts?.neighborhoods ?? []).map((o) => {
                    const sel = data.preferredAreas?.includes(o.id);
                    return (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() =>
                          setData((d) => {
                            const cur = d.preferredAreas ?? [];
                            const next = sel ? cur.filter((x) => x !== o.id) : [...cur, o.id];
                            return { ...d, preferredAreas: next };
                          })
                        }
                        className={`py-2 px-3 rounded-xl border text-sm ${
                          sel ? "border-amber-500 bg-amber-50 text-amber-900" : "border-stone-300"
                        }`}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-stone-700 text-sm">Budget min ($/mo)</label>
                  <input
                    type="number"
                    min={0}
                    value={data.budgetMin ?? ""}
                    onChange={(e) =>
                      setData((d) => ({ ...d, budgetMin: e.target.value ? Number(e.target.value) : undefined }))
                    }
                    className="mt-1 w-full px-4 py-2 rounded-xl border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 text-sm">Budget max ($/mo)</label>
                  <input
                    type="number"
                    min={0}
                    value={data.budgetMax ?? ""}
                    onChange={(e) =>
                      setData((d) => ({ ...d, budgetMax: e.target.value ? Number(e.target.value) : undefined }))
                    }
                    className="mt-1 w-full px-4 py-2 rounded-xl border border-stone-300"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium text-stone-700">Lease term</label>
                <select
                  value={data.leaseDuration ?? ""}
                  onChange={(e) =>
                    setData((d) => ({ ...d, leaseDuration: e.target.value as ProfileUpdate["leaseDuration"] }))
                  }
                  className="mt-1 w-full px-4 py-2 rounded-xl border border-stone-300"
                >
                  <option value="">Select…</option>
                  {HOUSING_OPTIONS.leaseDuration.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-stone-700 text-sm">Target move-in</label>
                <input
                  type="date"
                  value={data.moveInDate ?? ""}
                  onChange={(e) => setData((d) => ({ ...d, moveInDate: e.target.value }))}
                  className="mt-1 w-full px-4 py-2 rounded-xl border border-stone-300"
                />
              </div>
              <div>
                <label className="block font-medium text-stone-700 mb-2">Room / unit type</label>
                <div className="flex flex-wrap gap-2">
                  {(housingOpts?.offCampusRoomTypes ?? []).map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setData((d) => ({ ...d, offCampusRoomType: o.id }))}
                      className={`py-2 px-3 rounded-xl border text-sm ${
                        data.offCampusRoomType === o.id ? "border-amber-500 bg-amber-50 text-amber-900" : "border-stone-300"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {stepId === "lifestyle" && (
            <div className="space-y-4">
              {(
                [
                  "sleepSchedule",
                  "guestsFrequency",
                  "studyEnvironment",
                  "noiseTolerance",
                  "smokingStance",
                  "drinkingStance",
                  "petsStance",
                ] as const
              ).map((key) => (
                <div key={key}>
                  <label className="block font-medium text-stone-700 capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(LIFESTYLE_OPTIONS as Record<string, { value: string; label: string }[]>)[key]?.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setData((d) => ({ ...d, [key]: o.value }))}
                        className={`py-2 px-3 rounded-xl border text-sm ${
                          (data as Record<string, string>)[key] === o.value
                            ? "border-amber-500 bg-amber-50 text-amber-800"
                            : "border-stone-300"
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div>
                <label className="block font-medium text-stone-700">Cleanliness (1–5)</label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={data.cleanlinessLevel ?? 3}
                  onChange={(e) => setData((d) => ({ ...d, cleanlinessLevel: Number(e.target.value) }))}
                  className="w-full mt-2"
                />
                <span className="text-sm text-stone-500">{data.cleanlinessLevel ?? 3}</span>
              </div>
            </div>
          )}

          {stepId === "personality" && (
            <div className="space-y-4">
              <div>
                <label className="block font-medium text-stone-700">Introvert (1) ↔ Extrovert (10)</label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={data.introvertExtrovert ?? 5}
                  onChange={(e) => setData((d) => ({ ...d, introvertExtrovert: Number(e.target.value) }))}
                  className="w-full mt-2"
                />
                <span className="text-sm text-stone-500">{data.introvertExtrovert ?? 5}</span>
              </div>
              <div>
                <label className="block font-medium text-stone-700">Social habits</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {PERSONALITY_OPTIONS.socialHabits.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setData((d) => ({ ...d, socialHabits: o.value }))}
                      className={`py-2 px-3 rounded-xl border text-sm ${
                        data.socialHabits === o.value ? "border-amber-500 bg-amber-50 text-amber-800" : "border-stone-300"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block font-medium text-stone-700">Conflict style</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {PERSONALITY_OPTIONS.conflictStyle.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setData((d) => ({ ...d, conflictStyle: o.value }))}
                      className={`py-2 px-3 rounded-xl border text-sm ${
                        data.conflictStyle === o.value ? "border-amber-500 bg-amber-50 text-amber-800" : "border-stone-300"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {stepId === "preferences" && (
            <div className="space-y-4">
              <p className="text-sm text-stone-600">
                Set how strongly each area matters and mark <span className="font-medium">dealbreakers</span> — we will
                not suggest roommates who fail a mutual dealbreaker.
              </p>
              {preferenceMeta.map((meta) => {
                const i = (data.preferences ?? []).findIndex((p) => p.category === meta.category);
                if (i < 0) return null;
                const pref = data.preferences![i];
                return (
                  <div key={pref.category} className="p-3 rounded-xl border border-stone-200 bg-stone-50/50">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div>
                        <span className="font-medium text-stone-800">{meta.label}</span>
                        {meta.hint && <p className="text-xs text-stone-500 mt-0.5">{meta.hint}</p>}
                      </div>
                      <label className="flex items-center gap-2 text-xs shrink-0 text-stone-600">
                        <input
                          type="checkbox"
                          checked={pref.dealbreaker}
                          onChange={(e) =>
                            setData((d) => ({
                              ...d,
                              preferences: (d.preferences ?? []).map((p, j) =>
                                j === i ? { ...p, dealbreaker: e.target.checked } : p
                              ),
                            }))
                          }
                        />
                        Dealbreaker
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-500">Importance</span>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={pref.strength}
                        onChange={(e) =>
                          setData((d) => ({
                            ...d,
                            preferences: (d.preferences ?? []).map((p, j) =>
                              j === i ? { ...p, strength: Number(e.target.value) } : p
                            ),
                          }))
                        }
                        className="flex-1"
                      />
                      <span className="text-sm w-6 tabular-nums">{pref.strength}</span>
                    </div>
                  </div>
                );
              })}
              <div>
                <label className="block font-medium text-stone-700">Tags / interests (comma-separated)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. SCS, orchestra, intramural"
                  className="mt-1 w-full px-4 py-2 rounded-xl border border-stone-300"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={() => setStepIndex((i) => i - 1)}
              className="py-3 px-5 rounded-xl border border-stone-300 text-stone-700 hover:bg-white"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={saveAndNext}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 disabled:opacity-60 shadow-sm"
          >
            {saving ? "Saving…" : stepIndex === STEPS.length - 1 ? "Finish & go to swipe" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
