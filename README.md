# RootLens AI

**AI-Powered Incident Investigation and Root Cause Analysis Agent**

Use Case: PS-05 -- Production Support RCA Drafter
Submission for: Infinite AI Prototype Challenge

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Overview](#2-architecture-overview)
3. [Agent Design](#3-agent-design)
4. [MCP Integration](#4-mcp-integration)
5. [Tech Stack](#5-tech-stack)
6. [File Structure](#6-file-structure)
7. [Setup Instructions](#7-setup-instructions)
8. [Run Instructions](#8-run-instructions)
9. [Authentication (Planned)](#9-authentication-planned)
10. [API Reference](#10-api-reference)
11. [Sample Data](#11-sample-data)
12. [AI Usage](#12-ai-usage)
13. [Assumptions and Limitations](#13-assumptions-and-limitations)
14. [Team Information](#14-team-information)

---

## 1. Project Overview

Production incidents in modern distributed systems often require 2+ hours of manual investigation across logs, deployment timelines, and code changes before engineers can identify a root cause. RootLens AI automates this process using a multi-agent AI pipeline that runs specialized agents in sequence -- a Log Agent, Timeline Agent, Git Agent, and RCA Agent -- each powered by Google Gemini 2.5 Flash. The system ingests raw log files, incident timelines, and git diffs, then produces a structured Root Cause Analysis report containing the identified root cause with confidence score, a complete evidence chain linking findings to source data, an executive summary for management briefings, and an actionable prevention plan. Historical incidents are stored via an MCP-integrated PostgreSQL knowledge base, enabling pattern matching against past failures to improve accuracy over time.

---

## 2. Architecture Overview

```
                    +--------------------------------------+
                    |     Frontend (Vite + React)           |
                    |  Landing - Login - Dashboard -        |
                    |  Investigation - Report - Historical  |
                    +------------------+-------------------+
                                       |
                                  REST API
                                       |
                    +------------------v-------------------+
                    |         FastAPI Backend               |
                    |  Upload APIs - Incident APIs -        |
                    |  Report APIs - Copilot API            |
                    +------------------+-------------------+
                                       |
                    +------------------v-------------------+
                    |       Orchestrator Pipeline           |
                    |                                       |
                    |  Log Agent --> Timeline Agent -->      |
                    |  Git Agent --> Routing Check           |
                    |       |                               |
                    |       v                               |
                    |  MCP Historical Search (InForge)      |
                    |       |                               |
                    |       v                               |
                    |  Evidence Correlation & RCA Agent      |
                    |       |                               |
                    |       v                               |
                    |  Final RCA Report                     |
                    +------------------+-------------------+
                                       |
                    +------------------v-------------------+
                    |        External Services              |
                    |  Gemini 2.5 Flash  |  PostgreSQL      |
                    |  InForge MCP       |  SendGrid        |
                    +--------------------------------------+
```

**Flow:** The user uploads incident files (logs, timeline, git diff) through the React frontend. The FastAPI backend receives the data and creates an incident record. The Orchestrator coordinates the three specialist agents sequentially -- each agent sends its input to Gemini 2.5 Flash and returns structured JSON findings. After the specialist agents complete, the MCP layer searches the PostgreSQL-backed historical incidents table for similar past incidents using keyword matching. The Orchestrator then runs an evidence-completeness routing check via Gemini to determine if the collected evidence is sufficient. If sufficient, the RCA Agent synthesizes all agent findings plus historical matches into a complete Root Cause Analysis document. The final report is stored in PostgreSQL and returned to the frontend for display, PDF export, or email delivery.

---

## 3. Agent Design

| Agent | File | Input | Responsibilities | Output |
|---|---|---|---|---|
| Orchestrator | `backend/app/agents/orchestrator.py` | incident_id, raw logs/timeline/diff, user_context | Coordinates all agents sequentially, runs evidence-completeness routing check via Gemini, aggregates findings, enriches context with MCP historical matches, passes combined context to RCA agent | Full RCA result envelope with status, evidence_completeness, confidence_ceiling, agent_outputs, and rca |
| Log Agent | `backend/app/agents/log_agent.py` | Raw log file text content | Parse errors/warnings/anomalies, extract failure signatures with severity levels (CRITICAL/ERROR/WARNING/INFO), identify recurring patterns, group related log lines, detect anomaly windows, record source line numbers | log_summary, events array, anomaly_windows, analyst_notes |
| Timeline Agent | `backend/app/agents/timeline_agent.py` | Timeline text content, optional incident_date | Parse freeform timeline into structured chronological events, identify incident phases (TRIGGER/DETECTION/MITIGATION/RESOLUTION), compute duration metrics between phases, detect temporal gaps | structured timeline, metrics (detection-to-mitigation, total duration), timeline_gaps |
| Git Agent | `backend/app/agents/git_agent.py` | Git diff text, incident_context string | Analyze diff for risky config changes, env variable mutations, removed safety checks, flag high-risk modifications, compute deployment risk score (0-100) | diff_summary with risk_score, changes array, most_likely_cause, analyst_notes |
| RCA Agent | `backend/app/agents/rca_agent.py` | All agent outputs combined, MCP similar incidents via enriched user_context | Synthesize all findings, rank root causes by confidence, build evidence chain linking findings to source data, write executive summary and prevention plan, identify contributing factors and alternative causes | root_cause (title, confidence, description, evidence, causal_chain), executive_summary, prevention_plan, contributing_factors, alternative_causes, action_items, open_questions |

### Gemini Key Rotation

The system uses `GeminiClientPool` (`backend/app/ai/gemini_client.py`) to manage API rate limits:

- Accepts up to 4 API keys: `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3`, plus the legacy `GEMINI_API_KEY` field
- Rotates keys in round-robin order across all agent calls using a global index counter
- On 429 rate limit or quota error, automatically skips to the next key in the pool
- Raises an error only if all keys in the pool are exhausted
- Uses `run_in_executor` to run the synchronous `google-generativeai` SDK in the async FastAPI event loop
- Provides three methods: `generate()` for plain text, `generate_json()` for structured JSON output with `response_mime_type="application/json"`, and `generate_stream()` for streaming chat responses
- This effectively multiplies the free tier RPM limit by the number of keys configured (e.g., 3 keys = 15 RPM instead of 5 RPM)

---

## 4. MCP Integration

### Provider

InForge -- PostgreSQL-backed historical incident store using direct SQLAlchemy async queries against the local database.

### Files

- `backend/app/mcp/inforge_client.py` -- SQLAlchemy async client for CRUD on `historical_incidents` table
- `backend/app/mcp/incident_search.py` -- Similarity scoring layer on top of inforge_client
- `backend/app/mcp/tools.py` -- High-level tool functions called by the orchestrator
- `backend/app/mcp/local_store.py` -- In-memory fallback store for fast lookups

### Capabilities

Three MCP tool functions exposed to the orchestrator:

- **search_historical_incidents**: Searches PostgreSQL for similar past incidents using keyword matching with ilike queries. Falls back to the in-memory local store if PostgreSQL is unavailable.
- **save_incident_to_mcp**: Persists a completed incident to both the PostgreSQL `historical_incidents` table and the in-memory store. Extracts root_cause title, description, and executive_summary from the RCA output.
- **get_incident_from_mcp**: Retrieves a full incident record (including RCA and agent_outputs) from the in-memory local store.

### How Similarity Works

The similarity scoring in `incident_search.py` operates as follows:

1. Extracts meaningful keywords (words longer than 3 characters) from the search query
2. Queries PostgreSQL using `ilike` pattern matching across title, root_cause, and summary columns
3. For each result, counts how many query keywords appear in the root_cause text
4. Computes similarity score as: `(matched_words / total_query_words) * 100`
5. Returns the top results sorted by similarity_score in descending order

### Why MCP

MCP gives the system historical intelligence that improves over time. Every completed investigation is automatically saved to the knowledge base. When a new incident arrives, the orchestrator queries MCP for similar past incidents before running the RCA Agent, enriching the context with prior root causes and resolutions. The more incidents the system processes, the stronger its pattern matching becomes, allowing it to reference previous failures and suggest proven remediation strategies.

---

## 5. Tech Stack

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Frontend | React + Vite | React 19.x, Vite 8.x | Single Page Application with Material 3 design |
| Routing | React Router DOM | 7.x | Client-side routing |
| Backend | FastAPI | 0.115+ | Async Python web framework |
| Database | PostgreSQL | 14+ | Via asyncpg driver |
| ORM | SQLAlchemy async | 2.x | Async sessions with asyncpg |
| AI Model | Gemini 2.5 Flash | Latest | Google free tier with key rotation |
| AI SDK | google-generativeai | 0.8+ | Python SDK for Gemini |
| MCP Provider | InForge | - | PostgreSQL-backed via SQLAlchemy |
| PDF Export | ReportLab | Latest | In-memory PDF generation |
| Email | SendGrid | Latest | Free tier email delivery |
| Settings | Pydantic Settings | 2.x | Environment-based configuration |
| Containerization | Docker Compose | - | Optional local deployment |

---

## 6. File Structure

```
rootlens-ai/
|-- frontend/
|   |-- App.jsx                          # Root component with routing (public + authenticated)
|   |-- main.jsx                         # React entry point
|   |-- index.css                        # Global styles
|   |-- pages/
|   |   |-- LandingPage.jsx              # Public landing page
|   |   |-- LoginPage.jsx                # Login page with auth integration
|   |   |-- login_illustration.png       # Login page illustration asset
|   |-- features/
|   |   |-- dashboard/
|   |   |   |-- DashboardPage.jsx        # Main dashboard with recent incidents
|   |   |-- scan/
|   |   |   |-- NewScanPage.jsx          # Upload incident files and trigger analysis
|   |   |-- investigation/
|   |   |   |-- InvestigationPage.jsx    # Live agent progress and findings
|   |   |-- report/
|   |   |   |-- ReportPage.jsx           # Full RCA report view with PDF/email export
|   |   |-- historical/
|   |   |   |-- HistoricalPage.jsx       # Browse similar past incidents
|   |   |-- chat/
|   |   |   |-- CopilotPage.jsx          # AI Copilot conversational interface
|   |-- components/
|   |   |-- shared/
|   |   |   |-- ToastContext.jsx         # Toast notification provider
|   |-- services/                        # API client utilities
|   |-- hooks/                           # Custom React hooks
|   |-- utils/                           # Shared utility functions
|
|-- backend/
|   |-- app/
|   |   |-- main.py                      # FastAPI app factory, CORS, router registration
|   |   |-- __init__.py
|   |   |-- core/
|   |   |   |-- config.py               # Pydantic Settings (env vars, API keys)
|   |   |-- agents/
|   |   |   |-- __init__.py
|   |   |   |-- orchestrator.py          # Pipeline controller — runs all agents sequentially
|   |   |   |-- log_agent.py             # Parses raw logs via Gemini
|   |   |   |-- timeline_agent.py        # Structures incident timeline via Gemini
|   |   |   |-- git_agent.py             # Analyzes git diffs for risky changes via Gemini
|   |   |   |-- rca_agent.py             # Synthesizes findings into RCA report via Gemini
|   |   |   |-- prompts.py              # All agent system/user prompt templates
|   |   |   |-- copilot_prompts.py       # AI Copilot system prompt and context
|   |   |-- ai/
|   |   |   |-- gemini_client.py         # GeminiClientPool — multi-key round-robin with 429 fallback
|   |   |-- api/
|   |   |   |-- __init__.py
|   |   |   |-- incidents.py             # POST/GET /incidents — create and list incidents
|   |   |   |-- upload.py               # POST /upload/logs, /upload/timeline, /upload/diff
|   |   |   |-- reports.py              # GET /report/{id}, export-pdf, send-email, similar-incidents
|   |   |   |-- copilot.py              # POST /copilot — streaming AI chat endpoint
|   |   |-- mcp/
|   |   |   |-- __init__.py
|   |   |   |-- inforge_client.py        # SQLAlchemy async client for historical_incidents
|   |   |   |-- incident_search.py       # Similarity scoring and keyword search
|   |   |   |-- tools.py                # MCP tool functions (search, save, get)
|   |   |   |-- local_store.py          # In-memory incident store (fallback)
|   |   |-- database/
|   |   |   |-- __init__.py
|   |   |   |-- connection.py            # Async engine + session factory
|   |   |   |-- models.py              # ORM models (User, Incident, Upload, Report, HistoricalIncident)
|   |   |-- schemas/
|   |   |   |-- __init__.py
|   |   |   |-- incident.py             # Pydantic request/response schemas for incidents
|   |   |   |-- report.py              # EmailReportRequest schema
|   |   |   |-- upload.py              # Upload response schema
|   |   |-- services/
|   |   |   |-- pdf_service.py           # ReportLab PDF generation (in-memory)
|   |   |   |-- email_service.py         # SendGrid email delivery
|   |   |   |-- upload_service.py        # File storage service
|   |   |   |-- copilot_service.py       # AI Copilot conversation management
|   |   |   |-- conversation_store.py    # In-memory conversation history
|   |   |-- auth/                        # Authentication module (planned)
|   |-- requirements.txt                 # Python dependencies
|   |-- Dockerfile                       # Backend container definition
|   |-- schema.sql                       # Database schema reference
|   |-- .env.example                     # Environment variable template
|
|-- public/
|   |-- logo.png                         # Application logo (transparent)
|   |-- logo.jpg                         # Application logo (original)
|
|-- docker-compose.yml                   # PostgreSQL + backend container config
|-- package.json                         # Frontend dependencies
|-- vite.config.js                       # Vite build configuration
|-- index.html                           # HTML entry point
|-- .gitignore                           # Git ignore rules
```

---

## 7. Setup Instructions

### Prerequisites

- Node.js 18 or higher
- Python 3.10 or higher
- PostgreSQL 14 or higher (local installation via pgAdmin 4 or command line)
- Git

### Environment Configuration

**Step 1** -- Clone the repository:

```bash
git clone https://github.com/MukeshKumar-17/RCA.git
cd RCA/Project
```

**Step 2** -- Copy the environment file:

```bash
cp backend/.env.example .env
```

**Step 3** -- Fill in `.env` with the following values:

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL async connection string | `postgresql+asyncpg://rootlens:rootlens_secret@localhost:5432/rootlens` |
| `GEMINI_API_KEY` | Primary Gemini API key | `AIza...` |
| `GEMINI_API_KEY_1` | First key for round-robin pool | `AIza...` |
| `GEMINI_API_KEY_2` | Second key for round-robin pool | `AIza...` |
| `GEMINI_API_KEY_3` | Third key for round-robin pool | `AIza...` |
| `GEMINI_MODEL` | Gemini model identifier | `gemini-2.5-flash` |
| `SECRET_KEY` | Random secret for signing tokens | Generate: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `SENDGRID_API_KEY` | SendGrid API key for email reports | `SG....` |
| `EMAIL_FROM` | Verified sender email for SendGrid | `you@gmail.com` |
| `UPLOAD_DIR` | Local file storage path | `./storage` |

**Step 4** -- Create PostgreSQL database:

Option A (pgAdmin 4):
1. Open pgAdmin 4 and connect to localhost:5432
2. Create a new database named `rootlens`
3. Tables are auto-created on first backend startup via SQLAlchemy

Option B (Docker Compose):
```bash
docker-compose up -d db
```
This starts a PostgreSQL container with user `rootlens`, password `rootlens_secret`, and database `rootlens` pre-configured.

**Step 5** -- Install backend dependencies:

```bash
cd backend
pip install -r requirements.txt
```

**Step 6** -- Install frontend dependencies:

```bash
cd ..
npm install
```

---

## 8. Run Instructions

### Start Backend

```bash
cd backend
uvicorn app.main:app --reload
```

- Backend runs at: `http://localhost:8000`
- Interactive API docs at: `http://localhost:8000/docs`

### Start Frontend

In a separate terminal:

```bash
npm run dev
```

- Frontend runs at: `http://localhost:5173`

### Verify Running

1. Open `http://localhost:5173` in a browser
2. The RootLens AI landing page should appear
3. Click "Start Scan" or "Log In" to navigate to the login page
4. Submit the login form to access the dashboard
5. Navigate to "New Scan" to upload incident files and trigger analysis

### Run with Docker (Optional)

```bash
docker-compose up --build
```

This starts both the PostgreSQL database and the backend service. The frontend must still be started separately with `npm run dev`.

---

## 9. Authentication (Planned)

### Design

The authentication system is designed and the database schema is implemented. The planned implementation uses:

- JWT tokens via python-jose
- bcrypt password hashing via passlib
- OAuth2PasswordBearer scheme for FastAPI dependency injection

### Backend Endpoints (Planned)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register a new user account |
| POST | `/api/auth/login` | Authenticate and receive a JWT token |
| GET | `/api/auth/me` | Get current authenticated user profile |
| POST | `/api/auth/logout` | Logout (client-side token deletion) |

### Token Usage

After login, the JWT token is stored in localStorage:

```
key: token
value: <access_token from login response>
```

All subsequent API requests include the token:

```
Authorization: Bearer <token>
```

### Database Schema for Users

| Column | Type | Constraints |
|---|---|---|
| id | UUID | Primary key, auto-generated |
| email | String(320) | Unique, not null, indexed |
| name | String(255) | Not null |
| created_at | DateTime (UTC) | Not null, auto-set |

### Pending Work

- Backend auth route handlers need to be implemented in `backend/app/auth/`
- Frontend login page needs to be connected to auth endpoints (currently falls through to dashboard)
- Protected route wrapper for dashboard and other authenticated pages
- Password hashing column (`hashed_password`) needs to be added to the User model
- Token refresh mechanism

---

## 10. API Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/upload/logs` | Upload raw log text or .log/.txt file | No |
| POST | `/api/upload/timeline` | Upload incident timeline text | No |
| POST | `/api/upload/diff` | Upload git diff text or .diff/.patch file | No |
| POST | `/api/incidents` | Create incident and run full RCA pipeline | No |
| GET | `/api/incidents` | List all incidents (newest first) | No |
| GET | `/api/incidents/{id}` | Get a single incident by ID | No |
| GET | `/api/report/{id}` | Get full RCA report for an incident | No |
| GET | `/api/report/{id}/export-pdf` | Download RCA report as PDF | No |
| POST | `/api/report/{id}/send-email` | Email RCA report as PDF attachment | No |
| GET | `/api/similar-incidents/{id}` | Find similar historical incidents | No |
| POST | `/api/copilot` | AI Copilot streaming chat (SSE) | No |
| GET | `/health` | Health check for load balancers | No |

---

## 11. Sample Data

### Location

```
sample-data/
```

### Incidents Included

| Folder | Scenario | Files Included |
|---|---|---|
| incident-001 | Payment API Outage | logs.txt, timeline.txt, gitdiff.diff, expected_rca.md |
| incident-002 | Database Pool Exhaustion | logs.txt, timeline.txt, gitdiff.diff, expected_rca.md |
| incident-003 | Cache Layer Failure | logs.txt, timeline.txt, gitdiff.diff, expected_rca.md |

### Demo Scenario

Incident-002 (Database Pool Exhaustion) serves as the primary demo scenario:

- The git diff shows `DB_POOL_SIZE` was reduced from 50 to 5 in a configuration change
- The logs show repeated connection pool exhaustion errors and request timeouts starting shortly after deployment
- The timeline shows errors beginning approximately 5 minutes after the deployment event
- Expected confidence score: 94%
- Expected root cause: `DB_POOL_SIZE` configuration change causing connection starvation under normal load

This scenario demonstrates the full pipeline: the Log Agent identifies the pool exhaustion errors, the Timeline Agent correlates the error onset with the deployment window, the Git Agent flags the `DB_POOL_SIZE` reduction as a high-risk change, and the RCA Agent synthesizes these findings into a definitive root cause with strong evidence linkage.

---

## 12. AI Usage

### What AI Helped With

- Full backend scaffolding: FastAPI application structure, SQLAlchemy async ORM models, Pydantic settings and schemas
- All five agent implementations: Log Agent, Timeline Agent, Git Agent, RCA Agent, and Orchestrator
- Agent prompt engineering: structured system prompts with strict JSON output contracts and severity frameworks
- MCP integration rewrite from Supabase REST to direct SQLAlchemy async queries against local PostgreSQL
- Gemini key rotation pool design with round-robin and automatic 429 fallback
- PDF generation service with ReportLab (in-memory, no disk writes)
- Email delivery service with SendGrid
- AI Copilot streaming chat interface with conversation history management
- Frontend component structure, Material 3 design system, and responsive UI
- Landing page and login page design and integration
- Debugging rate limit errors, routing issues, and database connection handling

### What AI Got Wrong

- Initially wired agents to OpenRouter free model fallbacks instead of calling Gemini directly, causing routing failures
- MCP layer was originally generating Supabase REST API calls to endpoints that did not exist in the InForge setup
- PDF export route was missing the `/api` prefix, causing 404 errors from the frontend
- Agents were initially called in parallel, causing immediate rate limit exhaustion on the Gemini free tier
- InvestigationView routing was broken -- incident ID was not being passed correctly through React Router params

### How Errors Were Fixed

- Removed all OpenRouter logic and rewired all agents to use GeminiClientPool directly
- Replaced Supabase client with SQLAlchemy async queries against the local PostgreSQL `historical_incidents` table
- Fixed route prefix mismatch between `main.py` router registration and frontend API calls
- Changed agent execution from parallel to sequential in the orchestrator with per-agent error isolation
- Implemented the 4-key rotation pool to multiply the effective RPM limit

### Key Prompts Used

1. **Multi-agent orchestration** -- Sequential execution pipeline with per-agent error isolation, evidence-completeness routing check, and graceful degradation when individual agents fail
2. **Gemini key rotation pool** -- Round-robin key selection with automatic 429 fallback using `run_in_executor` for async compatibility with the synchronous google-generativeai SDK
3. **MCP rewrite** -- Migration from Supabase REST to SQLAlchemy async with ilike-based similarity search and keyword scoring against the `historical_incidents` table
4. **PDF generation** -- ReportLab-based PDF export returning bytes in-memory without saving to disk, served via FastAPI `Response` with proper content-disposition headers
5. **Agent prompt design** -- Structured system prompts with explicit output schemas, severity classification frameworks, and evidence ID conventions (LOG-001, TL-001, GIT-001)

### AI Tools Used

- **Claude (Anthropic)** -- Primary coding assistant for all backend and frontend development, debugging, and architecture decisions
- **Gemini 2.5 Flash (Google)** -- Runtime AI model powering all five investigation agents and the AI Copilot chat interface

---

## 13. Assumptions and Limitations

### Assumptions

- The user provides at least one of the three input files (logs, timeline, or git diff) per investigation
- Log files are in plain text format with recognizable timestamp patterns
- Timeline is provided as human-readable chronological text describing incident events
- Git diff is in standard unified diff format (as produced by `git diff`)
- PostgreSQL is running and accessible at the configured `DATABASE_URL` during operation
- Gemini free tier is sufficient for demo and prototype workloads (5 RPM per key)

### Limitations

- **Rate limits**: Free tier Gemini allows 5 requests per minute per key. The 4-key rotation pool raises this to approximately 20 RPM, but very high concurrent usage may still trigger 429 errors. The system waits and retries automatically.
- **Similarity search**: Uses keyword matching with ilike queries, not semantic vector search. Accuracy improves as more historical incidents are added to the database, but it will not catch semantically similar incidents with different wording.
- **Authentication**: The frontend login page currently falls through to the dashboard without server-side validation. All API endpoints are unprotected. Auth backend implementation is planned.
- **PDF styling**: PDF export uses ReportLab basic text formatting. There is no custom branding, charts, or rich layout beyond structured text sections.
- **Email delivery**: The SendGrid sender email address must be verified in the SendGrid dashboard before email delivery functions correctly.
- **File storage**: Uploaded files are stored on local disk in the `./storage` directory. This is not suitable for multi-instance deployment without a shared filesystem or object storage backend.
- **In-memory store**: Full incident records (including RCA output and agent_outputs) are stored in an in-memory Python dict. These records are lost on backend restart. The historical_incidents table in PostgreSQL persists only the title, root_cause, resolution, and summary fields.

---

## 14. Team Information

**Team Name:** [Insert team name]

| Name | Role | College | Contact |
|---|---|---|---|
| [Member 1] | Backend + AI Agents | KIT | [email] |
| [Member 2] | Frontend | KIT | [email] |
| [Member 3] | MCP + Database | KIT | [email] |
| [Member 4] | Documentation + Testing | KIT | [email] |
