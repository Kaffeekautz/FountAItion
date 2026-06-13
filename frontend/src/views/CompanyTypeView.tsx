import type { AppState } from "../types";
import { DisclaimerBox } from "../components/DisclaimerBox";

type ViewKey = "dashboard" | "company-type" | "founding" | "documents" | "evidence" | "resources" | "help";

interface CompanyTypeViewProps {
  state: AppState;
  isSubmitting: boolean;
  onSelectLegalForm: () => Promise<void>;
  onNavigate: (view: ViewKey) => void;
}

export function CompanyTypeView({
  state,
  isSubmitting,
  onSelectLegalForm,
  onNavigate,
}: CompanyTypeViewProps) {
  const steps = [
    {
      question: "Gründest du allein oder mit mehreren Personen?",
      answer: state.founder_case.foundersCount > 1 ? "Mit mehreren Personen" : "Allein",
    },
    {
      question: "Soll persönliche Haftung möglichst begrenzt werden?",
      answer: state.founder_case.wantsLimitedLiability ? "Ja" : "Nein",
    },
    {
      question: "Ist eine Kapitalgesellschaft grundsätzlich denkbar?",
      answer: "Ja, im Pilot ist der Kapitalgesellschafts-Pfad vorgesehen.",
    },
    {
      question: "Möchtest du den UG-POC-Pfad öffnen?",
      answer: state.founder_case.selectedLegalForm ? "Bereits aktiviert" : "Jetzt aktivierbar",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="panel-section">
        <p className="muted-label">Entscheidungsbaum</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">UG-Pfad aktivieren</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Der Pilot bildet nur die Gesellschaftsform „UG haftungsbeschränkt“ ab und führt dafür durch einen fokussierten POC-Pfad.
        </p>
      </section>

      <div className="grid gap-4">
        {steps.map((step, index) => (
          <div key={step.question} className="panel-section">
            <p className="muted-label">Frage {index + 1}</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">{step.question}</h3>
            <div className="mt-4 inline-flex rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
              {step.answer}
            </div>
          </div>
        ))}
      </div>

      <div className="panel-section">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="muted-label">POC-Aktivierung</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">UG-Pfad starten</h3>
            <p className="mt-2 text-sm text-slate-600">
              Dieser Schritt setzt den strukturierten FoundAItion-Pfad für die UG haftungsbeschränkt.
            </p>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => void onSelectLegalForm()}
            className="rounded-2xl bg-brand-violet px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Wird aktiviert..." : "UG-Pfad starten"}
          </button>
        </div>

        {state.founder_case.selectedLegalForm ? (
          <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
            <h4 className="text-lg font-semibold text-emerald-900">POC-Pfad aktiv</h4>
            <p className="mt-2 text-sm leading-6 text-emerald-900">
              Dieser Pilot bildet beispielhaft den Gründungspfad einer UG haftungsbeschränkt ab. Weitere Rechtsformen können später ergänzt werden.
            </p>
            <button
              type="button"
              onClick={() => onNavigate("founding")}
              className="mt-4 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Zum Gründungscheck
            </button>
          </div>
        ) : null}
      </div>

      <DisclaimerBox text={state.disclaimer} />
    </div>
  );
}

