import { useMemo, useState } from "react";

import { CollapsibleSection } from "../components/CollapsibleSection";
import { DisclaimerBox } from "../components/DisclaimerBox";
import type { AppState } from "../types";

type ViewKey = "dashboard" | "company-type" | "founding" | "compliance" | "documents" | "evidence" | "resources" | "ask-me";
type EntryMode = "direct" | "guided";

interface CompanyTypeViewProps {
  state: AppState;
  isSubmitting: boolean;
  onSelectLegalForm: () => Promise<boolean>;
  onNavigate: (view: ViewKey, sectionId?: string) => void;
}

interface DecisionOption {
  value: string;
  label: string;
}

interface DecisionQuestion {
  id: string;
  title: string;
  question: string;
  options: DecisionOption[];
}

const questionInfoTexts: Record<string, string> = {
  purpose: "Hier könnte eine kurze Erläuterung dazu stehen, worauf es bei der Zweckausrichtung ankommt.",
  membership: "Hier könnte eine kurze Erläuterung dazu stehen, wie sich Mitgliedschaft und Beteiligung unterscheiden.",
  founders: "Hier könnte eine kurze Erläuterung dazu stehen, warum die Anzahl der Gründungsmitglieder relevant ist.",
  governance: "Hier könnte eine kurze Erläuterung dazu stehen, was mit demokratischer Mitgliederverwaltung gemeint ist.",
  registry:
    "Rechtsfähig heißt: Die Organisation kann selbst Trägerin von Rechten und Pflichten sein, also z. B. Verträge schließen oder Eigentum halten.",
};

const decisionTreeSteps: DecisionQuestion[] = [
  {
    id: "purpose",
    title: "Frage 1",
    question: "Was ist der primäre Zweck Ihrer geplanten Organisation?",
    options: [
      { value: "economic", label: "Ich möchte wirtschaftliche Gewinne erzielen und/oder erwerbswirtschaftlich tätig sein." },
      {
        value: "ideell",
        label: "Ich verfolge einen ideellen, gemeinnützigen, mildtätigen oder kirchlichen Zweck - nicht primär auf Gewinn ausgerichtet.",
      },
      {
        value: "member-benefits",
        label: "Ich möchte meinen Mitgliedern wirtschaftliche Vorteile verschaffen, z. B. günstigere Einkaufskonditionen oder die gemeinschaftliche Nutzung von Ressourcen.",
      },
    ],
  },
  {
    id: "membership",
    title: "Frage 2",
    question:
      "Soll die Organisation auf einem freiwilligen Mitgliedschaftsprinzip oder einer persönlichen Beteiligung beruhen - d. h. können Personen als Mitglieder oder Gesellschafter ein- und austreten?",
    options: [
      { value: "yes", label: "Ja." },
      { value: "asset", label: "Nein, im Vordergrund steht ein gewidmetes Vermögen." },
      { value: "shares", label: "Nein, eine Beteiligung erfolgt durch kapitalmäßige Beteiligung (Anteile)." },
    ],
  },
  {
    id: "founders",
    title: "Frage 3",
    question: "Wie viele Gründungsmitglieder sind vorhanden oder geplant?",
    options: [
      { value: "lt7", label: "Weniger als 7 Personen." },
      { value: "gte7", label: "Mindestens 7 Personen." },
    ],
  },
  {
    id: "governance",
    title: "Frage 4",
    question: "Soll die Organisation demokratisch durch ihre Mitglieder verwaltet werden, z. B. durch eine Mitgliederversammlung als oberstes Organ?",
    options: [
      { value: "yes", label: "Ja." },
      { value: "no", label: "Nein, die Entscheidungsstruktur soll bei einer kleinen Gruppe oder bei Gesellschaftern liegen." },
    ],
  },
  {
    id: "registry",
    title: "Frage 5",
    question: "Soll die Organisation rechtsfähig sein?",
    options: [
      { value: "yes", label: "Ja." },
      { value: "no", label: "Nein." },
    ],
  },
];

const evPathIndicators = [
  { label: "Ideeller oder gemeinnütziger Zweck", key: "purpose" },
  { label: "Freiwillige Mitgliedschaft", key: "membership" },
  { label: "Mindestens 7 Gründungsmitglieder", key: "founders" },
  { label: "Demokratische Mitgliederverwaltung", key: "governance" },
  { label: "Rechtsfähigkeit", key: "registry" },
] as const;

function InfoHint({ text }: { text: string }) {
  return (
    <div className="group relative shrink-0">
      <button
        type="button"
        aria-label="Info"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-600 transition hover:border-brand-violet/30 hover:text-brand-violet"
      >
        i
      </button>
      <div className="pointer-events-none absolute right-0 top-10 z-10 w-64 rounded-2xl bg-slate-900 px-4 py-3 text-xs leading-5 text-white opacity-0 shadow-soft transition group-hover:opacity-100">
        {text}
      </div>
    </div>
  );
}

export function CompanyTypeView({ state, isSubmitting, onSelectLegalForm, onNavigate }: CompanyTypeViewProps) {
  const [entryMode, setEntryMode] = useState<EntryMode | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const isEvActive = state.founder_case.selectedLegalForm === "eingetragener Verein (e.V.)";
  const currentQuestionIndex = decisionTreeSteps.findIndex((step) => !answers[step.id]);
  const currentQuestion = currentQuestionIndex >= 0 ? decisionTreeSteps[currentQuestionIndex] : null;
  const guidedComplete = entryMode === "guided" && currentQuestion === null;
  const totalSteps = entryMode === "guided" ? decisionTreeSteps.length + 1 : 1;
  const completedSteps =
    entryMode === null ? 0 : entryMode === "direct" ? 1 : Math.min(Object.keys(answers).length + 1, totalSteps);
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const matchingEvCriteria = useMemo(
    () => ({
      purpose: answers.purpose === "ideell",
      membership: answers.membership === "yes",
      founders: answers.founders === "gte7",
      governance: answers.governance === "yes",
      registry: answers.registry === "yes",
    }),
    [answers],
  );

  const evMatchCount = Object.values(matchingEvCriteria).filter(Boolean).length;
  const evRecommended = entryMode === "direct" || (guidedComplete && evMatchCount === evPathIndicators.length);

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  };

  const handleBack = () => {
    if (entryMode !== "guided") {
      setEntryMode(null);
      return;
    }

    const answeredSteps = decisionTreeSteps.filter((step) => answers[step.id]);
    const previousStep = answeredSteps[answeredSteps.length - 1];
    if (!previousStep) {
      setEntryMode(null);
      return;
    }

    setAnswers((current) => {
      const next = { ...current };
      delete next[previousStep.id];
      return next;
    });
  };

  const handleReset = () => {
    setEntryMode(null);
    setAnswers({});
  };

  const handleActivate = async () => {
    if (isEvActive) {
      onNavigate("founding");
      return;
    }

    const activated = await onSelectLegalForm();
    if (activated) {
      onNavigate("founding");
    }
  };

  const activationLabel = isEvActive
    ? "Zum Gründungscheck"
    : evRecommended
      ? "e.V.-Pfad starten"
      : "e.V.-Pilot trotzdem öffnen";

  return (
    <div className="space-y-6">
      <CollapsibleSection id="company-type-overview" label="Entscheidungsbaum" title="Rechtsform auswählen">
        <p className="text-sm leading-6 text-slate-600">
          Nutze den Entscheidungsbaum als strukturierte Orientierung für die Rechtsformwahl. Der Pilot bildet aktuell nur den
          eingetragenen Verein (e.V.) ab; die Aktivierung des passenden Pilot-Pfads folgt darunter.
        </p>
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            <span>Fortschritt</span>
            <span>
              {completedSteps}/{totalSteps} Schritte
            </span>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand-violet transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </CollapsibleSection>

      {entryMode === null ? (
        <CollapsibleSection id="company-type-start" label="Start" title="Wie möchtest du zur Rechtsformentscheidung einsteigen?">
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <button
              type="button"
              onClick={() => setEntryMode("direct")}
              className="rounded-3xl border border-brand-violet/20 bg-brand-violet/5 px-5 py-5 text-left transition hover:border-brand-violet/40 hover:bg-brand-violet/10"
            >
              <p className="text-sm font-semibold text-slate-900">Ich weiß die Rechtsform schon</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Wenn du bereits weißt, dass du den e.V.-Pfad testen möchtest, kannst du ihn direkt unten aktivieren.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setEntryMode("guided")}
              className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-5 text-left transition hover:border-slate-300 hover:bg-white"
            >
              <p className="text-sm font-semibold text-slate-900">Ich möchte durch den Entscheidungsbaum geführt werden</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Beantworte die Fragen nacheinander. FoundAItion zeigt dir danach, wie gut der aktuelle Pilot zum e.V. passt.
              </p>
            </button>
          </div>
        </CollapsibleSection>
      ) : null}

      {entryMode === "guided" && currentQuestion ? (
        <CollapsibleSection
          id="company-type-decision"
          label={currentQuestion.title}
          title={currentQuestion.question}
          headerAside={
            <>
              <InfoHint text={questionInfoTexts[currentQuestion.id] ?? "Hier könnte eine Erläuterung stehen."} />
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                Schritt {currentQuestionIndex + 2} von {totalSteps}
              </span>
            </>
          }
        >
          <div className="mt-6 space-y-3">
            {currentQuestion.options.map((option) => (
              <div key={option.value}>
                <button
                  type="button"
                  onClick={() => handleAnswer(currentQuestion.id, option.value)}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-left text-sm leading-6 text-slate-700 transition hover:border-brand-violet/30 hover:bg-white hover:text-slate-900"
                >
                  {option.label}
                </button>
              </div>
            ))}
          </div>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Zurück
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
            >
              Neu starten
            </button>
          </div>
        </CollapsibleSection>
      ) : null}

      {entryMode === "guided" && Object.keys(answers).length > 0 ? (
        <CollapsibleSection id="company-type-progress" label="Bisherige Antworten" title="Zwischenstand">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Entscheidungsbaum zurücksetzen
            </button>
          </div>
          <div className="mt-6 grid gap-3">
            {decisionTreeSteps
              .filter((step) => answers[step.id])
              .map((step) => (
                <div key={step.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{step.title}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{step.question}</p>
                  <p className="mt-2 text-sm text-slate-600">
                    {step.options.find((option) => option.value === answers[step.id])?.label}
                  </p>
                </div>
              ))}
          </div>
        </CollapsibleSection>
      ) : null}

      {entryMode === "guided" && guidedComplete ? (
        <CollapsibleSection
          id="company-type-result"
          label="Auswertung"
          title={evRecommended ? 'Zu dir passt der "eingetragene Verein (e.V.)"' : "Der Entscheidungsbaum passt nicht eindeutig zum e.V.-Pilot."}
        >
          <div
            className={`mt-2 rounded-3xl border p-5 ${
              evRecommended ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-slate-200 bg-slate-50 text-slate-600"
            }`}
          >
            <p className="text-sm leading-6">
              {evRecommended
                ? "Deine Antworten entsprechen dem Muster eines eingetragenen Vereins: ideeller Zweck, Mitgliedschaft, mindestens sieben Gründungsmitglieder, demokratische Struktur und Registereintragung."
                : "Nicht alle Antworten sprechen für den eingetragenen Verein. Im aktuellen Pilot steht trotzdem nur der e.V.-Pfad für den weiteren Test zur Verfügung."}
            </p>
          </div>
        </CollapsibleSection>
      ) : null}

      {(entryMode === "direct" || guidedComplete) ? (
        <CollapsibleSection
          id="company-type-activation"
          label="e.V.-Pfad im Entscheidungsbaum"
          title={evRecommended ? "Der aktuelle Pilot passt zu deinem Entscheidungsbild" : "Der aktuelle Pilot bleibt auf den e.V. begrenzt"}
        >
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {evRecommended
              ? "Für den eingetragenen Verein verdichten sich im Entscheidungsbaum typischerweise diese Merkmale."
              : "Auch wenn der Fragebaum nicht eindeutig beim e.V. landet, kannst du den Pilotpfad für Demo- und Testzwecke trotzdem öffnen."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {evPathIndicators.map((indicator) => {
              const indicatorMatches =
                entryMode !== "guided" || matchingEvCriteria[indicator.key as keyof typeof matchingEvCriteria];

              return (
                <span
                  key={indicator.label}
                  className={`rounded-full border px-4 py-2 text-sm font-medium ${
                    indicatorMatches
                      ? "border-brand-violet/20 bg-brand-violet/10 text-brand-violet"
                      : "border-slate-200 bg-slate-100 text-slate-500"
                  }`}
                >
                  {indicator.label}
                </span>
              );
            })}
          </div>
        </CollapsibleSection>
      ) : null}

      {(entryMode === "direct" || guidedComplete || isEvActive) ? (
        <section className="panel-section">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="muted-label">Pilot-Aktivierung</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">e.V.-Pfad starten</h3>
              <p className="mt-2 text-sm text-slate-600">
                Dieser Schritt setzt den strukturierten FoundAItion-Pfad für den eingetragenen Verein.
              </p>
            </div>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void handleActivate()}
              className="rounded-2xl bg-brand-violet px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Wird aktiviert..." : activationLabel}
            </button>
          </div>

          {isEvActive ? (
            <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
              <h4 className="text-lg font-semibold text-emerald-900">Pilot-Pfad aktiv</h4>
              <p className="mt-2 text-sm leading-6 text-emerald-900">
                Dieser Pilot bildet beispielhaft den Gründungspfad eines eingetragenen Vereins (e.V.) ab. Weitere Rechtsformen
                können später ergänzt werden.
              </p>
            </div>
          ) : null}
        </section>
      ) : null}

      <DisclaimerBox text={state.disclaimer} />
    </div>
  );
}
