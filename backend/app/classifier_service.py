from __future__ import annotations

from typing import Iterable


UNKNOWN_DOCUMENT = "Unbekanntes Dokument"

DOCUMENT_RULES: list[tuple[str, tuple[str, ...]]] = [
    ("Impressum", ("impressum", "anbieterkennzeichnung")),
    ("Datenschutz-Basischeck", ("datenschutz", "dsgvo", "personenbezogene daten")),
    ("Gesellschaftsvertrag", ("gesellschaftsvertrag", "satzung", "geschäftsanteile", "geschaeftsanteile", "vertrag")),
    ("Kapitalübersicht", ("kapital", "stammkapital", "einlage")),
    (
        "Geschäftsadresse-Nachweis",
        ("geschäftsanschrift", "geschaeftsanschrift", "geschäftsadresse", "geschaeftsadresse", "adresse", "anschrift"),
    ),
    ("Gewerbeanmeldung", ("gewerbeanmeldung", "gewerbe")),
    ("Steuerdaten", ("steuernummer", "finanzamt", "steuerliche erfassung", "steuer")),
    ("AI-Use-Case-Steckbrief", ("ki", "ai", "modell", "automatisierte entscheidung", "use case", "use-case", "usecase")),
    ("Gründer:innenprofil", ("gründer", "gruender")),
    ("Unternehmensprofil", ("unternehmen", "firma", "company")),
]


def _normalize_text(value: str) -> str:
    return value.lower().replace("_", " ").replace("-", " ")


def _match_document_type(haystack: str) -> tuple[str | None, int]:
    normalized = _normalize_text(haystack)
    best_match: str | None = None
    best_score = 0

    for document_type, keywords in DOCUMENT_RULES:
        score = sum(1 for keyword in keywords if keyword in normalized)
        if score > best_score:
            best_match = document_type
            best_score = score
    return best_match, best_score


def _build_warnings(document_type: str, sources: Iterable[str]) -> list[str]:
    warnings: list[str] = []
    if document_type == UNKNOWN_DOCUMENT:
        warnings.append("Dokumenttyp konnte nicht sicher bestimmt werden.")
    if not any(sources):
        warnings.append("Weder Dateiname noch Text lieferten verwertbare Klassifikationssignale.")
    return warnings


def classify_document_by_filename(filename: str) -> tuple[str, float, list[str]]:
    matched, _ = _match_document_type(filename)
    if matched:
        return matched, 0.8, []
    return UNKNOWN_DOCUMENT, 0.3, _build_warnings(UNKNOWN_DOCUMENT, [filename])


def classify_document(filename: str, extracted_text: str) -> tuple[str, float, list[str]]:
    filename_match, filename_score = _match_document_type(filename)
    text_match, text_score = _match_document_type(extracted_text)

    if filename_match and text_match and filename_match == text_match:
        return filename_match, 0.95, []
    if filename_match and text_match:
        if filename_score >= text_score:
            return filename_match, 0.8, ["Dateiname und Text lieferten unterschiedliche Klassifikationssignale."]
        return text_match, 0.85, ["Dateiname und Text lieferten unterschiedliche Klassifikationssignale."]
    if text_match:
        return text_match, 0.85, []
    if filename_match:
        return filename_match, 0.8, []
    return UNKNOWN_DOCUMENT, 0.3, _build_warnings(UNKNOWN_DOCUMENT, [filename, extracted_text])
