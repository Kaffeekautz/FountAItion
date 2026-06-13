# FoundAItion

FoundAItion ist ein lokal lauffähiger End-to-End-MVP für einen ersten strukturierten Gründungs-Compliance-Check. Der Pilot bildet aktuell bewusst nur den Pfad **eingetragener Verein (e.V.)** ab und kombiniert Demo-State, Dokumentenportfolio, Upload-Verarbeitung, OCR/PDF-Extraction, lokalen JSON-RAG-Index, Evidence-Mapping und einen eng begrenzten Help-Chat.

## Fachlicher Hinweis

- FoundAItion gibt strukturierende Orientierung.
- FoundAItion ersetzt keine Rechtsberatung.

## Ubuntu Setup

```bash
sudo apt update
sudo apt install -y python3 python3-venv python3-pip nodejs npm tesseract-ocr tesseract-ocr-deu
```

Wenn auf deinem System Tools fehlen, installiere mindestens:

- `python3`
- `python3-venv`
- `python3-pip`
- `nodejs`
- `npm`
- `tesseract-ocr`
- `tesseract-ocr-deu`

## Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Backend Start

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Frontend Setup

```bash
cd frontend
npm install
```

## Frontend Start

```bash
npm run dev
```

## URLs

- Backend Health: <http://localhost:8000/health>
- Backend State: <http://localhost:8000/api/state>
- Frontend: <http://localhost:5173>

## Im selben Netz teilen

Starte Backend und Frontend so, dass sie nicht nur auf `localhost`, sondern im lokalen Netz lauschen:

```bash
# Terminal 1
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2
cd frontend
npm run dev
```

Danach deine lokale IP anzeigen:

```bash
hostname -I
```

Die erste IPv4-Adresse ist in den meisten Heim- und Office-Netzen die richtige LAN-Adresse. Andere Geräte im selben Netz erreichen FoundAItion dann typischerweise unter:

- `http://DEINE-LAN-IP:5173`
- z. B. `http://10.172.6.45:5173`

Das Frontend verwendet für API-Aufrufe automatisch denselben Host und spricht dadurch im LAN das Backend unter Port `8000` an.

## Upload-Testdateinamen

- `gruenderprofil_demo.pdf`
- `unternehmensprofil_demo.pdf`
- `impressum_demo.pdf`
- `impressum_scan_only.pdf`
- `datenschutz_basischeck_scan.tiff`
- `gesellschaftsvertrag_demo.pdf`
- `kapitaluebersicht.xlsx`
- `geschaeftsadresse_nachweis_scan.png`
- `gewerbeanmeldung_test.pdf`
- `steuerdaten_finanzamt.pdf`
- `ai_use_case_steckbrief.docx`

## Mock-Dokumente generieren

```bash
cd backend
source .venv/bin/activate
python generate_mock_documents.py
```

Die Testdateien werden unter `backend/data/mock_documents/` erzeugt. Dort liegen:

- je ein Mock-Dokument für alle FoundAItion-Dokumenttypen
- OCR-Samples als `png` und `tiff`
- ein bildbasiertes PDF für den PDF-OCR-Fallback
- eine `mock_documents_manifest.json` mit erwarteten Dokumenttypen und Extraction-Pfaden

## Unterstützte Text-Extraction

- PDF mit eingebettetem Text
- Bilddateien per OCR: `png`, `jpg`, `jpeg`, `tif`, `tiff`
- Textdateien: `txt`, `md`, `markdown`, `log`, `ini`, `cfg`, `conf`, `yaml`, `yml`
- Strukturierte Textformate: `csv`, `json`, `jsonl`, `html`, `htm`, `xml`
- Moderne Office-Formate mit Basis-Extraction: `docx`, `xlsx`

## Ollama optional

```bash
export OLLAMA_EMBED_MODEL=nomic-embed-text
export OLLAMA_MODEL=llama3.1
```

Wenn Ollama nicht läuft, nutzt FoundAItion Keyword-Retrieval und einen regelbasierten Chat ohne freie Rechtsbewertung.

## Lokale Validierung

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m compileall app
python -c "from app.main import app; print('backend import ok')"
```

### Frontend

```bash
cd frontend
npm install
npm run build
```

## Systemstatus in dieser Umgebung

- `python3` vorhanden
- `python3-venv` nutzbar
- `pip` vorhanden
- `tesseract` vorhanden
- `node` systemweit nicht vorhanden
- `npm` systemweit nicht vorhanden

Wenn `sudo` nicht non-interaktiv verfügbar ist, dokumentiert FoundAItion die benötigten Ubuntu-Befehle statt die Systempakete automatisch zu installieren.

## Bekannte Einschränkungen

- POC aktuell nur für **eingetragener Verein (e.V.)**
- keine echte Rechtsberatung
- keine Behördenintegration
- keine echte Signatur
- ältere Binärformate wie `doc` oder `xls` werden noch nicht extrahiert
- Tesseract muss lokal installiert sein für OCR
- der Help-Chat beantwortet nur FoundAItion-konforme Fragen zu Dokumenten, Nachweisen, Checklistenpunkten und Begriffen
