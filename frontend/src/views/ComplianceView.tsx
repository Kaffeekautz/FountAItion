import { useState } from "react";
import { CircleHelp, FileText, Wallet } from "lucide-react";

import type { AppState, CheckStatus, DocumentRecord, UploadDocumentResponse } from "../types";
import { ActionCard } from "../components/ActionCard";
import { ChecklistItem } from "../components/ChecklistItem";
import { CollapsibleSection } from "../components/CollapsibleSection";
import { DisclaimerBox } from "../components/DisclaimerBox";
import { UploadPanel } from "../components/UploadPanel";

interface ComplianceViewProps {
  state: AppState;
  updatingCheckId: string | null;
  isUploading: boolean;
  lastUploadResult: UploadDocumentResponse | null;
  onUpdateCheckStatus: (checkId: string, status: CheckStatus) => Promise<void>;
  onUpload: (file: File) => Promise<void>;
}

export function ComplianceView({
  state,
  updatingCheckId,
  isUploading,
  lastUploadResult,
  onUpdateCheckStatus,
  onUpload,
}: ComplianceViewProps) {
  const complianceChecks = state.checks.filter((check) => check.category === "Laufende Pflichten");
  const [isIncomeFlowOpen, setIsIncomeFlowOpen] = useState(false);
  const [isExpenseEvaluationVisible, setIsExpenseEvaluationVisible] = useState(false);
  const [isEvaluationVisible, setIsEvaluationVisible] = useState(false);
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeSource, setIncomeSource] = useState("");
  const [hasConsideration, setHasConsideration] = useState<"yes" | "no" | null>(null);
  const doneCount = complianceChecks.filter((check) => check.status === "done").length;
  const openCount = complianceChecks.filter((check) => check.status === "missing" || check.status === "required").length;
  const reviewCount = complianceChecks.filter((check) => check.status === "check").length;
  const documentMap = state.documents.reduce<Record<string, DocumentRecord>>((accumulator, document) => {
    accumulator[document.id] = document;
    return accumulator;
  }, {});

  return (
    <div className="space-y-6">
      <CollapsibleSection id="compliance-overview" label="Compliance" title="Überblick">
        <p className="text-sm text-slate-600">
          Hier bündelt FoundAItion die laufenden Pflichten und Folgeprozesse, die du nach der Gründung im Blick behalten solltest.
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

      <CollapsibleSection id="compliance-finanzen" label="Bereich" title="Finanzen">
        <div className="grid gap-6 lg:grid-cols-2">
          <ActionCard
            title="Einnahmen"
            description="Starte hier die Fragestellung zu erhaltenen Leistungen, Geldgebern, Gegenleistung und Dokument-Upload."
            icon={<FileText className="h-6 w-6" />}
            actionLabel={isIncomeFlowOpen ? "Fragestellung geöffnet" : "Fragestellung starten"}
            onClick={() => setIsIncomeFlowOpen(true)}
          />
          <ActionCard
            title="Ausgaben"
            description="Überwache deine Ausgaben"
            icon={<Wallet className="h-6 w-6" />}
            actionLabel="Auswertung"
            onClick={() => setIsExpenseEvaluationVisible(true)}
          />
        </div>

        {isIncomeFlowOpen ? (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p className="muted-label">Einnahmen</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">Fragestellung</h3>

            <div className="mt-6 space-y-6">
              <div>
                <label htmlFor="income-amount" className="block text-sm font-semibold text-slate-900">
                  1. Welche Leistungen hast du erhalten?
                </label>
                <p className="mt-2 text-sm text-slate-600">Eingabefeld für Summe</p>
                <input
                  id="income-amount"
                  type="text"
                  value={incomeAmount}
                  onChange={(event) => setIncomeAmount(event.target.value)}
                  placeholder="z. B. 500,00 EUR"
                  className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-brand-violet"
                />
              </div>

              <div>
                <label htmlFor="income-source" className="block text-sm font-semibold text-slate-900">
                  2. Von wem hast du die Leistung erhalten?
                </label>
                <p className="mt-2 text-sm text-slate-600">Freitextfeld</p>
                <textarea
                  id="income-source"
                  value={incomeSource}
                  onChange={(event) => setIncomeSource(event.target.value)}
                  placeholder="Name der Person, Organisation oder Förderstelle"
                  rows={4}
                  className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-brand-violet"
                />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900">3. Gibt es eine Gegenleistung?</p>
                <div className="mt-3 rounded-2xl border border-emerald-100 bg-white p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-xl bg-emerald-50 p-2 text-brand-navy">
                      <CircleHelp className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Was ist eine Gegenleistung?</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Eine Gegenleistung liegt vor, wenn für das Geld oder die Unterstützung etwas zurückgegeben wird, zum
                        Beispiel Werbung, Sichtbarkeit oder ein anderer konkreter Vorteil.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setHasConsideration("yes")}
                    className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                      hasConsideration === "yes"
                        ? "border-brand-violet bg-brand-violet text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-brand-violet/30 hover:text-brand-violet"
                    }`}
                  >
                    Ja
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasConsideration("no")}
                    className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                      hasConsideration === "no"
                        ? "border-brand-violet bg-brand-violet text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-brand-violet/30 hover:text-brand-violet"
                    }`}
                  >
                    Nein
                  </button>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900">4. Lade dein Dokument hoch zur Analyse</p>
                <div className="mt-4">
                  <UploadPanel onUpload={onUpload} isUploading={isUploading} lastUploadResult={lastUploadResult} />
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900">5. Auswertung</p>
                <button
                  type="button"
                  onClick={() => setIsEvaluationVisible(true)}
                  className="mt-4 rounded-2xl bg-brand-navy px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-violet"
                >
                  Auswertung
                </button>
                {isEvaluationVisible ? (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-slate-700">
                    <span className="font-semibold text-slate-900">Ergebnis:</span> Es handelt sich in diesem Fall nicht um
                    eine steuerfreie Spende, sondern um ein steuerpflichtiges Sponsoring! Für das Sponsoring muss eine Rechnung
                    ausgestellt werden. Es darf keine Spendenquittung ausgestellt werden, da sonst der Vorstand persönlich wegen
                    Steuerhinterziehung haften könnte.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {isExpenseEvaluationVisible ? (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p className="muted-label">Ausgaben</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">Auswertung</h3>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Hier wird im Pilot die Ausgabenbeobachtung vorbereitet. Der Einstieg ist bereits sichtbar und kann später um
              konkrete Prüfschritte erweitert werden.
            </p>
          </div>
        ) : null}
      </CollapsibleSection>

      <CollapsibleSection id="compliance-mitarbeiter" label="Bereich" title="Mitarbeiter">
        <p className="text-sm leading-6 text-slate-600">
          Dieser Bereich ist für Compliance-Themen rund um Mitarbeiter vorgesehen und kann im Pilot als eigener Abschnitt
          weiter ausgebaut werden.
        </p>
      </CollapsibleSection>

      <CollapsibleSection id="compliance-mitgliederversammlung" label="Bereich" title="Mitgliederversammlung">
        <p className="text-sm leading-6 text-slate-600">
          Dieser Bereich ist für Themen rund um die Mitgliederversammlung reserviert und schließt in der Navigation direkt an
          Finanzen an.
        </p>
      </CollapsibleSection>

      <CollapsibleSection id="compliance-laufende-pflichten" label="Kategorie" title="Laufende Pflichten">
        <div className="space-y-4">
          {complianceChecks.map((check) => (
            <ChecklistItem
              key={check.id}
              check={check}
              matchedDocuments={check.matched_document_ids.map((id) => documentMap[id]).filter(Boolean)}
              isUpdating={updatingCheckId === check.id}
              onMarkDone={() => onUpdateCheckStatus(check.id, "done")}
              onReopen={() => onUpdateCheckStatus(check.id, check.required_document_types.length > 0 ? "missing" : "check")}
            />
          ))}
        </div>
      </CollapsibleSection>

      <DisclaimerBox text={state.disclaimer} />
    </div>
  );
}
