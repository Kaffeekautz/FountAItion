import type {
  AppState,
  ChatResponse,
  CheckStatus,
  EvidenceMatrixResponse,
  RagSearchResponse,
  RagStatus,
  UploadDocumentResponse,
} from "../types";

const API_BASE_URL = "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  if (!response.ok) {
    let message = "API request failed";
    try {
      const payload = await response.json();
      message = payload.detail ?? message;
    } catch {
      message = await response.text();
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export function fetchAppState(): Promise<AppState> {
  return request<AppState>("/api/state");
}

export function selectLegalForm(legalForm: string): Promise<AppState> {
  return request<AppState>("/api/select-legal-form", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ legal_form: legalForm }),
  });
}

export function updateCheckStatus(checkId: string, status: CheckStatus): Promise<AppState> {
  return request<AppState>(`/api/checks/${checkId}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

export function markDocumentAvailable(documentType: string, title?: string): Promise<AppState> {
  return request<AppState>("/api/documents/mark-available", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document_type: documentType, title }),
  });
}

export function uploadDocument(file: File): Promise<UploadDocumentResponse> {
  const formData = new FormData();
  formData.append("file", file);

  return request<UploadDocumentResponse>("/api/upload-document", {
    method: "POST",
    body: formData,
  });
}

export function getRagStatus(): Promise<RagStatus> {
  return request<RagStatus>("/api/rag/status");
}

export function reindexRag(): Promise<{ message: string; chunks: number }> {
  return request<{ message: string; chunks: number }>("/api/rag/reindex", { method: "POST" });
}

export function searchRag(query: string, topK = 3): Promise<RagSearchResponse> {
  return request<RagSearchResponse>("/api/rag/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, top_k: topK }),
  });
}

export function sendChatMessage(message: string): Promise<ChatResponse> {
  return request<ChatResponse>("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
}

export function fetchEvidenceMatrix(): Promise<EvidenceMatrixResponse> {
  return request<EvidenceMatrixResponse>("/api/evidence/matrix");
}

