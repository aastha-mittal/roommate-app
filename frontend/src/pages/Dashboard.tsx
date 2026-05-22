import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { profile as profileApi, type ProfileResponse } from "../api/client";
import PageHeader from "../components/ui/PageHeader";
import EmptyState from "../components/ui/EmptyState";

export default function Dashboard() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    profileApi
      .get()
      .then((p) => {
        setProfile(p);
        setError(null);
      })
      .catch((err) => {
        setProfile(null);
        setError(err instanceof Error ? err.message : "Failed to load profile");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="animate-spin w-10 h-10 border-2 border-cmu-red border-t-transparent rounded-full mb-4" />
        <p className="text-stone-500">Loading your profile…</p>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Profile unavailable"
        description={error}
        action={
          <button type="button" onClick={load} className="btn-primary">
            Retry
          </button>
        }
      />
    );
  }

  if (!profile) return null;

  const housingLabel = profile.housingType?.replace("_", " ").toLowerCase() ?? "—";
  const leaseLabel = profile.leaseDuration?.replace("_", " ").toLowerCase() ?? "—";
  const budget =
    [profile.budgetMin, profile.budgetMax].filter(Boolean).length > 0
      ? `$${profile.budgetMin ?? "?"}–$${profile.budgetMax ?? "?"} / mo`
      : null;
  const name = profile.displayName?.trim() || "Your profile";

  return (
    <div>
      <PageHeader
        title="Profile"
        subtitle="Your housing and lifestyle preferences drive who appears in swipe and how compatibility is scored."
        action={
          <Link to="/onboarding" className="btn-primary shrink-0">
            Edit preferences
          </Link>
        }
      />

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        <div className="card overflow-hidden">
          <div className="h-36 bg-gradient-to-br from-red-50 via-amber-50 to-stone-100 flex items-center justify-center">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" className="w-24 h-24 rounded-2xl object-cover shadow-md border-4 border-white" />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-white shadow-md flex items-center justify-center text-3xl font-display font-bold text-cmu-red border-4 border-white">
                {(profile.displayName?.[0] ?? profile.userId?.[0] ?? "?").toUpperCase()}
              </div>
            )}
          </div>
          <div className="p-5 text-center border-t border-stone-100">
            <h2 className="font-display text-lg font-semibold text-stone-900">{name}</h2>
            <p className="text-sm text-stone-500 capitalize mt-1">
              {profile.schoolYear?.replace("_", " ") ?? "—"}
              {profile.isFirstYear ? " · First-year" : ""}
            </p>
            <span className="chip mt-3 bg-stone-100 text-stone-700 border border-stone-200 capitalize inline-flex">
              {housingLabel}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {profile.bio && (
            <section className="card p-5">
              <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">About</h3>
              <p className="text-stone-700 leading-relaxed">{profile.bio}</p>
            </section>
          )}

          {profile.tags && profile.tags.length > 0 && (
            <section className="card p-5">
              <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {profile.tags.map((t) => (
                  <span key={t} className="chip bg-stone-100 text-stone-700 border border-stone-200">
                    {t}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className="card p-5">
            <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">Housing</h3>
            <dl className="grid sm:grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-stone-500">Type</dt>
                <dd className="font-medium text-stone-800 capitalize">{housingLabel}</dd>
              </div>
              {profile.housingType === "ON_CAMPUS" && (profile.dormRanking?.length ?? 0) > 0 && (
                <div className="sm:col-span-2">
                  <dt className="text-stone-500 mb-1">Dorm ranking</dt>
                  <dd className="font-medium text-stone-800">
                    <ol className="list-decimal list-inside space-y-0.5">
                      {(profile.dormRanking ?? []).map((dorm) => (
                        <li key={dorm} className="capitalize">
                          {dorm.replace(/_/g, " ")}
                        </li>
                      ))}
                    </ol>
                  </dd>
                </div>
              )}
              {(profile.roomStylePreferences?.length ?? 0) > 0 && (
                <div className="sm:col-span-2">
                  <dt className="text-stone-500">Room styles</dt>
                  <dd className="font-medium text-stone-800 capitalize">
                    {(profile.roomStylePreferences ?? []).map((r) => r.replace(/_/g, " ")).join(", ")}
                  </dd>
                </div>
              )}
              {profile.housingType === "OFF_CAMPUS" && (
                <>
                  <div className="sm:col-span-2">
                    <dt className="text-stone-500">Preferred areas</dt>
                    <dd className="font-medium text-stone-800">
                      {profile.preferredAreas?.length
                        ? profile.preferredAreas.map((a) => a.replace(/_/g, " ")).join(", ")
                        : "—"}
                    </dd>
                  </div>
                  {profile.offCampusRoomType && (
                    <div>
                      <dt className="text-stone-500">Room type</dt>
                      <dd className="font-medium capitalize">{profile.offCampusRoomType.replace(/_/g, " ")}</dd>
                    </div>
                  )}
                  {budget && (
                    <div>
                      <dt className="text-stone-500">Budget</dt>
                      <dd className="font-medium">{budget}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-stone-500">Lease</dt>
                    <dd className="font-medium capitalize">{leaseLabel}</dd>
                  </div>
                </>
              )}
            </dl>
          </section>

          <section className="card p-5">
            <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">Lifestyle</h3>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <dt className="text-stone-500">Sleep</dt>
                <dd className="font-medium capitalize">{profile.sleepSchedule?.replace(/_/g, " ") ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-stone-500">Cleanliness</dt>
                <dd className="font-medium">{profile.cleanlinessLevel != null ? `${profile.cleanlinessLevel}/5` : "—"}</dd>
              </div>
              <div>
                <dt className="text-stone-500">Guests</dt>
                <dd className="font-medium capitalize">{profile.guestsFrequency?.replace(/_/g, " ") ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-stone-500">Noise</dt>
                <dd className="font-medium">{profile.noiseTolerance ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-stone-500">Smoking</dt>
                <dd className="font-medium capitalize">{profile.smokingStance?.replace(/_/g, " ") ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-stone-500">Pets</dt>
                <dd className="font-medium capitalize">{profile.petsStance?.replace(/_/g, " ") ?? "—"}</dd>
              </div>
            </dl>
          </section>

          {(profile.preferences?.length ?? 0) > 0 && (
            <section className="card p-5">
              <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">Dealbreakers & strength</h3>
              <ul className="space-y-2 text-sm">
                {(profile.preferences ?? []).map((p) => (
                  <li
                    key={p.category}
                    className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0"
                  >
                    <span className="text-stone-700 capitalize">{p.category.replace(/_/g, " ")}</span>
                    <span className="text-stone-600">
                      Strength {p.strength}
                      {p.dealbreaker && (
                        <span className="ml-2 chip bg-red-50 text-cmu-red border-red-100">Dealbreaker</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
