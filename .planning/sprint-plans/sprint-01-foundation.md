# Sprint 01: Foundation Setup

**Epic:** 01 - Foundation | **Duration:** 2 weeks | **Status:** planning

## Sprint Goal

Set up Docker Compose, database schema, authentication, and basic conversation/message system.

## Tasks

### Week 1: Infrastructure & Auth

| ID | Task | Feature | Assignee | Status |
|----|------|---------|----------|--------|
| T01 | Create docker-compose.yml (PostgreSQL, Redis) | F01 | - | todo |
| T02 | Initialize Laravel backend project | F01 | - | todo |
| T03 | Initialize Next.js frontend project | F01 | - | todo |
| T04 | Create PostgreSQL schema (25+ tables) | F06 | - | todo |
| T05 | Implement Auth API (register, login, logout) | F02 | - | todo |
| T06 | Implement RBAC (roles, permissions) | F03 | - | todo |

### Week 2: Conversations & Divisions

| ID | Task | Feature | Assignee | Status |
|----|------|---------|----------|--------|
| T07 | Implement Division Management API | F04 | - | todo |
| T08 | Implement Conversation CRUD API | F05 | - | todo |
| T09 | Implement Message API (text, file, image) | F05 | - | todo |
| T10 | Implement Audit Trail | F05 | - | todo |
| T11 | Frontend: Auth pages (login/register) | F02 | - | todo |
| T12 | Frontend: Chat UI layout (3-panel WhatsApp style) | F05 | - | todo |

## Definition of Done

- [ ] `docker compose up` starts all services
- [ ] Migration runs successfully
- [ ] User can register and login
- [ ] Role permissions enforced
- [ ] User can create conversation and send message
- [ ] Audit trail records all changes
