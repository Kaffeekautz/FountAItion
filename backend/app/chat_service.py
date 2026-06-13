from __future__ import annotations

from app.evidence_service import build_evidence_matrix
from app.knowledge_base import find_knowledge_item
from app.models import AppState, ChatResponse, ChatSource, DocumentRecord, FoundingCheck
from app.ollama_service import generate_short_answer
from app.rag_service import search_rag


STANDARD_DISCLAIMER = "FoundAItion gibt eine strukturierende Orientierung und ersetzt keine Rechtsberatung."
OUT_OF_SCOPE_ANSWER = (
    "Ich kann im Piloten nur Fragen zu deinen hochgeladenen Dokumenten, offenen Nachweisen, "
    "Checklistenpunkten und Begriffen im FoundAItion-Kontext beantworten. FoundAItion ersetzt keine Rechtsberatung."
)
ASK_ME_SCOPE_GUARD = (
    "Diese Frage kann ich dir im Rahmen meines aktuellen Umfangs noch nicht beantworten. "
    "Ich nehme sie aber mit, und das FoundAItion-Team wird sich zeitnah um eine passende Antwort kümmern."
)

YES_TOKENS = {"ja", "ja bitte", "gern", "gerne", "klar", "ok", "okay"}
NO_TOKENS = {"nein", "nein danke", "später", "nicht jetzt"}
ASK_ME_SCOPE_TERMS = (
    "eingetragener verein",
    "e.v.",
    " e.v",
    "gemeinnützigkeit",
    "rechtsfähigkeit",
    "rechtsfaehigkeit",
    "satzung",
    "vorstand",
    "mitgliederversammlung",
    "vereinsregister",
    "vereinszweck",
    "mindestmitgliederzahl",
    "vermögensbindung",
    "vermoegensbindung",
    "satzungsmäßigkeit",
    "satzungsmaessigkeit",
)

DOCUMENT_TYPE_ALIASES: dict[str, tuple[str, ...]] = {
    "Impressum": ("impressum", "anbieterkennzeichnung"),
    "Datenschutz-Basischeck": ("datenschutz", "dsgvo", "personenbezogene daten"),
    "Vereinssatzung": ("vereinssatzung", "satzung", "satzungsentwurf"),
    "Vereinszweckbeschreibung": ("vereinszweck", "zweckbeschreibung"),
    "Gründungsmitgliederliste": ("gruendungsmitglieder", "gründungsmitglieder", "mitgliederliste"),
    "Namensprüfung": ("namenspruefung", "namensprüfung", "vereinsname", "namecheck"),
    "Vereinssitz-Nachweis": ("vereinssitz", "verwaltungssitz"),
    "Gemeinnützigkeitskonzept": ("gemeinnuetzigkeit", "gemeinnützigkeit", "gemeinnützigkeitskonzept"),
    "Gründungsprotokoll": ("gruendungsprotokoll", "gründungsprotokoll", "gruendungsversammlung", "gründungsversammlung"),
    "Vorstandswahlprotokoll": ("vorstandswahl", "vorstandswahlprotokoll", "wahlprotokoll"),
    "Unterzeichnete Satzung": ("unterzeichnete satzung", "satzung unterzeichnet", "satzung unterschrieben"),
    "Vereinsregister-Anmeldung": ("vereinsregister", "registeranmeldung", "registergericht"),
    "Notarielle Beglaubigung": ("notar", "notariell", "beglaubigung"),
    "Antrag Satzungsmäßigkeit": ("satzungsmäßigkeit", "satzungsmaessigkeit", "feststellung der satzungsmäßigkeit", "feststellung der satzungsmaessigkeit"),
    "Buchhaltungs-Setup": ("buchhaltung", "aufzeichnungen", "mittelverwendung"),
    "Vereinskonto-Nachweis": ("vereinskonto", "bankkonto", "kontoeröffnung", "kontoeroeffnung"),
}


def _normalize_message(message: str) -> str:
    return " ".join(message.lower().strip().split())


def detect_intent(message: str, mode: str = "help") -> str:
    normalized = _normalize_message(message)
    normalized_compact = normalized.replace(",", "").replace("!", "").replace("?", "")

    if mode == "ask-me":
        if normalized_compact in YES_TOKENS:
            return "GUIDED_CONFIRM"
        if normalized_compact in NO_TOKENS:
            return "GUIDED_DECLINE"

    if any(phrase in normalized for phrase in ("dokumente enthalten", "enthalten", "volltext", "suche", "inhalt")):
        return "DOCUMENT_CONTENT_SEARCH"
    if any(phrase in normalized for phrase in ("was bedeutet", "was ist", "was heißt", "erklär", "erkläre")):
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
    if mode == "ask-me" and any(term in normalized for term in ASK_ME_SCOPE_TERMS):
        return "ASK_ME_SCOPE"
    return "OUT_OF_SCOPE"


def normalize_document_type_from_message(message: str) -> str | None:
    normalized = _normalize_message(message)
    for document_type, aliases in DOCUMENT_TYPE_ALIASES.items():
        if any(alias in normalized for alias in aliases):
            return document_type
    return None


def _build_response(
    *,
    intent: str,
    answer: str,
    sources: list[ChatSource] | None = None,
    related_documents: list[DocumentRecord] | None = None,
    related_checks: list[FoundingCheck] | None = None,
    warnings: list[str] | None = None,
) -> ChatResponse:
    return ChatResponse(
        intent=intent,
        answer=answer,
        sources=sources or [],
        related_documents=related_documents or [],
        related_checks=related_checks or [],
        warnings=warnings or [],
        disclaimer=STANDARD_DISCLAIMER,
    )


def _build_out_of_scope_response(mode: str) -> ChatResponse:
    answer = ASK_ME_SCOPE_GUARD if mode == "ask-me" else OUT_OF_SCOPE_ANSWER
    intent = "ASK_ME_SCOPE_GUARD" if mode == "ask-me" else "OUT_OF_SCOPE"
    return _build_response(intent=intent, answer=answer)


def _find_related_checks(state: AppState, message: str, document_type: str | None = None) -> list[FoundingCheck]:
    normalized = _normalize_message(message)
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


def _generate_constrained_answer(topic: str, facts: list[str]) -> str | None:
    prompt = (
        "Du bist der stark eingeschränkte FoundAItion-Pilot. "
        "Antworte auf Deutsch in maximal 3 kurzen Sätzen. "
        "Nutze ausschließlich die bereitgestellten Fakten. "
        "Keine Rechtsberatung, keine Warnhinweise, keine neuen Pflichten, keine Spekulation. "
        "Wenn die Fakten nicht ausreichen, antworte exakt mit OUT_OF_SCOPE.\n\n"
        f"Thema: {topic}\n"
        "Fakten:\n- "
        + "\n- ".join(facts)
    )
    answer = generate_short_answer(prompt)
    if not answer or "OUT_OF_SCOPE" in answer:
        return None
    return answer


def _build_guided_confirm_response(state: AppState) -> ChatResponse:
    knowledge_item = next((item for item in state.knowledge_base if item.term in {"e.V.", "eingetragener Verein"}), None)
    facts = [
        "Ein eingetragener Verein ist ein nicht wirtschaftlicher Verein.",
        "Er wird durch Eintragung in das Vereinsregister rechtsfähig.",
        "Im aktuellen FoundAItion-Pilot passen dazu besonders ideeller Zweck, Mitgliedschaft, mindestens sieben Gründungsmitglieder und eine demokratische Mitgliederverwaltung.",
    ]
    answer = _generate_constrained_answer("eingetragener Verein", facts)
    if not answer:
        answer = (
            "Gerne. Ein eingetragener Verein ist im Pilot ein nicht wirtschaftlicher Verein, der durch die Eintragung "
            "ins Vereinsregister rechtsfähig wird. Typisch sind ein ideeller Zweck, Mitgliedschaft, mindestens sieben "
            "Gründungsmitglieder und eine demokratische Mitgliederverwaltung."
        )
    related_checks = [check for check in state.checks if check.id in {"association_purpose", "founding_members", "legal_form_path"}]
    sources = []
    if knowledge_item:
        sources.append(ChatSource(source_type="knowledge_base", title=knowledge_item.term, excerpt=knowledge_item.category))
    return _build_response(
        intent="GUIDED_CONFIRM",
        answer=answer,
        sources=sources,
        related_checks=related_checks,
    )


def _build_guided_decline_response() -> ChatResponse:
    return _build_response(
        intent="GUIDED_DECLINE",
        answer=(
            "Alles klar. Dann bleibe ich im engen FoundAItion-Rahmen und beantworte dir kurze Fragen zu e.V., "
            "Rechtsfähigkeit, Gemeinnützigkeit, Satzung, Vereinsregister oder zu deinen Dokumenten."
        ),
    )


def _build_ask_me_scope_response(message: str, state: AppState) -> ChatResponse:
    item = find_knowledge_item(message, state.knowledge_base)
    related_checks = _find_related_checks(state, message)
    if item:
        answer = _generate_constrained_answer(item.term, [item.explanation]) or item.explanation
        return _build_response(
            intent="ASK_ME_SCOPE",
            answer=answer,
            sources=[ChatSource(source_type="knowledge_base", title=item.term, excerpt=item.category)],
            related_checks=related_checks[:3],
        )

    if "eingetragener verein" in _normalize_message(message) or " e.v" in _normalize_message(message):
        return _build_guided_confirm_response(state)

    if related_checks:
        first_check = related_checks[0]
        facts = [first_check.description, first_check.explanation]
        answer = _generate_constrained_answer(first_check.title, facts)
        if not answer:
            answer = first_check.explanation
        return _build_response(
            intent="ASK_ME_SCOPE",
            answer=answer,
            sources=[ChatSource(source_type="check", title=first_check.title, reference_id=first_check.id, excerpt=first_check.category)],
            related_checks=related_checks[:3],
        )

    return _build_out_of_scope_response("ask-me")


def answer_chat(message: str, state: AppState, mode: str = "help") -> ChatResponse:
    intent = detect_intent(message, mode)
    document_type = normalize_document_type_from_message(message)
    evidence_matrix = build_evidence_matrix(state)

    if mode == "ask-me" and intent == "GUIDED_CONFIRM":
        return _build_guided_confirm_response(state)

    if mode == "ask-me" and intent == "GUIDED_DECLINE":
        return _build_guided_decline_response()

    if mode == "ask-me" and intent == "ASK_ME_SCOPE":
        return _build_ask_me_scope_response(message, state)

    if intent == "DOCUMENT_EXISTS":
        related_documents = _documents_for_type(state, document_type)
        if not document_type:
            return _build_out_of_scope_response(mode)
        if related_documents:
            answer = f"Ja, für „{document_type}“ liegt im Pilot bereits mindestens ein Dokument vor."
        else:
            answer = f"Nein, für „{document_type}“ wurde aktuell noch kein Dokument hochgeladen oder manuell markiert."
        return _build_response(
            intent=intent,
            answer=answer,
            sources=[ChatSource(source_type="document", title=document.filename, reference_id=document.id) for document in related_documents],
            related_documents=related_documents,
            related_checks=_find_related_checks(state, message, document_type),
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
        return _build_response(
            intent=intent,
            answer=answer,
            sources=[ChatSource(source_type="check", title=row.check_title, reference_id=row.check_id, excerpt=row.explanation) for row in open_items[:5]],
            related_checks=[check for check in state.checks if check.id in {row.check_id for row in open_items}],
        )

    if intent == "CHECK_STATUS":
        related_checks = _find_related_checks(state, message, document_type)
        if not related_checks:
            return _build_out_of_scope_response(mode)
        first_check = related_checks[0]
        matching_row = next((row for row in evidence_matrix.rows if row.check_id == first_check.id), None)
        if matching_row:
            answer = f"„{first_check.title}“ steht auf „{first_check.status}“. {matching_row.explanation}"
        else:
            answer = f"„{first_check.title}“ steht aktuell auf „{first_check.status}“."
        return _build_response(
            intent=intent,
            answer=answer,
            sources=[ChatSource(source_type="check", title=first_check.title, reference_id=first_check.id, excerpt=first_check.description)],
            related_documents=[document for document in state.documents if document.id in first_check.matched_document_ids],
            related_checks=related_checks[:3],
        )

    if intent == "DOCUMENT_LOOKUP":
        related_documents = _documents_for_type(state, document_type)
        if not document_type:
            return _build_out_of_scope_response(mode)
        if related_documents:
            answer = f"Für „{document_type}“ habe ich {len(related_documents)} passendes Dokument(e) gefunden."
        else:
            answer = f"Für „{document_type}“ ist aktuell kein passendes Dokument im Pilot hinterlegt."
        return _build_response(
            intent=intent,
            answer=answer,
            sources=[ChatSource(source_type="document", title=document.filename, reference_id=document.id) for document in related_documents],
            related_documents=related_documents,
            related_checks=_find_related_checks(state, message, document_type),
        )

    if intent == "TERM_EXPLANATION":
        item = find_knowledge_item(message, state.knowledge_base)
        if not item:
            if mode == "ask-me":
                return _build_ask_me_scope_response(message, state)
            return _build_out_of_scope_response(mode)
        answer = item.explanation
        if mode == "ask-me":
            answer = _generate_constrained_answer(item.term, [item.explanation]) or item.explanation
        return _build_response(
            intent=intent if mode == "help" else "ASK_ME_SCOPE",
            answer=answer,
            sources=[ChatSource(source_type="knowledge_base", title=item.term, excerpt=item.category)],
            related_checks=_find_related_checks(state, message, document_type),
        )

    if intent == "EVIDENCE_SUMMARY":
        relevant_rows = evidence_matrix.rows
        if document_type:
            relevant_rows = [row for row in relevant_rows if document_type in row.required_document_types or document_type in row.check_title]

        matched_documents: list[DocumentRecord] = []
        for row in relevant_rows:
            matched_documents.extend(row.matched_documents)
        unique_documents = list({document.id: document for document in matched_documents}.values())
        missing_types = sorted({missing_type for row in relevant_rows for missing_type in row.missing_document_types})
        if unique_documents:
            answer = f"Vorhanden sind aktuell {len(unique_documents)} Nachweis-Dokument(e)."
            if missing_types:
                answer += f" Noch offen sind: {', '.join(missing_types)}."
        else:
            answer = "Aktuell liegen noch keine passenden Nachweise für diese Anfrage vor."
            if missing_types:
                answer += f" Offen sind insbesondere: {', '.join(missing_types)}."
        return _build_response(
            intent=intent,
            answer=answer,
            sources=[ChatSource(source_type="document", title=document.filename, reference_id=document.id) for document in unique_documents[:5]],
            related_documents=unique_documents[:5],
            related_checks=[check for check in state.checks if check.id in {row.check_id for row in relevant_rows[:5]}],
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
        return _build_response(
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
        )

    return _build_out_of_scope_response(mode)
