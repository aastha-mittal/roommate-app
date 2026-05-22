import type { Candidate } from "../api/client";

function fmt(s?: string | null) {
  if (!s) return null;
  return s.replace(/_/g, " ").toLowerCase();
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || value === "" || value === "—") return null;
  return (
    <div className="flex justify-between gap-3 py-1.5 border-b border-stone-100 last:border-0 text-sm">
      <span className="text-stone-500 shrink-0">{label}</span>
      <span className="font-medium text-stone-800 text-right capitalize">{value}</span>
    </div>
  );
}

export default function ProfileDetailPanel({ p }: { p: Candidate }) {
  const budget =
    p.budgetMin != null || p.budgetMax != null
      ? `$${p.budgetMin ?? "?"}–$${p.budgetMax ?? "?"} / mo`
      : null;

  return (
    <div className="space-y-4">
      {p.bio && (
        <section>
          <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">About</h3>
          <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">{p.bio}</p>
        </section>
      )}

      <section>
        <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Housing</h3>
        <div className="rounded-xl border border-stone-100 bg-stone-50/50 px-3 py-1">
          <Row label="Type" value={fmt(p.housingType)} />
          {p.housingType === "ON_CAMPUS" && (p.dormLabels?.length ?? 0) > 0 && (
            <div className="py-2 border-b border-stone-100">
              <span className="text-stone-500 text-sm">Dorm ranking</span>
              <ol className="mt-1 list-decimal list-inside text-sm font-medium text-stone-800">
                {p.dormLabels!.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ol>
            </div>
          )}
          {p.housingType === "OFF_CAMPUS" && (
            <>
              <Row
                label="Areas"
                value={p.preferredAreas?.length ? p.preferredAreas.map((a) => fmt(a)).join(", ") : null}
              />
              <Row label="Room type" value={fmt(p.offCampusRoomType)} />
              <Row label="Budget" value={budget} />
              <Row label="Lease" value={fmt(p.leaseDuration)} />
            </>
          )}
          {(p.roomStylePreferences?.length ?? 0) > 0 && (
            <Row label="Room style" value={p.roomStylePreferences!.map((r) => fmt(r)).join(", ")} />
          )}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Lifestyle</h3>
        <div className="rounded-xl border border-stone-100 bg-stone-50/50 px-3 py-1">
          <Row label="Sleep" value={fmt(p.sleepSchedule)} />
          <Row label="Cleanliness" value={p.cleanlinessLevel != null ? `${p.cleanlinessLevel}/5` : null} />
          <Row label="Guests" value={fmt(p.guestsFrequency)} />
          <Row label="Study" value={fmt(p.studyEnvironment)} />
          <Row label="Noise" value={p.noiseTolerance} />
          <Row label="Smoking" value={fmt(p.smokingStance)} />
          <Row label="Drinking" value={fmt(p.drinkingStance)} />
          <Row label="Pets" value={fmt(p.petsStance)} />
          <Row label="Social" value={fmt(p.socialHabits)} />
          <Row label="Conflict" value={fmt(p.conflictStyle)} />
          {p.introvertExtrovert != null && (
            <Row label="Introvert ↔ extrovert" value={`${p.introvertExtrovert}/10`} />
          )}
        </div>
      </section>

      {(p.sharedActivities?.length ?? 0) > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Activities</h3>
          <div className="flex flex-wrap gap-1.5">
            {p.sharedActivities!.map((a) => (
              <span key={a} className="chip bg-stone-100 text-stone-700 border border-stone-200">
                {a}
              </span>
            ))}
          </div>
        </section>
      )}

      {p.compatibilityExplanation?.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">Why you match</h3>
          <ul className="text-sm text-stone-700 space-y-1">
            {p.compatibilityExplanation.map((line) => (
              <li key={line}>• {line}</li>
            ))}
          </ul>
        </section>
      )}

      {p.tags?.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Tags</h3>
          <div className="flex flex-wrap gap-1.5">
            {p.tags.map((t) => (
              <span key={t} className="chip bg-red-50 text-cmu-red border border-red-100">
                {t}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
