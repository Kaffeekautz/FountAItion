import type { AppState, RagStatus, UploadDocumentResponse } from "../types";
import { CollapsibleSection } from "../components/CollapsibleSection";
import { DisclaimerBox } from "../components/DisclaimerBox";
import { DocumentCard } from "../components/DocumentCard";
import { UploadPanel } from "../components/UploadPanel";
import { toSectionId } from "../utils/sectionIds";

interface DocumentsViewProps {
  state: AppState;
  ragStatus: RagStatus | null;
  isMarkingDocumentType: string | null;
  isUploading: boolean;
  isReindexing: boolean;
  lastUploadResult: UploadDocumentResponse | null;
  onMarkAvailable: (documentType: string, title?: string) => Promise<void>;
  onUpload: (file: File) => Promise<void>;
  onReindex: () => Promise<void>;
}

export function DocumentsView({
  state,
  ragStatus,
  isMarkingDocumentType,
  isUploading,
  isReindexing,
  lastUploadResult,
  onMarkAvailable,
  onUpload,
  onReindex,
}: DocumentsViewProps) {
  const groupedTemplates = state.document_templates.reduce<Record<string, typeof state.document_templates>>((accumulator, template) => {
    accumulator[template.category] = [...(accumulator[template.category] ?? []), template];
    return accumulator;
  }, {});
  const availableDocumentTypes = new Set(state.documents.map((document) => document.document_type));

  return (
    <div className="space-y-6">
      <CollapsibleSection id="documents-overview" label="Dokumentenportfolio" title="Dokumentenportfolio" defaultOpen={false}>
        <p className="text-sm text-slate-600">
          Die Dokumente im Portfolio dienen der Vorbereitung und Strukturierung der e.V.-Gründung. Sie ersetzen keine rechtliche Prüfung.
        </p>
      </CollapsibleSection>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="panel-section">
          <p className="muted-label">Portfolio-Dokumente gesamt</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{state.document_templates.length}</p>
        </div>
        <div className="panel-section">
          <p className="muted-label">Im Pilot vorhanden</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{availableDocumentTypes.size}</p>
        </div>
        <div className="panel-section">
          <p className="muted-label">Noch offen</p>
          <p className="mt-2 text-3xl font-bold text-rose-600">
            {Math.max(state.document_templates.length - availableDocumentTypes.size, 0)}
          </p>
        </div>
      </div>

      <CollapsibleSection id="documents-upload" label="Bereich" title="Upload" defaultOpen={false}>
        <UploadPanel onUpload={onUpload} isUploading={isUploading} lastUploadResult={lastUploadResult} />
      </CollapsibleSection>

      <CollapsibleSection id="documents-rag-status" label="Bereich" title="RAG-Status" defaultOpen={false}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-600">Lokaler Dokumentindex und aktueller Verarbeitungsstand.</p>
          </div>
          <button
            type="button"
            disabled={isReindexing}
            onClick={() => void onReindex()}
            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-navy disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isReindexing ? "Indexiert..." : "Index neu aufbauen"}
          </button>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-5">
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-400">Chunks</p><p className="mt-2 text-2xl font-semibold text-slate-900">{ragStatus?.chunks ?? 0}</p></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-400">Dokumente</p><p className="mt-2 text-2xl font-semibold text-slate-900">{ragStatus?.indexed_documents ?? 0}</p></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-400">Embedding-Chunks</p><p className="mt-2 text-2xl font-semibold text-slate-900">{ragStatus?.embedding_chunks ?? 0}</p></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-400">Keyword-only</p><p className="mt-2 text-2xl font-semibold text-slate-900">{ragStatus?.keyword_only_chunks ?? 0}</p></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-400">Ollama</p><p className="mt-2 text-2xl font-semibold text-slate-900">{ragStatus?.ollama_available ? "Ja" : "Nein"}</p></div>
        </div>
      </CollapsibleSection>

      {Object.entries(groupedTemplates).map(([category, templates]) => (
        <CollapsibleSection key={category} id={toSectionId("documents", category)} label="Kategorie" title={category} defaultOpen={false}>
          <div className="grid gap-4 xl:grid-cols-2">
            {templates.map((template) => (
              <DocumentCard
                key={template.id}
                template={template}
                isAvailable={availableDocumentTypes.has(template.document_type)}
                linkedChecks={state.checks.filter((check) => check.required_document_types.includes(template.document_type))}
                isSubmitting={isMarkingDocumentType === template.document_type}
                onMarkAvailable={() => onMarkAvailable(template.document_type, template.title)}
              />
            ))}
          </div>
        </CollapsibleSection>
      ))}

      <CollapsibleSection id="documents-uploads" label="Bereich" title="Aktuelle Uploads" defaultOpen={false}>
        <div className="space-y-4">
          {state.documents.length > 0 ? (
            state.documents.map((document) => (
              <div key={document.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="grid gap-3 md:grid-cols-2">
                  <p className="text-sm text-slate-600"><span className="font-semibold text-slate-900">Datei:</span> {document.filename}</p>
                  <p className="text-sm text-slate-600"><span className="font-semibold text-slate-900">Dokumenttyp:</span> {document.document_type}</p>
                  <p className="text-sm text-slate-600"><span className="font-semibold text-slate-900">Extraction Method:</span> {document.extraction_method ?? "Keine"}</p>
                  <p className="text-sm text-slate-600"><span className="font-semibold text-slate-900">Confidence:</span> {document.confidence.toFixed(2)}</p>
                  <p className="text-sm text-slate-600"><span className="font-semibold text-slate-900">Volltext vorhanden:</span> {document.extracted_text ? "Ja" : "Nein"}</p>
                </div>
                <p className="mt-3 rounded-2xl bg-white p-4 text-sm text-slate-600">
                  {document.extracted_text.slice(0, 240) || "Keine Textvorschau vorhanden."}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">Noch keine Dokumente im Pilot vorhanden.</p>
          )}
        </div>
      </CollapsibleSection>

      <DisclaimerBox text={state.disclaimer} />
    </div>
  );
}
