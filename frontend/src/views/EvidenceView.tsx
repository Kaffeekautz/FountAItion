import type { EvidenceMatrixResponse } from "../types";
import { DisclaimerBox } from "../components/DisclaimerBox";
import { EvidenceMatrix } from "../components/EvidenceMatrix";

interface EvidenceViewProps {
  evidenceMatrix: EvidenceMatrixResponse | null;
}

export function EvidenceView({ evidenceMatrix }: EvidenceViewProps) {
  if (!evidenceMatrix) {
    return (
      <div className="panel-section">
        <p className="text-sm text-slate-500">Evidence-Matrix wird geladen...</p>
      </div>
    );
  }

  const summaryCards = [
    { label: "Checks gesamt", value: evidenceMatrix.summary.total_checks, color: "text-slate-900" },
    { label: "Voll belegt", value: evidenceMatrix.summary.checks_with_full_evidence, color: "text-emerald-600" },
    { label: "Teilweise belegt", value: evidenceMatrix.summary.checks_with_partial_evidence, color: "text-amber-600" },
    { label: "Fehlende Nachweise", value: evidenceMatrix.summary.checks_missing_evidence, color: "text-rose-600" },
  ];

  return (
    <div className="space-y-6">
      <section className="panel-section">
        <p className="muted-label">Evidence Buddy</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Evidence Buddy</h2>
        <p className="mt-3 text-sm text-slate-600">{evidenceMatrix.product_message}</p>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="panel-section">
            <p className="muted-label">{card.label}</p>
            <p className={`mt-2 text-3xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <EvidenceMatrix rows={evidenceMatrix.rows} />
      <DisclaimerBox text={evidenceMatrix.disclaimer} />
    </div>
  );
}

