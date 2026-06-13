import type { AppState, CheckStatus, DocumentRecord } from "../types";
import { ChecklistItem } from "../components/ChecklistItem";
import { DisclaimerBox } from "../components/DisclaimerBox";

interface FoundingViewProps {
  state: AppState;
  updatingCheckId: string | null;
  onUpdateCheckStatus: (checkId: string, status: CheckStatus) => Promise<void>;
}

export function FoundingView({ state, updatingCheckId, onUpdateCheckStatus }: FoundingViewProps) {
  const groupedChecks = state.checks.reduce<Record<string, typeof state.checks>>((accumulator, check) => {
    accumulator[check.category] = [...(accumulator[check.category] ?? []), check];
    return accumulator;
  }, {});

  const doneCount = state.checks.filter((check) => check.status === "done").length;
  const openCount = state.checks.filter((check) => check.status === "missing" || check.status === "required").length;
  const reviewCount = state.checks.filter((check) => check.status === "check").length;
  const documentMap = state.documents.reduce<Record<string, DocumentRecord>>((accumulator, document) => {
    accumulator[document.id] = document;
    return accumulator;
  }, {});

  return (
    <div className="space-y-6">
      <section className="panel-section">
        <p className="muted-label">Gründungscheck</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">UG-Gründungscheck</h2>
        <p className="mt-3 text-sm text-slate-600">
          Ausgewählter POC-Pfad: {state.founder_case.selectedLegalForm ?? "Noch nicht ausgewählt"}
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="panel-section">
          <p className="muted-label">Erledigt</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{doneCount}</p>
        </div>
        <div className="panel-section">
          <p className="muted-label">Offen</p>
          <p className="mt-2 text-3xl font-bold text-rose-600">{openCount}</p>
        </div>
        <div className="panel-section">
          <p className="muted-label">Zu prüfen</p>
          <p className="mt-2 text-3xl font-bold text-blue-600">{reviewCount}</p>
        </div>
      </div>

      {Object.entries(groupedChecks).map(([category, checks]) => (
        <section key={category} className="panel-section">
          <p className="muted-label">Kategorie</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-900">{category}</h3>
          <div className="mt-6 space-y-4">
            {checks.map((check) => (
              <ChecklistItem
                key={check.id}
                check={check}
                matchedDocuments={check.matched_document_ids.map((id) => documentMap[id]).filter(Boolean)}
                isUpdating={updatingCheckId === check.id}
                onMarkDone={() => onUpdateCheckStatus(check.id, "done")}
                onReopen={() =>
                  onUpdateCheckStatus(check.id, check.required_document_types.length > 0 ? "missing" : "check")
                }
              />
            ))}
          </div>
        </section>
      ))}

      <DisclaimerBox text={state.disclaimer} />
    </div>
  );
}

