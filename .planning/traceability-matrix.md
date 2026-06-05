# Traceability Matrix

Membuktikan bahwa goal, roadmap, epics, features, milestones, dan sprints selaras.

## Goal Success Criteria → Feature Mapping

Setiap 20 success criteria di product-goals.md dipetakan ke feature spesifik:

| # | Success Criteria | Epic | Feature |
|---|-----------------|------|---------|
| 1 | User can create conversation | 01 | F05 Conversation System |
| 2 | User can send chat messages | 01 | F05 Conversation System |
| 3 | User can mention other users | 01 | F05 Conversation System |
| 4 | User can watch conversation | 01 | F05 Conversation System |
| 5 | Observer role exists | 01 | F03 RBAC |
| 6 | AI classifies user intent | 02 | F09 AI Orchestrator |
| 7 | AI creates ticket draft from chat | 02 | F10 Ticket Extraction |
| 8 | AI asks clarifying questions | 02 | F11 Clarifying Questions |
| 9 | AI updates conversation summary | 02 | F12 Conversation Summary |
| 10 | Ticket assigned to staff/team | 03 | F18 Assigned View |
| 11 | Inbox, Mentioned, Assigned, Watching, All views | 03 | F16-F20 |
| 12 | Kanban view works | 03 | F21 Kanban Board |
| 13 | PostgreSQL stores messages + state | 01 | F06 Database Schema |
| 14 | Redis queue runs AI jobs | 02 | F15 Redis Queue |
| 15 | Ollama local model integrated | 02 | F08 Ollama Integration |
| 16 | AI usage logging exists | 02 | F13 AI Usage Logs |
| 17 | Model Gateway abstraction exists | 02 | F14 Model Gateway |
| 18 | Skill registry structure exists | 02 | F09 AI Orchestrator |
| 19 | Docker Compose runs full MVP locally | 01 | F01 Docker Compose |
| 20 | Documentation complete | 05 | F33 Advanced Reporting (T52) |

## Coverage: 20/20 = 100%

## Hierarchy Tree

```text
Vision → Roadmap (5 phases) → Product Goals (20 criteria)
                                   ↓
                              5 Epics → 5 Milestones
                                   ↓
                              33 Features
                                   ↓
                              5 Sprints → 52 Tasks
```

## Phase → Epic → Sprint Mapping

| Phase | Epic | Sprint | Tasks |
|-------|------|--------|-------|
| 1: Foundation | Epic 01 | Sprint 01 | T01-T12 |
| 2: AI MVP | Epic 02 | Sprint 02 | T13-T23 |
| 3: Operations UI | Epic 03 | Sprint 03 | T24-T33 |
| 4: Intelligence | Epic 04 | Sprint 04 | T34-T43 |
| 5: Scale | Epic 05 | Sprint 05 | T44-T52 |

## MVP Scope → Feature Coverage

| MVP Tier | Features | Status |
|----------|----------|--------|
| Must Have | F01-F06, F08-F10, F12-F13, F15-F22 | Covered in Epics 01-03 |
| Should Have | F24-F27 | Covered in Epic 04 |
| Could Have | F29-F32 | Covered in Epic 05 |
| Not MVP | - | Excluded |