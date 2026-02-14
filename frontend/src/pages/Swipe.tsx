import { useState, useEffect, useCallback } from "react";
import { match as matchApi, type Candidate } from "../api/client";
import SwipeCard from "../components/SwipeCard";

export default function Swipe() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [index, setIndex] = useState(0);
  const [exiting, setExiting] = useState<"left" | "right" | null>(null);
  const [matchModal, setMatchModal] = useState<{ candidate: Candidate; matchId: string } | null>(null);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { candidates: list } = await matchApi.candidates(20);
      setCandidates(list);
      setIndex(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load candidates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const current = candidates[index];

  const handleLike = async () => {
    if (!current) return;
    setExiting("right");
    await new Promise((r) => setTimeout(r, 280));
    try {
      const res = await matchApi.like(current.userId);
      if (res.match) setMatchModal({ candidate: current, matchId: res.match.id });
    } catch {
      // ignore
    }
    setExiting(null);
    setIndex((i) => i + 1);
  };

  const handlePass = async () => {
    if (!current) return;
    setExiting("left");
    await new Promise((r) => setTimeout(r, 280));
    try {
      await matchApi.pass(current.userId);
    } catch {
      // ignore
    }
    setExiting(null);
    setIndex((i) => i + 1);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full mb-4" />
        <p className="text-stone-500">Loading potential roommates...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          type="button"
          onClick={fetchCandidates}
          className="py-2 px-4 rounded-xl bg-amber-500 text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!current && candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-stone-600 mb-2">No more candidates right now.</p>
        <p className="text-sm text-stone-500 mb-4">Check back later or update your preferences.</p>
        <button
          type="button"
          onClick={fetchCandidates}
          className="py-2 px-4 rounded-xl bg-amber-500 text-white"
        >
          Refresh
        </button>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-stone-600 mb-4">You've seen everyone in this batch!</p>
        <button
          type="button"
          onClick={fetchCandidates}
          className="py-2 px-4 rounded-xl bg-amber-500 text-white"
        >
          Load more
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="font-display text-xl font-semibold text-stone-800 mb-4">Find your roommate</h1>
      <p className="text-sm text-stone-500 mb-6">Swipe right to like, left to pass.</p>

      <div className="relative h-[420px]">
        <SwipeCard
          candidate={current}
          onLike={handleLike}
          onPass={handlePass}
          isExiting={exiting}
        />
      </div>

      {matchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setMatchModal(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-lg font-display font-semibold text-amber-700 text-center mb-2">It's a match!</p>
            <p className="text-stone-600 text-center text-sm mb-4">You and {matchModal.candidate.email ?? "your match"} liked each other. Start a conversation.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMatchModal(null)}
                className="flex-1 py-2 rounded-xl border border-stone-300"
              >
                Keep swiping
              </button>
              <a
                href={`/matches/${matchModal.matchId}/chat`}
                className="flex-1 py-2 rounded-xl bg-amber-500 text-white text-center font-medium"
              >
                Chat now
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
