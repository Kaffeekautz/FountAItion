from __future__ import annotations

import csv
import io
import json
import shutil
import zipfile
from html.parser import HTMLParser
from pathlib import Path
from xml.etree import ElementTree

import fitz
import pytesseract
from PIL import Image


IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg", ".tif", ".tiff"}
TEXT_SUFFIXES = {
    ".txt",
    ".md",
    ".markdown",
    ".csv",
    ".json",
    ".jsonl",
    ".log",
    ".ini",
    ".cfg",
    ".conf",
    ".yaml",
    ".yml",
}
HTML_SUFFIXES = {".html", ".htm"}
XML_SUFFIXES = {".xml"}
DOCX_SUFFIXES = {".docx"}
XLSX_SUFFIXES = {".xlsx"}


class _VisibleTextHtmlParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []

    def handle_data(self, data: str) -> None:
        cleaned = data.strip()
        if cleaned:
            self.parts.append(cleaned)


def _filename_fallback_text(filename: str) -> str:
    return Path(filename).stem.replace("_", " ").replace("-", " ").strip()


def _run_tesseract_on_image(image: Image.Image) -> str:
    return pytesseract.image_to_string(image, lang="deu+eng").strip()


def _normalize_extracted_text(text: str) -> str:
    lines = [line.strip() for line in text.replace("\r\n", "\n").split("\n")]
    return "\n".join(line for line in lines if line).strip()


def _read_text_file(file_path: Path) -> str:
    raw = file_path.read_bytes()
    for encoding in ("utf-8-sig", "utf-8", "cp1252", "latin-1"):
        try:
            return _normalize_extracted_text(raw.decode(encoding))
        except UnicodeDecodeError:
            continue
    raise UnicodeDecodeError("utf-8", raw, 0, 1, "Datei konnte mit gängigen Encodings nicht dekodiert werden.")


def _extract_csv_text(file_path: Path) -> str:
    content = _read_text_file(file_path)
    rows: list[str] = []
    for row in csv.reader(io.StringIO(content)):
        cleaned = " | ".join(cell.strip() for cell in row if cell.strip())
        if cleaned:
            rows.append(cleaned)
    return _normalize_extracted_text("\n".join(rows))


def _extract_json_text(file_path: Path) -> str:
    content = _read_text_file(file_path)
    parsed = json.loads(content)
    return _normalize_extracted_text(json.dumps(parsed, ensure_ascii=False, indent=2))


def _extract_html_text(file_path: Path) -> str:
    parser = _VisibleTextHtmlParser()
    parser.feed(_read_text_file(file_path))
    return _normalize_extracted_text("\n".join(parser.parts))


def _extract_xml_text(file_path: Path) -> str:
    root = ElementTree.fromstring(file_path.read_bytes())
    return _normalize_extracted_text("\n".join(text for text in root.itertext() if text and text.strip()))


def _extract_docx_text(file_path: Path) -> str:
    with zipfile.ZipFile(file_path) as archive:
        document_xml = archive.read("word/document.xml")
    root = ElementTree.fromstring(document_xml)
    text_nodes = [
        node.text
        for node in root.iter()
        if node.tag.endswith("}t") and node.text and node.text.strip()
    ]
    return _normalize_extracted_text("\n".join(text_nodes))


def _extract_xlsx_text(file_path: Path) -> str:
    with zipfile.ZipFile(file_path) as archive:
        shared_strings: list[str] = []
        if "xl/sharedStrings.xml" in archive.namelist():
            shared_root = ElementTree.fromstring(archive.read("xl/sharedStrings.xml"))
            shared_strings = [
                node.text or ""
                for node in shared_root.iter()
                if node.tag.endswith("}t")
            ]

        workbook_parts = sorted(
            name for name in archive.namelist() if name.startswith("xl/worksheets/") and name.endswith(".xml")
        )
        extracted_rows: list[str] = []
        for part_name in workbook_parts:
            sheet_root = ElementTree.fromstring(archive.read(part_name))
            current_row: list[str] = []
            for cell in sheet_root.iter():
                if not cell.tag.endswith("}c"):
                    continue

                cell_type = cell.attrib.get("t")
                if cell_type == "inlineStr":
                    values = [node.text for node in cell.iter() if node.tag.endswith("}t") and node.text]
                    if values:
                        current_row.append(" ".join(values))
                else:
                    value_node = next((node for node in cell if node.tag.endswith("}v") and node.text), None)
                    if value_node is None:
                        continue
                    if cell_type == "s":
                        try:
                            current_row.append(shared_strings[int(value_node.text)])
                        except (ValueError, IndexError):
                            current_row.append(value_node.text)
                    else:
                        current_row.append(value_node.text)

                if current_row:
                    extracted_rows.append(" | ".join(item.strip() for item in current_row if item.strip()))
                    current_row = []

    return _normalize_extracted_text("\n".join(extracted_rows))


def _extract_common_document_text(file_path: Path, suffix: str) -> str:
    if suffix in TEXT_SUFFIXES:
        if suffix == ".csv":
            return _extract_csv_text(file_path)
        if suffix in {".json", ".jsonl"}:
            return _extract_json_text(file_path)
        return _read_text_file(file_path)
    if suffix in HTML_SUFFIXES:
        return _extract_html_text(file_path)
    if suffix in XML_SUFFIXES:
        return _extract_xml_text(file_path)
    if suffix in DOCX_SUFFIXES:
        return _extract_docx_text(file_path)
    if suffix in XLSX_SUFFIXES:
        return _extract_xlsx_text(file_path)
    return ""


def extract_text_from_file(file_path: Path, filename: str) -> dict:
    warnings: list[str] = []
    suffix = file_path.suffix.lower()
    tesseract_available = shutil.which("tesseract") is not None

    if suffix == ".pdf":
        page_count: int | None = None
        try:
            document = fitz.open(file_path)
            page_count = document.page_count
            extracted_parts = [page.get_text("text").strip() for page in document]
            extracted_text = "\n".join(part for part in extracted_parts if part).strip()
            if len(extracted_text) >= 50:
                document.close()
                return {
                    "extracted_text": extracted_text,
                    "extraction_method": "pdf_text",
                    "page_count": page_count,
                    "warnings": warnings,
                }

            if not tesseract_available:
                document.close()
                warnings.append("Tesseract ist nicht verfügbar. Es wurde nur ein Dateiname-Fallback genutzt.")
                return {
                    "extracted_text": _filename_fallback_text(filename),
                    "extraction_method": "filename_fallback",
                    "page_count": page_count,
                    "warnings": warnings,
                }

            ocr_parts: list[str] = []
            for page in document:
                pixmap = page.get_pixmap(matrix=fitz.Matrix(2, 2))
                image = Image.open(io.BytesIO(pixmap.tobytes("png")))
                ocr_text = _run_tesseract_on_image(image)
                if ocr_text:
                    ocr_parts.append(ocr_text)
            document.close()
            ocr_text = "\n".join(ocr_parts).strip()
            if ocr_text:
                return {
                    "extracted_text": ocr_text,
                    "extraction_method": "ocr",
                    "page_count": page_count,
                    "warnings": warnings,
                }

            warnings.append("PDF lieferte kaum Text; es wurde auf den Dateinamen zurückgefallen.")
            return {
                "extracted_text": _filename_fallback_text(filename),
                "extraction_method": "filename_fallback",
                "page_count": page_count,
                "warnings": warnings,
            }
        except Exception as exc:  # pragma: no cover - defensive fallback
            warnings.append(f"Text-Extraction für PDF war nicht vollständig möglich: {exc}")
            return {
                "extracted_text": _filename_fallback_text(filename),
                "extraction_method": "filename_fallback",
                "page_count": None,
                "warnings": warnings,
            }

    if suffix in IMAGE_SUFFIXES:
        if not tesseract_available:
            warnings.append("Tesseract ist nicht verfügbar. Es wurde nur ein Dateiname-Fallback genutzt.")
            return {
                "extracted_text": _filename_fallback_text(filename),
                "extraction_method": "filename_fallback",
                "page_count": 1,
                "warnings": warnings,
            }
        try:
            image = Image.open(file_path)
            extracted_text = _run_tesseract_on_image(image)
            if extracted_text:
                return {
                    "extracted_text": extracted_text,
                    "extraction_method": "ocr",
                    "page_count": 1,
                    "warnings": warnings,
                }
            warnings.append("Das Bild lieferte keinen auswertbaren OCR-Text.")
            return {
                "extracted_text": _filename_fallback_text(filename),
                "extraction_method": "filename_fallback",
                "page_count": 1,
                "warnings": warnings,
            }
        except Exception as exc:  # pragma: no cover - defensive fallback
            warnings.append(f"OCR für das Bild war nicht möglich: {exc}")
            return {
                "extracted_text": _filename_fallback_text(filename),
                "extraction_method": "filename_fallback",
                "page_count": 1,
                "warnings": warnings,
            }

    if suffix in TEXT_SUFFIXES | HTML_SUFFIXES | XML_SUFFIXES | DOCX_SUFFIXES | XLSX_SUFFIXES:
        try:
            extracted_text = _extract_common_document_text(file_path, suffix)
            if extracted_text:
                return {
                    "extracted_text": extracted_text,
                    "extraction_method": "text",
                    "page_count": None,
                    "warnings": warnings,
                }
            warnings.append("Die Datei enthielt keinen auswertbaren Text. Es wurde auf den Dateinamen zurückgefallen.")
            return {
                "extracted_text": _filename_fallback_text(filename),
                "extraction_method": "filename_fallback",
                "page_count": None,
                "warnings": warnings,
            }
        except (
            OSError,
            UnicodeDecodeError,
            json.JSONDecodeError,
            zipfile.BadZipFile,
            KeyError,
            ElementTree.ParseError,
            csv.Error,
        ) as exc:
            warnings.append(f"Text-Extraction für diesen Dateityp war nicht vollständig möglich: {exc}")
            return {
                "extracted_text": _filename_fallback_text(filename),
                "extraction_method": "filename_fallback",
                "page_count": None,
                "warnings": warnings,
            }

    warnings.append("Für diesen Dateityp ist noch keine Text-Extraction implementiert.")
    return {
        "extracted_text": _filename_fallback_text(filename),
        "extraction_method": "filename_fallback",
        "page_count": None,
        "warnings": warnings,
    }
