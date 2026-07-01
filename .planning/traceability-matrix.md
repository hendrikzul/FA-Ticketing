# Traceability Matrix

Membuktikan bahwa goal, roadmap, epics, features, milestones, dan sprints selaras.

## Goal Success Criteria → Feature Mapping

Setiap 38 success criteria di product-goals.md dipetakan ke feature spesifik:

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
| 20 | Documentation complete | 05 | F33 Advanced Reporting |
| 25 | Core features accessible by all users | 06 | F34 Core Feature Access |
| 26 | Addons gated by role/division/user | 06 | F35 Addon Access Grants |
| 27 | Frontend AuthProvider + Can + registry | 06 | F36 Frontend Addon Framework |
| 28 | Slack-style 3-panel layout | 07 | F41 ChatSidebar |
| 29 | Group chat / channel creation | 07 | F38 Group Chat |
| 30 | Thread / subchat replies | 07 | F37 Thread Messages |
| 31 | Rich media upload (multi-file) | 07 | F39 Multi-file Upload + F43 Composer |
| 32 | AI mention (@ai) in all chat types | 07 | F40 AI Mention |
| 33 | Message rendering (avatar, name, time) | 07 | F42 Message Rendering |
| 34 | Mention autocomplete popup | 07 | F43 Rich Media Composer |
| 35 | Drag-drop + paste file upload | 07 | F43 Rich Media Composer |
| 36 | Admin can create, edit, deactivate users | 08 | F45 User CRUD + F46 User Mgmt Page |
| 37 | Role assignment per user | 08 | F45 User CRUD |
| 38 | User list with search + role filter | 08 | F46 User Mgmt Page |

## Coverage: 38/38 = 100%

## Hierarchy Tree

```text
Vision → Roadmap (8 phases) → Product Goals (38 criteria)
                                   ↓
                              8 Epics → 8 Milestones
                                   ↓
                              46 Features
                                   ↓
                              8 Sprints → 74+ Tasks
```

## Phase → Epic → Sprint Mapping

| Phase | Epic | Sprint | Tasks |
|-------|------|--------|-------|
| 1: Foundation | Epic 01 | Sprint 01 | T01-T12 |
| 2: AI MVP | Epic 02 | Sprint 02 | T13-T23 |
| 3: Operations UI | Epic 03 | Sprint 03 | T24-T33 |
| 4: Intelligence | Epic 04 | Sprint 04 | T34-T43 |
| 5: Scale | Epic 05 | Sprint 05 | T44-T52 |
| 6: CRM & Addon | Epic 06 | Sprint 06 | T53-T56 |
| 7: Slack Chat | Epic 07 | Sprint 07 | T57-T72 |
| 8: User Mgmt | Epic 08 | Sprint 08 | T73-T74 |

## Phase 7: Slack-Style Chat Tasks

| Task | Description | Layer |
|------|-------------|-------|
| T57 | Migration: parent_id + thread_reply_count on messages | Backend |
| T58 | Migration: conversation_mode support 'group' | Backend |
| T59 | Message model: thread relations + auto-increment | Backend |
| T60 | MessageController: multi-file, parent_id, AI routing | Backend |
| T61 | MessageController::index: filter top_level / parent_id | Backend |
| T62 | ConversationController: group create + multi-participant | Backend |
| T63 | api.ts: new endpoints (thread, group) | Frontend |
| T64 | useChat() hook | Frontend |
| T65 | ChatSidebar (3 sections) | Frontend |
| T66 | MessageList + MessageItem (Slack-style) | Frontend |
| T67 | ChatComposer (rich media + mention + drag-drop) | Frontend |
| T68 | MentionPopup (@ autocomplete) | Frontend |
| T69 | ThreadPanel | Frontend |
| T70 | CreateGroupModal | Frontend |
| T71 | GroupDetailPanel | Frontend |
| T72 | Refactor chat/page.tsx (thin orchestrator) | Frontend |

## Phase 8: User Management Tasks

| Task | Description | Layer |
|------|-------------|-------|
| T73 | Backend: UserController full CRUD + role assignment + routes | Backend |
| T74 | Frontend: /users page (table, search, modal, sidebar) | Frontend |
