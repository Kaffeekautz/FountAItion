import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface CollapsibleSectionProps {
  id?: string;
  label: string;
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  headerAside?: ReactNode;
}

export function CollapsibleSection({
  id,
  label,
  title,
  children,
  defaultOpen = true,
  headerAside,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section id={id} className="panel-section">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-start justify-between gap-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="muted-label">{label}</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-900">{title}</h3>
        </div>
        {headerAside ? <div className="flex items-start gap-3">{headerAside}</div> : null}
        <span className="mt-1 inline-flex rounded-2xl border border-emerald-100 bg-white p-2 text-slate-500 transition hover:text-brand-navy">
          {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </span>
      </button>
      {isOpen ? <div className="mt-6">{children}</div> : null}
    </section>
  );
}
