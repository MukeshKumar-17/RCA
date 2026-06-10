# RCA - AI Powered Root Cause Analysis Platform

# RootLens AI

**AI-Powered Incident Investigation and Root Cause Analysis Agent**

Use Case: PS-05 — Production Support RCA Drafter  
Submission for: Infinite AI Prototype Challenge  
Team: VOID SMASH

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

After every production incident, engineers spend 2 or more hours manually reading logs, reviewing deployment history, tracing git commits, constructing timelines, and writing the RCA document from scratch. RootLens AI eliminates this by acting as an autonomous Incident Investigation Agent that correlates logs, timelines, and git diffs to produce a complete, evidence-backed Root Cause Analysis report in under 5 minutes.

The system uses a multi-agent architecture where specialized AI agents each analyze one dimension of the incident, then an RCA Agent synthesizes all findings into a structured report with a confidence score, evidence chain, executive summary, and prevention recommendations. Historical incident intelligence is provided through MCP integration with Inforge, enabling the system to surface similar past incidents and proven resolutions.

---

## 2. Architecture Overview

```
User
  |
  v
Frontend (Vite + React)
  Dashboard --> Investigation View --> Report View
  |
  | REST API
  v
FastAPI Backend
  |-- POST /api/upload/logs
  |-- POST /api/upload/timeline
  |-- POST /api/upload/gitdiff
  |-- POST /api/incident/analyze
  |-- GET  /api/report/{id}
  |-- GET  /api/report/{id}/export-pdf
  |-- POST /api/report/{id}/send-email
  |
  v
Agent Orchestrator (orchestrator.py)
  |
  |-- Log Agent -----------> Gemini 2.5 Flash
  |-- Timeline Agent ------> Gemini 2.5 Flash
  |-- Git Agent -----------> Gemini 2.5 Flash
  |
  v
MCP Historical Search (Inforge / PostgreSQL)
  |
  | Historical Matches + Context
  v
RCA Agent ---------------> Gemini 2.5 Flash
  |
  v
Final RCA Report
  |-- Root Cause
  |-- Confidence Score (0-100%)
  |-- Evidence Chain
  |-- Executive Summary
  |-- Prevention Recommendations
  |-- Similar Historical Incidents
  |
  v
PostgreSQL Database (stored)
  |
  |-- PDF Export (ReportLab)
  |-- Email Delivery (SendGrid)
```

### Architecture Diagram

```
+---------------------------+
|   Frontend (Vite + React) |
|  Dashboard -> Investigation|
|         -> Report View    |
+------------+--------------+
             |
          REST API
             |
+------------v--------------+
|     FastAPI Backend        |
|  Upload APIs + Incident    |
|          APIs              |
+------------+--------------+
             |
+------------v-------------------------------+
|         Orchestrator Pipeline              |
|                                            |
|  +----------+  +--------------+  +-------+|
|  | Log Agent|  |Timeline Agent|  |Git    ||
|  +----+-----+  +------+-------+  |Agent  ||
|       |               |          +---+---+|
|  LLM Calls       LLM Calls      LLM Calls |
|       |               |              |    |
|       +-------+--------+-------------+    |
|               |   Context and Findings    |
|               v                           |
|  +------------+-------------+             |
|  |  MCP Historical Search   |             |
|  |  (Inforge PostgreSQL)    |             |
|  +------------+-------------+             |
|               |  Historical Matches       |
|               v                           |
|  +------------+-------------+             |
|  | Evidence Correlation     |             |
|  | and RCA Agent            |<-- LLM Calls|
|  +------------+-------------+             |
|               |  Synthesized Analysis     |
|               v                           |
|  +------------+-------------+             |
|  |     Final RCA Report     |             |
|  +--------------------------+             |
+--------------------------------------------+
             |                    |
             | Read/Write         | Query
             v                    v
+------------------+  +---------------------+
|   PostgreSQL DB  |  |  External Services  |
|                  |  |                     |
|  incidents       |  |  Gemini AI          |
|  reports         |  |  Inforge MCP Server |
|  uploads         |  |  SendGrid Email     |
|  users           |  +---------------------+
+------------------+
```

### Flow Description

The user uploads three files — a log file, an incident timeline, and a git diff — via the React frontend. The FastAPI backend stores the files, creates an incident record in PostgreSQL, and triggers the Agent Orchestrator as a background task. The Orchestrator runs the Log Agent, Timeline Agent, and Git Agent sequentially, each calling Gemini 2.5 Flash with a structured prompt and returning JSON findings. The MCP tool then queries Inforge for historically similar incidents. The RCA Agent receives all agent outputs plus MCP results and synthesizes them into a final report, which is stored in PostgreSQL and returned to the frontend. The user can then export the report as a PDF or send it to a developer via email.

---

## 3. Agent Design

| Agent | File | Input | Responsibilities | Output Fields |
|---|---|---|---|---|
| Orchestrator | agents/orchestrator.py | incident_id, file paths | Coordinates all agents sequentially, aggregates findings, passes context to RCA Agent | Final RCA report dict |
| Log Agent | agents/log_agent.py | Log file text | Parse errors, extract failure signatures, identify recurring patterns, timestamp key events | error_summary, key_events, error_frequency |
| Timeline Agent | agents/timeline_agent.py | Timeline text | Parse freeform timeline, order events chronologically, detect temporal correlations | structured_timeline, correlations |
| Git Agent | agents/git_agent.py | Git diff text | Analyze diff for risky config changes, env variable mutations, flag suspicious modifications | risky_changes, impact_summary, risk_level |
| RCA Agent | agents/rca_agent.py | All agent outputs + MCP matches | Synthesize findings, rank root causes by confidence, build evidence chain, write summary and prevention plan | root_cause, confidence_score, evidence_chain, executive_summary, prevention_plan, alternative_causes |

All agents prompt Gemini with the instruction: "Respond only with valid JSON. No markdown, no explanation, no code fences." Each agent handles JSON parse failures gracefully by logging the error and returning empty defaults so the pipeline continues.

### Gemini Key Rotation

The system uses `GeminiClientPool` in `backend/app/ai/gemini_client.py` which accepts up to 4 Gemini API keys configured as `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3`, and the legacy `GEMINI_API_KEY`. Keys are rotated in round-robin order across all agent calls globally — not reset per request — meaning four consecutive agent calls each use a different key. On a 429 rate limit error, the pool automatically tries the next key immediately. An error is raised only if all keys are exhausted. This effectively multiplies the free tier RPM limit of 5 requests per minute by the number of keys configured, providing up to 20 RPM with 4 keys. The synchronous Google SDK call is wrapped in `run_in_executor` to avoid blocking the async event loop.

---

## 4. MCP Integration

### Provider

Inforge — PostgreSQL-backed historical incident store.

### Files

```
backend/app/mcp/inforge_client.py   — MCP client with save, get, search methods
backend/app/mcp/incident_search.py  — Similarity search logic
backend/app/mcp/tools.py            — Tool wrapper functions called by orchestrator
```

### Capabilities

| Tool Function | Description |
|---|---|
| mcp_save_incident | Persists a new incident to the HistoricalIncident table after RCA completion |
| mcp_get_incident | Retrieves a historical incident by UUID |
| mcp_search_similar | Keyword similarity search across historical incidents using SQLAlchemy ilike |

### How Similarity Scoring Works

The search builds a query string from the current incident title and root cause keywords. It queries the HistoricalIncident table using case-insensitive ilike matching on the title, root_cause, and summary columns. For each result it counts how many query words appear in the record's root_cause field and expresses this as a percentage: `matched_words / total_query_words * 100`. Results are returned sorted by similarity_score descending, with a maximum of 5 matches.

### Why MCP

MCP provides the system with historical intelligence. Every incident analyzed is saved to the historical store. The more incidents processed, the better the pattern matching becomes over time. When a new incident arrives, the orchestrator searches history before the RCA Agent runs, passing similar resolutions as context into the final synthesis prompt. This enables the system to recognize repeated root causes and surface proven fixes.

---

## 5. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React 18 + Vite | Single page application |
| Backend | FastAPI | Fully async |
| Database | PostgreSQL 14+ | Local via pgAdmin 4 |
| ORM | SQLAlchemy 2.x async | asyncpg driver |
| AI Model | Gemini 2.5 Flash | Google free tier |
| AI SDK | google-generativeai | Python SDK |
| MCP Provider | Inforge | PostgreSQL-backed |
| PDF Export | ReportLab 4.x | Returns bytes, no disk write |
| Email | SendGrid | Free tier, 100 emails per day |
| Auth Tokens | python-jose JWT | Planned integration |
| Password Hashing | passlib bcrypt | Planned integration |
| Source Control | GitHub | Public repository |

All tools and services used are free or open-source in compliance with the challenge tooling restriction.

---

## 6. File Structure

```
rootlens-ai/
|-- frontend/
|   |-- src/
|   |   |-- pages/
|   |   |   |-- LandingPage.jsx          # Landing page with CTA
|   |   |   |-- LoginPage.jsx            # Login form
|   |   |   |-- Dashboard.jsx            # Upload incident files
|   |   |   |-- InvestigationView.jsx    # Live agent progress steps
|   |   |   |-- ReportView.jsx           # Full RCA report display
|   |   |   |-- HistoricalView.jsx       # Similar past incidents
|   |   |-- components/
|   |   |   |-- UploadPanel.jsx          # Drag and drop file upload
|   |   |   |-- EvidenceCard.jsx         # Single evidence item display
|   |   |   |-- RCAReport.jsx            # Full report layout container
|   |   |   |-- ConfidenceScore.jsx      # Score display with visual ring
|   |   |   |-- TimelineView.jsx         # Chronological event list
|   |   |   |-- SimilarIncidents.jsx     # MCP match results list
|   |   |   |-- ExecutiveSummary.jsx     # Collapsible plain-language summary
|   |   |   |-- EmailReportModal.jsx     # Email send modal popup
|   |   |-- App.jsx                      # Routes and app entry
|   |-- index.html
|   |-- vite.config.js
|   |-- package.json
|
|-- backend/
|   |-- app/
|   |   |-- agents/
|   |   |   |-- orchestrator.py          # Coordinates all agents
|   |   |   |-- log_agent.py             # Log parsing and analysis
|   |   |   |-- timeline_agent.py        # Timeline structuring
|   |   |   |-- git_agent.py             # Git diff analysis
|   |   |   |-- rca_agent.py             # Root cause synthesis
|   |   |-- ai/
|   |   |   |-- gemini_client.py         # GeminiClientPool with key rotation
|   |   |-- api/
|   |   |   |-- upload.py                # File upload endpoints
|   |   |   |-- incidents.py             # Incident create and analyze endpoints
|   |   |   |-- reports.py               # Report fetch, PDF export, email send
|   |   |   |-- auth.py                  # Auth endpoints (signup, login, me)
|   |   |-- auth/
|   |   |   |-- security.py              # hash_password, verify_password, JWT
|   |   |   |-- dependencies.py         # get_current_user dependency
|   |   |-- core/
|   |   |   |-- config.py                # Pydantic settings from .env
|   |   |-- database/
|   |   |   |-- connection.py            # AsyncEngine, SessionLocal, get_db
|   |   |   |-- models.py                # SQLAlchemy ORM models
|   |   |-- mcp/
|   |   |   |-- inforge_client.py        # Inforge MCP client
|   |   |   |-- incident_search.py       # Similarity search logic
|   |   |   |-- tools.py                 # MCP tool wrapper functions
|   |   |-- schemas/
|   |   |   |-- incident.py              # IncidentCreate, IncidentResponse
|   |   |   |-- upload.py                # UploadResponse
|   |   |   |-- report.py                # ReportResponse, EmailReportRequest
|   |   |   |-- auth.py                  # SignupRequest, LoginRequest, TokenResponse
|   |   |-- services/
|   |   |   |-- upload_service.py        # File save and upload record creation
|   |   |   |-- pdf_service.py           # generate_pdf returning bytes
|   |   |   |-- email_service.py         # SendGrid email with PDF attachment
|   |   |-- main.py                      # FastAPI app init, CORS, routers, startup
|   |-- requirements.txt
|   |-- .env.example
|
|-- sample-data/
|   |-- incident-001/                    # Payment API Outage
|   |   |-- logs.txt
|   |   |-- timeline.txt
|   |   |-- gitdiff.diff
|   |   |-- expected_rca.md
|   |-- incident-002/                    # Database Pool Exhaustion (primary demo)
|   |   |-- logs.txt
|   |   |-- timeline.txt
|   |   |-- gitdiff.diff
|   |   |-- expected_rca.md
|   |-- incident-003/                    # Cache Layer Failure
|   |   |-- logs.txt
|   |   |-- timeline.txt
|   |   |-- gitdiff.diff
|   |   |-- expected_rca.md
|
|-- tests/
|   |-- test_agents.py                   # Agent unit tests
|   |-- test_api.py                      # API endpoint tests
|
|-- docs/
|   |-- AI_PROMPTS.md                    # Key prompts used during development
|
|-- storage/                             # Uploaded incident files (gitignored)
|-- docker-compose.yml
|-- .gitignore
|-- README.md
```

---

## 7. Setup Instructions

### Prerequisites

- Node.js 18 or higher
- Python 3.10 or higher
- PostgreSQL 14 or higher running locally via pgAdmin 4
- Git

### Step 1 — Clone the Repository

```bash
git clone https://github.com/MukeshKumar-17/RCA.git
cd RCA
```

### Step 2 — Create the Database

```
1. Open pgAdmin 4
2. Connect to localhost:5432
3. Right-click Databases and create a new database named: rootlens
4. Tables are created automatically on first backend startup
```

### Step 3 — Configure Environment Variables

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and fill in the following values:

| Variable | Description | Example |
|---|---|---|
| DATABASE_URL | PostgreSQL async connection string | postgresql+asyncpg://postgres:yourpassword@localhost:5432/rootlens |
| GEMINI_API_KEY_1 | First Gemini API key | AIzaSy... |
| GEMINI_API_KEY_2 | Second Gemini API key | AIzaSy... |
| GEMINI_API_KEY_3 | Third Gemini API key | AIzaSy... |
| GEMINI_API_KEY | Fourth or legacy Gemini API key | AIzaSy... |
| GEMINI_MODEL | Gemini model name | gemini-2.5-flash |
| SENDGRID_API_KEY | SendGrid API key for email | SG.xxxx... |
| EMAIL_FROM | Verified SendGrid sender email | you@gmail.com |
| JWT_SECRET_KEY | Random 32-character secret | see generation command below |
| UPLOAD_DIR | Local file storage path | ./storage |

To generate a secure JWT secret key:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Gemini API keys are available free at: https://aistudio.google.com/app/apikey  
At least one key is required. Up to 4 keys are supported for rate limit rotation.

### Step 4 — Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Step 5 — Install Frontend Dependencies

```bash
cd frontend
npm install
```

---

## 8. Run Instructions

### Start the Backend

```bash
cd backend
uvicorn main:app --reload --port 8000
```

Backend runs at: http://localhost:8000  
Interactive API docs at: http://localhost:8000/docs

On first startup, SQLAlchemy will automatically create all database tables in the `rootlens` PostgreSQL database.

### Start the Frontend

```bash
cd frontend
npm run dev
```

Frontend runs at: http://localhost:5173

### Verify the Application is Running

Open http://localhost:5173 in a browser. The RootLens AI landing page should appear. Click Start Scan to proceed to login.

### Run with Docker (Optional)

```bash
docker-compose up --build
```

---

## 9. Authentication (Planned)

The authentication system backend is fully implemented. JWT token generation, bcrypt password hashing, and protected route dependency are all in place. Frontend integration with the login and signup pages is in progress.

### Backend Endpoints (Implemented)

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/signup | Register a new user account |
| POST | /api/auth/login | Login with email and password, returns JWT token |
| GET | /api/auth/me | Retrieve current authenticated user details |
| POST | /api/auth/logout | Logout — client deletes token from localStorage |

### Token Usage

After a successful login, store the token in localStorage:

```javascript
localStorage.setItem('token', data.access_token)
```

Pass the token in all subsequent protected API requests:

```
Authorization: Bearer <access_token>
```

### User Table Schema

| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key, auto-generated |
| email | VARCHAR(255) | Unique, required |
| name | VARCHAR(100) | Required |
| hashed_password | VARCHAR | bcrypt hash, never returned in responses |
| is_active | BOOLEAN | Default true |
| is_verified | BOOLEAN | Default false |
| created_at | TIMESTAMP | Auto-set on creation |

### Pending Work

- Frontend LoginPage and SignupPage need to be connected to auth endpoints
- Protected route wrapper component for dashboard access
- Token expiry handling and refresh mechanism
- All current API endpoints are unprotected pending frontend auth integration

---

## 10. API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/upload/logs | Upload one or more log files for an incident |
| POST | /api/upload/timeline | Upload a plain-text incident timeline |
| POST | /api/upload/gitdiff | Upload a git diff file |
| POST | /api/incidents | Create a new incident record |
| POST | /api/incident/analyze | Trigger the full multi-agent investigation |
| GET | /api/incident/{id} | Get incident details and analysis status |
| GET | /api/report/{id} | Get the generated RCA report |
| GET | /api/report/{id}/export-pdf | Download the RCA report as a PDF file |
| POST | /api/report/{id}/send-email | Send the RCA report PDF to a developer email |
| GET | /api/similar-incidents/{id} | Get similar historical incidents from MCP |
| POST | /api/auth/signup | Register a new user |
| POST | /api/auth/login | Login and receive a JWT token |
| GET | /api/auth/me | Get current authenticated user |

Full interactive documentation is available at http://localhost:8000/docs when the backend is running.

---

## 11. Sample Data

### Location

```
sample-data/
```

### Incidents Included

| Folder | Scenario | Files |
|---|---|---|
| incident-001 | Payment API Outage | logs.txt, timeline.txt, gitdiff.diff, expected_rca.md |
| incident-002 | Database Pool Exhaustion | logs.txt, timeline.txt, gitdiff.diff, expected_rca.md |
| incident-003 | Cache Layer Failure | logs.txt, timeline.txt, gitdiff.diff, expected_rca.md |

### Primary Demo Scenario — incident-002

This is the recommended scenario for the demo video. The git diff shows `DB_POOL_SIZE` reduced from 50 to 5 in a deployment. The log file contains repeated connection pool exhaustion errors and API timeout messages. The timeline shows errors beginning exactly 5 minutes after the deployment started. The expected output is a confidence score of 94% with root cause identified as the configuration change in the git diff. The MCP search surfaces a similar historical incident with 91% similarity and a resolution of rolling back the deployment.

---

## 12. AI Usage

### What AI Helped With

- Complete FastAPI backend scaffolding including SQLAlchemy async models, Pydantic schemas, and router structure
- All five agent implementations with structured JSON prompting
- MCP integration rewrite from Supabase REST API calls to direct SQLAlchemy async queries against local PostgreSQL
- Gemini key rotation pool design with round-robin rotation and 429 fallback using run_in_executor
- PDF generation service using ReportLab returning bytes without disk writes
- SendGrid email service with PDF attachment using base64 encoding
- Frontend component architecture and UI design across all pages
- Debugging 429 rate limit errors caused by parallel agent execution
- Debugging OpenRouter fallback misconfiguration in all agent files
- .gitignore configuration and GitHub repository setup
- This README

### What AI Got Wrong

- Initially wired all agents to a chain of OpenRouter free model fallbacks instead of calling Gemini directly. Every agent call failed because all free OpenRouter models were unavailable or rate-limited.
- The MCP layer was generating Supabase REST API calls to `/rest/v1/incidents` endpoints that did not exist in the Inforge PostgreSQL setup, causing 404 errors on every incident save and search.
- The PDF export route was missing the `/api` prefix, causing a 404 on every export attempt even though the route existed in the backend.
- Agents were designed to run in parallel, causing immediate exhaustion of the 5 RPM free tier limit before any response was received.

### How Errors Were Fixed

- Removed all OpenRouter logic from every agent file and rewired all agent calls to the GeminiClientPool directly with no fallback chain.
- Replaced the Supabase Python client with SQLAlchemy async queries against the local PostgreSQL database using the existing HistoricalIncident model and ilike for text matching.
- Fixed the route prefix mismatch in main.py and corrected the frontend fetch URL from `/report/{id}/export-pdf` to `/api/report/{id}/export-pdf`.
- Redesigned the orchestrator to run agents sequentially. Implemented a 4-key rotation pool so consecutive agent calls each use a different key, effectively providing 20 RPM across 4 keys without delays.

### Key Prompts Used

Full prompt log is in `docs/AI_PROMPTS.md`

1. Multi-agent orchestration with sequential execution and per-agent error isolation so one failing agent does not abort the pipeline
2. Gemini key rotation pool with round-robin index and 429 fallback trying each key once before raising using run_in_executor for async compatibility
3. MCP layer rewrite from Supabase REST client to SQLAlchemy async with ilike similarity search returning scored results sorted descending
4. PDF generation with ReportLab building a complete structured report from a plain dict and returning bytes without writing to disk
5. Complete backend auth system with JWT access tokens, bcrypt hashing, OAuth2PasswordBearer scheme, and get_current_user async dependency

### AI Tools Used

| Tool | Purpose |
|---|---|
| Claude by Anthropic | Primary coding assistant for all backend and frontend development throughout the project |
| Gemini 2.5 Flash by Google | Runtime AI model powering all five investigation agents |

---

## 13. Assumptions and Limitations

### Assumptions

- The user provides at least one of the three input files. More files result in higher confidence scores.
- Log files are in plain text format with timestamps.
- The incident timeline is provided as human-readable chronological text with one event per line.
- The git diff is in standard unified diff format.
- PostgreSQL is running locally on port 5432 during development.
- At least one Gemini API key is configured. Up to four keys are supported.
- The SendGrid sender email has been verified in the SendGrid dashboard before use.

### Limitations

- The Gemini free tier allows 5 requests per minute per key. With 4 keys this provides approximately 20 RPM. Very high concurrent usage across multiple simultaneous investigations may still encounter rate limits.
- Similarity search uses keyword matching against stored text fields, not semantic vector search. Accuracy improves as more incidents are added to the historical database.
- Frontend authentication integration is pending. All API endpoints are currently unprotected.
- File uploads are stored on the local disk under the `storage/` directory. This is not suitable for multi-instance deployment without shared storage.
- The PDF export uses ReportLab basic text styling. No images or custom fonts are included.
- Email delivery requires a verified sender address in SendGrid. Without verification, all send attempts will be rejected by SendGrid.

---

## 14. Team Information

**Team Name: VOID SMASH**

**Team Members : MUKESH KUMAR K | HEMA DHARSHANA S J | VIJAY PRASATH R | SUMAN M**

