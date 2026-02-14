import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { match as matchApi, type MatchListItem } from "../api/client";

export default function Matches() {
  const [matches, setMatches] = useState<MatchListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    matchApi
      .list()
      .then((res) => setMatches(res.matches))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-xl font-semibold text-stone-800 mb-4">Matches</h1>
      <p className="text-sm text-stone-500 mb-6">Chat with roommates you've matched with.</p>

      {matches.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-stone-200">
          <p className="text-stone-600">No matches yet.</p>
          <p className="text-sm text-stone-500 mt-1">Keep swiping to find roommates!</p>
          <Link to="/swipe" className="inline-block mt-4 py-2 px-4 rounded-xl bg-amber-500 text-white text-sm font-medium">
            Go to Swipe
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {matches.map((m) => (
            <li key={m.matchId}>
              <Link
                to={`/matches/${m.matchId}/chat`}
                className="flex items-center gap-4 p-4 bg-white rounded-xl border border-stone-200 hover:border-amber-300 hover:bg-amber-50/50 transition"
              >
                <div className="w-12 h-12 rounded-full bg-amber-200 flex items-center justify-center text-lg font-display font-semibold text-amber-900">
                  {m.otherEmail?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-800 truncate">{m.otherEmail}</p>
                  {m.otherProfile?.bio && (
                    <p className="text-sm text-stone-500 truncate">{m.otherProfile.bio}</p>
                  )}
                </div>
                <span className="text-stone-400">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
