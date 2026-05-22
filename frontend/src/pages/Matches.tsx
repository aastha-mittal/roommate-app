import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { match as matchApi, type MatchListItem } from "../api/client";
import PageHeader from "../components/ui/PageHeader";
import CompatibilityBar from "../components/ui/CompatibilityBar";
import EmptyState from "../components/ui/EmptyState";

export default function Matches() {
  const [matches, setMatches] = useState<MatchListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    matchApi
      .list()
      .then((res) => {
        setMatches(res.matches);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load matches"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="animate-spin w-10 h-10 border-2 border-cmu-red border-t-transparent rounded-full mb-4" />
        <p className="text-stone-500">Loading your matches…</p>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Could not load matches"
        description={error}
        action={
          <button type="button" onClick={load} className="btn-primary">
            Try again
          </button>
        }
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="Matches"
        subtitle="Mutual likes appear here. Open a conversation to coordinate housing plans."
        action={
          <Link to="/swipe" className="btn-secondary shrink-0">
            Find more
          </Link>
        }
      />

      {matches.length === 0 ? (
        <EmptyState
          title="No matches yet"
          description="When you and another student both swipe right, you'll see them here and can start chatting."
          action={
            <Link to="/swipe" className="btn-primary">
              Go to Swipe
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {matches.map((m) => {
            const displayName =
              m.otherProfile?.displayName?.trim() || m.otherEmail?.split("@")[0] || "Match";
            return (
              <li key={m.matchId}>
                <Link
                  to={`/matches/${m.matchId}/chat`}
                  className="card p-4 flex flex-col gap-3 hover:border-cmu-red/30 hover:shadow-md transition h-full"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-50 to-amber-50 flex items-center justify-center text-xl font-display font-bold text-cmu-red shrink-0 border border-stone-100">
                      {(m.otherProfile?.displayName?.[0] ?? m.otherEmail?.[0] ?? "?").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-semibold text-stone-900 truncate">{displayName}</p>
                      {m.otherProfile?.bio && (
                        <p className="text-sm text-stone-500 line-clamp-2 mt-0.5">{m.otherProfile.bio}</p>
                      )}
                    </div>
                    <span className="text-stone-400 text-lg" aria-hidden>
                      →
                    </span>
                  </div>
                  {m.compatibilityScore != null && (
                    <CompatibilityBar score={m.compatibilityScore} compact />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
