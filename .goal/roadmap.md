# AICOP Roadmap

## Phase 1: Foundation (Current)

**Deliverables:**
- Repository structure (done)
- Docker Compose (PostgreSQL, Redis, Backend, Frontend)
- Auth (register, login, logout)
- RBAC (Admin, Manager, Staff, User, Observer)
- Division management
- Conversation CRUD + Messages
- Full PostgreSQL schema

**Success:** Docker runs all services, Auth works, Conversations work

## Phase 2: AI MVP

**Deliverables:**
- Python FastAPI Worker
- Ollama integration (Qwen3 4B)
- AI Orchestrator (intent detection)
- Ticket extraction from chat
- AI clarifying questions
- Conversation summary / AI memory
- AI usage logs
- Model Gateway
- Redis queue for AI jobs

**Success:** AI creates ticket drafts, asks questions, summarizes

## Phase 3: Operations UI

**Deliverables:**
- Inbox, Mentioned, Assigned, Watching, All Conversations views
- Kanban board (New..Closed columns)
- Ticket detail panel
- Filters (status, priority, assignee, team)

**Success:** All nav works, Kanban drag-and-drop works

## Phase 4: Intelligence

**Deliverables:**
- AI suggested actions
- Reminder system
- Basic SLA (P1-P4)
- AI search interpreter
- Knowledge draft generation
- AI timeline

**Success:** AI suggests actions, SLA tracks, Search works in natural language

## Phase 5: Scale

**Deliverables:**
- pgvector semantic search
- Cloud model fallback
- External skill registry
- Incident correlation
- Advanced reporting

**Success:** Hybrid search, Cloud fallback, Multi-incident detection
