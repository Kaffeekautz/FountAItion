import { useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";

import type { AppState, CheckStatus, DocumentRecord, FoundingCheck } from "../types";
import { ChecklistItem } from "../components/ChecklistItem";
import { CollapsibleSection } from "../components/CollapsibleSection";
import { DisclaimerBox } from "../components/DisclaimerBox";
import { buildStatutePreview } from "../utils/statuteTemplate";

interface FoundingViewProps {
  state: AppState;
  updatingCheckId: string | null;
  onUpdateCheckStatus: (checkId: string, status: CheckStatus) => Promise<void>;
}

interface TodoItem {
  id: string;
  label: string;
}

const foundersMeetingTodos: TodoItem[] = [
  { id: "invite-members", label: "Mitglieder einladen und Tagesordnung erstellen und bekanntgeben" },
  { id: "attendance-list", label: "Anwesenheitsliste mit Namen, Anschrift und Unterschrift der Mitglieder erstellen" },
  { id: "discuss-statute", label: "Satzung verteilen, diskutieren und dann darüber abstimmen" },
  { id: "sign-statute", label: "Unterzeichnung der Satzung durch mindestens 7 Mitglieder" },
  { id: "elect-board", label: "Wahl eines Vorstands" },
  { id: "founding-minutes", label: "Erstellung eines Gründungsprotokolls und Dokumentation der Versammlung" },
];

const notaryTodos: TodoItem[] = [
  { id: "schedule-notary", label: "Notartermin vereinbaren" },
  { id: "bring-statute", label: "Satzung zum Termin mitbringen" },
  { id: "bring-minutes", label: "Gründungsprotokoll und daran angefügte Anwesenheitsliste mitbringen" },
  { id: "bring-ids", label: "Gültige Ausweise aller vertretungsberechtigten Vorstandsmitglieder mitbringen" },
];

function FoundingPrompt({
  title,
  explanation,
  children,
}: {
  title: string;
  explanation: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{explanation}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function FoundingTodoList({
  items,
  state,
  setState,
}: {
  items: TodoItem[];
  state: Record<string, boolean>;
  setState: Dispatch<SetStateAction<Record<string, boolean>>>;
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() =>
            setState((current) => ({
              ...current,
              [item.id]: !current[item.id],
            }))
          }
          className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-4 text-left transition ${
            state[item.id]
              ? "border-emerald-200 bg-emerald-50 text-emerald-950"
              : "border-slate-200 bg-white text-slate-700 hover:border-brand-violet/30"
          }`}
        >
          <span
            className={`mt-1 h-5 w-5 rounded-md border ${
              state[item.id] ? "border-emerald-500 bg-emerald-500" : "border-slate-300 bg-white"
            }`}
          />
          <span className="text-sm leading-6">{item.label}</span>
        </button>
      ))}
    </div>
  );
}

export function FoundingView({ state, updatingCheckId, onUpdateCheckStatus }: FoundingViewProps) {
  const hiddenFoundingCheckIds = new Set([
    "nonprofit_strategy",
    "statute_core",
    "statute_board",
    "statute_meeting",
    "nonprofit_clauses",
  ]);
  const foundingChecks = state.checks.filter(
    (check) => check.category !== "Laufende Pflichten" && !hiddenFoundingCheckIds.has(check.id),
  );
  const doneCount = foundingChecks.filter((check) => check.status === "done").length;
  const openCount = foundingChecks.filter((check) => check.status === "missing" || check.status === "required").length;
  const reviewCount = foundingChecks.filter((check) => check.status === "check").length;

  const documentMap = useMemo(
    () =>
      state.documents.reduce<Record<string, DocumentRecord>>((accumulator, document) => {
        accumulator[document.id] = document;
        return accumulator;
      }, {}),
    [state.documents],
  );

  const checksById = useMemo(
    () =>
      foundingChecks.reduce<Record<string, FoundingCheck>>((accumulator, check) => {
        accumulator[check.id] = check;
        return accumulator;
      }, {}),
    [foundingChecks],
  );

  const statuteChecks = foundingChecks.filter((check) => check.category === "Satzung");
  const nonprofitChecks = foundingChecks.filter((check) => check.category === "Gemeinnützigkeit");
  const [associationPurpose, setAssociationPurpose] = useState("");
  const [hasSevenMembers, setHasSevenMembers] = useState<"yes" | "no" | null>(null);
  const [associationName, setAssociationName] = useState("");
  const [associationSeat, setAssociationSeat] = useState("");
  const [wantsNonprofit, setWantsNonprofit] = useState<"yes" | "no" | null>(null);
  const [showStatutePreview, setShowStatutePreview] = useState(false);
  const [foundersMeetingState, setFoundersMeetingState] = useState<Record<string, boolean>>({});
  const [notaryState, setNotaryState] = useState<Record<string, boolean>>({});

  const statutePreview = useMemo(
    () =>
      buildStatutePreview({
        associationName,
        associationSeat,
        associationPurpose,
      }),
    [associationName, associationSeat, associationPurpose],
  );

  const renderCheck = (checkId: string) => {
    const check = checksById[checkId];
    if (!check) {
      return null;
    }

    return (
      <ChecklistItem
        key={check.id}
        check={check}
        matchedDocuments={check.matched_document_ids.map((id) => documentMap[id]).filter(Boolean)}
        isUpdating={updatingCheckId === check.id}
        onMarkDone={() => onUpdateCheckStatus(check.id, "done")}
        onReopen={() => onUpdateCheckStatus(check.id, check.required_document_types.length > 0 ? "missing" : "check")}
      />
    );
  };

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

      <CollapsibleSection id="founding-purpose" label="Kategorie" title="Verbreitung & Konzept" defaultOpen={false}>
        <div className="space-y-5">
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 text-sm leading-6 text-emerald-950">
            Die folgenden Angaben werden zusammengeführt, damit daraus direkt die Satzung generiert werden kann. Die weiteren
            Schritte aus der Gründung folgen darunter.
          </div>

          <FoundingPrompt
            title="Gib deinen Vereinszweck an"
            explanation="Der e.V.-Zweck muss ideell und nicht auf einen wirtschaftlichen Geschäftsbetrieb ausgerichtet sein. Formuliere den Vereinszweck so konkret, dass er für Satzung, Registergericht und spätere Tätigkeiten nachvollziehbar bleibt. Wähle einen Vereinszweck entsprechend § 52 Abs. 2 AO."
          >
            <textarea
              value={associationPurpose}
              onChange={(event) => setAssociationPurpose(event.target.value)}
              placeholder="Beschreibe hier den Vereinszweck"
              rows={4}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-brand-violet"
            />
          </FoundingPrompt>

          <FoundingPrompt
            title="Hast du mindestens 7 Mitglieder?"
            explanation="Für die Eintragung zum e.V. sollen mindestens sieben Mitglieder an der Gründung beteiligt sein. Halte die sieben Gründungsmitglieder frühzeitig strukturiert fest, damit Satzung und Gründungsversammlung sauber vorbereitet werden können."
          >
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setHasSevenMembers("yes")}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                  hasSevenMembers === "yes"
                    ? "border-brand-violet bg-brand-violet text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-brand-violet/30 hover:text-brand-violet"
                }`}
              >
                Ja
              </button>
              <button
                type="button"
                onClick={() => setHasSevenMembers("no")}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                  hasSevenMembers === "no"
                    ? "border-brand-violet bg-brand-violet text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-brand-violet/30 hover:text-brand-violet"
                }`}
              >
                Nein
              </button>
            </div>
          </FoundingPrompt>

          <FoundingPrompt
            title="Vereinsname prüfen und festlegen"
            explanation="Der Vereinsname muss unterscheidbar sein und in der Satzung geführt werden. Eine dokumentierte Namensprüfung reduziert das Risiko einer Zurückweisung durch das Registergericht."
          >
            <input
              value={associationName}
              onChange={(event) => setAssociationName(event.target.value)}
              placeholder="Vereinsname eingeben"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-brand-violet"
            />
            <a
              href="https://www.handelsregister.de/rp_web/welcome.xhtml"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex text-sm font-semibold text-brand-violet transition hover:text-brand-navy"
            >
              Eingetragene Vereine im Register prüfen
            </a>
          </FoundingPrompt>

          <FoundingPrompt
            title="Vereinssitz festlegen"
            explanation="Der Sitz des Vereins bestimmt unter anderem das zuständige Registergericht. Lege den Sitz früh fest, damit Satzung und Registeranmeldung konsistent bleiben."
          >
            <input
              value={associationSeat}
              onChange={(event) => setAssociationSeat(event.target.value)}
              placeholder="Ort des Vereinssitzes"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-brand-violet"
            />
          </FoundingPrompt>

          <FoundingPrompt
            title="Gemeinnützigkeit entscheiden"
            explanation="Prüfe, ob der Verein die Anforderungen an eine spätere Gemeinnützigkeit erfüllen soll. Die Entscheidung wirkt sich direkt auf Satzung, Vermögensbindung und spätere Finanzamtskommunikation aus."
          >
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setWantsNonprofit("yes")}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                  wantsNonprofit === "yes"
                    ? "border-brand-violet bg-brand-violet text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-brand-violet/30 hover:text-brand-violet"
                }`}
              >
                Ja
              </button>
              <button
                type="button"
                onClick={() => setWantsNonprofit("no")}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                  wantsNonprofit === "no"
                    ? "border-brand-violet bg-brand-violet text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-brand-violet/30 hover:text-brand-violet"
                }`}
              >
                Nein
              </button>
            </div>
          </FoundingPrompt>

          <div className="grid gap-5 lg:grid-cols-2">
            <FoundingPrompt
              title="Satzungs-Generator"
              explanation="Die Angaben aus diesem Abschnitt werden in die Variablen [VEREINSNAME], [VEREINSSITZ] und [VEREINSZWECK] eingesetzt."
            >
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                  <p>
                    <span className="font-semibold text-slate-900">[VEREINSNAME]:</span>{" "}
                    {associationName || "noch nicht befüllt"}
                  </p>
                  <p className="mt-2">
                    <span className="font-semibold text-slate-900">[VEREINSSITZ]:</span>{" "}
                    {associationSeat || "noch nicht befüllt"}
                  </p>
                  <p className="mt-2">
                    <span className="font-semibold text-slate-900">[VEREINSZWECK]:</span>{" "}
                    {associationPurpose || "noch nicht befüllt"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowStatutePreview(true)}
                  className="rounded-2xl bg-brand-navy px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-violet"
                >
                  Satzung generieren
                </button>
              </div>
            </FoundingPrompt>

            <FoundingPrompt
              title="Satzungsentwurf"
              explanation="So sieht der Entwurf mit den aktuell eingesetzten Variablen aus. Nicht gesetzte Werte bleiben als Platzhalter sichtbar."
            >
              {showStatutePreview ? (
                <pre className="max-h-[36rem] overflow-auto rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-6 text-slate-700 whitespace-pre-wrap">
                  {statutePreview}
                </pre>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                  Starte den Generator, um den Satzungsentwurf mit deinen Variablen anzuzeigen.
                </div>
              )}
            </FoundingPrompt>
          </div>

          <div className="space-y-4">
            {statuteChecks.map((check) => (
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
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="founding-founders-meeting" label="Kategorie" title="Gründerversammlung" defaultOpen={false}>
        <div className="space-y-5">
          <FoundingTodoList items={foundersMeetingTodos} state={foundersMeetingState} setState={setFoundersMeetingState} />
          <div className="space-y-4">
            {renderCheck("founding_meeting")}
            {renderCheck("board_election")}
            {renderCheck("signed_statute")}
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="founding-notary" label="Kategorie" title="Notartermin" defaultOpen={false}>
        <div className="space-y-5">
          <FoundingTodoList items={notaryTodos} state={notaryState} setState={setNotaryState} />
          <div className="space-y-4">
            {renderCheck("registry_application")}
            {renderCheck("notarization")}
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="founding-gemeinnuetzigkeit" label="Kategorie" title="Gemeinnützigkeit" defaultOpen={false}>
        <div className="mt-5 space-y-4">
          {nonprofitChecks
            .filter((check) => check.id !== "nonprofit_strategy")
            .map((check) => (
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
