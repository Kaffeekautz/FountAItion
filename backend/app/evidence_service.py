from __future__ import annotations

from app.models import AppState, DocumentRecord, EvidenceMatrixResponse, EvidenceMatrixRow, EvidenceSummary


PRODUCT_MESSAGE = "FoundAItion zeigt nicht nur, was Gründer:innen brauchen – sondern auch, was sie bereits belegen können."
DISCLAIMER = "Die Evidence-Matrix ist ein technischer Pilotstatus und ersetzt keine rechtliche Prüfung."


def build_evidence_matrix(state: AppState) -> EvidenceMatrixResponse:
    rows: list[EvidenceMatrixRow] = []
    full = 0
    partial = 0
    missing = 0
    without_required = 0
    total_required_document_types = 0
    total_matched_documents = 0
    total_missing_document_types = 0

    for check in state.checks:
        required_document_types = list(check.required_document_types)
        matched_documents: list[DocumentRecord] = [
            document
            for document in state.documents
            if document.document_type in required_document_types
        ]
        missing_document_types = [
            document_type
            for document_type in required_document_types
            if all(document.document_type != document_type for document in matched_documents)
        ]

        if not required_document_types:
            evidence_status = "not_required" if check.status == "done" else "check_only"
            explanation = (
                "Für diesen Punkt ist im Pilot kein Dokumentnachweis vorgesehen."
                if evidence_status == "not_required"
                else "Dieser Punkt ist ein Merk- oder Prüfpunkt ohne verpflichtenden Dokumenttyp."
            )
            without_required += 1
        else:
            total_required_document_types += len(required_document_types)
            total_matched_documents += len(matched_documents)
            total_missing_document_types += len(missing_document_types)
            if matched_documents and not missing_document_types:
                evidence_status = "complete"
                explanation = "Alle benötigten Dokumenttypen sind im aktuellen Pilotzustand vorhanden."
                full += 1
            elif matched_documents and missing_document_types:
                evidence_status = "partial"
                explanation = "Ein Teil der benötigten Nachweise ist vorhanden, weitere Dokumenttypen fehlen noch."
                partial += 1
            else:
                evidence_status = "missing"
                explanation = "Für diesen Check wurde noch kein passender Dokumentnachweis gefunden."
                missing += 1

        rows.append(
            EvidenceMatrixRow(
                check_id=check.id,
                check_title=check.title,
                category=check.category,
                check_status=check.status,
                required_document_types=required_document_types,
                matched_documents=matched_documents,
                missing_document_types=missing_document_types,
                evidence_status=evidence_status,
                explanation=explanation,
            )
        )

    summary = EvidenceSummary(
        total_checks=len(state.checks),
        checks_with_full_evidence=full,
        checks_with_partial_evidence=partial,
        checks_missing_evidence=missing,
        checks_without_required_documents=without_required,
        total_required_document_types=total_required_document_types,
        total_matched_documents=total_matched_documents,
        total_missing_document_types=total_missing_document_types,
    )

    return EvidenceMatrixResponse(
        summary=summary,
        rows=rows,
        disclaimer=DISCLAIMER,
        product_message=PRODUCT_MESSAGE,
    )

