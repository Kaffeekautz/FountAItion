from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class FounderCase(BaseModel):
    userName: str
    companyName: str
    foundersCount: int
    wantsLimitedLiability: bool
    hasWebsite: bool
    processesPersonalData: bool
    usesAiTools: bool
    selectedLegalForm: str | None


class FoundingCheck(BaseModel):
    id: str
    category: str
    title: str
    description: str
    status: str
    required_document_types: list[str]
    matched_document_ids: list[str]
    explanation: str


class DocumentTemplate(BaseModel):
    id: str
    title: str
    category: str
    description: str
    document_type: str
    template_type: str


class DocumentRecord(BaseModel):
    id: str
    filename: str
    document_type: str
    confidence: float
    extraction_method: str | None
    extracted_text: str
    warnings: list[str]


class EvidenceRecord(BaseModel):
    id: str
    check_id: str
    document_id: str
    evidence_status: str
    reason: str


class KnowledgeItem(BaseModel):
    term: str
    category: str
    explanation: str


class AppState(BaseModel):
    founder_case: FounderCase
    checks: list[FoundingCheck]
    document_templates: list[DocumentTemplate]
    documents: list[DocumentRecord]
    evidence_records: list[EvidenceRecord]
    knowledge_base: list[KnowledgeItem]
    disclaimer: str


class SelectLegalFormRequest(BaseModel):
    legal_form: str


class UpdateCheckStatusRequest(BaseModel):
    status: str


class MarkDocumentAvailableRequest(BaseModel):
    document_type: str
    title: str | None = None


class UploadDocumentResponse(BaseModel):
    state: AppState
    document: DocumentRecord
    matched_checks: list[str]
    message: str
    disclaimer: str


class RagChunk(BaseModel):
    id: str
    document_id: str
    filename: str
    document_type: str
    chunk_index: int
    text: str
    embedding: list[float] | None
    metadata: dict[str, Any] = Field(default_factory=dict)


class RagSearchRequest(BaseModel):
    query: str
    top_k: int = 3


class RagSearchResult(BaseModel):
    chunk_id: str
    document_id: str
    filename: str
    document_type: str
    chunk_index: int
    text: str
    score: float
    retrieval_method: str


class RagSearchResponse(BaseModel):
    query: str
    results: list[RagSearchResult]
    retrieval_method: str
    warnings: list[str]


class ChatRequest(BaseModel):
    message: str
    mode: str | None = None


class ChatSource(BaseModel):
    source_type: str
    title: str
    reference_id: str | None = None
    excerpt: str | None = None


class ChatResponse(BaseModel):
    intent: str
    answer: str
    sources: list[ChatSource]
    related_documents: list[DocumentRecord]
    related_checks: list[FoundingCheck]
    warnings: list[str]
    disclaimer: str


class EvidenceMatrixRow(BaseModel):
    check_id: str
    check_title: str
    category: str
    check_status: str
    required_document_types: list[str]
    matched_documents: list[DocumentRecord]
    missing_document_types: list[str]
    evidence_status: str
    explanation: str


class EvidenceSummary(BaseModel):
    total_checks: int
    checks_with_full_evidence: int
    checks_with_partial_evidence: int
    checks_missing_evidence: int
    checks_without_required_documents: int
    total_required_document_types: int
    total_matched_documents: int
    total_missing_document_types: int


class EvidenceMatrixResponse(BaseModel):
    summary: EvidenceSummary
    rows: list[EvidenceMatrixRow]
    disclaimer: str
    product_message: str
