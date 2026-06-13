import { useMemo, useState } from "react";
import { BookOpen, Bot, Building2, ChevronDown, ChevronRight, FileStack, LayoutDashboard, ShieldCheck, Sparkles } from "lucide-react";
import foundaitionLogo from "../assets/foundaition-logo.jpg";

type ExtendedViewKey = "dashboard" | "company-type" | "founding" | "compliance" | "documents" | "evidence" | "resources" | "ask-me";

interface NavigationSection {
  id: string;
  label: string;
}

interface SidebarProps {
  currentView: ExtendedViewKey;
  activeSectionId?: string | null;
  sectionsByView: Partial<Record<ExtendedViewKey, NavigationSection[]>>;
  onNavigate: (view: ExtendedViewKey, sectionId?: string) => void;
}

const items: Array<{ key: ExtendedViewKey; label: string; icon: typeof LayoutDashboard }> = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "documents", label: "Dokumente", icon: FileStack },
  { key: "company-type", label: "Rechtsform", icon: Building2 },
  { key: "founding", label: "Gründung", icon: Sparkles },
  { key: "compliance", label: "Compliance", icon: ShieldCheck },
  { key: "resources", label: "Glossar", icon: BookOpen },
  { key: "ask-me", label: "Frag mich", icon: Bot },
];

export function Sidebar({ currentView, activeSectionId, sectionsByView, onNavigate }: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<Partial<Record<ExtendedViewKey, boolean>>>({});

  const visibleItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        sections: sectionsByView[item.key] ?? [],
      })),
    [sectionsByView],
  );

  const toggleExpanded = (key: ExtendedViewKey) => {
    setExpandedItems((current) => ({
      ...current,
      [key]: !(current[key] ?? key === currentView),
    }));
  };

  return (
    <aside className="panel hidden h-[calc(100vh-2rem)] w-full max-w-[280px] shrink-0 self-start overflow-y-auto px-5 py-6 lg:sticky lg:top-4 lg:flex lg:flex-col">
      <div className="px-2">
        <img
          src={foundaitionLogo}
          alt="FoundAItion Logo"
          className="w-full rounded-3xl border border-slate-200 object-cover shadow-sm"
        />
        <div className="mt-4 text-center">
          <div className="text-3xl font-bold text-slate-900">
            Found<span className="text-brand-violet">AI</span>tion
          </div>
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Pilot</p>
        </div>
      </div>
      <nav className="mt-8 space-y-2">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = currentView === item.key;
          const isExpanded = expandedItems[item.key] ?? active;
          const hasSections = item.sections.length > 0;
          return (
            <div key={item.key} className="space-y-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate(item.key)}
                  className={`flex flex-1 items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                    active
                      ? "bg-brand-navy text-white shadow-soft"
                      : "text-slate-600 hover:bg-emerald-50 hover:text-brand-navy"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1">{item.label}</span>
                </button>
                {hasSections ? (
                  <button
                    type="button"
                    aria-label={`${item.label} Unterpunkte ${isExpanded ? "einklappen" : "ausklappen"}`}
                    onClick={() => toggleExpanded(item.key)}
                    className="rounded-2xl border border-emerald-100 bg-white px-3 py-3 text-slate-500 transition hover:border-emerald-200 hover:text-brand-navy"
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                ) : null}
              </div>
              {hasSections && isExpanded ? (
                <div className="ml-5 border-l border-emerald-100 pl-3">
                  <div className="space-y-1">
                    {item.sections.map((section) => {
                      const sectionActive = activeSectionId === section.id && currentView === item.key;
                      return (
                        <button
                          key={section.id}
                          type="button"
                          onClick={() => onNavigate(item.key, section.id)}
                          className={`block w-full rounded-xl px-3 py-2 text-left text-xs font-medium transition ${
                            sectionActive
                              ? "bg-emerald-50 text-brand-navy"
                              : "text-slate-500 hover:bg-emerald-50 hover:text-brand-navy"
                          }`}
                        >
                          {section.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
