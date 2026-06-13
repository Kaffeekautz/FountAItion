import type { KnowledgeItem } from "../types";
import { CollapsibleSection } from "../components/CollapsibleSection";
import { toSectionId } from "../utils/sectionIds";

interface ResourcesViewProps {
  items: KnowledgeItem[];
}

export function ResourcesView({ items }: ResourcesViewProps) {
  const groupedItems = items.reduce<Record<string, KnowledgeItem[]>>((accumulator, item) => {
    accumulator[item.category] = [...(accumulator[item.category] ?? []), item];
    return accumulator;
  }, {});

  return (
    <div className="space-y-6">
      <CollapsibleSection id="resources-overview" label="Glossar" title="e.V.-Glossar" defaultOpen={false}>
        <p className="text-sm text-slate-600">
          Dieses Glossar erklärt die wichtigsten Begriffe rund um den eingetragenen Verein in knapper, laienverständlicher Form.
          Dieselbe Wissensbasis nutzt auch der eingeschränkte FoundAItion-Chat.
        </p>
        <div className="mt-4 inline-flex rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
          {items.length} Begriffe im Glossar
        </div>
      </CollapsibleSection>

      {Object.entries(groupedItems).map(([category, categoryItems]) => (
        <CollapsibleSection key={category} id={toSectionId("resources", category)} label="Kategorie" title={category} defaultOpen={false}>
          <div className="grid gap-4 xl:grid-cols-2">
            {categoryItems.map((item) => (
              <div key={item.term} className="panel-section">
                <p className="muted-label">{item.category}</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">{item.term}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.explanation}</p>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      ))}
    </div>
  );
}
