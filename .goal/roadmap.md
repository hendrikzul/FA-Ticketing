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
- AI Orchestrator (intent + IT intake detection)
- Ticket draft extraction from chat
- AI clarifying questions
- Conversation summary / AI memory
- AI usage logs
- Model Gateway
- Redis queue for AI jobs

**Success:** AI marks `needs_ticket`, creates draft tickets, asks questions, summarizes

## Phase 3: Operations UI

**Deliverables:**
- Inbox, Mentioned, Assigned, Watching, All Conversations views
- Kanban board (intake..closed columns)
- Ticket detail panel
- Filters (type, status, priority, assignee, team)

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

## Phase 6: CRM & Addon Architecture

**Deliverables:**
- Addon system architecture (backend + frontend)
- `addons` table + `addon_access_grants` (polymorphic: role, division, user)
- `CheckAddonAccess` middleware (back-end)
- AddonInterface contract + AddonRegistry auto-discovery
- Frontend AuthProvider + useAuth() + `<Can>` component
- Frontend addon route registry + dynamic lazy-loaded pages
- First sample addon: CRM Leads (CRUD with read/write/delete levels)
- Per-division and per-user addon assignment
- `/auth/me` response enriched with `addons` map

**Success:** Core features remain accessible to all users. Addons are gated modules under `backend/addons/` and `frontend/src/addons/`. Users see only assigned addons in sidebar.

## Phase 7: Cross-Division Access Matrix (Current)

**Deliverables:**

Backend:
- Migration: `cross_division_access` table (user, division, module, access_level)
- Model `CrossDivisionAccess` with relations
- Controller `AccessMatrixController` (CRUD grants)
- Middleware `CheckDivisionAccess` (own division, super admin, cross-division grant)
- Routes under `auth:sanctum`

Frontend:
- Page `/access` — Access Matrix table with filters (user, division, module)
- Tab "Division Access" di modal Edit User — kelola grant per user
- Entry "🔐 Access Matrix" di Profile Popup (admin/super_admin only)
- Module checkboxes + access level dropdown

**Success:** Admin bisa memberikan akses `read`/`write` per modul per divisi ke user manapun. Semua grant terlihat di satu halaman Access Matrix.

---

## Phase 8: Slack-Style Chat

**Deliverables:**

Backend:
- Migration: `parent_id` + `thread_reply_count` on messages
- Migration: `conversation_mode` support 'group'
- `Message` model: thread relations (parent, replies), auto-increment reply count
- `MessageController`: multi-file upload, parent_id support, `@ai` detection for ALL modes
- `MessageController::index()`: filter by `top_level` or `parent_id`
- `ConversationController`: group creation with multi-participant
- `Conversation` model: `scopeMode()` for direct/group filtering

Frontend:
- `useChat()` hook — all chat state + logic
- `ChatSidebar` — 3 sections: Channels, Direct Messages, Threads
- `ChatMain` — orchestrate header + messages + composer
- `ChatHeader` — channel name, member count, group detail toggle
- `MessageList` — scrollable message container
- `MessageItem` — avatar 36px + sender name + timestamp + bubble + thread indicator
- `ChatComposer` — rich media (multi-file, image/video preview), mention `@` autocomplete, drag-drop, paste, auto-resize
- `MentionPopup` — `@` trigger, filter user list + AI Agent
- `ThreadPanel` — slide-in right panel for thread replies
- `GroupDetailPanel` — member list with add member
- `CreateGroupModal` — create channel with multi-select members
- Refactor `chat/page.tsx` → thin orchestrator (~80 lines)

**Success:** Users can create group channels, send direct messages, reply in threads, upload multiple files, mention `@ai` in any chat type, and see Slack-style message layout.
