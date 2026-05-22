import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { match as matchApi, type LikeSentItem } from "../api/client";
import PageHeader from "../components/ui/PageHeader";
import CompatibilityBar from "../components/ui/CompatibilityBar";
import EmptyState from "../components/ui/EmptyState";

export default function Likes() {
  const [likes, setLikes] = useState<LikeSentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    matchApi
      .likes()
      .then((r) => setLikes(r.likes))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load likes"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const pending = likes.filter((l) => l.status === "pending");
  const matched = likes.filter((l) => l.status === "matched");

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="animate-spin w-10 h-10 border-2 border-cmu-red border-t-transparent rounded-full mb-4" />
        <p className="text-stone-500">Loading your likes…</p>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Could not load likes"
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
        title="Likes you sent"
        subtitle="Hearts here are waiting for them to like you back. When it's mutual, they move to Matches and you can chat."
      />

      {likes.length === 0 ? (
        <EmptyState
          title="No likes yet"
          description="Swipe right on someone in Discover — they'll show up here until they like you back."
          action={
            <Link to="/swipe" className="btn-primary">
              Go to Swipe
            </Link>
          }
        />
      ) : (
        <div className="space-y-8">
          {pending.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">
                Waiting for them ({pending.length})
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {pending.map((l) => (
                  <LikeCard key={l.userId} item={l} />
                ))}
              </ul>
            </section>
          )}
          {matched.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">
                Matched ({matched.length})
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {matched.map((l) => (
                  <LikeCard key={l.userId} item={l} />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function LikeCard({ item }: { item: LikeSentItem }) {
  const name = item.displayName?.trim() || item.email?.split("@")[0] || "Student";
  const likedDate = new Date(item.likedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  return (
    <li className="card p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-50 to-amber-50 flex items-center justify-center font-display font-bold text-cmu-red shrink-0">
          {name[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-stone-900">{name}</p>
          <p className="text-xs text-stone-500">Liked {likedDate}</p>
          {item.status === "pending" ? (
            <span className="chip mt-1 bg-amber-50 text-amber-800 border border-amber-200">Pending</span>
          ) : (
            <span className="chip mt-1 bg-emerald-50 text-emerald-800 border border-emerald-200">Matched</span>
          )}
        </div>
      </div>
      {item.bio && <p className="text-sm text-stone-600 line-clamp-2">{item.bio}</p>}
      <CompatibilityBar score={item.compatibilityScore} compact />
      {item.status === "matched" && item.matchId && (
        <Link to={`/matches/${item.matchId}/chat`} className="btn-primary text-center text-sm py-2">
          Open chat
        </Link>
      )}
    </li>
  );
}
