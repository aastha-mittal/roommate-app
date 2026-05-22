export default function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-stone-600 mt-1 text-sm sm:text-base max-w-xl">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
