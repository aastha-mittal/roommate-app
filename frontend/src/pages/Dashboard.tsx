import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { profile as profileApi, type ProfileResponse } from "../api/client";

export default function Dashboard() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    profileApi
      .get()
      .then(setProfile)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!profile) return null;

  const housingLabel = profile.housingType?.replace("_", " ").toLowerCase() ?? "—";
  const leaseLabel = profile.leaseDuration?.replace("_", " ").toLowerCase() ?? "—";
  const budget = [profile.budgetMin, profile.budgetMax].filter(Boolean).length
    ? `$${profile.budgetMin ?? "?"}–$${profile.budgetMax ?? "?"}`
    : "—";

  return (
    <div>
      <h1 className="font-display text-xl font-semibold text-stone-800 mb-4">Profile</h1>
      <p className="text-sm text-stone-500 mb-6">View and edit your preferences. Changes affect who you see when swiping.</p>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="h-32 bg-gradient-to-br from-amber-100 to-stone-200 flex items-center justify-center">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" className="w-20 h-20 rounded-full object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-amber-300 flex items-center justify-center text-2xl font-display font-semibold text-amber-900">
              {profile.userId?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
        </div>
        <div className="p-6 space-y-4">
          {profile.bio && (
            <div>
              <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Bio</h3>
              <p className="text-stone-700">{profile.bio}</p>
            </div>
          )}
          {profile.tags?.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {profile.tags.map((t) => (
                  <span key={t} className="text-sm bg-stone-100 text-stone-600 px-2 py-1 rounded">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div>
            <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Housing</h3>
            <ul className="text-sm text-stone-700 space-y-1">
              <li>Type: {housingLabel}</li>
              <li>Areas: {profile.preferredAreas?.length ? profile.preferredAreas.join(", ") : "—"}</li>
              <li>Budget: {budget}</li>
              <li>Lease: {leaseLabel}</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Lifestyle</h3>
            <ul className="text-sm text-stone-700 space-y-1">
              <li>Sleep: {profile.sleepSchedule?.replace("_", " ") ?? "—"}</li>
              <li>Cleanliness: {profile.cleanlinessLevel ?? "—"}</li>
              <li>Guests: {profile.guestsFrequency?.replace("_", " ") ?? "—"}</li>
              <li>Noise: {profile.noiseTolerance ?? "—"}</li>
              <li>Smoking: {profile.smokingStance?.replace("_", " ") ?? "—"}</li>
              <li>Pets: {profile.petsStance?.replace("_", " ") ?? "—"}</li>
            </ul>
          </div>
          {profile.preferences?.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Dealbreakers & strength</h3>
              <ul className="text-sm space-y-1">
                {profile.preferences.map((p) => (
                  <li key={p.category} className="text-stone-700">
                    {p.category.replace("_", " ")}: strength {p.strength}
                    {p.dealbreaker && <span className="text-amber-600 ml-1">(dealbreaker)</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <Link
        to="/onboarding"
        className="mt-6 inline-block py-3 px-6 rounded-xl bg-amber-500 text-white font-medium hover:bg-amber-600"
      >
        Edit profile & preferences
      </Link>
    </div>
  );
}
