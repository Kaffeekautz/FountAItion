from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.chat_service import answer_chat
from app.classifier_service import classify_document
from app.document_processing import save_uploaded_file
from app.evidence_service import build_evidence_matrix
from app.models import (
    ChatRequest,
    MarkDocumentAvailableRequest,
    RagSearchRequest,
    SelectLegalFormRequest,
    UpdateCheckStatusRequest,
    UploadDocumentResponse,
)
from app.ocr_service import extract_text_from_file
from app.ollama_service import is_ollama_available
from app.rag_service import load_vector_store, search_rag
from app.storage import (
    add_uploaded_document,
    get_state,
    mark_document_available,
    reindex_all_documents,
    reset_state,
    select_legal_form,
    update_check_status,
)


app = FastAPI(title="FoundAItion backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "FoundAItion backend"}


@app.get("/api/state")
def api_state():
    return get_state()


@app.post("/api/reset-demo")
def api_reset_demo():
    return reset_state()


@app.get("/api/checks")
def api_checks():
    return get_state().checks


@app.get("/api/document-templates")
def api_document_templates():
    return get_state().document_templates


@app.get("/api/knowledge-base")
def api_knowledge_base():
    return get_state().knowledge_base


@app.post("/api/select-legal-form")
def api_select_legal_form(request: SelectLegalFormRequest):
    return select_legal_form(request.legal_form)


@app.post("/api/checks/{check_id}/status")
def api_update_check_status(check_id: str, request: UpdateCheckStatusRequest):
    try:
        return update_check_status(check_id, request.status)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.post("/api/documents/mark-available")
def api_mark_document_available(request: MarkDocumentAvailableRequest):
    return mark_document_available(request.document_type, request.title)


@app.post("/api/upload-document", response_model=UploadDocumentResponse)
async def api_upload_document(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Es wurde kein Dateiname übermittelt.")

    try:
        filename, file_path = save_uploaded_file(file)
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Die Datei konnte nicht gespeichert werden.") from exc

    extraction = {
        "extracted_text": Path(filename).stem,
        "extraction_method": "filename_fallback",
        "warnings": ["Die Text-Extraction wurde auf den Dateinamen reduziert."],
    }
    try:
        extraction = extract_text_from_file(file_path, filename)
    except Exception as exc:  # pragma: no cover - defensive fallback
        extraction["warnings"].append(f"Die Text-Extraction ist auf einen Fallback gewechselt: {exc}")

    document_type, confidence, classification_warnings = classify_document(
        filename,
        extraction.get("extracted_text", ""),
    )
    warnings = list(extraction.get("warnings", [])) + classification_warnings

    state, document, matched_checks = add_uploaded_document(
        filename=filename,
        document_type=document_type,
        confidence=confidence,
        warnings=warnings,
        extraction_method=extraction.get("extraction_method", "filename_fallback"),
        extracted_text=extraction.get("extracted_text", ""),
    )
    return UploadDocumentResponse(
        state=state,
        document=document,
        matched_checks=matched_checks,
        message="Dokument wurde verarbeitet und dem Pilotstatus zugeordnet.",
        disclaimer=state.disclaimer,
    )


@app.post("/api/rag/reindex")
def api_rag_reindex():
    total_chunks = reindex_all_documents()
    return {"message": "RAG-Index wurde neu aufgebaut.", "chunks": total_chunks}


@app.post("/api/rag/search")
def api_rag_search(request: RagSearchRequest):
    return search_rag(request.query, request.top_k)


@app.get("/api/rag/status")
def api_rag_status():
    chunks = load_vector_store()
    document_ids = {chunk.get("document_id") for chunk in chunks}
    embedding_chunks = sum(1 for chunk in chunks if chunk.get("embedding"))
    return {
        "chunks": len(chunks),
        "indexed_documents": len(document_ids),
        "embedding_chunks": embedding_chunks,
        "keyword_only_chunks": len(chunks) - embedding_chunks,
        "ollama_available": is_ollama_available(),
    }


@app.post("/api/chat")
def api_chat(request: ChatRequest):
    return answer_chat(request.message, get_state(), request.mode or "help")


@app.get("/api/evidence/matrix")
def api_evidence_matrix():
    return build_evidence_matrix(get_state())
