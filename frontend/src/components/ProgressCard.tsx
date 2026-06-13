interface ProgressCardProps {
  title: string;
  doneCount: number;
  totalCount: number;
  description: string;
}

export function ProgressCard({ title, doneCount, totalCount, description }: ProgressCardProps) {
  const percent = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);
  return (
    <div className="panel-section">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="muted-label">{title}</p>
          <h3 className="mt-2 text-3xl font-bold text-slate-900">{percent}%</h3>
          <p className="mt-2 text-sm text-slate-600">{description}</p>
        </div>
        <div className="rounded-2xl bg-brand-navy px-4 py-3 text-right text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-white/70">Fortschritt</p>
          <p className="mt-1 text-xl font-semibold">
            {doneCount} / {totalCount}
          </p>
        </div>
      </div>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-gradient-to-r from-brand-blue via-brand-violet to-brand-green" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
