import { useMemo, useState } from "react";

import type { UploadDocumentResponse } from "../types";

interface UploadPanelProps {
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  lastUploadResult: UploadDocumentResponse | null;
}

const extractionMethodLabel: Record<string, string> = {
  pdf_text: "PDF-Text",
  ocr: "OCR",
  text: "Text-Extraction",
  filename_fallback: "Dateiname-Fallback",
  unsupported: "Nicht unterstützt",
  manual: "Manuell",
};

export function UploadPanel({ onUpload, isUploading, lastUploadResult }: UploadPanelProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const previewText = useMemo(
    () => lastUploadResult?.document.extracted_text.slice(0, 260) ?? "",
    [lastUploadResult],
  );

  const handleSubmit = async () => {
    if (!selectedFile) {
      return;
    }
    await onUpload(selectedFile);
    setSelectedFile(null);
  };

  return (
    <div className="panel-section">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="muted-label">Upload</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">Dokument hochladen</h3>
          <p className="mt-2 text-sm text-slate-600">
            PDFs und Bilder werden direkt klassifiziert, textuell aufbereitet und dem Pilotstatus zugeordnet.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="file"
            onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600"
          />
          <button
            type="button"
            disabled={!selectedFile || isUploading}
            onClick={handleSubmit}
            className="rounded-2xl bg-brand-violet px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUploading ? "Wird verarbeitet..." : "Hochladen"}
          </button>
        </div>
      </div>

      {lastUploadResult ? (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <h4 className="text-lg font-semibold text-slate-900">Letztes Upload-Ergebnis</h4>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">Datei:</span> {lastUploadResult.document.filename}
            </p>
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">Dokumenttyp:</span> {lastUploadResult.document.document_type}
            </p>
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">Confidence:</span> {lastUploadResult.document.confidence.toFixed(2)}
            </p>
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">Extraction Method:</span>{" "}
              {extractionMethodLabel[lastUploadResult.document.extraction_method ?? ""] ?? lastUploadResult.document.extraction_method ?? "Unbekannt"}
            </p>
            <p className="text-sm text-slate-600 md:col-span-2">
              <span className="font-semibold text-slate-900">Gematchte Checks:</span>{" "}
              {lastUploadResult.matched_checks.length > 0 ? lastUploadResult.matched_checks.join(", ") : "Keine"}
            </p>
          </div>
          <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Textvorschau</p>
            <p className="mt-2 whitespace-pre-wrap">{previewText || "Kein extrahierter Volltext verfügbar."}</p>
          </div>
          {lastUploadResult.document.warnings.length > 0 ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">Warnings</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {lastUploadResult.document.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
