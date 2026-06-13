import type { ReactNode } from "react";

interface ActionCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  actionLabel: string;
  onClick: () => void;
}

export function ActionCard({ title, description, icon, actionLabel, onClick }: ActionCardProps) {
  return (
    <div className="panel-section flex h-full flex-col">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-brand-violet">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
      <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{description}</p>
      <button
        type="button"
        onClick={onClick}
        className="mt-6 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-navy"
      >
        {actionLabel}
      </button>
    </div>
  );
}

