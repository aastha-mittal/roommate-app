import { useRef, useState, useCallback, useEffect } from "react";
import type { Candidate } from "../api/client";

const SWIPE_COMMIT_PX = 80;
const SWIPE_HINT_PX = 36;
const EXIT_MS = 300;

interface SwipeCardProps {
  candidate: Candidate;
  onLike: () => void;
  onPass: () => void;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Drag the card horizontally (mouse or touch). Window-level pointer tracking
 * so dragging still works when the cursor leaves the card.
 */
export default function SwipeCard({ candidate, onLike, onPass, style, className = "" }: SwipeCardProps) {
  const [dragX, setDragX] = useState(0);
  const [exiting, setExiting] = useState<"left" | "right" | null>(null);
  const [spring, setSpring] = useState(false);
  const dragXRef = useRef(0);
  const exitingRef = useRef(false);
  const removeWindowListenersRef = useRef<(() => void) | null>(null);

  const onLikeRef = useRef(onLike);
  const onPassRef = useRef(onPass);
  useEffect(() => {
    onLikeRef.current = onLike;
    onPassRef.current = onPass;
  }, [onLike, onPass]);

  const runExit = useCallback((dir: "left" | "right", action: () => void) => {
    if (exitingRef.current) return;
    exitingRef.current = true;
    setDragX(0);
    dragXRef.current = 0;
    setExiting(dir);
    window.setTimeout(() => {
      action();
      setExiting(null);
      exitingRef.current = false;
    }, EXIT_MS);
  }, []);

  useEffect(
    () => () => {
      removeWindowListenersRef.current?.();
      removeWindowListenersRef.current = null;
    },
    [candidate.userId]
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (exitingRef.current) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;

    e.preventDefault();
    removeWindowListenersRef.current?.();

    const startClientX = e.clientX - dragXRef.current;
    const pointerId = e.pointerId;
    setSpring(false);

    const onMove = (ev: Event) => {
      const pe = ev as PointerEvent;
      if (pe.pointerId !== pointerId) return;
      pe.preventDefault();
      const x = pe.clientX - startClientX;
      dragXRef.current = x;
      setDragX(x);
    };

    const onUp = (ev: Event) => {
      const pe = ev as PointerEvent;
      if (pe.pointerId !== pointerId) return;
      pe.preventDefault();
      window.removeEventListener("pointermove", onMove, true);
      window.removeEventListener("pointerup", onUp, true);
      window.removeEventListener("pointercancel", onUp, true);
      removeWindowListenersRef.current = null;

      if (exitingRef.current) return;

      const x = dragXRef.current;
      if (x > SWIPE_COMMIT_PX) {
        runExit("right", () => onLikeRef.current());
      } else if (x < -SWIPE_COMMIT_PX) {
        runExit("left", () => onPassRef.current());
      } else {
        setSpring(true);
        requestAnimationFrame(() => {
          dragXRef.current = 0;
          setDragX(0);
        });
        window.setTimeout(() => setSpring(false), 240);
      }
    };

    window.addEventListener("pointermove", onMove, { capture: true, passive: false });
    window.addEventListener("pointerup", onUp, { capture: true });
    window.addEventListener("pointercancel", onUp, { capture: true });
    removeWindowListenersRef.current = () => {
      window.removeEventListener("pointermove", onMove, true);
      window.removeEventListener("pointerup", onUp, true);
      window.removeEventListener("pointercancel", onUp, true);
    };
  };

  const budget =
    candidate.budgetMin != null || candidate.budgetMax != null
      ? `$${candidate.budgetMin ?? "?"}–$${candidate.budgetMax ?? "?"}`
      : null;

  const exitClass = exiting === "right" ? "animate-swipe-right" : exiting === "left" ? "animate-swipe-left" : "";
  const dragRotate = exiting ? 0 : dragX * 0.06;
  const transformStyle =
    exiting || (!spring && dragX === 0)
      ? undefined
      : {
          transform: `translateX(${dragX}px) rotate(${dragRotate}deg)`,
          transition: spring ? "transform 0.22s ease-out" : "none",
        };

  const likeOpacity = Math.min(1, Math.max(0, (dragX - SWIPE_HINT_PX) / (SWIPE_COMMIT_PX - SWIPE_HINT_PX)));
  const passOpacity = Math.min(1, Math.max(0, (-dragX - SWIPE_HINT_PX) / (SWIPE_COMMIT_PX - SWIPE_HINT_PX)));

  return (
    <div
      role="application"
      aria-label="Swipe card: drag right to like, left to pass"
      style={{ ...style, ...transformStyle }}
      className={`no-select touch-none absolute inset-0 bg-white rounded-2xl shadow-lg border border-stone-200 overflow-hidden cursor-grab active:cursor-grabbing select-none [user-select:none] [-webkit-user-drag:none] ${exitClass} ${className}`}
      onPointerDown={onPointerDown}
    >
      <div
        className="pointer-events-none absolute top-3 right-3 z-10 rounded-lg border-2 border-emerald-400 bg-emerald-500/20 px-3 py-1.5"
        style={{ opacity: likeOpacity }}
      >
        <span className="text-sm font-display font-bold text-emerald-700">LIKE</span>
      </div>
      <div
        className="pointer-events-none absolute top-3 left-3 z-10 rounded-lg border-2 border-red-400 bg-red-500/20 px-3 py-1.5"
        style={{ opacity: passOpacity }}
      >
        <span className="text-sm font-display font-bold text-red-700">PASS</span>
      </div>

      <div className="h-full flex flex-col pb-3 pointer-events-none">
        <div className="h-44 shrink-0 bg-gradient-to-br from-amber-100 to-stone-200 flex items-center justify-center">
          {candidate.avatarUrl ? (
            <img src={candidate.avatarUrl} alt="" className="w-24 h-24 rounded-full object-cover pointer-events-none" draggable={false} />
          ) : (
            <div className="w-24 h-24 rounded-full bg-amber-300 flex items-center justify-center text-2xl font-display font-semibold text-amber-900">
              {(candidate.email ?? "?")[0].toUpperCase()}
            </div>
          )}
        </div>
        <div className="p-4 flex-1 flex flex-col min-h-0 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
              {candidate.compatibilityScore}% match
            </span>
            {candidate.housingType && (
              <span className="text-xs text-stone-500 capitalize">
                {candidate.housingType.replace("_", " ").toLowerCase()}
              </span>
            )}
          </div>
          {candidate.bio && <p className="text-sm text-stone-600 mb-2">{candidate.bio}</p>}
          {candidate.preferredAreas?.length > 0 && (
            <p className="text-xs text-stone-500 mb-1">Areas: {candidate.preferredAreas.join(", ")}</p>
          )}
          {budget && <p className="text-xs text-stone-500 mb-2">{budget}</p>}
          {candidate.compatibilityExplanation?.length > 0 && (
            <div className="mt-1 pt-2 border-t border-stone-100">
              <p className="text-xs text-stone-500">{candidate.compatibilityExplanation.slice(0, 3).join(" · ")}</p>
            </div>
          )}
          {candidate.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {candidate.tags.slice(0, 8).map((t) => (
                <span key={t} className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
