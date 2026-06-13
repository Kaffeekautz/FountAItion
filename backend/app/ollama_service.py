from __future__ import annotations

import os

import requests


OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1")
TIMEOUT_SECONDS = 10


def is_ollama_available() -> bool:
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=TIMEOUT_SECONDS)
        return response.ok
    except requests.RequestException:
        return False


def get_embedding(text: str) -> list[float] | None:
    if not text.strip():
        return None
    try:
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/embeddings",
            json={"model": OLLAMA_EMBED_MODEL, "prompt": text[:4000]},
            timeout=TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        payload = response.json()
        embedding = payload.get("embedding")
        return embedding if isinstance(embedding, list) else None
    except (requests.RequestException, ValueError):
        return None


def generate_short_answer(prompt: str) -> str | None:
    if not prompt.strip():
        return None
    try:
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt[:4000],
                "stream": False,
                "options": {"temperature": 0.1},
            },
            timeout=TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        payload = response.json()
        answer = payload.get("response")
        return answer.strip() if isinstance(answer, str) and answer.strip() else None
    except (requests.RequestException, ValueError):
        return None

