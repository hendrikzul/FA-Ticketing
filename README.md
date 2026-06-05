# AICOP - AI Collaboration & Operations Platform

Platform kolaborasi operasional internal berbasis AI yang menggabungkan:
- **WhatsApp Web**: conversation list, mention, participant, watcher
- **ChatGPT**: AI-first conversation, natural language input, AI memory, AI suggested actions
- **Ticketing System**: ticket, assignment, SLA, status, audit trail
- **Kanban**: visual workflow untuk ticket, task, incident, problem, dan change
- **AI Workspace**: pusat interaksi untuk search, reporting, reminder, RCA, dan knowledge generation

> Everything starts as a conversation. AI decides what operational object should be created.

## Tech Stack (MVP)

| Layer    | Technology              |
|----------|-------------------------|
| Frontend | Next.js + Tailwind + ShadCN |
| Backend  | Laravel 11 API          |
| Worker   | Python FastAPI          |
| Database | PostgreSQL              |
| Queue    | Redis                   |
| LLM      | Ollama (Qwen3 4B/8B)   |
| Deploy   | Docker Compose          |

## Architecture

```text
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Frontend   │─────▶│   Backend    │─────▶│  PostgreSQL  │
│   (Next.js)  │◀─────│   (Laravel)  │◀─────│              │
└──────────────┘      └──────┬───────┘      └──────────────┘
                             │
                             │ Redis Queue
                             ▼
                      ┌──────────────┐      ┌──────────────┐
                      │    Worker    │─────▶│    Ollama    │
                      │  (FastAPI)   │◀─────│  (Qwen3)    │
                      └──────────────┘      └──────────────┘
```

## Repository Structure

```
├── .goal/                    # Vision, roadmap, product goals
│   ├── vision.md
│   ├── roadmap.md
│   └── product-goals.md
├── .planning/                # Epics, features, milestones, sprints
│   ├── epics/
│   ├── features/
│   ├── milestones/
│   └── sprint-plans/
├── .codex/                   # AI development rules & standards
│   ├── architecture.md
│   ├── coding-standards.md
│   ├── backend-rules.md
│   ├── frontend-rules.md
│   ├── worker-rules.md
│   ├── ai-agent-rules.md
│   ├── prompt-engineering.md
│   └── security-rules.md
├── docs/                     # Documentation
│   ├── prd/                  # Product Requirement Document
│   ├── architecture/
│   ├── api/
│   ├── database/
│   ├── ux/
│   └── operations/
├── infra/                    # Infrastructure configs
│   ├── docker-compose/
│   ├── nginx/
│   ├── monitoring/
│   └── deployment/
├── frontend/                 # Next.js frontend
├── backend/                  # Laravel API backend
├── worker/                   # Python FastAPI AI worker
├── docker/                   # Docker configs
├── scripts/                  # Utility scripts
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 20+
- PHP 8.2+
- Python 3.11+
- Docker & Docker Compose
- Ollama

### Quick Start

```bash
# Start all services
docker compose up -d

# Pull local LLM model
ollama pull qwen3:4b

# Frontend
cd frontend && npm install && npm run dev

# Backend
cd backend && composer install && php artisan serve

# Worker
cd worker && pip install -r requirements.txt && uvicorn main:app --reload
```

## Documentation

- [PRD: Master Document](docs/prd/aicop_master_document.md)
- [Architecture](.codex/architecture.md)
- [Coding Standards](.codex/coding-standards.md)

## Roadmap

| Phase | Focus |
|-------|-------|
| Phase 1: Foundation | Repo, Docker, Auth, Roles, Divisions, Conversation & Messages |
| Phase 2: AI MVP | Worker, Ollama, AI Orchestrator, Ticket extraction, Summary, Usage logs |
| Phase 3: Operations UI | Inbox, Mentioned, Assigned, Watching, All Conversations, Kanban |
| Phase 4: Intelligence | AI suggested actions, Reminder, SLA, Search interpreter, Knowledge draft |
| Phase 5: Scale | pgvector, Cloud model fallback, External skills, Incident correlation |

## License

Internal use.