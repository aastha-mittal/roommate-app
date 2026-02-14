import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { profile } from "../api/client";
import type { ProfileUpdate } from "../api/client";

const STEPS = [
  { id: "housing", title: "Housing" },
  { id: "lifestyle", title: "Lifestyle" },
  { id: "personality", title: "Personality" },
  { id: "preferences", title: "Roommate preferences" },
  { id: "bio", title: "Bio" },
];

const HOUSING_OPTIONS = {
  housingType: [
    { value: "ON_CAMPUS", label: "On-campus" },
    { value: "OFF_CAMPUS", label: "Off-campus" },
  ],
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

const PREFERENCE_CATEGORIES = [
  { key: "CLEANLINESS", label: "Cleanliness" },
  { key: "SLEEP_SCHEDULE", label: "Sleep schedule" },
  { key: "GUESTS", label: "Guests" },
  { key: "NOISE_TOLERANCE", label: "Noise" },
  { key: "SMOKING", label: "Smoking" },
  { key: "PETS", label: "Pets" },
  { key: "BUDGET", label: "Budget" },
];

export default function Onboarding() {
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<ProfileUpdate>({
    preferredAreas: [],
    sharedActivities: [],
    tags: [],
    preferences: PREFERENCE_CATEGORIES.map((c) => ({ category: c.key, value: "FLEXIBLE", strength: 5, dealbreaker: false })),
  });
  const [areasInput, setAreasInput] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    profile
      .get()
      .then((p) => {
        setData({
          housingType: p.housingType,
          preferredAreas: p.preferredAreas ?? [],
          budgetMin: p.budgetMin ?? undefined,
          budgetMax: p.budgetMax ?? undefined,
          leaseDuration: p.leaseDuration,
          moveInDate: p.moveInDate ? p.moveInDate.slice(0, 10) : undefined,
          genderPreference: p.genderPreference ?? undefined,
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
          sharedActivities: p.sharedActivities ?? [],
          bio: p.bio,
          tags: p.tags ?? [],
          preferences: p.preferences?.length
            ? p.preferences.map((pr) => ({ category: pr.category, value: pr.value, strength: pr.strength, dealbreaker: pr.dealbreaker }))
            : PREFERENCE_CATEGORIES.map((c) => ({ category: c.key, value: "FLEXIBLE", strength: 5, dealbreaker: false })),
        });
        setAreasInput((p.preferredAreas ?? []).join(", "));
        setTagsInput((p.tags ?? []).join(", "));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const saveAndNext = async () => {
    setSaving(true);
    try {
      const payload: ProfileUpdate = {
        ...data,
        preferredAreas: areasInput.split(",").map((s) => s.trim()).filter(Boolean),
        tags: tagsInput.split(",").map((s) => s.trim()).filter(Boolean),
      };
      await profile.update(payload);
      if (stepIndex === STEPS.length - 1) {
        await profile.onboardingComplete();
        navigate("/swipe", { replace: true });
      } else {
        setStepIndex((i) => i + 1);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const stepId = STEPS[stepIndex].id;

  return (
    <div className="min-h-screen bg-stone-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <div className="flex gap-1 mb-2">
            {STEPS.map((s, i) => (
              <div
                key={s.id}
                className={`h-1.5 flex-1 rounded-full ${i <= stepIndex ? "bg-amber-500" : "bg-stone-200"}`}
              />
            ))}
          </div>
          <p className="text-sm text-stone-500">
            Step {stepIndex + 1} of {STEPS.length}: {STEPS[stepIndex].title}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 mb-6">
          {stepId === "housing" && (
            <div className="space-y-4">
              <label className="block font-medium text-stone-700">Housing type</label>
              <div className="flex gap-2">
                {HOUSING_OPTIONS.housingType.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setData((d) => ({ ...d, housingType: o.value }))}
                    className={`flex-1 py-2 px-3 rounded-xl border ${data.housingType === o.value ? "border-amber-500 bg-amber-50 text-amber-800" : "border-stone-300"}`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <label className="block font-medium text-stone-700">Preferred areas (comma-separated)</label>
              <input
                type="text"
                value={areasInput}
                onChange={(e) => setAreasInput(e.target.value)}
                placeholder="e.g. Squirrel Hill, Shadyside"
                className="w-full px-4 py-2 rounded-xl border border-stone-300"
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-stone-700 text-sm">Budget min ($)</label>
                  <input
                    type="number"
                    value={data.budgetMin ?? ""}
                    onChange={(e) => setData((d) => ({ ...d, budgetMin: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full px-4 py-2 rounded-xl border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 text-sm">Budget max ($)</label>
                  <input
                    type="number"
                    value={data.budgetMax ?? ""}
                    onChange={(e) => setData((d) => ({ ...d, budgetMax: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full px-4 py-2 rounded-xl border border-stone-300"
                  />
                </div>
              </div>
              <label className="block font-medium text-stone-700">Lease duration</label>
              <select
                value={data.leaseDuration ?? ""}
                onChange={(e) => setData((d) => ({ ...d, leaseDuration: e.target.value as ProfileUpdate["leaseDuration"] }))}
                className="w-full px-4 py-2 rounded-xl border border-stone-300"
              >
                {HOUSING_OPTIONS.leaseDuration.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <label className="block font-medium text-stone-700 text-sm">Move-in date</label>
              <input
                type="date"
                value={data.moveInDate ?? ""}
                onChange={(e) => setData((d) => ({ ...d, moveInDate: e.target.value }))}
                className="w-full px-4 py-2 rounded-xl border border-stone-300"
              />
            </div>
          )}

          {stepId === "lifestyle" && (
            <div className="space-y-4">
              {(["sleepSchedule", "guestsFrequency", "studyEnvironment", "noiseTolerance", "smokingStance", "drinkingStance", "petsStance"] as const).map((key) => (
                <div key={key}>
                  <label className="block font-medium text-stone-700 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(LIFESTYLE_OPTIONS as Record<string, { value: string; label: string }[]>)[key]?.map((o: { value: string; label: string }) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setData((d) => ({ ...d, [key]: o.value }))}
                        className={`py-2 px-3 rounded-xl border text-sm ${(data as Record<string, string>)[key] === o.value ? "border-amber-500 bg-amber-50 text-amber-800" : "border-stone-300"}`}
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
                  className="w-full"
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
                  className="w-full"
                />
                <span className="text-sm text-stone-500">{data.introvertExtrovert ?? 5}</span>
              </div>
              <div>
                <label className="block font-medium text-stone-700">Social habits</label>
                <div className="flex flex-wrap gap-2">
                  {PERSONALITY_OPTIONS.socialHabits.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setData((d) => ({ ...d, socialHabits: o.value }))}
                      className={`py-2 px-3 rounded-xl border text-sm ${data.socialHabits === o.value ? "border-amber-500 bg-amber-50 text-amber-800" : "border-stone-300"}`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block font-medium text-stone-700">Conflict style</label>
                <div className="flex flex-wrap gap-2">
                  {PERSONALITY_OPTIONS.conflictStyle.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setData((d) => ({ ...d, conflictStyle: o.value }))}
                      className={`py-2 px-3 rounded-xl border text-sm ${data.conflictStyle === o.value ? "border-amber-500 bg-amber-50 text-amber-800" : "border-stone-300"}`}
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
              <p className="text-sm text-stone-600">Set importance and mark dealbreakers for roommate matching.</p>
              {(data.preferences ?? []).map((pref, i) => (
                <div key={pref.category} className="p-3 rounded-xl border border-stone-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-stone-700">
                      {PREFERENCE_CATEGORIES.find((c) => c.key === pref.category)?.label ?? pref.category}
                    </span>
                    <label className="flex items-center gap-2 text-sm">
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
                    <span className="text-xs text-stone-500">Strength</span>
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
                    <span className="text-sm w-6">{pref.strength}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {stepId === "bio" && (
            <div className="space-y-4">
              <label className="block font-medium text-stone-700">About you</label>
              <textarea
                value={data.bio ?? ""}
                onChange={(e) => setData((d) => ({ ...d, bio: e.target.value }))}
                placeholder="A short bio for your profile..."
                rows={4}
                className="w-full px-4 py-2 rounded-xl border border-stone-300"
              />
              <label className="block font-medium text-stone-700">Tags / interests (comma-separated)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. hiking, cooking, quiet"
                className="w-full px-4 py-2 rounded-xl border border-stone-300"
              />
            </div>
          )}
        </div>

        <div className="flex gap-3">
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={() => setStepIndex((i) => i - 1)}
              className="py-3 px-6 rounded-xl border border-stone-300 text-stone-700"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={saveAndNext}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-amber-500 text-white font-medium hover:bg-amber-600 disabled:opacity-60"
          >
            {saving ? "Saving…" : stepIndex === STEPS.length - 1 ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
