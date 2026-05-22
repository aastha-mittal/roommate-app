import { useRef, useState, useCallback, useEffect } from "react";
import type { Candidate } from "../api/client";
import CompatibilityBar from "./ui/CompatibilityBar";
import ProfileDetailPanel from "./ProfileDetailPanel";

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

/** Drag the card horizontally (mouse or touch). Right = like, left = pass. */
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

  const name = candidate.displayName?.trim() || candidate.email?.split("@")[0] || "Student";

  return (
    <div
      role="application"
      aria-label="Swipe card: drag right to like, left to pass"
      style={{ ...style, ...transformStyle }}
      className={`no-select touch-none absolute inset-0 card-elevated overflow-hidden flex flex-col cursor-grab active:cursor-grabbing ${exitClass} ${className}`}
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

      <div className="shrink-0 h-28 sm:h-32 bg-gradient-to-br from-red-50 via-amber-50 to-stone-100 flex items-center justify-center relative pointer-events-none">
        {candidate.avatarUrl ? (
          <img
            src={candidate.avatarUrl}
            alt=""
            className="w-20 h-20 rounded-2xl object-cover shadow-md border-4 border-white"
            draggable={false}
          />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-white shadow-md flex items-center justify-center text-3xl font-display font-bold text-cmu-red border-4 border-white">
            {name[0]?.toUpperCase()}
          </div>
        )}
        <span className="absolute top-3 right-14 chip bg-white border border-stone-200 text-stone-700 capitalize">
          {candidate.housingType?.replace("_", " ").toLowerCase()}
        </span>
      </div>

      <div className="shrink-0 px-4 pt-3 pb-2 border-b border-stone-100 pointer-events-none">
        <h2 className="font-display text-xl font-bold text-stone-900">{name}</h2>
        {candidate.schoolYear && (
          <p className="text-xs text-stone-500 capitalize">
            {candidate.schoolYear.toLowerCase()}
            {candidate.isFirstYear ? " · First-year" : ""}
          </p>
        )}
        <div className="mt-2">
          <CompatibilityBar score={candidate.compatibilityScore} />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3 pointer-events-none">
        <ProfileDetailPanel p={candidate} />
      </div>

      <div className="shrink-0 p-3 border-t border-stone-100 flex gap-4 justify-center bg-stone-50/80">
        <button
          type="button"
          onClick={() => runExit("left", () => onPassRef.current())}
          aria-label="Pass"
          className="w-14 h-14 rounded-full bg-white border-2 border-stone-300 shadow-sm flex items-center justify-center text-red-600 hover:bg-red-50 hover:border-red-300 transition"
        >
          <span className="text-2xl leading-none">✕</span>
        </button>
        <button
          type="button"
          onClick={() => runExit("right", () => onLikeRef.current())}
          aria-label="Like"
          className="w-14 h-14 rounded-full bg-cmu-red shadow-md flex items-center justify-center text-white hover:bg-red-800 transition"
        >
          <span className="text-2xl leading-none">♥</span>
        </button>
      </div>
    </div>
  );
}
