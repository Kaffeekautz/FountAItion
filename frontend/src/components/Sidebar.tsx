import { Bot, Building2, FileStack, LayoutDashboard, LifeBuoy, ShieldCheck, Sparkles } from "lucide-react";
import foundaitionLogo from "../assets/foundaition-logo.jpg";

type ViewKey = "dashboard" | "company-type" | "founding" | "documents" | "evidence" | "resources" | "help";

interface SidebarProps {
  currentView: ViewKey;
  onNavigate: (view: ViewKey) => void;
}

const items: Array<{ key: ViewKey; label: string; icon: typeof LayoutDashboard }> = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "company-type", label: "Unternehmensart", icon: Building2 },
  { key: "founding", label: "Gründung", icon: Sparkles },
  { key: "documents", label: "Dokumente", icon: FileStack },
  { key: "evidence", label: "Evidence Buddy", icon: ShieldCheck },
  { key: "resources", label: "Ressourcen", icon: Bot },
  { key: "help", label: "Hilfe", icon: LifeBuoy },
];

export function Sidebar({ currentView, onNavigate }: SidebarProps) {
  return (
    <aside className="panel hidden w-full max-w-[280px] shrink-0 flex-col px-5 py-6 lg:flex">
      <div className="px-2">
        <div className="flex items-center gap-3">
          <img
            src={foundaitionLogo}
            alt="FoundAItion Logo"
            className="h-14 w-14 rounded-2xl border border-slate-200 object-cover shadow-sm"
          />
          <div>
            <div className="text-2xl font-bold text-slate-900">
              Found<span className="text-brand-violet">AI</span>tion
            </div>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Pilot</p>
          </div>
        </div>
        <p className="mt-2 text-sm text-slate-500">Legal-Tech SaaS Pilot für strukturierte Gründungs-Checks.</p>
      </div>
      <nav className="mt-8 space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = currentView === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate(item.key)}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                active
                  ? "bg-slate-900 text-white shadow-soft"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
