from __future__ import annotations

from app.models import KnowledgeItem


def find_knowledge_item(message: str, knowledge_base: list[KnowledgeItem]) -> KnowledgeItem | None:
    normalized = message.lower()
    for item in knowledge_base:
        if item.term.lower() in normalized:
            return item
    return None

