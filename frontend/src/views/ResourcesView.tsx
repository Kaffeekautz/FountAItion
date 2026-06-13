import type { KnowledgeItem } from "../types";

interface ResourcesViewProps {
  items: KnowledgeItem[];
}

export function ResourcesView({ items }: ResourcesViewProps) {
  return (
    <div className="space-y-6">
      <section className="panel-section">
        <p className="muted-label">Wissenskatalog</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Ressourcen</h2>
        <p className="mt-3 text-sm text-slate-600">
          Der Begriffskatalog erklärt die im Pilot genutzten Fachbegriffe im FoundAItion-Kontext.
        </p>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        {items.map((item) => (
          <div key={item.term} className="panel-section">
            <p className="muted-label">{item.category}</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">{item.term}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.explanation}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

