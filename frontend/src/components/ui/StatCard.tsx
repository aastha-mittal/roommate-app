export default function StatCard({
  label,
  value,
  hint,
  accent = "stone",
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "stone" | "amber" | "red";
}) {
  const accentClass =
    accent === "red" ? "text-cmu-red" : accent === "amber" ? "text-amber-700" : "text-stone-900";
  return (
    <div className="card p-4 sm:p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</p>
      <p className={`text-2xl sm:text-3xl font-display font-bold mt-1 ${accentClass}`}>{value}</p>
      {hint && <p className="text-xs text-stone-500 mt-1">{hint}</p>}
    </div>
  );
}
