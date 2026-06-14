# FoundAItion

FoundAItion ist ein End-to-End-MVP für einen ersten strukturierten Gründungs- und Compliance-Check. Der aktuelle Pilot bildet bewusst nur den Pfad **eingetragener Verein (e.V.)** ab und kombiniert Demo-State, Dokumentenportfolio, Upload-Verarbeitung, OCR/PDF-Extraction, lokalen JSON-RAG-Index, Evidence-Mapping und einen eng begrenzten Chat.

## Fachlicher Hinweis

- FoundAItion gibt strukturierende Orientierung.
- FoundAItion ersetzt keine Rechtsberatung.

## Verwendete Kerntechnologien

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Python, FastAPI, Pydantic, Uvicorn
- **Dokumentenverarbeitung:** PyMuPDF, Pillow, pytesseract, Tesseract OCR
- **Speicherung:** lokaler Demo-State, Upload-Ordner, `vector_store.json`
- **Optional:** Ollama für Embeddings und kurze Formulierungen

## Empfehlung für den einfachsten Betrieb

Für die meisten Teams ist **Docker Compose** der einfachste Weg. Damit startet ihr Frontend und Backend mit einem einzigen Befehl, ohne Python, Node oder Tesseract manuell auf dem Zielsystem einzurichten.

---

## FoundAItion mit Docker starten

### 1. Was ihr dafür braucht

Installiert auf dem Zielrechner:

- **Docker**
- **Docker Compose Plugin** (`docker compose`)

Auf macOS und Windows ist das in der Regel über **Docker Desktop** am einfachsten.  
Auf Ubuntu/Linux könnt ihr **Docker Engine** plus **Compose Plugin** verwenden.

### Ubuntu-Hinweis zu Paketnamen

Je nach Ubuntu-Version unterscheiden sich die Paketnamen:

- über das **Ubuntu-Repository** oft: `docker.io` und `docker-compose-v2`
- über das **offizielle Docker-Repository** oft: `docker-ce`, `docker-ce-cli` und `docker-compose-plugin`

Auf dem hier verwendeten Ubuntu-System war **`docker-compose-v2`** verfügbar, **`docker-compose-plugin`** dagegen nicht.

Ein typischer Ubuntu-Installationsbefehl ist daher:

```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-v2
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"
```

Danach einfach **ein neues Terminal öffnen** oder sich einmal neu anmelden, damit die neue `docker`-Gruppe aktiv ist.

### 2. Projekt holen

```bash
git clone https://github.com/Kaffeekautz/FountAItion.git
cd FountAItion
```

### 3. Optionale Konfiguration anlegen

Wenn ihr die Standard-Ports verwenden wollt, könnt ihr diesen Schritt überspringen.  
Wenn ihr Ports oder Ollama-Werte anpassen wollt:

```bash
cp .env.example .env
```

Die Standardwerte sind:

```env
FRONTEND_PORT=8080
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_EMBED_MODEL=nomic-embed-text
OLLAMA_MODEL=llama3.1
```

### 4. Container bauen und starten

Im Projektverzeichnis:

```bash
docker compose up --build
```

Wenn ihr die Container lieber im Hintergrund laufen lassen wollt:

```bash
docker compose up --build -d
```

### 5. Anwendung öffnen

Nach dem Start ist FoundAItion erreichbar unter:

- **Frontend:** <http://localhost:8080>
- **Backend API über Nginx:** <http://localhost:8080/api/state>
- **Backend Health über Nginx:** <http://localhost:8080/health>
- **FastAPI Docs über Nginx:** <http://localhost:8080/docs>

Wenn ihr Docker auf einem anderen Rechner oder Server gestartet habt, ersetzt `localhost` einfach durch dessen IP oder Hostnamen.

### 6. Docker parallel zur bereits laufenden lokalen Instanz starten

Wenn auf eurem Rechner bereits eine lokale FoundAItion-Instanz läuft, bleibt diese weiterhin erreichbar.  
Die Docker-Variante blockiert den Host-Port `8000` bewusst **nicht** mehr. Sie veröffentlicht standardmäßig nur das Frontend auf Port `8080`.

Falls `8080` bei euch schon belegt ist, setzt einfach vor dem Start einen anderen Frontend-Port:

```bash
FRONTEND_PORT=8081 docker compose up --build -d
```

---

## Was Docker hier genau startet

Docker Compose erstellt zwei Container:

### `frontend`

- baut die React/Vite-App
- liefert die gebaute App über **Nginx** aus
- leitet Anfragen an `/api`, `/health`, `/docs`, `/redoc` und `/openapi.json` intern an das Backend weiter

### `backend`

- startet die FastAPI-Anwendung
- enthält Python, die Backend-Abhängigkeiten und **Tesseract OCR**
- verarbeitet Uploads, OCR, Klassifikation und RAG
- ist nur **intern** für den Frontend-Container freigegeben und muss deshalb keinen Host-Port belegen

---

## Wo eure Daten im Docker-Betrieb liegen

Die Laufzeitdaten werden in einem Docker-Volume gespeichert:

- Docker-Volume: **`foundaition_data`**
- im Container gemountet nach: **`/app/data`**

Darin liegen dann insbesondere:

- Uploads: **`/app/data/uploads/`**
- lokaler RAG-Index: **`/app/data/vector_store.json`**

Das ist wichtig, weil eure Daten damit **nicht verloren gehen**, wenn ihr Container neu startet.

### Container stoppen, ohne Daten zu löschen

```bash
docker compose down
```

### Container stoppen und alle Docker-Daten dieses Projekts löschen

```bash
docker compose down -v
```

**Achtung:** Mit `-v` löscht ihr auch Uploads und den RAG-Index.

---

## Nützliche Docker-Befehle

### Laufende Container anzeigen

```bash
docker compose ps
```

### Logs ansehen

```bash
docker compose logs
```

### Logs live verfolgen

```bash
docker compose logs -f
```

### Nur Backend-Logs ansehen

```bash
docker compose logs -f backend
```

### Nur Frontend-Logs ansehen

```bash
docker compose logs -f frontend
```

### Nach Änderungen neu bauen

```bash
docker compose up --build
```

### Container neu starten

```bash
docker compose restart
```

---

## Ollama im Docker-Betrieb

Ollama ist **optional**. Wenn Ollama nicht erreichbar ist, läuft FoundAItion trotzdem weiter und verwendet Keyword-Retrieval sowie die regelbasierte Logik.

Wenn Ollama auf eurem Host-Rechner läuft, könnt ihr in `.env` z. B. diese Werte verwenden:

```env
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_EMBED_MODEL=nomic-embed-text
OLLAMA_MODEL=llama3.1
```

Wenn ihr kein Ollama nutzt, könnt ihr die Standardwerte einfach stehen lassen. FoundAItion fällt automatisch auf den lokalen Nicht-Ollama-Modus zurück.

---

## FoundAItion im lokalen Netzwerk bereitstellen

Wenn Docker auf einem Rechner im selben Netzwerk läuft, können andere Geräte die Anwendung in der Regel über dessen IP öffnen:

- `http://DEINE-IP:8080`

Beispiel:

- `http://192.168.0.25:8080`

Die Uploads der anderen Geräte landen dann **nicht auf deren Rechnern**, sondern im Backend-Container auf dem Host-System, genauer im Docker-Volume `foundaition_data`.

---

## Typischer Ablauf für Nicht-Docker-Expert:innen

Wenn jemand einfach nur einen lauffähigen Stand braucht, reicht meist genau das:

1. Docker installieren
2. Repository klonen
3. Im Projektordner `docker compose up --build -d` ausführen
4. Im Browser `http://localhost:8080` öffnen
5. Bei Problemen `docker compose logs -f` ansehen

Zum Beenden:

```bash
docker compose down
```

---

## Lokaler Betrieb ohne Docker

Wenn ihr bewusst lokal ohne Docker arbeiten wollt:

### Ubuntu-Pakete

```bash
sudo apt update
sudo apt install -y python3 python3-venv python3-pip nodejs npm tesseract-ocr tesseract-ocr-deu
```

Mindestens benötigt:

- `python3`
- `python3-venv`
- `python3-pip`
- `nodejs`
- `npm`
- `tesseract-ocr`
- `tesseract-ocr-deu`

### Backend lokal starten

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend lokal starten

```bash
cd frontend
npm install
npm run dev
```

### Lokale URLs

- Backend Health: <http://localhost:8000/health>
- Backend State: <http://localhost:8000/api/state>
- Frontend: <http://localhost:5173>

---

## Lokale Validierung ohne Docker

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

---

## Mock-Dokumente generieren

```bash
cd backend
source .venv/bin/activate
python generate_mock_documents.py
```

Die Testdateien werden unter `backend/data/mock_documents/` erzeugt.

---

## Unterstützte Text-Extraction

- PDF mit eingebettetem Text
- Bilddateien per OCR: `png`, `jpg`, `jpeg`, `tif`, `tiff`
- Textdateien: `txt`, `md`, `markdown`, `log`, `ini`, `cfg`, `conf`, `yaml`, `yml`
- Strukturierte Textformate: `csv`, `json`, `jsonl`, `html`, `htm`, `xml`
- Moderne Office-Formate mit Basis-Extraction: `docx`, `xlsx`

---

## Bekannte Einschränkungen

- POC aktuell nur für **eingetragener Verein (e.V.)**
- keine echte Rechtsberatung
- keine Behördenintegration
- keine echte Signatur
- keine echte Datenbank
- ältere Binärformate wie `doc` oder `xls` werden noch nicht extrahiert
- Tesseract muss lokal installiert sein, wenn ihr **ohne Docker** arbeitet
- der Chat beantwortet nur FoundAItion-konforme Fragen zu Dokumenten, Nachweisen, Checklistenpunkten und Begriffen
