import type { AppState, CheckStatus, DocumentRecord } from "../types";
import { ChecklistItem } from "../components/ChecklistItem";
import { CollapsibleSection } from "../components/CollapsibleSection";
import { DisclaimerBox } from "../components/DisclaimerBox";
import { toSectionId } from "../utils/sectionIds";

interface FoundingViewProps {
  state: AppState;
  updatingCheckId: string | null;
  onUpdateCheckStatus: (checkId: string, status: CheckStatus) => Promise<void>;
}

export function FoundingView({ state, updatingCheckId, onUpdateCheckStatus }: FoundingViewProps) {
  const foundingChecks = state.checks.filter((check) => check.category !== "Laufende Pflichten");
  const groupedChecks = foundingChecks.reduce<Record<string, typeof foundingChecks>>((accumulator, check) => {
    accumulator[check.category] = [...(accumulator[check.category] ?? []), check];
    return accumulator;
  }, {});

  const doneCount = foundingChecks.filter((check) => check.status === "done").length;
  const openCount = foundingChecks.filter((check) => check.status === "missing" || check.status === "required").length;
  const reviewCount = foundingChecks.filter((check) => check.status === "check").length;
  const documentMap = state.documents.reduce<Record<string, DocumentRecord>>((accumulator, document) => {
    accumulator[document.id] = document;
    return accumulator;
  }, {});

  return (
    <div className="space-y-6">
      <CollapsibleSection id="founding-overview" label="Gründungscheck" title="e.V.-Gründungscheck" defaultOpen={false}>
        <p className="text-sm text-slate-600">
          Ausgewählter Pilot-Pfad: {state.founder_case.selectedLegalForm ?? "Noch nicht ausgewählt"}
        </p>
      </CollapsibleSection>

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
          <p className="mt-2 text-3xl font-bold text-brand-violet">{reviewCount}</p>
        </div>
      </div>

      {Object.entries(groupedChecks).map(([category, checks]) => (
        <CollapsibleSection key={category} id={toSectionId("founding", category)} label="Kategorie" title={category} defaultOpen={false}>
          <div className="space-y-4">
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
        </CollapsibleSection>
      ))}

      <DisclaimerBox text={state.disclaimer} />
    </div>
  );
}
