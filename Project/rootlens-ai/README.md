# 🔍 RootLens AI

> **Investigate incidents in minutes, not hours.**

AI-powered Post-Incident Root Cause Analysis (RCA) Drafter that automatically analyzes production incidents by correlating system logs, incident timelines, git diffs, and historical incidents.

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (Vite + React)            │
│   Dashboard → Investigation → Report → Historical   │
└──────────────────────┬──────────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────────┐
│                   FastAPI Backend                     │
│   /upload/*  ·  /incidents  ·  /report/{id}          │
│   /similar-incidents/{id}                            │
├──────────────────────────────────────────────────────┤
│              Orchestrator Pipeline                    │
│   Log Agent → Timeline Agent → Git Agent             │
│        ↓              ↓             ↓                │
│      MCP Historical Search (InsForge)                │
│        ↓                                             │
│   Routing Check → RCA Agent → Final Report           │
├──────────────────────────────────────────────────────┤
│   Gemini AI  ·  InsForge (Supabase)  ·  PostgreSQL   │
└──────────────────────────────────────────────────────┘
```

## ⚡ Core Features

| Feature | Description |
|---|---|
| **Multi-Agent RCA** | 5 specialised AI agents (Log, Timeline, Git, RCA, Orchestrator) |
| **Evidence Chain** | Linked evidence trail across all data sources |
| **Confidence Score** | 0–100% numerical confidence in root cause |
| **MCP Integration** | InsForge historical incident search via Supabase-compatible API |
| **Executive Summary** | Management-ready plain-language summary |
| **Prevention Plan** | Actionable recommendations with priority and ownership |

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router |
| Backend | FastAPI, Python 3.12+, Pydantic v2 |
| AI | Google Gemini (gemini-2.0-flash) |
| Database | PostgreSQL 16, SQLAlchemy (async) |
| MCP Backend | InsForge (Supabase-compatible) |

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.12+** with `pip`
- **Node.js 18+** with `npm`
- **PostgreSQL 16** running locally
- **Google Gemini API key**

### 1. Clone & configure

```bash
git clone <repo-url>
cd rootlens-ai
```

Edit `.env` with your real values:

```env
DATABASE_URL=postgresql://rootlens:rootlens_secret@localhost:5432/rootlens
GEMINI_API_KEY=your-real-gemini-api-key
MCP_INFORGE_URL=https://yzb8iiq6.us-east.insforge.app
INFORGE_KEY=your-insforge-key
SECRET_KEY=generate-a-strong-random-secret
VITE_API_URL=http://localhost:8000/api
```

Make sure your local PostgreSQL server is running and the database specified in your `DATABASE_URL` exists.

### 3. Start the backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs at `http://localhost:8000`. API docs at `http://localhost:8000/docs`.

### 4. Start the frontend

```bash
# From project root
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

---

## 📂 Project Structure

```
rootlens-ai/
├── frontend/
│   ├── pages/
│   │   ├── Dashboard.jsx           # Upload + start investigation
│   │   ├── InvestigationView.jsx   # Live agent progress + polling
│   │   ├── ReportView.jsx          # Full RCA report display
│   │   └── HistoricalView.jsx      # Similar past incidents (MCP)
│   ├── components/                 # Reusable UI components
│   └── data/
│       ├── api.js                  # API client
│       └── mockData.js             # Demo data
│
├── backend/
│   └── app/
│       ├── main.py                 # FastAPI entry point
│       ├── api/                    # Route handlers
│       ├── agents/                 # AI agent modules + prompts
│       ├── mcp/                    # InsForge client + search + tools
│       ├── ai/                     # Gemini client wrapper
│       ├── schemas/                # Pydantic models
│       ├── database/               # SQLAlchemy models + connection
│       └── core/                   # Config
│
├── sample-data/                    # 3 demo incidents
└── .env
```

## 🎯 Demo Flow

1. **Upload** sample files from `sample-data/incident-002/`
   - `logs.txt` → Log files panel
   - `timeline.txt` → Timeline panel
   - `gitdiff.diff` → Git diff panel

2. **Start Investigation** → watch the 7-step agent pipeline run live

3. **View RCA Report** with:
   - Root cause + causal chain
   - Evidence-backed timeline
   - Confidence score
   - Executive summary
   - Prevention recommendations

4. **Browse Historical Incidents** surfaced via MCP InsForge search

---

## 📡 API Endpoints

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/upload/logs` | Upload log file or text |
| `POST` | `/api/upload/timeline` | Upload timeline text |
| `POST` | `/api/upload/diff` | Upload git diff |
| `POST` | `/api/incidents` | Run full RCA pipeline |
| `GET` | `/api/report/{id}` | Fetch completed report |
| `GET` | `/api/similar-incidents/{id}` | Fetch similar historical incidents |
| `GET` | `/health` | Health check |

---

## 📄 License

Built for the PS-05 competition track: Production Support — Post-Incident RCA Drafter.

**RootLens AI** · Agentic AI · MCP Integration · Multi-source RAG
