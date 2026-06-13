from __future__ import annotations

import re
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile


UPLOAD_DIR = Path(__file__).resolve().parent.parent / "data" / "uploads"


def ensure_upload_dir() -> Path:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    return UPLOAD_DIR


def _sanitize_filename(filename: str) -> str:
    candidate = Path(filename or "upload.bin").name
    sanitized = re.sub(r"[^A-Za-z0-9._-]+", "_", candidate).strip("._")
    return sanitized or f"upload_{uuid4().hex[:8]}.bin"


def save_uploaded_file(upload_file: UploadFile) -> tuple[str, Path]:
    upload_dir = ensure_upload_dir()
    safe_name = _sanitize_filename(upload_file.filename or "upload.bin")
    destination = upload_dir / safe_name

    if destination.exists():
        stem = destination.stem
        suffix = destination.suffix
        destination = upload_dir / f"{stem}_{uuid4().hex[:8]}{suffix}"

    content = upload_file.file.read()
    destination.write_bytes(content)
    return destination.name, destination

