export default function CompatibilityBar({
  score,
  className = "",
  compact = false,
}: {
  score: number;
  className?: string;
  compact?: boolean;
}) {
  const clamped = Math.min(100, Math.max(0, score));
  const color =
    clamped >= 80 ? "bg-emerald-500" : clamped >= 60 ? "bg-amber-500" : "bg-stone-400";
  return (
    <div className={className}>
      <div className={`flex justify-between text-stone-600 mb-1 ${compact ? "text-[10px]" : "text-xs"}`}>
        <span>Compatibility</span>
        <span className="font-semibold">{clamped}%</span>
      </div>
      <div className={`rounded-full bg-stone-200 overflow-hidden ${compact ? "h-1.5" : "h-2"}`}>
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
