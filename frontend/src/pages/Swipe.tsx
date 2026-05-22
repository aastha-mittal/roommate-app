import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { match as matchApi, type Candidate } from "../api/client";
import SwipeCard from "../components/SwipeCard";
import PageHeader from "../components/ui/PageHeader";
import EmptyState from "../components/ui/EmptyState";

export default function Swipe() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [meta, setMeta] = useState<{ poolSampled?: number; cohortSize?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [index, setIndex] = useState(0);
  const [matchModal, setMatchModal] = useState<{ candidate: Candidate; matchId: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await matchApi.candidates(20);
      setCandidates(res.candidates);
      setMeta(res.meta ?? null);
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

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const current = candidates[index];
  const displayName = (c: Candidate) =>
    c.displayName?.trim() || c.email?.split("@")[0] || "them";

  const handleLike = async () => {
    if (!current) return;
    const snap = current;
    try {
      const res = await matchApi.like(snap.userId);
      if (res.match) {
        setMatchModal({ candidate: snap, matchId: res.match.id });
      } else {
        setToast(`Liked ${displayName(snap)} — see Likes to track until they heart you back.`);
      }
    } catch {
      /* ignore */
    }
    setIndex((i) => i + 1);
  };

  const handlePass = async () => {
    if (!current) return;
    const snap = current;
    try {
      await matchApi.pass(snap.userId);
      setToast(`Passed on ${displayName(snap)}.`);
    } catch {
      /* ignore */
    }
    setIndex((i) => i + 1);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="animate-spin w-10 h-10 border-2 border-cmu-red border-t-transparent rounded-full mb-4" />
        <p className="text-stone-500">Finding compatible roommates in your cohort…</p>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Could not load candidates"
        description={error}
        action={
          <button type="button" onClick={fetchCandidates} className="btn-primary">
            Try again
          </button>
        }
      />
    );
  }

  if (!current && candidates.length === 0) {
    return (
      <EmptyState
        title="No one new to show"
        description="Check back later or update your profile and dealbreakers to widen your pool."
        action={
          <div className="flex flex-wrap gap-2 justify-center">
            <button type="button" onClick={fetchCandidates} className="btn-primary">
              Refresh
            </button>
            <Link to="/profile" className="btn-secondary">
              Edit profile
            </Link>
          </div>
        }
      />
    );
  }

  if (!current) {
    return (
      <EmptyState
        title="Batch complete"
        description="You've seen everyone in this sample. Load another batch from your housing cohort."
        action={
          <div className="flex flex-wrap gap-2 justify-center">
            <button type="button" onClick={fetchCandidates} className="btn-primary">
              Load more
            </button>
            <Link to="/likes" className="btn-secondary">
              View likes sent
            </Link>
          </div>
        }
      />
    );
  }

  return (
    <div className="relative">
      <PageHeader
        title="Discover roommates"
        subtitle={
          meta?.cohortSize != null
            ? `~${meta.cohortSize} in your cohort · drag or tap ♥ / ✕ · scroll for full profile`
            : "Drag right to like, left to pass. Mutual likes → Matches → Chat."
        }
        action={
          <Link to="/likes" className="btn-secondary shrink-0 text-sm">
            Likes sent
          </Link>
        }
      />

      <div className="grid lg:grid-cols-[minmax(0,1fr)_280px] gap-6 items-stretch">
        <div className="relative w-full max-w-lg mx-auto lg:max-w-none h-[min(720px,calc(100vh-11rem))] min-h-[480px]">
          <SwipeCard key={current.userId} candidate={current} onLike={handleLike} onPass={handlePass} />
        </div>

        <aside className="space-y-4 hidden lg:block">
          <div className="card p-4">
            <h3 className="font-medium text-stone-900 text-sm">How matching works</h3>
            <ol className="mt-2 text-sm text-stone-600 space-y-2 list-decimal list-inside">
              <li>Drag right or tap ♥ to like</li>
              <li>They like you back → match</li>
              <li>Matches → Chat to talk</li>
            </ol>
          </div>
          <div className="card p-4 text-sm text-stone-600">
            <p>
              <span className="font-medium text-stone-800">{index + 1}</span> of {candidates.length} in this batch
            </p>
          </div>
        </aside>
      </div>

      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-md w-[calc(100%-2rem)] card-elevated px-4 py-3 text-sm text-stone-800 shadow-lg flex items-center justify-between gap-3"
          role="status"
        >
          <span>{toast}</span>
          <button type="button" className="text-cmu-red font-medium shrink-0" onClick={() => setToast(null)}>
            OK
          </button>
        </div>
      )}

      {matchModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setMatchModal(null)}
        >
          <div className="card-elevated p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <p className="text-lg font-display font-semibold text-cmu-red text-center mb-2">It's a match!</p>
            <p className="text-stone-600 text-center text-sm mb-4">
              You and {displayName(matchModal.candidate)} liked each other. You can chat now.
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setMatchModal(null)} className="btn-secondary flex-1">
                Keep swiping
              </button>
              <Link to={`/matches/${matchModal.matchId}/chat`} className="btn-primary flex-1 text-center">
                Chat now
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
