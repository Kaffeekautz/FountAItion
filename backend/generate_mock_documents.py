from __future__ import annotations

import json
import textwrap
import zipfile
from pathlib import Path
from xml.sax.saxutils import escape

import fitz
from PIL import Image, ImageDraw, ImageFont


MOCK_DIR = Path(__file__).resolve().parent / "data" / "mock_documents"


def ensure_mock_dir() -> Path:
    MOCK_DIR.mkdir(parents=True, exist_ok=True)
    return MOCK_DIR


def create_text_pdf(path: Path, title: str, body: str) -> None:
    document = fitz.open()
    page = document.new_page(width=595, height=842)
    page.insert_text((50, 70), title, fontsize=20)
    page.insert_textbox(
        fitz.Rect(50, 110, 545, 780),
        body,
        fontsize=11,
        lineheight=1.35,
    )
    document.save(path)
    document.close()


def create_text_image(path: Path, title: str, body: str) -> None:
    image = Image.new("RGB", (1600, 1100), "white")
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default()

    y = 40
    draw.text((40, y), title, fill="black", font=font)
    y += 40

    for paragraph in body.split("\n"):
        wrapped_lines = textwrap.wrap(paragraph, width=72) or [""]
        for line in wrapped_lines:
            draw.text((40, y), line, fill="black", font=font)
            y += 22
        y += 12

    if path.suffix.lower() in {".tif", ".tiff"}:
        image.save(path, compression="tiff_deflate")
    else:
        image.save(path)


def create_image_only_pdf(path: Path, image_path: Path) -> None:
    document = fitz.open()
    image = Image.open(image_path)
    width, height = image.size
    page = document.new_page(width=width, height=height)
    page.insert_image(fitz.Rect(0, 0, width, height), filename=str(image_path))
    document.save(path)
    document.close()


def create_docx(path: Path, paragraphs: list[str]) -> None:
    document_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" '
        'xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" '
        'xmlns:o="urn:schemas-microsoft-com:office:office" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
        'xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" '
        'xmlns:v="urn:schemas-microsoft-com:vml" '
        'xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" '
        'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" '
        'xmlns:w10="urn:schemas-microsoft-com:office:word" '
        'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '
        'xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" '
        'xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml" '
        'xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" '
        'xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" '
        'xmlns:wne="http://schemas.microsoft.com/office/2006/wordml" '
        'xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" '
        'mc:Ignorable="w14 w15 wp14">'
        "<w:body>"
        + "".join(
            f"<w:p><w:r><w:t>{escape(paragraph)}</w:t></w:r></w:p>"
            for paragraph in paragraphs
        )
        + "<w:sectPr><w:pgSz w:w=\"11906\" w:h=\"16838\"/><w:pgMar w:top=\"1440\" w:right=\"1440\" w:bottom=\"1440\" w:left=\"1440\" w:header=\"708\" w:footer=\"708\" w:gutter=\"0\"/></w:sectPr>"
        "</w:body></w:document>"
    )

    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED) as docx:
        docx.writestr(
            "[Content_Types].xml",
            """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>""",
        )
        docx.writestr(
            "_rels/.rels",
            """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>""",
        )
        docx.writestr("word/document.xml", document_xml)


def create_xlsx(path: Path, rows: list[list[str]]) -> None:
    row_xml: list[str] = []
    for row_index, row in enumerate(rows, start=1):
        cells: list[str] = []
        for column_index, value in enumerate(row, start=1):
            column_letter = chr(64 + column_index)
            cells.append(
                f'<c r="{column_letter}{row_index}" t="inlineStr"><is><t>{escape(value)}</t></is></c>'
            )
        row_xml.append(f'<row r="{row_index}">{"".join(cells)}</row>')

    sheet_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        f'<sheetData>{"".join(row_xml)}</sheetData>'
        "</worksheet>"
    )

    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED) as workbook:
        workbook.writestr(
            "[Content_Types].xml",
            """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>""",
        )
        workbook.writestr(
            "_rels/.rels",
            """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>""",
        )
        workbook.writestr(
            "xl/workbook.xml",
            """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Kapitalübersicht" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>""",
        )
        workbook.writestr(
            "xl/_rels/workbook.xml.rels",
            """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>""",
        )
        workbook.writestr("xl/worksheets/sheet1.xml", sheet_xml)


def generate_mock_documents() -> list[dict]:
    output_dir = ensure_mock_dir()

    founder_text = (
        "Gründer:innenprofil Demo\n"
        "Name: Max Muster\n"
        "Rolle: Geschäftsführung\n"
        "Kontakt: max@example.com\n"
        "Mitgründerin: Erika Beispiel\n"
        "Verantwortung: Produkt und Vertrieb."
    )
    company_text = (
        "Unternehmensprofil Demo Startup UG\n"
        "Firma: Demo Startup UG\n"
        "Sitz: Berlin\n"
        "Unternehmenszweck: Entwicklung digitaler Compliance-Workflows für Gründer:innen.\n"
        "Kontakt: hallo@demo-startup.example"
    )
    contract_text = (
        "Gesellschaftsvertrag der Demo Startup UG\n"
        "Die Gesellschafter:innen halten Geschäftsanteile von jeweils 50 Prozent.\n"
        "Der Unternehmensgegenstand ist die Entwicklung und Vermarktung digitaler SaaS-Lösungen.\n"
        "Stammkapital und Vertretung werden in dieser Demo-Struktur dokumentiert."
    )
    trade_text = (
        "Gewerbeanmeldung Checkliste\n"
        "Unternehmensname: Demo Startup UG\n"
        "Tätigkeit: Softwareentwicklung und digitale Beratungsprodukte.\n"
        "Zuständige Behörde und Unterlagen wurden für den Piloten vorgemerkt."
    )
    tax_text = (
        "Steuerdaten für die steuerliche Erfassung\n"
        "Finanzamt: Berlin Mitte\n"
        "Steuernummer: beantragt\n"
        "Bankverbindung, Kontaktperson und steuerliche Ansprechpartner:innen werden gesammelt."
    )
    imprint_text = (
        "Impressum Demo Startup UG\n"
        "Anbieterkennzeichnung für die Website\n"
        "Geschäftsanschrift: Musterstraße 10, 10115 Berlin\n"
        "Kontakt: hallo@demo-startup.example"
    )
    address_text = (
        "Geschäftsadresse Nachweis\n"
        "Geschäftsanschrift der Demo Startup UG\n"
        "Musterstraße 10\n"
        "10115 Berlin\n"
        "Sitz der Gesellschaft"
    )
    privacy_text = (
        "Datenschutz Basischeck\n"
        "Personenbezogene Daten werden im Kontaktformular verarbeitet.\n"
        "Es besteht Bedarf für Datenschutzhinweise, Löschfristen und Verantwortlichkeiten."
    )
    ai_text = [
        "AI-Use-Case-Steckbrief",
        "Anwendungsfall: KI-gestützte Strukturierung von Gründungsunterlagen",
        "Grenzen: Keine freie Rechtsberatung, keine automatisierte Einzelfallbewertung",
        "Verwendete Modelle: lokale Embeddings und knappe Formulierungshilfen",
    ]

    samples = [
        {
            "filename": "gruenderprofil_demo.pdf",
            "document_type": "Gründer:innenprofil",
            "expected_extraction_method": "pdf_text",
        },
        {
            "filename": "unternehmensprofil_demo.pdf",
            "document_type": "Unternehmensprofil",
            "expected_extraction_method": "pdf_text",
        },
        {
            "filename": "gesellschaftsvertrag_demo.pdf",
            "document_type": "Gesellschaftsvertrag",
            "expected_extraction_method": "pdf_text",
        },
        {
            "filename": "kapitaluebersicht.xlsx",
            "document_type": "Kapitalübersicht",
            "expected_extraction_method": "filename_fallback",
        },
        {
            "filename": "geschaeftsadresse_nachweis_scan.png",
            "document_type": "Geschäftsadresse-Nachweis",
            "expected_extraction_method": "ocr",
        },
        {
            "filename": "gewerbeanmeldung_test.pdf",
            "document_type": "Gewerbeanmeldung",
            "expected_extraction_method": "pdf_text",
        },
        {
            "filename": "steuerdaten_finanzamt.pdf",
            "document_type": "Steuerdaten",
            "expected_extraction_method": "pdf_text",
        },
        {
            "filename": "impressum_demo.pdf",
            "document_type": "Impressum",
            "expected_extraction_method": "pdf_text",
        },
        {
            "filename": "datenschutz_basischeck_scan.tiff",
            "document_type": "Datenschutz-Basischeck",
            "expected_extraction_method": "ocr",
        },
        {
            "filename": "ai_use_case_steckbrief.docx",
            "document_type": "AI-Use-Case-Steckbrief",
            "expected_extraction_method": "filename_fallback",
        },
        {
            "filename": "impressum_scan_only.pdf",
            "document_type": "Impressum",
            "expected_extraction_method": "ocr",
            "notes": "Bildbasiertes PDF zum Test des PDF-OCR-Pfads.",
        },
    ]

    create_text_pdf(output_dir / "gruenderprofil_demo.pdf", "Gründer:innenprofil", founder_text)
    create_text_pdf(output_dir / "unternehmensprofil_demo.pdf", "Unternehmensprofil", company_text)
    create_text_pdf(output_dir / "gesellschaftsvertrag_demo.pdf", "Gesellschaftsvertrag", contract_text)
    create_text_pdf(output_dir / "gewerbeanmeldung_test.pdf", "Gewerbeanmeldung", trade_text)
    create_text_pdf(output_dir / "steuerdaten_finanzamt.pdf", "Steuerdaten", tax_text)
    create_text_pdf(output_dir / "impressum_demo.pdf", "Impressum", imprint_text)

    create_text_image(output_dir / "geschaeftsadresse_nachweis_scan.png", "Geschäftsadresse-Nachweis", address_text)
    create_text_image(output_dir / "datenschutz_basischeck_scan.tiff", "Datenschutz-Basischeck", privacy_text)
    create_text_image(output_dir / "impressum_scan_only_source.png", "Impressum Scan", imprint_text)
    create_image_only_pdf(output_dir / "impressum_scan_only.pdf", output_dir / "impressum_scan_only_source.png")

    create_docx(output_dir / "ai_use_case_steckbrief.docx", ai_text)
    create_xlsx(
        output_dir / "kapitaluebersicht.xlsx",
        [
            ["Position", "Betrag", "Hinweis"],
            ["Stammkapital", "1000 EUR", "Demo-Wert für den POC"],
            ["Einlage Max Muster", "500 EUR", "bar"],
            ["Einlage Erika Beispiel", "500 EUR", "bar"],
        ],
    )

    manifest = {
        "generated_in": str(output_dir),
        "documents": samples,
        "notes": [
            "PDF-Dateien mit Text testen den pdf_text-Pfad.",
            "PNG/TIFF-Dateien testen OCR auf Bilddateien.",
            "Das bildbasierte PDF testet den OCR-Fallback für PDFs mit wenig eingebettetem Text.",
            "DOCX und XLSX testen den filename_fallback für noch nicht voll unterstützte Office-Dateien.",
        ],
    }
    (output_dir / "mock_documents_manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    return samples


if __name__ == "__main__":
    generated = generate_mock_documents()
    print(f"Generated {len(generated)} mock documents in {MOCK_DIR}")
    for item in generated:
        print(f"- {item['filename']} -> {item['document_type']} ({item['expected_extraction_method']})")
