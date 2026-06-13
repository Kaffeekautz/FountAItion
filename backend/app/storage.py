from __future__ import annotations

from copy import deepcopy
from uuid import uuid4

from app.demo_state import DISCLAIMER, build_demo_state
from app.models import AppState, DocumentRecord, EvidenceRecord


VALID_STATUSES = {"done", "missing", "required", "check", "optional"}
_STATE = build_demo_state()


def get_initial_state() -> AppState:
    return build_demo_state()


def _copy_state(state: AppState) -> AppState:
    return AppState.model_validate(deepcopy(state.model_dump()))


def _rebuild_evidence_records(state: AppState) -> None:
    evidence_records: list[EvidenceRecord] = []
    for check in state.checks:
        for document_id in check.matched_document_ids:
            evidence_records.append(
                EvidenceRecord(
                    id=f"evidence-{check.id}-{document_id}",
                    check_id=check.id,
                    document_id=document_id,
                    evidence_status="matched",
                    reason="Dokumenttyp wurde dem Check technisch zugeordnet.",
                )
            )
    state.evidence_records = evidence_records


def _sync_check_matches(state: AppState) -> None:
    for check in state.checks:
        matched_documents = [
            document
            for document in state.documents
            if document.document_type in check.required_document_types
        ]
        check.matched_document_ids = [document.id for document in matched_documents]

        if not check.required_document_types:
            continue

        required_types = set(check.required_document_types)
        matched_types = {document.document_type for document in matched_documents}
        if required_types and required_types.issubset(matched_types):
            check.status = "done"
        elif matched_types:
            check.status = "check"
        elif check.status == "done":
            check.status = "missing"

    _rebuild_evidence_records(state)


def get_state() -> AppState:
    return _copy_state(_STATE)


def reset_state() -> AppState:
    global _STATE
    _STATE = build_demo_state()
    try:
        from app.rag_service import save_vector_store

        save_vector_store([])
    except Exception:
        pass
    return get_state()


def select_legal_form(legal_form: str) -> AppState:
    _STATE.founder_case.selectedLegalForm = legal_form
    if legal_form:
        for check in _STATE.checks:
            if check.id == "legal_form_path":
                check.status = "done"
                break
    return get_state()


def update_check_status(check_id: str, status: str) -> AppState:
    if status not in VALID_STATUSES:
        raise ValueError(f"Ungültiger Status: {status}")
    for check in _STATE.checks:
        if check.id == check_id:
            check.status = status
            return get_state()
    raise KeyError(f"Check nicht gefunden: {check_id}")


def _create_document_record(
    filename: str,
    document_type: str,
    confidence: float,
    warnings: list[str],
    extraction_method: str | None,
    extracted_text: str,
) -> DocumentRecord:
    return DocumentRecord(
        id=f"doc-{uuid4().hex[:10]}",
        filename=filename,
        document_type=document_type,
        confidence=confidence,
        extraction_method=extraction_method,
        extracted_text=extracted_text,
        warnings=warnings,
    )


def mark_document_available(document_type: str, title: str | None = None) -> AppState:
    filename = title or f"{document_type}.md"
    document = _create_document_record(
        filename=filename,
        document_type=document_type,
        confidence=1.0,
        warnings=[],
        extraction_method="manual",
        extracted_text=title or document_type,
    )
    _STATE.documents.append(document)
    _sync_check_matches(_STATE)
    return get_state()


def add_uploaded_document(
    filename: str,
    document_type: str,
    confidence: float,
    warnings: list[str],
    extraction_method: str,
    extracted_text: str,
) -> tuple[AppState, DocumentRecord, list[str]]:
    document = _create_document_record(
        filename=filename,
        document_type=document_type,
        confidence=confidence,
        warnings=list(warnings),
        extraction_method=extraction_method,
        extracted_text=extracted_text,
    )
    _STATE.documents.append(document)
    _sync_check_matches(_STATE)
    matched_checks = [
        check.id
        for check in _STATE.checks
        if document.id in check.matched_document_ids
    ]

    if extracted_text.strip():
        try:
            from app import rag_service

            rag_service.index_document(document)
        except Exception:  # pragma: no cover - defensive fallback
            document.warnings.append("Das Dokument konnte nicht vollständig in den lokalen RAG-Index übernommen werden.")

    return get_state(), document, matched_checks


def reindex_all_documents() -> int:
    from app import rag_service

    return rag_service.index_all_documents(_STATE.documents)


def get_disclaimer() -> str:
    return DISCLAIMER
