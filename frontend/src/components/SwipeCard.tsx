import type { Candidate } from "../api/client";

interface SwipeCardProps {
  candidate: Candidate;
  onLike: () => void;
  onPass: () => void;
  style?: React.CSSProperties;
  className?: string;
  isExiting?: "left" | "right" | null;
}

export default function SwipeCard({ candidate, onLike, onPass, style, className = "", isExiting }: SwipeCardProps) {
  const budget =
    candidate.budgetMin != null || candidate.budgetMax != null
      ? `$${candidate.budgetMin ?? "?"}–$${candidate.budgetMax ?? "?"}`
      : null;

  const exitClass = isExiting === "right" ? "animate-swipe-right" : isExiting === "left" ? "animate-swipe-left" : "";

  return (
    <div
      style={style}
      className={`no-select absolute inset-0 bg-white rounded-2xl shadow-lg border border-stone-200 overflow-hidden ${exitClass} ${className}`}
    >
      <div className="h-full flex flex-col">
        <div className="h-48 bg-gradient-to-br from-amber-100 to-stone-200 flex items-center justify-center">
          {candidate.avatarUrl ? (
            <img src={candidate.avatarUrl} alt="" className="w-24 h-24 rounded-full object-cover" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-amber-300 flex items-center justify-center text-2xl font-display font-semibold text-amber-900">
              {(candidate.email ?? "?")[0].toUpperCase()}
            </div>
          )}
        </div>
        <div className="p-4 flex-1 flex flex-col">
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
          {candidate.bio && (
            <p className="text-sm text-stone-600 line-clamp-3 mb-2">{candidate.bio}</p>
          )}
          {candidate.preferredAreas?.length > 0 && (
            <p className="text-xs text-stone-500 mb-1">
              Areas: {candidate.preferredAreas.join(", ")}
            </p>
          )}
          {budget && <p className="text-xs text-stone-500 mb-2">{budget}</p>}
          {candidate.compatibilityExplanation?.length > 0 && (
            <div className="mt-auto pt-2 border-t border-stone-100">
              <p className="text-xs text-stone-500">
                {candidate.compatibilityExplanation.slice(0, 3).join(" · ")}
              </p>
            </div>
          )}
          {candidate.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {candidate.tags.slice(0, 5).map((t) => (
                <span key={t} className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="absolute bottom-4 left-4 right-4 flex gap-4 justify-center">
        <button
          type="button"
          onClick={onPass}
          aria-label="Pass"
          className="w-14 h-14 rounded-full bg-white border-2 border-stone-300 shadow flex items-center justify-center text-red-500 hover:bg-red-50 hover:border-red-300"
        >
          <span className="text-2xl">✕</span>
        </button>
        <button
          type="button"
          onClick={onLike}
          aria-label="Like"
          className="w-14 h-14 rounded-full bg-amber-500 shadow flex items-center justify-center text-white hover:bg-amber-600"
        >
          <span className="text-2xl">♥</span>
        </button>
      </div>
    </div>
  );
}
