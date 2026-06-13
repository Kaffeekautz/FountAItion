from __future__ import annotations

import json
import math
import re
from pathlib import Path

from app.models import DocumentRecord, RagChunk, RagSearchResponse, RagSearchResult
from app.ollama_service import get_embedding


VECTOR_STORE_PATH = Path(__file__).resolve().parent.parent / "data" / "vector_store.json"
CHUNK_SIZE = 800
CHUNK_OVERLAP = 100


def load_vector_store() -> list[dict]:
    if not VECTOR_STORE_PATH.exists():
        save_vector_store([])
        return []
    try:
        return json.loads(VECTOR_STORE_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []


def save_vector_store(chunks: list[dict]) -> None:
    VECTOR_STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
    VECTOR_STORE_PATH.write_text(
        json.dumps(chunks, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    normalized = re.sub(r"\s+", " ", text).strip()
    if not normalized:
        return []
    if len(normalized) <= chunk_size:
        return [normalized]

    chunks: list[str] = []
    start = 0
    while start < len(normalized):
        end = min(len(normalized), start + chunk_size)
        chunks.append(normalized[start:end].strip())
        if end == len(normalized):
            break
        start = max(0, end - overlap)
    return [chunk for chunk in chunks if chunk]


def index_document(document: DocumentRecord) -> list[RagChunk]:
    existing = load_vector_store()
    filtered = [chunk for chunk in existing if chunk.get("document_id") != document.id]

    created_chunks: list[RagChunk] = []
    for chunk_index, chunk_text_value in enumerate(chunk_text(document.extracted_text)):
        embedding = get_embedding(chunk_text_value)
        created_chunks.append(
            RagChunk(
                id=f"{document.id}-chunk-{chunk_index}",
                document_id=document.id,
                filename=document.filename,
                document_type=document.document_type,
                chunk_index=chunk_index,
                text=chunk_text_value,
                embedding=embedding,
                metadata={"source": "upload"},
            )
        )

    save_vector_store(filtered + [chunk.model_dump() for chunk in created_chunks])
    return created_chunks


def index_all_documents(documents: list[DocumentRecord]) -> int:
    save_vector_store([])
    total_chunks = 0
    for document in documents:
        if document.extracted_text.strip():
            total_chunks += len(index_document(document))
    return total_chunks


def cosine_similarity(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot_product = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot_product / (norm_a * norm_b)


def keyword_score(query: str, text: str) -> float:
    query_terms = [term for term in re.findall(r"\w+", query.lower()) if len(term) > 1]
    if not query_terms:
        return 0.0
    normalized_text = text.lower()
    matches = sum(1 for term in set(query_terms) if term in normalized_text)
    density_bonus = min(len(text) / 800.0, 1.0) * 0.05
    return matches / max(len(set(query_terms)), 1) + density_bonus


def search_rag(query: str, top_k: int = 3) -> RagSearchResponse:
    chunks = load_vector_store()
    if not chunks:
        return RagSearchResponse(
            query=query,
            results=[],
            retrieval_method="keyword",
            warnings=["Der lokale RAG-Index enthält aktuell keine Dokument-Chunks."],
        )

    query_embedding = get_embedding(query)
    has_embeddings = bool(query_embedding) and any(chunk.get("embedding") for chunk in chunks)
    scored_results: list[RagSearchResult] = []

    for chunk in chunks:
        if has_embeddings and chunk.get("embedding"):
            score = cosine_similarity(query_embedding or [], chunk["embedding"])
            method = "embedding"
        else:
            score = keyword_score(query, chunk.get("text", ""))
            method = "keyword"

        scored_results.append(
            RagSearchResult(
                chunk_id=chunk["id"],
                document_id=chunk["document_id"],
                filename=chunk["filename"],
                document_type=chunk["document_type"],
                chunk_index=chunk["chunk_index"],
                text=chunk["text"],
                score=round(float(score), 4),
                retrieval_method=method,
            )
        )

    ranked = sorted(scored_results, key=lambda item: item.score, reverse=True)
    filtered = [item for item in ranked if item.score > 0][: max(top_k, 1)]
    if not filtered:
        filtered = ranked[: max(top_k, 1)]

    retrieval_method = filtered[0].retrieval_method if filtered else ("embedding" if has_embeddings else "keyword")
    warnings: list[str] = []
    if not has_embeddings:
        warnings.append("Ollama-Embeddings sind nicht verfügbar. Es wird Keyword-Retrieval verwendet.")

    return RagSearchResponse(
        query=query,
        results=filtered,
        retrieval_method=retrieval_method,
        warnings=warnings,
    )

