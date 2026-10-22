# Cyber Shield

**AI-Powered Investigation Support Platform for Digital Evidence Case Management**

_Making Evidence to Intelligence_

Cyber Shield is an investigator **decision-support** system. AI findings are recommendations only and must be independently verified. The platform never automatically decides guilt, admissibility, or enforcement action.

> This project can sync with [Lovable](https://lovable.dev). Avoid force-pushing or rewriting published git history.

---

## Architecture

```text
React (TanStack Router)
        ↓
FastAPI
        ↓
PostgreSQL
        ↓
AI Processing Services
        ↓
Evidence Intelligence (entities, correlations, timeline, risk, leads)
```

| Layer    | Location                  | Responsibility                                                    |
| -------- | ------------------------- | ----------------------------------------------------------------- |
| Frontend | `src/`                    | Role workspaces, case detail, evidence viewer, intelligence panel |
| API      | `backend/app/api/routes/` | Auth, cases, evidence, AI, reports                                |
| Services | `backend/app/services/`   | Case/evidence workflow + `services/ai/` pipeline                  |
| Database | PostgreSQL + Alembic      | Cases, evidence, leads, relationships, audit                      |
| Storage  | `backend/uploads/`        | Original evidence files (never modified after upload)             |

---

## AI pipeline

```text
CASE → Evidence upload → Validate → SHA-256 → Duplicate check
    → Metadata → Text / OCR / STT → Entities → Correlation
    → Timeline → Risk → Explainable leads → Investigator review
    → Summary / export
```

Every AI result includes supporting evidence IDs, confidence, explanation, and a human review state (`PENDING_REVIEW`, `VERIFIED`, `REJECTED`, `MODIFIED`). Original AI output is preserved when a lead is modified.

If an external LLM key is missing, the API stays online and uses local/rule-based processing.

---

## Running the project

### Frontend

```sh
npm i
npm run dev
```

Default Vite origin: `http://localhost:8080` (see `vite.config.ts`).

### Backend

```sh
cd backend
cp .env.example .env
# set DATABASE_URL and JWT_SECRET
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

Interactive docs: `http://localhost:8001/docs`

Optional local engines (not required): Tesseract / EasyOCR, OpenAI Whisper. Optional LLM: set `AI_PROVIDER=openai` and `AI_API_KEY`.

### Synthetic demonstration case

After login, open **AI Intelligence** and seed **CS-2026-0003**, or `POST /api/demo/seed-synthetic-case`. All demonstration evidence is synthetic.

---

## Evidence Repository

The **Evidence Repository** is a local synthetic evidence library. It does **not** replace case Evidence pages or the real upload pipeline. Every file is marked **SYNTHETIC DEMONSTRATION DATA — NOT REAL FORENSIC EVIDENCE**. Identities use fictional `.test` domains and invented phone numbers. No real PII or forensic material is used.

| Item          | Detail                                                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Location      | `backend/evidence_repository/<case-number>/<category>/`                                                                                          |
| Catalog table | `evidence_repository_items` (`dataset = CYBER_SHIELD_DEMO`)                                                                                      |
| UI            | **Evidence Repository** in Investigator, Supervisor, Admin, and Major Admin nav                                                                  |
| Types         | Documents (PDF/DOCX/TXT/CSV/JSON), images, audio (WAV), video (MP4 or GIF fallback), communications, location, browser, call logs, social export |

### What you can do

- Search and filter by case, type, filename, description, tags, and extracted entities
- Preview images, PDF, audio, video, text/JSON/CSV, and DOCX text
- Download the real generated file
- **Add to Case** — copies the file through the existing evidence ingest API (SHA-256, duplicate detection, metadata, AI pipeline)
- **Generate Evidence** / **Generate Complete Demo** for one case
- **Generate Evidence For All Cases** (admin / major admin) — background job with progress
- **Reset Synthetic Evidence** (admin / major admin) — deletes only `CYBER_SHIELD_DEMO` catalog items and imported synthetic evidence. Users, cases, investigators, and non-synthetic evidence are kept.

### Demonstration workflow

```text
Login
 → Evidence Repository
 → Generate Evidence For All Cases
 → Filter CS-2026-0003
 → Preview / Download
 → Add to Case
 → Existing pipeline: hash → duplicates → OCR/text/STT (or fallback status)
 → Entities → correlation → timeline → risk → explainable leads → human review → summary / export
```

If OCR, Whisper, or an LLM is unavailable, processing status shows the existing fallback (for example “Not processed — dependency unavailable”). The UI does not invent AI results.

### API

| Method | Path                                        |
| ------ | ------------------------------------------- |
| GET    | `/api/evidence-repository`                  |
| GET    | `/api/evidence-repository/{id}`             |
| GET    | `/api/evidence-repository/{id}/preview`     |
| GET    | `/api/evidence-repository/{id}/download`    |
| POST   | `/api/evidence-repository/generate`         |
| POST   | `/api/evidence-repository/generate-all`     |
| GET    | `/api/evidence-repository/jobs/{job_id}`    |
| POST   | `/api/evidence-repository/{id}/add-to-case` |
| DELETE | `/api/evidence-repository/synthetic`        |

Generator unit tests: `python test_evidence_repository.py` from `backend/`.

---

## Environment

See `backend/.env.example`. Never commit `.env` or put API keys in frontend code.

| Variable                                             | Purpose                                                          |
| ---------------------------------------------------- | ---------------------------------------------------------------- |
| `DATABASE_URL`                                       | PostgreSQL                                                       |
| `JWT_SECRET`                                         | Access-token signing                                             |
| `UPLOAD_DIR` / `MAX_UPLOAD_BYTES`                    | Evidence storage                                                 |
| `AI_PROVIDER` / `AI_API_KEY` / `MODEL_NAME`          | Optional LLM                                                     |
| `OCR_ENGINE` / `WHISPER_MODEL`                       | Optional local media engines                                     |
| `RISK_LOW_MAX` / `RISK_MEDIUM_MAX` / `RISK_HIGH_MAX` | Priority bands                                                   |
| `EVIDENCE_REPOSITORY_DIR`                            | Synthetic library folder (default `backend/evidence_repository`) |

---

## Security and oversight

- Passwords are bcrypt-hashed; JWT + role checks are enforced in the API
- Investigators only receive cases they created, lead, or are assigned to
- Uploaded files are extension/size validated; original bytes are never rewritten
- AI outputs are labeled and require investigator Verify / Reject / Modify
- Activity and review decisions are audited

---

## Built with

- React, TypeScript, TanStack Router / Query, Tailwind CSS
- FastAPI, SQLAlchemy, Alembic, PostgreSQL
- Pillow + optional OCR / Whisper / LLM backends
