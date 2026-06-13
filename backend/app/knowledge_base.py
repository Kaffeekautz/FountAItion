from __future__ import annotations

from app.models import KnowledgeItem


TERM_ALIASES: dict[str, tuple[str, ...]] = {
    "e.V.": ("e.v.", "e.v", "ev", "eingetragener verein"),
    "eingetragener Verein": ("eingetragener verein", "e.v.", "e.v", "ev"),
    "Rechtsfähigkeit": ("rechtsfähigkeit", "rechtsfaehigkeit", "rechtsfähig", "rechtsfaehig"),
    "Gemeinnützigkeit": ("gemeinnützigkeit", "gemeinnuetzigkeit"),
    "Satzungsmäßigkeit": ("satzungsmäßigkeit", "satzungsmaessigkeit"),
    "Vermögensbindung": ("vermögensbindung", "vermoegensbindung"),
}


def find_knowledge_item(message: str, knowledge_base: list[KnowledgeItem]) -> KnowledgeItem | None:
    normalized = message.lower()
    for item in knowledge_base:
        aliases = TERM_ALIASES.get(item.term, (item.term.lower(),))
        if any(alias in normalized for alias in aliases):
            return item
    return None
