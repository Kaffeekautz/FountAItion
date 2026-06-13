from __future__ import annotations

from app.evidence_service import build_evidence_matrix
from app.knowledge_base import find_knowledge_item
from app.models import AppState, ChatResponse, ChatSource, DocumentRecord, FoundingCheck
from app.rag_service import search_rag


STANDARD_DISCLAIMER = "FoundAItion gibt eine strukturierende Orientierung und ersetzt keine Rechtsberatung."
OUT_OF_SCOPE_ANSWER = (
    "Ich kann im Piloten nur Fragen zu deinen hochgeladenen Dokumenten, offenen Nachweisen, "
    "Checklistenpunkten und Begriffen im FoundAItion-Kontext beantworten. FoundAItion ersetzt keine Rechtsberatung."
)


DOCUMENT_TYPE_ALIASES: dict[str, tuple[str, ...]] = {
    "Impressum": ("impressum", "anbieterkennzeichnung"),
    "Datenschutz-Basischeck": ("datenschutz", "dsgvo", "personenbezogene daten"),
    "Gesellschaftsvertrag": ("gesellschaftsvertrag", "satzung", "vertrag"),
    "Kapitalübersicht": ("kapital", "stammkapital", "einlage"),
    "Geschäftsadresse-Nachweis": ("geschäftsadresse", "geschäftsanschrift", "anschrift", "adresse", "sitz"),
    "Gewerbeanmeldung": ("gewerbeanmeldung", "gewerbe"),
    "Steuerdaten": ("steuerdaten", "steuernummer", "finanzamt", "steuer"),
    "AI-Use-Case-Steckbrief": ("ai", "ki", "use case", "use-case", "usecase", "modell"),
    "Gründer:innenprofil": ("gründer", "gruender"),
    "Unternehmensprofil": ("unternehmen", "firma", "company"),
}


def detect_intent(message: str) -> str:
    normalized = message.lower()
    if any(phrase in normalized for phrase in ("dokumente enthalten", "enthalten", "volltext", "suche", "inhalt")):
        return "DOCUMENT_CONTENT_SEARCH"
    if any(phrase in normalized for phrase in ("was bedeutet", "was ist")):
        return "TERM_EXPLANATION"
    if "zeig mir" in normalized and "dokument" in normalized:
        return "DOCUMENT_LOOKUP"
    if any(phrase in normalized for phrase in ("habe ich bereits", "habe ich schon", "hochgeladen", "vorhanden")):
        return "DOCUMENT_EXISTS"
    if "warum" in normalized or "status" in normalized:
        return "CHECK_STATUS"
    if "nachweise habe ich bereits" in normalized or "welche nachweise habe ich" in normalized:
        return "EVIDENCE_SUMMARY"
    if any(phrase in normalized for phrase in ("welche dokumente fehlen", "was fehlt", "offen")):
        return "MISSING_EVIDENCE"
    return "OUT_OF_SCOPE"


def normalize_document_type_from_message(message: str) -> str | None:
    normalized = message.lower()
    for document_type, aliases in DOCUMENT_TYPE_ALIASES.items():
        if any(alias in normalized for alias in aliases):
            return document_type
    return None


def _build_out_of_scope_response() -> ChatResponse:
    return ChatResponse(
        intent="OUT_OF_SCOPE",
        answer=OUT_OF_SCOPE_ANSWER,
        sources=[],
        related_documents=[],
        related_checks=[],
        warnings=[],
        disclaimer=STANDARD_DISCLAIMER,
    )


def _find_related_checks(state: AppState, message: str, document_type: str | None = None) -> list[FoundingCheck]:
    normalized = message.lower()
    matches: list[FoundingCheck] = []
    for check in state.checks:
        check_blob = " ".join(
            [
                check.title.lower(),
                check.category.lower(),
                check.description.lower(),
                " ".join(item.lower() for item in check.required_document_types),
            ]
        )
        if document_type and document_type in check.required_document_types:
            matches.append(check)
        elif any(term in check_blob for term in normalized.split() if len(term) > 3):
            matches.append(check)
    return matches


def _documents_for_type(state: AppState, document_type: str | None) -> list[DocumentRecord]:
    if not document_type:
        return []
    return [document for document in state.documents if document.document_type == document_type]


def answer_chat(message: str, state: AppState) -> ChatResponse:
    intent = detect_intent(message)
    document_type = normalize_document_type_from_message(message)
    evidence_matrix = build_evidence_matrix(state)

    if intent == "DOCUMENT_EXISTS":
        related_documents = _documents_for_type(state, document_type)
        if not document_type:
            return _build_out_of_scope_response()
        if related_documents:
            answer = f"Ja, für „{document_type}“ liegt im Pilot bereits mindestens ein Dokument vor."
        else:
            answer = f"Nein, für „{document_type}“ wurde aktuell noch kein Dokument hochgeladen oder manuell markiert."
        return ChatResponse(
            intent=intent,
            answer=answer,
            sources=[ChatSource(source_type="document", title=document.filename, reference_id=document.id) for document in related_documents],
            related_documents=related_documents,
            related_checks=_find_related_checks(state, message, document_type),
            warnings=[],
            disclaimer=STANDARD_DISCLAIMER,
        )

    if intent == "MISSING_EVIDENCE":
        relevant_rows = evidence_matrix.rows
        if document_type:
            relevant_rows = [row for row in relevant_rows if document_type in row.required_document_types or document_type in row.check_title]
        open_items = [
            row
            for row in relevant_rows
            if row.evidence_status in {"missing", "partial", "check_only"} or row.check_status in {"missing", "required", "check"}
        ]
        if not open_items:
            answer = "Aktuell sind in diesem Pilotkontext keine offenen Nachweise für deine Anfrage erkennbar."
        else:
            missing_types = []
            for row in open_items:
                missing_types.extend(row.missing_document_types or row.required_document_types)
            deduplicated = ", ".join(sorted(dict.fromkeys(missing_types))) if missing_types else "keine zusätzlichen Dokumenttypen"
            answer = f"Offen sind aktuell vor allem folgende Nachweise oder Dokumenttypen: {deduplicated}."
        return ChatResponse(
            intent=intent,
            answer=answer,
            sources=[ChatSource(source_type="check", title=row.check_title, reference_id=row.check_id, excerpt=row.explanation) for row in open_items[:5]],
            related_documents=[],
            related_checks=[check for check in state.checks if check.id in {row.check_id for row in open_items}],
            warnings=[],
            disclaimer=STANDARD_DISCLAIMER,
        )

    if intent == "CHECK_STATUS":
        related_checks = _find_related_checks(state, message, document_type)
        if not related_checks:
            return _build_out_of_scope_response()
        first_check = related_checks[0]
        matching_row = next((row for row in evidence_matrix.rows if row.check_id == first_check.id), None)
        if matching_row:
            answer = (
                f"„{first_check.title}“ steht auf „{first_check.status}“. "
                f"{matching_row.explanation}"
            )
        else:
            answer = f"„{first_check.title}“ steht aktuell auf „{first_check.status}“."
        return ChatResponse(
            intent=intent,
            answer=answer,
            sources=[ChatSource(source_type="check", title=first_check.title, reference_id=first_check.id, excerpt=first_check.description)],
            related_documents=[document for document in state.documents if document.id in first_check.matched_document_ids],
            related_checks=related_checks[:3],
            warnings=[],
            disclaimer=STANDARD_DISCLAIMER,
        )

    if intent == "DOCUMENT_LOOKUP":
        related_documents = _documents_for_type(state, document_type)
        if not document_type:
            return _build_out_of_scope_response()
        if related_documents:
            answer = f"Für „{document_type}“ habe ich {len(related_documents)} passendes Dokument(e) gefunden."
        else:
            answer = f"Für „{document_type}“ ist aktuell kein passendes Dokument im Pilot hinterlegt."
        return ChatResponse(
            intent=intent,
            answer=answer,
            sources=[ChatSource(source_type="document", title=document.filename, reference_id=document.id) for document in related_documents],
            related_documents=related_documents,
            related_checks=_find_related_checks(state, message, document_type),
            warnings=[],
            disclaimer=STANDARD_DISCLAIMER,
        )

    if intent == "TERM_EXPLANATION":
        item = find_knowledge_item(message, state.knowledge_base)
        if not item:
            return _build_out_of_scope_response()
        return ChatResponse(
            intent=intent,
            answer=item.explanation,
            sources=[ChatSource(source_type="knowledge_base", title=item.term, excerpt=item.category)],
            related_documents=[],
            related_checks=_find_related_checks(state, message, document_type),
            warnings=[],
            disclaimer=STANDARD_DISCLAIMER,
        )

    if intent == "EVIDENCE_SUMMARY":
        relevant_rows = evidence_matrix.rows
        if document_type:
            relevant_rows = [row for row in relevant_rows if document_type in row.required_document_types or document_type in row.check_title]

        matched_documents: list[DocumentRecord] = []
        for row in relevant_rows:
            matched_documents.extend(row.matched_documents)
        unique_documents = list({document.id: document for document in matched_documents}.values())
        missing_types = sorted(
            {
                missing_type
                for row in relevant_rows
                for missing_type in row.missing_document_types
            }
        )
        if unique_documents:
            answer = f"Vorhanden sind aktuell {len(unique_documents)} Nachweis-Dokument(e)."
            if missing_types:
                answer += f" Noch offen sind: {', '.join(missing_types)}."
        else:
            answer = "Aktuell liegen noch keine passenden Nachweise für diese Anfrage vor."
            if missing_types:
                answer += f" Offen sind insbesondere: {', '.join(missing_types)}."
        return ChatResponse(
            intent=intent,
            answer=answer,
            sources=[ChatSource(source_type="document", title=document.filename, reference_id=document.id) for document in unique_documents[:5]],
            related_documents=unique_documents[:5],
            related_checks=[check for check in state.checks if check.id in {row.check_id for row in relevant_rows[:5]}],
            warnings=[],
            disclaimer=STANDARD_DISCLAIMER,
        )

    if intent == "DOCUMENT_CONTENT_SEARCH":
        rag_response = search_rag(message, top_k=3)
        related_documents = [
            document
            for document in state.documents
            if document.id in {result.document_id for result in rag_response.results}
        ]
        if rag_response.results:
            answer = f"Ich habe {len(rag_response.results)} Treffer im lokalen Dokumentindex gefunden."
        else:
            answer = "Im lokalen Dokumentindex wurde kein passender Treffer gefunden."
        return ChatResponse(
            intent=intent,
            answer=answer,
            sources=[
                ChatSource(
                    source_type="rag_chunk",
                    title=result.filename,
                    reference_id=result.chunk_id,
                    excerpt=result.text[:220],
                )
                for result in rag_response.results
            ],
            related_documents=related_documents,
            related_checks=_find_related_checks(state, message, document_type),
            warnings=rag_response.warnings,
            disclaimer=STANDARD_DISCLAIMER,
        )

    return _build_out_of_scope_response()

