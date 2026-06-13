import { Building2, FileText, ShieldCheck } from "lucide-react";

import type { AppState } from "../types";
import { ActionCard } from "../components/ActionCard";
import { DisclaimerBox } from "../components/DisclaimerBox";
import { ProgressCard } from "../components/ProgressCard";
import { StatusBadge } from "../components/StatusBadge";

type ViewKey = "dashboard" | "company-type" | "founding" | "compliance" | "documents" | "evidence" | "resources" | "ask-me";

interface DashboardViewProps {
  state: AppState;
  onNavigate: (view: ViewKey, sectionId?: string) => void;
}

export function DashboardView({ state, onNavigate }: DashboardViewProps) {
  const relevantChecks = state.checks.filter((check) => check.status !== "optional");
  const doneChecks = relevantChecks.filter((check) => check.status === "done");
  const openChecks = relevantChecks.filter((check) => check.status !== "done").slice(0, 5);

  return (
    <div className="space-y-6">
      <section className="panel-section">
        <p className="muted-label">Willkommen</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Hallo {state.founder_case.userName}! 👋</h2>
        <p className="mt-3 text-lg text-slate-600">Schön, dass du da bist. Hier behältst du Pilotstatus, Unterlagen und nächste Schritte im Blick.</p>
      </section>

      <ProgressCard
        title="Pilot-Fortschritt"
        doneCount={doneChecks.length}
        totalCount={relevantChecks.length}
        description={`Du hast ${doneChecks.length} von ${relevantChecks.length} Schritten abgeschlossen.`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <ActionCard
          title="Rechtsform finden"
          description="Gehe den Entscheidungsbaum zur Rechtsformwahl durch und aktiviere danach den passenden Pilot-Pfad."
          icon={<Building2 className="h-6 w-6" />}
          actionLabel="Zum Entscheidungsbaum"
          onClick={() => onNavigate("company-type")}
        />
        <ActionCard
          title="Gründungs-Check"
          description="Arbeite die strukturierte Checkliste durch und halte deinen Status Schritt für Schritt aktuell."
          icon={<FileText className="h-6 w-6" />}
          actionLabel="Zum Gründungscheck"
          onClick={() => onNavigate("founding")}
        />
        <ActionCard
          title="Compliance"
          description="Behalte laufende Pflichten, Folgeprozesse und offene Compliance-Themen im Blick."
          icon={<ShieldCheck className="h-6 w-6" />}
          actionLabel="Zur Compliance"
          onClick={() => onNavigate("compliance")}
        />
      </div>

      <section className="panel-section">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="muted-label">To-do-Übersicht</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">Nächste offene Schritte</h3>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            Maximal 5 Einträge
          </span>
        </div>
        <div className="mt-6 space-y-4">
          {openChecks.map((check) => (
            <div key={check.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{check.title}</p>
                <p className="mt-1 text-sm text-slate-600">{check.description}</p>
              </div>
              <StatusBadge status={check.status} />
            </div>
          ))}
        </div>
      </section>

      <DisclaimerBox text={state.disclaimer} />
    </div>
  );
}
