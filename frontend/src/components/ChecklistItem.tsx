import type { DocumentRecord, FoundingCheck } from "../types";
import { StatusBadge } from "./StatusBadge";

interface ChecklistItemProps {
  check: FoundingCheck;
  matchedDocuments: DocumentRecord[];
  isUpdating: boolean;
  onMarkDone: () => void;
  onReopen: () => void;
  showActions?: boolean;
}

export function ChecklistItem({
  check,
  matchedDocuments,
  isUpdating,
  onMarkDone,
  onReopen,
  showActions = true,
}: ChecklistItemProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-semibold text-slate-900">{check.title}</h3>
            <StatusBadge status={check.status} />
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">{check.description}</p>
          <p className="mt-3 text-sm text-slate-500">{check.explanation}</p>
        </div>
        {showActions ? (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isUpdating}
              onClick={onMarkDone}
              className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Als erledigt markieren
            </button>
            <button
              type="button"
              disabled={isUpdating}
              onClick={onReopen}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Wieder öffnen
            </button>
          </div>
        ) : null}
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Benötigte Dokumenttypen</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {check.required_document_types.length > 0 ? (
              check.required_document_types.map((type) => (
                <span key={type} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
                  {type}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-500">Kein verpflichtender Dokumenttyp.</span>
            )}
          </div>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Verknüpfte Dokumente</p>
          <div className="mt-3 space-y-2">
            {matchedDocuments.length > 0 ? (
              matchedDocuments.map((document) => (
                <div key={document.id} className="rounded-2xl bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
                  {document.filename}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Noch keine Dokumente zugeordnet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
