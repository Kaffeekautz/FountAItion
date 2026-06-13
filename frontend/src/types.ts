export type CheckStatus = "done" | "missing" | "required" | "check" | "optional";

export interface FounderCase {
  userName: string;
  companyName: string;
  foundersCount: number;
  wantsLimitedLiability: boolean;
  hasWebsite: boolean;
  processesPersonalData: boolean;
  usesAiTools: boolean;
  selectedLegalForm: string | null;
}

export interface FoundingCheck {
  id: string;
  category: string;
  title: string;
  description: string;
  status: CheckStatus;
  required_document_types: string[];
  matched_document_ids: string[];
  explanation: string;
}

export interface DocumentTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  document_type: string;
  template_type: string;
}

export interface DocumentRecord {
  id: string;
  filename: string;
  document_type: string;
  confidence: number;
  extraction_method: string | null;
  extracted_text: string;
  warnings: string[];
}

export interface EvidenceRecord {
  id: string;
  check_id: string;
  document_id: string;
  evidence_status: string;
  reason: string;
}

export interface KnowledgeItem {
  term: string;
  category: string;
  explanation: string;
}

export interface AppState {
  founder_case: FounderCase;
  checks: FoundingCheck[];
  document_templates: DocumentTemplate[];
  documents: DocumentRecord[];
  evidence_records: EvidenceRecord[];
  knowledge_base: KnowledgeItem[];
  disclaimer: string;
}

export interface UploadDocumentResponse {
  state: AppState;
  document: DocumentRecord;
  matched_checks: string[];
  message: string;
  disclaimer: string;
}

export interface RagSearchResult {
  chunk_id: string;
  document_id: string;
  filename: string;
  document_type: string;
  chunk_index: number;
  text: string;
  score: number;
  retrieval_method: string;
}

export interface RagSearchResponse {
  query: string;
  results: RagSearchResult[];
  retrieval_method: string;
  warnings: string[];
}

export interface RagStatus {
  chunks: number;
  indexed_documents: number;
  embedding_chunks: number;
  keyword_only_chunks: number;
  ollama_available: boolean;
}

export interface ChatSource {
  source_type: string;
  title: string;
  reference_id?: string | null;
  excerpt?: string | null;
}

export interface ChatResponse {
  intent: string;
  answer: string;
  sources: ChatSource[];
  related_documents: DocumentRecord[];
  related_checks: FoundingCheck[];
  warnings: string[];
  disclaimer: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  response?: ChatResponse;
}

export interface EvidenceMatrixRow {
  check_id: string;
  check_title: string;
  category: string;
  check_status: string;
  required_document_types: string[];
  matched_documents: DocumentRecord[];
  missing_document_types: string[];
  evidence_status: string;
  explanation: string;
}

export interface EvidenceSummary {
  total_checks: number;
  checks_with_full_evidence: number;
  checks_with_partial_evidence: number;
  checks_missing_evidence: number;
  checks_without_required_documents: number;
  total_required_document_types: number;
  total_matched_documents: number;
  total_missing_document_types: number;
}

export interface EvidenceMatrixResponse {
  summary: EvidenceSummary;
  rows: EvidenceMatrixRow[];
  disclaimer: string;
  product_message: string;
}

