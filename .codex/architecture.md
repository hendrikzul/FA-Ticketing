# AICOP Architecture

## Tech Stack (MVP)

- Frontend: Next.js + Tailwind + ShadCN
- Backend: Laravel API
- Worker: Python FastAPI
- Database: PostgreSQL
- Queue/Cache: Redis
- LLM: Ollama (Qwen3 4B/8B)
- Deploy: Docker Compose

## Architecture Diagram

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
