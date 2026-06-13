import { useCallback, useEffect, useMemo, useState } from "react";

import {
  fetchAppState,
  fetchEvidenceMatrix,
  getRagStatus,
  markDocumentAvailable,
  reindexRag,
  selectLegalForm,
  sendChatMessage,
  updateCheckStatus,
  uploadDocument,
} from "./api/foundationApi";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { toSectionId } from "./utils/sectionIds";
import { AskMeView } from "./views/AskMeView";
import { ComplianceView } from "./views/ComplianceView";
import { DashboardView } from "./views/DashboardView";
import { CompanyTypeView } from "./views/CompanyTypeView";
import { DocumentsView } from "./views/DocumentsView";
import { EvidenceView } from "./views/EvidenceView";
import { FoundingView } from "./views/FoundingView";
import { ResourcesView } from "./views/ResourcesView";
import type {
  AppState,
  ChatMessage,
  CheckStatus,
  EvidenceMatrixResponse,
  RagStatus,
  UploadDocumentResponse,
} from "./types";

type ViewKey = "dashboard" | "company-type" | "founding" | "compliance" | "documents" | "evidence" | "resources" | "ask-me";

const createAskMeWelcomeMessage = (): ChatMessage => ({
  id: "ask-me-welcome",
  role: "assistant",
  text: 'Möchtest du mehr über „eingetragener Verein“ wissen? Antworte einfach mit Ja oder Nein.',
  response: {
    intent: "GUIDED_PROMPT",
    answer: 'Möchtest du mehr über „eingetragener Verein“ wissen? Antworte einfach mit Ja oder Nein.',
    disclaimer: "FoundAItion gibt eine strukturierende Orientierung und ersetzt keine Rechtsberatung.",
    related_checks: [],
    related_documents: [],
    sources: [],
    warnings: [],
  },
});

const viewMeta: Record<ViewKey, { title: string; subtitle: string }> = {
  dashboard: {
    title: "Compliance Dashboard",
    subtitle: "Behalte Demo-State, Fortschritt und nächste Schritte für den Pilot zentral im Blick.",
  },
  "company-type": {
      title: "Rechtsform",
      subtitle: "Nutze den Entscheidungsbaum zur Rechtsformwahl und aktiviere darunter den fokussierten e.V.-Pfad.",
  },
  founding: {
    title: "Gründung",
    subtitle: "Arbeite den strukturierten FoundAItion-Gründungscheck Schritt für Schritt ab.",
  },
  compliance: {
    title: "Compliance",
    subtitle: "Behalte laufende Pflichten, Folgeprozesse und spätere Register- oder Organisationspflichten im Blick.",
  },
  documents: {
    title: "Dokumente",
    subtitle: "Verwalte Dokumentvorlagen, Uploads, Text-Extraction und den lokalen RAG-Index.",
  },
  evidence: {
    title: "Evidence Buddy",
    subtitle: "Sieh auf einen Blick, welche Nachweise technisch belegt und welche noch offen sind.",
  },
  resources: {
    title: "Glossar",
    subtitle: "Nutze das e.V.-Glossar als laienverständliche Wissensbasis für Nutzer und den eingeschränkten Chat.",
  },
  "ask-me": {
    title: "Frag mich",
    subtitle: "Stelle eng geführte Pilotfragen zu e.V., Begriffen und Grundlagen.",
  },
};

function App() {
  const [appState, setAppState] = useState<AppState | null>(null);
  const [evidenceMatrix, setEvidenceMatrix] = useState<EvidenceMatrixResponse | null>(null);
  const [ragStatus, setRagStatus] = useState<RagStatus | null>(null);
  const [currentView, setCurrentView] = useState<ViewKey>("dashboard");
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSelectingLegalForm, setIsSelectingLegalForm] = useState(false);
  const [updatingCheckId, setUpdatingCheckId] = useState<string | null>(null);
  const [markingDocumentType, setMarkingDocumentType] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isReindexing, setIsReindexing] = useState(false);
  const [lastUploadResult, setLastUploadResult] = useState<UploadDocumentResponse | null>(null);
  const [askMeMessages, setAskMeMessages] = useState<ChatMessage[]>([createAskMeWelcomeMessage()]);
  const [isAskMeLoading, setIsAskMeLoading] = useState(false);

  const loadApp = useCallback(async () => {
    setError(null);
    const [state, matrix, status] = await Promise.all([
      fetchAppState(),
      fetchEvidenceMatrix(),
      getRagStatus(),
    ]);
    setAppState(state);
    setEvidenceMatrix(matrix);
    setRagStatus(status);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await loadApp();
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Backend konnte nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadApp]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (!activeSectionId) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      const target = document.getElementById(activeSectionId);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);

    return () => window.clearTimeout(timeoutId);
  }, [currentView, activeSectionId]);

  const currentMeta = useMemo(() => viewMeta[currentView], [currentView]);

  const sectionsByView = useMemo(() => {
    if (!appState) {
      return {};
    }

    const documentCategories = Array.from(new Set(appState.document_templates.map((template) => template.category)));
    const glossaryCategories = Array.from(new Set(appState.knowledge_base.map((item) => item.category)));

    return {
      "company-type": [
        { id: "company-type-start", label: "Start" },
        { id: "company-type-decision", label: "Entscheidungsbaum" },
        { id: "company-type-progress", label: "Zwischenstand" },
        { id: "company-type-result", label: "Auswertung" },
        { id: "company-type-activation", label: "Aktivierung" },
      ],
      founding: [
        { id: "founding-overview", label: "Übersicht" },
        { id: "founding-purpose", label: "Verbreitung & Konzept" },
        { id: "founding-founders-meeting", label: "Gründerversammlung" },
        { id: "founding-notary", label: "Notartermin" },
        { id: "founding-gemeinnuetzigkeit", label: "Gemeinnützigkeit" },
      ],
      compliance: [
        { id: "compliance-overview", label: "Übersicht" },
        { id: "compliance-finanzen", label: "Finanzen" },
        { id: "compliance-mitarbeiter", label: "Mitarbeiter" },
        { id: "compliance-mitgliederversammlung", label: "Mitgliederversammlung" },
        { id: "compliance-laufende-pflichten", label: "Laufende Pflichten" },
      ],
      documents: [
        { id: "documents-overview", label: "Übersicht" },
        { id: "documents-upload", label: "Upload" },
        { id: "documents-rag-status", label: "RAG-Status" },
        ...documentCategories.map((category) => ({ id: toSectionId("documents", category), label: category })),
        { id: "documents-uploads", label: "Aktuelle Uploads" },
      ],
      evidence: [
        { id: "evidence-overview", label: "Einordnung" },
        { id: "evidence-summary", label: "Übersicht" },
        { id: "evidence-matrix", label: "Matrix" },
      ],
      resources: [{ id: "resources-overview", label: "Übersicht" }, ...glossaryCategories.map((category) => ({ id: toSectionId("resources", category), label: category }))],
      "ask-me": [
        { id: "ask-me-overview", label: "Einordnung" },
        { id: "ask-me-chat", label: "Chat" },
      ],
    };
  }, [appState]);

  const handleNavigate = (view: ViewKey, sectionId?: string) => {
    setCurrentView(view);
    setActiveSectionId(sectionId ?? null);
  };

  const handleSelectLegalForm = async () => {
    setIsSelectingLegalForm(true);
    setError(null);
    try {
      const nextState = await selectLegalForm("eingetragener Verein (e.V.)");
      setAppState(nextState);
      setEvidenceMatrix(await fetchEvidenceMatrix());
      return true;
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "e.V.-Pfad konnte nicht aktiviert werden.");
      return false;
    } finally {
      setIsSelectingLegalForm(false);
    }
  };

  const handleUpdateCheckStatus = async (checkId: string, status: CheckStatus) => {
    setUpdatingCheckId(checkId);
    setError(null);
    try {
      const nextState = await updateCheckStatus(checkId, status);
      setAppState(nextState);
      setEvidenceMatrix(await fetchEvidenceMatrix());
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Checkstatus konnte nicht aktualisiert werden.");
    } finally {
      setUpdatingCheckId(null);
    }
  };

  const handleMarkAvailable = async (documentType: string, title?: string) => {
    setMarkingDocumentType(documentType);
    setError(null);
    try {
      const nextState = await markDocumentAvailable(documentType, title);
      setAppState(nextState);
      const [matrix, status] = await Promise.all([fetchEvidenceMatrix(), getRagStatus()]);
      setEvidenceMatrix(matrix);
      setRagStatus(status);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Dokument konnte nicht markiert werden.");
    } finally {
      setMarkingDocumentType(null);
    }
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);
    try {
      const result = await uploadDocument(file);
      setLastUploadResult(result);
      await loadApp();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Upload fehlgeschlagen.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleReindex = async () => {
    setIsReindexing(true);
    setError(null);
    try {
      await reindexRag();
      setRagStatus(await getRagStatus());
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "RAG-Index konnte nicht neu aufgebaut werden.");
    } finally {
      setIsReindexing(false);
    }
  };

  const handleSendChat = async (message: string) => {
    const userEntry: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: message,
    };
    setAskMeMessages((current) => [...current, userEntry]);
    setIsAskMeLoading(true);
    setError(null);
    try {
      const response = await sendChatMessage(message, "ask-me");
      setAskMeMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: response.answer,
          response,
        },
      ]);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Chat-Antwort konnte nicht geladen werden.");
    } finally {
      setIsAskMeLoading(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">FoundAItion wird geladen...</div>;
  }

  if (error && !appState) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
        <div className="panel-section max-w-xl text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Backend nicht erreichbar</h1>
          <p className="mt-3 text-sm text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!appState) {
    return null;
  }

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return <DashboardView state={appState} onNavigate={handleNavigate} />;
      case "company-type":
        return (
          <CompanyTypeView
            state={appState}
            isSubmitting={isSelectingLegalForm}
            onSelectLegalForm={handleSelectLegalForm}
            onNavigate={handleNavigate}
          />
        );
      case "founding":
        return (
          <FoundingView
            state={appState}
            updatingCheckId={updatingCheckId}
            onUpdateCheckStatus={handleUpdateCheckStatus}
          />
        );
      case "documents":
        return (
          <DocumentsView
            state={appState}
            ragStatus={ragStatus}
            isMarkingDocumentType={markingDocumentType}
            isUploading={isUploading}
            isReindexing={isReindexing}
            lastUploadResult={lastUploadResult}
            onMarkAvailable={handleMarkAvailable}
            onUpload={handleUpload}
            onReindex={handleReindex}
          />
        );
      case "compliance":
        return (
          <ComplianceView
            state={appState}
            updatingCheckId={updatingCheckId}
            isUploading={isUploading}
            lastUploadResult={lastUploadResult}
            onUpdateCheckStatus={handleUpdateCheckStatus}
            onUpload={handleUpload}
          />
        );
      case "evidence":
        return <EvidenceView evidenceMatrix={evidenceMatrix} />;
      case "resources":
        return <ResourcesView items={appState.knowledge_base} />;
      case "ask-me":
        return (
          <AskMeView
            messages={askMeMessages}
            isLoading={isAskMeLoading}
            onSend={handleSendChat}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-4 lg:px-6">
      <div className="mx-auto flex max-w-[1600px] items-start gap-6">
        <Sidebar
          currentView={currentView}
          activeSectionId={activeSectionId}
          sectionsByView={sectionsByView}
          onNavigate={handleNavigate}
        />
        <main className="min-w-0 flex-1">
          <Header
            title={currentMeta.title}
            subtitle={currentMeta.subtitle}
            selectedLegalForm={appState.founder_case.selectedLegalForm}
          />
          {error ? (
            <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </div>
          ) : null}
          {renderView()}
        </main>
      </div>
    </div>
  );
}

export default App;
