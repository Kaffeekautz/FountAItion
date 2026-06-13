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
import { DashboardView } from "./views/DashboardView";
import { CompanyTypeView } from "./views/CompanyTypeView";
import { DocumentsView } from "./views/DocumentsView";
import { EvidenceView } from "./views/EvidenceView";
import { FoundingView } from "./views/FoundingView";
import { HelpView } from "./views/HelpView";
import { ResourcesView } from "./views/ResourcesView";
import type {
  AppState,
  ChatMessage,
  CheckStatus,
  EvidenceMatrixResponse,
  RagStatus,
  UploadDocumentResponse,
} from "./types";

type ViewKey = "dashboard" | "company-type" | "founding" | "documents" | "evidence" | "resources" | "help";

const viewMeta: Record<ViewKey, { title: string; subtitle: string }> = {
  dashboard: {
    title: "Compliance Dashboard",
    subtitle: "Behalte Demo-State, Fortschritt und nächste Schritte für den UG-Pilot zentral im Blick.",
  },
  "company-type": {
    title: "Unternehmensart",
    subtitle: "Aktiviere den fokussierten UG-Pfad über den kompakten Entscheidungsbaum.",
  },
  founding: {
    title: "Gründung",
    subtitle: "Arbeite den strukturierten FoundAItion-Gründungscheck Schritt für Schritt ab.",
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
    title: "Ressourcen",
    subtitle: "Nutze den FoundAItion-Begriffskatalog als begrenzte Wissensbasis im Pilotkontext.",
  },
  help: {
    title: "Hilfe",
    subtitle: "Stelle nur erlaubte FoundAItion-Fragen zu Dokumenten, Nachweisen, Checks und Begriffen.",
  },
};

function App() {
  const [appState, setAppState] = useState<AppState | null>(null);
  const [evidenceMatrix, setEvidenceMatrix] = useState<EvidenceMatrixResponse | null>(null);
  const [ragStatus, setRagStatus] = useState<RagStatus | null>(null);
  const [currentView, setCurrentView] = useState<ViewKey>("dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSelectingLegalForm, setIsSelectingLegalForm] = useState(false);
  const [updatingCheckId, setUpdatingCheckId] = useState<string | null>(null);
  const [markingDocumentType, setMarkingDocumentType] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isReindexing, setIsReindexing] = useState(false);
  const [lastUploadResult, setLastUploadResult] = useState<UploadDocumentResponse | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Ich beantworte im Pilot nur Fragen zu Dokumenten, offenen Nachweisen, Checklistenpunkten und Begriffen im FoundAItion-Kontext.",
      response: {
        intent: "OUT_OF_SCOPE",
        answer:
          "Ich beantworte im Pilot nur Fragen zu Dokumenten, offenen Nachweisen, Checklistenpunkten und Begriffen im FoundAItion-Kontext.",
        disclaimer: "FoundAItion gibt eine strukturierende Orientierung und ersetzt keine Rechtsberatung.",
        related_checks: [],
        related_documents: [],
        sources: [],
        warnings: [],
      },
    },
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

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

  const currentMeta = useMemo(() => viewMeta[currentView], [currentView]);

  const handleSelectLegalForm = async () => {
    setIsSelectingLegalForm(true);
    setError(null);
    try {
      const nextState = await selectLegalForm("UG haftungsbeschränkt");
      setAppState(nextState);
      setEvidenceMatrix(await fetchEvidenceMatrix());
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "UG-Pfad konnte nicht aktiviert werden.");
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
    setChatMessages((current) => [...current, userEntry]);
    setIsChatLoading(true);
    setError(null);
    try {
      const response = await sendChatMessage(message);
      setChatMessages((current) => [
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
      setIsChatLoading(false);
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
        return <DashboardView state={appState} onNavigate={setCurrentView} />;
      case "company-type":
        return (
          <CompanyTypeView
            state={appState}
            isSubmitting={isSelectingLegalForm}
            onSelectLegalForm={handleSelectLegalForm}
            onNavigate={setCurrentView}
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
      case "evidence":
        return <EvidenceView evidenceMatrix={evidenceMatrix} />;
      case "resources":
        return <ResourcesView items={appState.knowledge_base} />;
      case "help":
        return <HelpView messages={chatMessages} isLoading={isChatLoading} onSend={handleSendChat} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-4 lg:px-6">
      <div className="mx-auto flex max-w-[1600px] gap-6">
        <Sidebar currentView={currentView} onNavigate={setCurrentView} />
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
