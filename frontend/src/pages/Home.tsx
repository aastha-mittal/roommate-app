import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { match as matchApi } from "../api/client";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";

export default function Home() {
  const [stats, setStats] = useState<{
    likesGiven: number;
    passesGiven: number;
    matchCount: number;
    onboardingComplete: boolean;
    housingType?: string;
    displayName?: string;
  } | null>(null);

  useEffect(() => {
    matchApi.stats().then(setStats).catch(() => setStats(null));
  }, []);

  return (
    <div>
      <PageHeader
        title={stats?.displayName ? `Hi, ${stats.displayName}` : "Welcome back"}
        subtitle="Your roommate search hub at CMU — swipe, match, and chat in one place."
        action={
          <Link to="/swipe" className="btn-primary shrink-0">
            Start swiping
          </Link>
        }
      />

      {!stats?.onboardingComplete && (
        <div className="card border-amber-200 bg-amber-50/80 p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="font-medium text-amber-900">Finish your profile</p>
            <p className="text-sm text-amber-800/90">Onboarding unlocks personalized matches.</p>
          </div>
          <Link to="/onboarding" className="btn-secondary border-amber-300 bg-white">
            Complete onboarding
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <StatCard label="Matches" value={stats?.matchCount ?? "—"} accent="red" />
        <StatCard
          label="Likes sent"
          value={stats?.likesGiven ?? "—"}
          accent="amber"
          hint={stats?.likesGiven ? "View in Likes tab" : undefined}
        />
        <StatCard label="Passed" value={stats?.passesGiven ?? "—"} />
        <StatCard
          label="Housing"
          value={stats?.housingType?.replace("_", " ") ?? "—"}
          hint={stats?.onboardingComplete ? "Profile complete" : "Incomplete"}
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/swipe" className="card p-5 hover:border-cmu-red/40 hover:shadow-md transition group">
          <span className="text-2xl">👋</span>
          <h3 className="font-display font-semibold text-stone-900 mt-2 group-hover:text-cmu-red">Swipe</h3>
          <p className="text-sm text-stone-600 mt-1">Full profiles, scrollable cards. Heart or pass.</p>
        </Link>
        <Link to="/likes" className="card p-5 hover:border-cmu-red/40 hover:shadow-md transition group">
          <span className="text-2xl">♥</span>
          <h3 className="font-display font-semibold text-stone-900 mt-2 group-hover:text-cmu-red">Likes</h3>
          <p className="text-sm text-stone-600 mt-1">Everyone you hearted — pending vs matched.</p>
        </Link>
        <Link to="/matches" className="card p-5 hover:border-cmu-red/40 hover:shadow-md transition group">
          <span className="text-2xl">💬</span>
          <h3 className="font-display font-semibold text-stone-900 mt-2 group-hover:text-cmu-red">Matches</h3>
          <p className="text-sm text-stone-600 mt-1">Mutual likes only — open chat here.</p>
        </Link>
        <Link to="/profile" className="card p-5 hover:border-cmu-red/40 hover:shadow-md transition group">
          <span className="text-2xl">⚙️</span>
          <h3 className="font-display font-semibold text-stone-900 mt-2 group-hover:text-cmu-red">Profile</h3>
          <p className="text-sm text-stone-600 mt-1">Update dorm rankings, budget, and dealbreakers.</p>
        </Link>
      </div>
    </div>
  );
}
