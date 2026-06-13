import foundaitionLogo from "../assets/foundaition-logo.jpg";

interface HeaderProps {
  title: string;
  subtitle: string;
  selectedLegalForm: string | null;
}

export function Header({ title, subtitle, selectedLegalForm }: HeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-4 rounded-3xl bg-gradient-to-r from-brand-navy via-slate-900 to-brand-violet px-6 py-6 text-white shadow-soft lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <img
            src={foundaitionLogo}
            alt="FoundAItion Logo"
            className="h-12 w-12 rounded-2xl border border-white/15 object-cover"
          />
          <p className="text-sm font-medium text-white/70">FoundAItion Pilot</p>
        </div>
        <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/80">{subtitle}</p>
      </div>
      <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">POC-Pfad</p>
        <p className="mt-2 text-sm font-semibold">
          {selectedLegalForm ?? "Noch kein POC-Pfad ausgewählt"}
        </p>
      </div>
    </header>
  );
}
