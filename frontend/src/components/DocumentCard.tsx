import type { DocumentTemplate, FoundingCheck } from "../types";
import { StatusBadge } from "./StatusBadge";

interface DocumentCardProps {
  template: DocumentTemplate;
  isAvailable: boolean;
  linkedChecks: FoundingCheck[];
  onMarkAvailable: () => void;
  isSubmitting: boolean;
}

export function DocumentCard({
  template,
  isAvailable,
  linkedChecks,
  onMarkAvailable,
  isSubmitting,
}: DocumentCardProps) {
  return (
    <div className="panel-section">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="muted-label">{template.category}</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">{template.title}</h3>
        </div>
        <StatusBadge status={isAvailable ? "done" : "missing"} />
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{template.description}</p>
      <div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
        <p>
          <span className="font-semibold text-slate-900">Dokumenttyp:</span> {template.document_type}
        </p>
        <p>
          <span className="font-semibold text-slate-900">Template-Typ:</span> {template.template_type}
        </p>
        <p>
          <span className="font-semibold text-slate-900">Verknüpfte Checks:</span>{" "}
          {linkedChecks.length > 0 ? linkedChecks.map((check) => check.title).join(", ") : "Keine"}
        </p>
      </div>
      <button
        type="button"
        disabled={isAvailable || isSubmitting}
        onClick={onMarkAvailable}
        className="mt-5 rounded-2xl bg-brand-navy px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-violet disabled:cursor-not-allowed disabled:opacity-50"
      >
        Als vorhanden markieren
      </button>
    </div>
  );
}
