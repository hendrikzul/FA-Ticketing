# Epic 01: Foundation

**Phase:** 1 | **Status:** completed | **Priority:** P0 - Critical

## Goal

Membangun fondasi infrastruktur, autentikasi, dan sistem percakapan dasar.

## Features

| ID | Feature | Description |
|----|---------|-------------|
| F01 | Docker Compose Setup | Multi-service Docker environment |
| F02 | Authentication | Register, login, logout |
| F03 | RBAC | Role-based access control (5 roles) |
| F04 | Division Management | Create/manage divisions and members |
| F05 | Conversation System | Create conversations, send messages |
| F06 | Database Schema | Full PostgreSQL schema (25+ tables) |

## Success Criteria

- [ ] `docker compose up` runs all services
- [ ] User can register, login, logout
- [ ] Roles enforce correct permissions
- [ ] User can create conversation and send messages

## Dependencies

- None (first epic)
