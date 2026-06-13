import type { EvidenceMatrixRow } from "../types";
import { StatusBadge } from "./StatusBadge";

interface EvidenceMatrixProps {
  rows: EvidenceMatrixRow[];
}

export function EvidenceMatrix({ rows }: EvidenceMatrixProps) {
  const grouped = rows.reduce<Record<string, EvidenceMatrixRow[]>>((accumulator, row) => {
    accumulator[row.category] = [...(accumulator[row.category] ?? []), row];
    return accumulator;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([category, categoryRows]) => (
        <section key={category} className="panel-section">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="muted-label">Kategorie</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">{category}</h3>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {categoryRows.length} Checks
            </span>
          </div>
          <div className="mt-6 space-y-4">
            {categoryRows.map((row) => (
              <div key={row.check_id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900">{row.check_title}</h4>
                    <p className="mt-2 text-sm text-slate-600">{row.explanation}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={row.check_status} />
                    <StatusBadge status={row.evidence_status} />
                  </div>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Required</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {row.required_document_types.length > 0 ? (
                        row.required_document_types.map((type) => (
                          <span key={type} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                            {type}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-500">Kein Dokumenttyp erforderlich.</span>
                      )}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Matched</p>
                    <div className="mt-3 space-y-2">
                      {row.matched_documents.length > 0 ? (
                        row.matched_documents.map((document) => (
                          <div key={document.id} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                            {document.filename}
                          </div>
                        ))
                      ) : (
                        <span className="text-sm text-slate-500">Noch keine Matches.</span>
                      )}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Missing</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {row.missing_document_types.length > 0 ? (
                        row.missing_document_types.map((type) => (
                          <span key={type} className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700">
                            {type}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-500">Nichts offen.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

