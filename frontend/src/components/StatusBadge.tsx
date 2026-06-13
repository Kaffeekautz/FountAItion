interface StatusBadgeProps {
  status: string;
}

const statusStyles: Record<string, string> = {
  done: "bg-emerald-100 text-emerald-700 border-emerald-200",
  missing: "bg-rose-100 text-rose-700 border-rose-200",
  required: "bg-amber-100 text-amber-800 border-amber-200",
  check: "bg-blue-100 text-blue-700 border-blue-200",
  optional: "bg-slate-100 text-slate-600 border-slate-200",
  complete: "bg-emerald-100 text-emerald-700 border-emerald-200",
  partial: "bg-amber-100 text-amber-800 border-amber-200",
  not_required: "bg-slate-100 text-slate-600 border-slate-200",
  check_only: "bg-blue-100 text-blue-700 border-blue-200",
  DOCUMENT_EXISTS: "bg-blue-100 text-blue-700 border-blue-200",
  MISSING_EVIDENCE: "bg-amber-100 text-amber-800 border-amber-200",
  CHECK_STATUS: "bg-violet-100 text-violet-700 border-violet-200",
  DOCUMENT_LOOKUP: "bg-cyan-100 text-cyan-700 border-cyan-200",
  TERM_EXPLANATION: "bg-indigo-100 text-indigo-700 border-indigo-200",
  EVIDENCE_SUMMARY: "bg-emerald-100 text-emerald-700 border-emerald-200",
  DOCUMENT_CONTENT_SEARCH: "bg-sky-100 text-sky-700 border-sky-200",
  OUT_OF_SCOPE: "bg-slate-100 text-slate-700 border-slate-200",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
        statusStyles[status] ?? "bg-slate-100 text-slate-700 border-slate-200"
      }`}
    >
      {status.split("_").join(" ")}
    </span>
  );
}
