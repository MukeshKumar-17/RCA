<![CDATA[<div align="center">

# 🔍 RootLens AI

### Intelligent Root Cause Analysis Platform

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-rootlens.insforge.site-0ea5e9?style=for-the-badge)](https://rootlens.insforge.site)
[![Backend](https://img.shields.io/badge/⚡_Backend-Fly.io-8b5cf6?style=for-the-badge)](https://rootlens-backend-73624a2a-d0c4-45ce-8f5c-628c7c020042.fly.dev/health)
[![Built with](https://img.shields.io/badge/Built_with-InsForge-f97316?style=for-the-badge)](https://insforge.com)

**RootLens AI** is an AI-powered incident investigation platform that automates **Root Cause Analysis (RCA)** for production incidents. Upload your logs, timelines, and code diffs — and let a multi-agent AI pipeline analyze, correlate, and synthesize a comprehensive RCA report in seconds.

[Live App](https://rootlens.insforge.site) · [Architecture](#-system-architecture) · [User Flow](#-user-flow) · [API Reference](#-api-reference)

</div>

---

## 📑 Table of Contents

- [Features](#-features)
- [Live Demo](#-live-demo)
- [System Architecture](#-system-architecture)
- [Multi-Agent Pipeline](#-multi-agent-pipeline)
- [User Flow](#-user-flow)
- [MCP (Model Context Protocol)](#-mcp-model-context-protocol)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [Getting Started](#-getting-started)
- [Deployment](#-deployment)
- [Environment Variables](#-environment-variables)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 **Multi-Agent RCA Pipeline** | Four specialized AI agents (Log, Timeline, Git, RCA) analyze incidents in parallel using Google Gemini 2.5 Flash |
| 🧠 **AI Copilot Chat** | Context-aware streaming chat assistant that answers follow-up questions about any investigation with SSE streaming |
| 📊 **Real-time Dashboard** | Live incident tracking with status indicators, confidence scores, and evidence completeness metrics |
| 📁 **File Upload & Attachment** | Upload logs, timelines, and diffs via InsForge Storage with automatic parsing |
| 📄 **PDF Export** | Generate downloadable PDF reports with full RCA details, evidence chains, and action items |
| 📧 **Email Reports** | Send PDF reports directly to team members via SendGrid integration |
| 🔍 **Historical Search** | MCP-powered similarity search across past incidents to enrich new investigations |
| 🔐 **Google OAuth** | Secure authentication via InsForge Auth with row-level security (RLS) on all tables |
| 🎨 **Material Design 3** | Premium dark-mode UI with glassmorphism, micro-animations, and responsive layout |
| ⚡ **Multi-Key Pool** | Round-robin Gemini API key rotation with automatic 429 fallback |

---

## 🚀 Live Demo

| Environment | URL |
|------------|-----|
| **Production (Custom Domain)** | [https://rootlens.insforge.site](https://rootlens.insforge.site) |
| **Production (Default)** | [https://yzb8iiq6.insforge.site](https://yzb8iiq6.insforge.site) |
| **Backend API** | [https://rootlens-backend-73624a2a-d0c4-45ce-8f5c-628c7c020042.fly.dev](https://rootlens-backend-73624a2a-d0c4-45ce-8f5c-628c7c020042.fly.dev/health) |

### Quick Test

```bash
# Health check
curl https://rootlens-backend-73624a2a-d0c4-45ce-8f5c-628c7c020042.fly.dev/health

# Test Gemini connectivity
curl https://rootlens-backend-73624a2a-d0c4-45ce-8f5c-628c7c020042.fly.dev/api/test-llm
```

---

## 🏗 System Architecture

```mermaid
graph TB
    subgraph "Frontend — React + Vite"
        UI["🖥️ React SPA<br/>(Material Design 3)"]
        SDK["📦 InsForge SDK<br/>(@insforge/sdk)"]
        Router["🔀 React Router v7"]
    end

    subgraph "InsForge Platform (BaaS)"
        Auth["🔐 Authentication<br/>(Google OAuth + JWT)"]
        DB["🗄️ PostgreSQL<br/>(PostgREST + RLS)"]
        Storage["📁 Object Storage<br/>(File uploads)"]
        CDN["🌐 Static Hosting<br/>(CDN + Custom Domain)"]
    end

    subgraph "Backend — FastAPI on Fly.io"
        API["⚡ FastAPI Server<br/>(Uvicorn + Gunicorn)"]
        CORS["🛡️ CORS Middleware"]
        AuthDep["🔑 JWT Auth Dependency"]

        subgraph "AI Agent Pipeline"
            Orchestrator["🎯 Orchestrator"]
            LogAgent["📋 Log Agent"]
            TimelineAgent["⏱️ Timeline Agent"]
            GitAgent["🔀 Git Agent"]
            RCAAgent["🧠 RCA Agent"]
        end

        subgraph "MCP Layer"
            MCPTools["🔧 MCP Tools"]
            InforgeClient["📡 InForge Client<br/>(SQLAlchemy Async)"]
            LocalStore["💾 In-Memory Store"]
        end

        subgraph "Services"
            Copilot["💬 Copilot Service<br/>(SSE Streaming)"]
            PDFService["📄 PDF Generator<br/>(WeasyPrint)"]
            EmailService["📧 Email Service<br/>(SendGrid)"]
            UploadService["📁 Upload Service"]
        end

        GeminiPool["🔑 Gemini Key Pool<br/>(Round-robin + 429 fallback)"]
    end

    subgraph "External Services"
        Gemini["🤖 Google Gemini 2.5 Flash"]
        SendGrid["📧 SendGrid API"]
    end

    UI --> SDK
    UI --> Router
    SDK --> Auth
    SDK --> Storage
    UI --> API
    CDN --> UI

    API --> CORS
    API --> AuthDep
    AuthDep --> Auth

    API --> Orchestrator
    Orchestrator --> LogAgent
    Orchestrator --> TimelineAgent
    Orchestrator --> GitAgent
    Orchestrator --> RCAAgent
    Orchestrator --> MCPTools

    LogAgent --> GeminiPool
    TimelineAgent --> GeminiPool
    GitAgent --> GeminiPool
    RCAAgent --> GeminiPool
    Copilot --> GeminiPool

    GeminiPool --> Gemini

    MCPTools --> InforgeClient
    MCPTools --> LocalStore
    InforgeClient --> DB

    API --> Copilot
    API --> PDFService
    API --> EmailService
    EmailService --> SendGrid
    API --> UploadService
    UploadService --> Storage

    style Orchestrator fill:#8b5cf6,color:#fff
    style GeminiPool fill:#f59e0b,color:#000
    style MCPTools fill:#10b981,color:#fff
    style Gemini fill:#4285f4,color:#fff
```

---

## 🤖 Multi-Agent Pipeline

The RCA pipeline uses a **multi-agent architecture** where specialized AI agents analyze different evidence sources in parallel, followed by an orchestrator that routes findings to the final RCA synthesis.

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API as FastAPI Backend
    participant Orch as Orchestrator
    participant LA as Log Agent
    participant TA as Timeline Agent
    participant GA as Git Agent
    participant MCP as MCP Tools
    participant RC as Routing Check
    participant RCA as RCA Agent
    participant Gemini as Gemini 2.5 Flash
    participant DB as PostgreSQL

    User->>Frontend: Upload logs, timeline, diff
    Frontend->>API: POST /api/incidents
    API->>Orch: orchestrator.run()

    Note over Orch: Step 1 — Parallel Agent Analysis

    par Log Analysis
        Orch->>LA: log_agent.run(raw_logs)
        LA->>Gemini: Analyze log patterns
        Gemini-->>LA: Structured log findings
        LA-->>Orch: log_output
    and Timeline Analysis
        Orch->>TA: timeline_agent.run(raw_timeline)
        TA->>Gemini: Parse timeline events
        Gemini-->>TA: Structured timeline
        TA-->>Orch: timeline_output
    and Git Analysis
        Orch->>GA: git_agent.run(raw_diff)
        GA->>Gemini: Analyze code changes
        Gemini-->>GA: Diff risk assessment
        GA-->>Orch: git_output
    end

    Note over Orch: Step 2 — Historical Search

    Orch->>MCP: search_historical_incidents()
    MCP->>DB: SELECT similar incidents
    DB-->>MCP: Past incident matches
    MCP-->>Orch: mcp_matches[]

    Note over Orch: Step 3 — Routing Check

    Orch->>RC: _routing_check()
    RC->>Gemini: Is evidence sufficient?
    Gemini-->>RC: evidence_completeness + decision
    RC-->>Orch: PROCEED_TO_RCA / REQUEST_CLARIFICATION

    Note over Orch: Step 4 — RCA Synthesis

    Orch->>RCA: rca_agent.run(all_findings)
    RCA->>Gemini: Synthesize root cause
    Gemini-->>RCA: Full RCA document
    RCA-->>Orch: rca_output

    Note over Orch: Step 5 — Persist & Return

    Orch-->>API: Complete result package
    API->>MCP: save_incident_to_mcp()
    MCP->>DB: INSERT incidents + historical
    API-->>Frontend: { id, status, evidence_completeness }
    Frontend-->>User: Navigate to investigation page
```

### Agent Descriptions

| Agent | Role | Input | Output |
|-------|------|-------|--------|
| **Log Agent** | Parses raw log text, identifies error patterns, anomalies, and dominant services | Raw log text | `{ events[], log_summary, error_patterns[] }` |
| **Timeline Agent** | Extracts chronological events, calculates MTTR, identifies blast radius | Timeline description + incident date | `{ timeline[], metrics, blast_radius }` |
| **Git Agent** | Analyzes code diffs for risky changes, modified services, potential root causes | Git diff + incident context | `{ changes[], diff_summary, risk_assessment }` |
| **RCA Agent** | Synthesizes all findings into a comprehensive root cause analysis document | All agent outputs + historical context | `{ root_cause, evidence_chain[], contributing_factors[], action_items[], prevention }` |
| **Orchestrator** | Coordinates agents, performs routing checks, enriches context with MCP data | Raw inputs | Complete result envelope |

---

## 🔄 User Flow

```mermaid
flowchart TD
    A["🌐 Visit rootlens.insforge.site"] --> B{"Authenticated?"}
    B -->|No| C["🔐 Google OAuth Login<br/>(via InsForge Auth)"]
    C --> D["✅ Authenticated"]
    B -->|Yes| D

    D --> E["📊 Dashboard<br/>View all incidents"]

    E --> F["➕ New Scan"]
    E --> G["📋 View Existing Report"]
    E --> H["📜 Historical Incidents"]
    E --> I["💬 AI Copilot Chat"]

    F --> J["📁 Upload Evidence<br/>• Paste logs<br/>• Add timeline<br/>• Upload git diff<br/>• Attach files"]

    J --> K["🚀 Generate Analysis"]

    K --> L["⏳ Pipeline Running<br/>• Analyzing Logs...<br/>• Parsing Timeline...<br/>• Reviewing Changes...<br/>• Searching Historical...<br/>• Synthesizing RCA..."]

    L --> M{"Evidence<br/>Sufficient?"}

    M -->|Yes| N["📊 Investigation Page<br/>• Root Cause<br/>• Evidence Chain<br/>• Contributing Factors<br/>• Action Items<br/>• Prevention Plan"]

    M -->|No| O["⚠️ Needs Clarification<br/>Additional evidence requested"]
    O --> J

    N --> P["📄 Export PDF"]
    N --> Q["📧 Email Report"]
    N --> R["💬 Ask Copilot"]
    N --> S["🔍 View Similar Incidents"]

    R --> T["🤖 AI Copilot<br/>SSE Streaming Chat<br/>Context-aware answers"]

    G --> N
    H --> U["📜 Historical List<br/>Past incident database"]

    style A fill:#0ea5e9,color:#fff
    style K fill:#8b5cf6,color:#fff
    style N fill:#10b981,color:#fff
    style T fill:#f59e0b,color:#000
    style C fill:#ef4444,color:#fff
```

---

## 🔧 MCP (Model Context Protocol)

RootLens AI implements a **custom MCP layer** that bridges the AI agent pipeline with persistent storage and historical intelligence. The MCP tools follow the Model Context Protocol pattern, providing structured tool interfaces that the orchestrator invokes during analysis.

### MCP Architecture

```mermaid
graph LR
    subgraph "MCP Tool Layer"
        T1["🔍 search_historical_incidents"]
        T2["💾 save_incident_to_mcp"]
        T3["📖 get_incident_from_mcp"]
        T4["📋 list_incidents_from_mcp"]
    end

    subgraph "Storage Backends"
        PG["🐘 PostgreSQL<br/>(SQLAlchemy Async)"]
        MEM["💨 In-Memory Store<br/>(Fast cache)"]
    end

    subgraph "Database Tables"
        INC["incidents<br/>(Full RCA records)"]
        HIST["historical_incidents<br/>(Searchable index)"]
        FILES["incident_files<br/>(Uploaded artifacts)"]
    end

    T1 --> PG
    T1 -.->|fallback| MEM
    T2 --> PG
    T2 --> MEM
    T3 --> MEM
    T3 -.->|cache miss| PG
    T4 --> PG

    PG --> INC
    PG --> HIST
    PG --> FILES

    style T1 fill:#10b981,color:#fff
    style T2 fill:#10b981,color:#fff
    style T3 fill:#10b981,color:#fff
    style T4 fill:#10b981,color:#fff
```

### MCP Tools Reference

| Tool | Type | Description |
|------|------|-------------|
| `search_historical_incidents` | **Read** | Searches the `historical_incidents` table using keyword matching across title, root_cause, and summary. Falls back to in-memory store if PostgreSQL is unavailable. |
| `save_incident_to_mcp` | **Write** | Dual-write to PostgreSQL (`incidents` + `historical_incidents`) and in-memory cache. Extracts root cause title and prevention improvements for the historical index. |
| `get_incident_from_mcp` | **Read** | Retrieves a single incident by ID. Checks in-memory cache first (O(1)), falls back to direct DB query on cache miss. Populates cache on DB hit. |
| `list_incidents_from_mcp` | **Read** | Lists all incidents ordered by `created_at DESC`. Used by the dashboard and historical pages. |

### MCP Data Flow in Pipeline

```mermaid
flowchart LR
    subgraph "During Analysis"
        A["Orchestrator"] -->|"search_historical_incidents(query)"| B["MCP Tools"]
        B -->|"SQL: ILIKE search"| C["PostgreSQL"]
        C -->|"matches[]"| B
        B -->|"Enrich context"| A
    end

    subgraph "After Analysis"
        D["Pipeline Complete"] -->|"save_incident_to_mcp()"| E["MCP Tools"]
        E -->|"INSERT incidents"| F["PostgreSQL"]
        E -->|"INSERT historical_incidents"| F
        E -->|"store.save()"| G["In-Memory Cache"]
    end

    subgraph "On Page Load"
        H["Frontend"] -->|"GET /api/incidents"| I["FastAPI"]
        I -->|"list_incidents_from_mcp()"| J["MCP Tools"]
        J -->|"SELECT * FROM incidents"| K["PostgreSQL"]
    end
```

### Consumed Platform Services (InsForge MCP)

| Service | Usage |
|---------|-------|
| **InsForge Auth** | Google OAuth authentication, JWT token issuance and validation |
| **InsForge Database** | PostgreSQL with PostgREST API, Row-Level Security (RLS) policies |
| **InsForge Storage** | File uploads for incident artifacts (logs, screenshots, configs) |
| **InsForge Hosting** | Static site hosting with CDN, custom domain (`rootlens.insforge.site`) |
| **InsForge Compute** | Docker container deployment on Fly.io for the FastAPI backend |
| **InsForge CLI** | Deployment, database queries, compute management, log streaming |

---

## 🛠 Tech Stack

### Frontend

| Technology | Purpose |
|-----------|---------|
| **React 19** | UI framework with hooks and functional components |
| **Vite 8** | Build tool and dev server with HMR |
| **React Router 7** | Client-side routing with nested layouts |
| **InsForge SDK** | Authentication, storage, and database client |
| **Material Design 3** | Custom design system with dark mode, glassmorphism |
| **CSS3** | Custom properties, animations, `backdrop-filter` |

### Backend

| Technology | Purpose |
|-----------|---------|
| **FastAPI** | Async Python web framework with OpenAPI docs |
| **Uvicorn + Gunicorn** | ASGI server with worker management |
| **SQLAlchemy 2.0** | Async ORM with `asyncpg` driver |
| **Google Gemini 2.5 Flash** | LLM for all agent analysis and copilot chat |
| **WeasyPrint** | HTML-to-PDF generation for report export |
| **SendGrid** | Transactional email delivery with PDF attachments |
| **PyJWT** | JWT token decoding for user authentication |

### Infrastructure

| Technology | Purpose |
|-----------|---------|
| **InsForge** | BaaS — Auth, Database, Storage, Hosting, Compute |
| **Fly.io** | Backend container hosting (via InsForge Compute) |
| **PostgreSQL** | Primary database with RLS and async connections |
| **Docker** | Container packaging for backend deployment |

---

## 📂 Project Structure

```
rootlens-ai/
├── frontend/                          # React SPA
│   ├── App.jsx                        # Root component with routing
│   ├── main.jsx                       # Entry point
│   ├── index.css                      # Global styles
│   ├── data/
│   │   └── api.js                     # Centralized API client
│   ├── features/
│   │   ├── dashboard/
│   │   │   └── DashboardPage.jsx      # Incident overview + metrics
│   │   ├── scan/
│   │   │   └── NewScanPage.jsx        # Evidence upload + pipeline trigger
│   │   ├── investigation/
│   │   │   └── InvestigationPage.jsx  # Live pipeline status
│   │   ├── report/
│   │   │   ├── ReportPage.jsx         # Full RCA report view
│   │   │   └── EmailReportModal.jsx   # Email sending modal
│   │   ├── historical/
│   │   │   └── HistoricalPage.jsx     # Past incidents browser
│   │   └── chat/
│   │       └── CopilotChat.jsx        # AI chat sidebar
│   ├── layout/
│   │   └── Shell.jsx                  # App shell with nav sidebar
│   ├── components/                    # Shared UI components
│   └── utils/
│       └── insforge.js                # InsForge SDK initialization
│
├── backend/                           # FastAPI server
│   ├── Dockerfile                     # Python 3.12 container
│   ├── requirements.txt               # Python dependencies
│   ├── app/
│   │   ├── main.py                    # FastAPI app, CORS, routers
│   │   ├── core/
│   │   │   └── config.py              # Pydantic settings (env vars)
│   │   ├── api/
│   │   │   ├── incidents.py           # POST/GET /incidents
│   │   │   ├── reports.py             # GET /report, /export-pdf, /send-email
│   │   │   ├── copilot.py             # POST /copilot/chat (SSE)
│   │   │   └── upload.py              # POST /upload
│   │   ├── agents/
│   │   │   ├── orchestrator.py        # Pipeline controller
│   │   │   ├── log_agent.py           # Log analysis agent
│   │   │   ├── timeline_agent.py      # Timeline parsing agent
│   │   │   ├── git_agent.py           # Code diff analysis agent
│   │   │   ├── rca_agent.py           # Root cause synthesis agent
│   │   │   └── prompts.py             # All LLM prompt templates
│   │   ├── ai/
│   │   │   └── gemini_client.py       # Multi-key Gemini pool
│   │   ├── mcp/
│   │   │   ├── tools.py               # MCP tool definitions
│   │   │   ├── inforge_client.py      # PostgreSQL async client
│   │   │   ├── local_store.py         # In-memory incident cache
│   │   │   └── incident_search.py     # Similarity search logic
│   │   ├── services/
│   │   │   ├── copilot_service.py     # Chat logic + SSE streaming
│   │   │   ├── pdf_service.py         # PDF generation (WeasyPrint)
│   │   │   ├── email_service.py       # SendGrid email delivery
│   │   │   ├── upload_service.py      # File handling
│   │   │   └── conversation_store.py  # Chat history management
│   │   ├── database/
│   │   │   ├── connection.py          # SQLAlchemy async engine
│   │   │   └── models.py             # ORM models
│   │   └── schemas/
│   │       └── report.py              # Pydantic request/response schemas
│   └── .env.example                   # Environment variable template
│
├── index.html                         # SPA entry point
├── vite.config.js                     # Vite configuration
├── package.json                       # Node.js dependencies
├── insforge.toml                      # InsForge project config
├── docker-compose.yml                 # Local development setup
└── schema_update.sql                  # Database migration scripts
```

---

## 🗄 Database Schema

```mermaid
erDiagram
    AUTH_USERS ||--o{ INCIDENTS : "user_id"
    AUTH_USERS ||--o{ HISTORICAL_INCIDENTS : "user_id"
    AUTH_USERS ||--o{ INCIDENT_FILES : "user_id"
    INCIDENTS ||--o{ INCIDENT_FILES : "incident_id"

    AUTH_USERS {
        uuid id PK
        string email
        string name
        timestamptz created_at
    }

    INCIDENTS {
        text id PK
        text user_context
        text status
        int evidence_completeness
        int confidence_ceiling
        jsonb rca
        jsonb agent_outputs
        timestamptz created_at
        uuid user_id FK
    }

    HISTORICAL_INCIDENTS {
        uuid id PK
        text title
        text root_cause
        text resolution
        text summary
        timestamptz occurred_at
        uuid user_id FK
    }

    INCIDENT_FILES {
        uuid id PK
        uuid incident_id FK
        text file_name
        text file_path
        text file_type
        bigint file_size
        uuid user_id FK
        timestamptz uploaded_at
    }
```

### Row-Level Security (RLS)

All tables have RLS enabled with user-scoped policies:

```sql
-- Users can only see/modify their own data
CREATE POLICY "Users can see their own incidents"
  ON incidents FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own incidents"
  ON incidents FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);
```

> **Note:** The `(select auth.uid())` subquery wrapper ensures the function is evaluated once per query (not per row), significantly improving performance on large tables.

---

## 📡 API Reference

### Incidents

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/incidents` | Create incident and run full RCA pipeline |
| `GET` | `/api/incidents` | List all incidents |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/report/{id}` | Fetch completed RCA report |
| `GET` | `/api/report/{id}/export-pdf` | Download report as PDF |
| `POST` | `/api/report/{id}/send-email` | Email report to a recipient |
| `GET` | `/api/similar-incidents/{id}` | Find similar historical incidents |

### Copilot

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/copilot/chat` | Send message, receive SSE stream |
| `GET` | `/api/copilot/history/{id}` | Fetch conversation history |
| `GET` | `/api/copilot/suggestions/{id}` | Get context-aware suggested questions |
| `POST` | `/api/copilot/search` | Search historical incidents |
| `GET` | `/api/copilot/context/{id}` | Get investigation context summary |
| `DELETE` | `/api/copilot/history/{id}` | Clear conversation history |

### Uploads

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload` | Upload file attachment to an incident |
| `GET` | `/api/upload/{incident_id}/files` | List files for an incident |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Container health check |
| `GET` | `/api/test-llm` | Test Gemini API connectivity |
| `GET` | `/api/test-db` | Test database connectivity |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.12
- **PostgreSQL** ≥ 15 (or InsForge database)
- **Google Gemini API Key** ([Get one here](https://aistudio.google.com/apikey))

### 1. Clone the repository

```bash
git clone https://github.com/your-username/rootlens-ai.git
cd rootlens-ai
```

### 2. Set up the frontend

```bash
npm install
```

Create `.env.local`:

```env
VITE_INSFORGE_URL=https://your-project.region.insforge.app
VITE_INSFORGE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:8000/api
```

### 3. Set up the backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create `.env`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/rootlens
GEMINI_API_KEY=your-gemini-api-key
GEMINI_API_KEY_1=your-key-1
GEMINI_API_KEY_2=your-key-2
GEMINI_API_KEY_3=your-key-3
SECRET_KEY=your-random-secret-key
UPLOAD_DIR=./storage
SENDGRID_API_KEY=your-sendgrid-key
EMAIL_FROM=your-verified-sender@email.com
```

### 4. Run locally

```bash
# Terminal 1 — Frontend
npm run dev

# Terminal 2 — Backend
cd backend
uvicorn app.main:app --reload --port 8000
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🌐 Deployment

### Frontend — InsForge Hosting

```bash
npx @insforge/cli deployments deploy ./ --env '{
  "VITE_INSFORGE_URL": "https://your-project.region.insforge.app",
  "VITE_INSFORGE_ANON_KEY": "your-anon-key",
  "VITE_API_URL": "https://your-backend.fly.dev/api"
}'
```

### Backend — InsForge Compute (Fly.io)

```bash
npx @insforge/cli compute deploy ./backend --name rootlens-backend --port 8000
```

Set environment variables:

```bash
npx @insforge/cli compute update <service-id> \
  --env-set "DATABASE_URL=postgresql://..." \
  --env-set "GEMINI_API_KEY_1=..." \
  --env-set "SENDGRID_API_KEY=SG...."
```

---

## 🔐 Environment Variables

### Frontend

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_INSFORGE_URL` | ✅ | InsForge backend URL |
| `VITE_INSFORGE_ANON_KEY` | ✅ | InsForge anonymous key |
| `VITE_API_URL` | ✅ | FastAPI backend URL (e.g., `https://your-backend.fly.dev/api`) |

### Backend

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key (legacy/fallback) |
| `GEMINI_API_KEY_1` | ⬡ | Gemini key #1 for round-robin pool |
| `GEMINI_API_KEY_2` | ⬡ | Gemini key #2 for round-robin pool |
| `GEMINI_API_KEY_3` | ⬡ | Gemini key #3 for round-robin pool |
| `SECRET_KEY` | ✅ | Secret key for signing tokens |
| `UPLOAD_DIR` | ❌ | Upload directory (default: `./storage`) |
| `SENDGRID_API_KEY` | ❌ | SendGrid API key for email reports |
| `EMAIL_FROM` | ❌ | Verified sender email for SendGrid |
| `GEMINI_MODEL` | ❌ | Gemini model (default: `gemini-2.5-flash`) |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ using [InsForge](https://insforge.com) + [Google Gemini](https://ai.google.dev)**

[⬆ Back to Top](#-rootlens-ai)

</div>
]]>
