# RCA - AI Powered Root Cause Analysis Platform

## Overview

RCA (Root Cause Analysis) is an AI-powered incident investigation platform designed to help teams quickly identify, analyze, and resolve system failures.

The platform leverages Artificial Intelligence to process incident logs, generate timelines, identify probable root causes, and create detailed investigation reports, reducing manual effort and improving operational efficiency.

---

## Features

### Incident Analysis
- Upload incident logs and reports
- Automated log processing
- AI-driven issue detection

### Root Cause Analysis
- Detect probable root causes
- Correlate events across multiple sources
- AI-generated investigation insights

### Timeline Generation
- Automatic incident timeline creation
- Event sequencing
- Impact tracking

### AI Copilot
- Interactive incident assistant
- Incident-related queries
- AI-powered recommendations

### Report Generation
- Generate RCA reports
- Export investigation summaries
- PDF report support

### File Upload Support
- Upload logs and incident files
- Secure processing pipeline

### Notifications
- Email report sharing
- Incident communication support

---

## System Architecture

```text
┌─────────────────────┐
│   React Frontend    │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   FastAPI Backend   │
└─────────┬───────────┘
          │
 ┌────────┴────────┐
 ▼                 ▼
PostgreSQL      Gemini AI
Database        Analysis Engine
```

---

## Tech Stack

### Frontend
- React 19
- React Router DOM
- Vite
- JavaScript

### Backend
- FastAPI
- Python
- SQLAlchemy
- AsyncPG
- Pydantic

### Database
- PostgreSQL

### AI
- Google Gemini API

### Additional Services
- ReportLab
- WeasyPrint
- SendGrid
- Email Validator

---

## 📁 Project Structure

```text
Project/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   ├── ai/
│   │   ├── api/
│   │   ├── database/
│   │   ├── services/
│   │   ├── schemas/
│   │   └── main.py
│   │
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
```

---

## Installation

### Clone Repository

```bash
git clone https://github.com/your-username/RCA.git
cd RCA
```

---

## Frontend Setup

```bash
cd Project

npm install

npm run dev
```

Frontend will run on:

```text
http://localhost:5173
```

---

## Backend Setup

Create virtual environment:

```bash
cd backend

python -m venv venv
```

Activate environment:

### Windows

```bash
venv\Scripts\activate
```

### Linux / Mac

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run server:

```bash
uvicorn app.main:app --reload
```

Backend will run on:

```text
http://localhost:8000
```

---

## Environment Variables

Create a `.env` file:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/rca

GEMINI_API_KEY=YOUR_GEMINI_API_KEY

SENDGRID_API_KEY=YOUR_SENDGRID_KEY

EMAIL_FROM=noreply@example.com
```

---

## Docker Deployment

```bash
docker-compose up --build
```

---

## API Modules

### Incident APIs
- Create Incident
- Get Incident
- Incident Analysis

### Upload APIs
- Upload Logs
- Upload Reports

### Report APIs
- Generate RCA Report
- Export PDF

### Copilot APIs
- AI Investigation Assistant
- Incident Query Support

---

## Use Cases

- Production Incident Analysis
- Application Failure Investigation
- DevOps Monitoring
- IT Operations
- Site Reliability Engineering (SRE)
- Root Cause Identification

---

## Future Enhancements

- Real-time Monitoring
- Predictive Incident Detection
- Multi-Agent Investigation Engine
- Dashboard Analytics
- Slack/MS Teams Integration
- Advanced Visualization

---

## Team

Developed as an AI-powered incident investigation and Root Cause Analysis platform to improve operational reliability and reduce Mean Time To Resolution (MTTR).

---

## License

This project is licensed under the MIT License.

---

## Support

If you find this project useful, please consider giving it a star on GitHub.
