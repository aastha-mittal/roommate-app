export default function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card p-8 sm:p-12 text-center">
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-50 flex items-center justify-center text-2xl">
        🏠
      </div>
      <h3 className="font-display text-lg font-semibold text-stone-900">{title}</h3>
      <p className="text-sm text-stone-600 mt-2 max-w-sm mx-auto">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
