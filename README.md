# Cyber Shield

**AI-Powered Investigation Support Platform for Digital Evidence Case Management**

Cyber Shield is an AI-powered investigation support platform that assists law enforcement, child protection investigators, and forensic officers in managing cases, consolidating evidence-related notes, and generating structured, explainable outputs. It is developed as an academic research project (Course 24MCAR295 / 24MCAR296) in two phases — a Mini Project establishing the core evidence-correlation engine, and a Main Project extending it into a full investigative intelligence platform.

> ⚠️ **Ethical Scope Note:** This project operates entirely on **synthetic, self-generated case data**. No real case data, evidentiary material, or sensitive content is used at any stage of development, testing, or evaluation. AI output is treated strictly as an **advisory suggestion** — every summary, correlation, score, and generated finding must be reviewed and approved by a human (investigator, forensic officer, or supervisor) before being acted upon.

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Proposed Solution](#proposed-solution)
- [Project Phases](#project-phases)
  - [Phase 1 — Mini Project](#phase-1--mini-project-evidence-correlation--explainable-lead-generation)
  - [Phase 2 — Main Project](#phase-2--main-project-full-investigative-intelligence-platform)
- [User Roles](#user-roles)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Research Contribution](#research-contribution)
- [Contributing](#contributing)
- [Acknowledgements](#acknowledgements)

---

## Problem Statement

Child protection investigations require examining large volumes of case-related information gathered from multiple digital sources, including witness statements, forensic reports, communication logs, and multimedia evidence. Investigators manually sift through scattered case notes, organize disparate pieces of information, and compile comprehensive reports — a process that is time-consuming, error-prone, and increasingly unsustainable given the growing volume of digital evidence.

## Proposed Solution

Cyber Shield integrates Natural Language Processing (NLP) and Large Language Model (LLM)-based techniques to:

- Automatically summarize case notes
- Extract key entities (names, phone numbers, locations, dates)
- Correlate related information across cases
- Assign explainable priority scores to significant findings
- Integrate forensic officer reports into a unified case knowledge base

All of this happens with **complete human oversight** at every step — the system assists, it does not decide.

---

## Project Phases

### Phase 1 — Mini Project: Evidence Correlation & Explainable Lead Generation

A self-contained system that connects scattered evidence notes into explainable, prioritized leads.

| Module | Purpose |
|---|---|
| Case & Investigator Management | Investigator registration, login, case creation, role-based access |
| Evidence Note Ingestion | Structured/free-text evidence logging with metadata tagging |
| Entity Extraction & Correlation | Extracts and links names, numbers, emails, locations, dates across notes |
| Explainable Lead Generation & Scoring | Converts connections into ranked leads with plain-language justification |
| Investigator Review Dashboard | Central view of leads, evidence, and reasoning; verify/dismiss/annotate |

**Research angle:** Design and evaluation of an explainable evidence-correlation and lead-scoring pipeline, measured against investigator judgment on synthetic test cases.

### Phase 2 — Main Project: Full Investigative Intelligence Platform

Builds on the Phase 1 engine to deliver a complete platform for an investigative unit.

| Module | Purpose |
|---|---|
| AI-Powered Report Summarization | Consolidates notes and leads into a structured, editable draft report |
| Forensic Officer Report Integration | Parses uploaded forensic reports and merges findings into the case knowledge base |
| Cross-Source Discrepancy Detection | Flags contradictions between investigator notes and forensic findings |
| Cross-Case Correlation & Knowledge Graph | Surfaces relationships across multiple cases via an interactive graph |
| Investigator Hypothesis Verification Assistant | Conversational agent that checks an investigator's hunch against logged evidence |
| Tamper-Evident Audit Trail | SHA-256 hash-chained logging for case history integrity |
| Voice-to-Text Case Note Entry | Speech-to-text dictation for faster field note entry |
| Multilingual Report Generation | English–Malayalam report output for wider accessibility |

**Research angle:** Evaluation of the end-to-end system's ability to build a coherent, cross-source case intelligence picture across full synthetic case scenarios.

---

## User Roles

- **Investigator** — creates cases, logs notes, reviews AI-drafted leads/reports, requests forensic analysis
- **Forensic Officer** — uploads forensic reports, maintains chain-of-custody records, logs technical findings
- **Supervisor** — reviews/approves reports, monitors caseloads and forensic workload, gives feedback on AI output
- **Admin** — manages accounts/roles, system settings, audit logs, usage reports
- **System (automated)** — ingestion, cross-referencing, notifications, entity extraction, knowledge graph updates

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB, Neo4j (knowledge graph) |
| AI / ML | Hugging Face Transformers, spaCy, LangChain, OpenAI Whisper |
| Auth | JWT (JSON Web Tokens) |
| Other Tools | Git, Docker |

---

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB instance
- Neo4j instance (required for Phase 2 knowledge graph module)
- Python 3.10+ (for NLP/AI services — spaCy, Hugging Face Transformers)

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/cyber-shield.git
cd cyber-shield

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install AI service dependencies
cd ../ai-services
pip install -r requirements.txt --break-system-packages
```

### Environment Variables

Create a `.env` file in `/backend` with:

```
MONGODB_URI=your_mongodb_connection_string
NEO4J_URI=your_neo4j_connection_string
NEO4J_USER=your_neo4j_username
NEO4J_PASSWORD=your_neo4j_password
JWT_SECRET=your_jwt_secret
```

### Running the Project

```bash
# Start backend
cd backend
npm run dev

# Start frontend
cd frontend
npm run dev

# Start AI services
cd ai-services
python app.py
```

---

## Project Structure

```
cyber-shield/
├── frontend/          # React + Tailwind CSS client
├── backend/           # Node.js + Express API
├── ai-services/        # Python-based NLP/AI pipeline (entity extraction, summarization, RAG)
├── docs/              # Abstract, module documentation, research notes
└── README.md
```

---

## Research Contribution

This project's primary research contribution is an **explainable AI pipeline for investigative case correlation** — a system that not only detects connections and generates leads but justifies its reasoning in plain language at every step, keeping a human decision-maker in full control. All development and evaluation use synthetic, self-generated case data to ensure the project remains ethical, safe, and appropriate for an academic setting.

---

## Contributing

This is an individual academic research project (MCA, Course 24MCAR295/24MCAR296). External contributions are not currently accepted, but feedback and suggestions are welcome via Issues.

---

## Acknowledgements

- Inspired by Kerala Police Cyberdome's investigative technology initiatives



