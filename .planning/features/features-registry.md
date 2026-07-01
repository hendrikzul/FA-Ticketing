# Features Registry

Master list of all 46 features across 8 epics.

## Epic 01: Foundation

| ID | Feature | Status |
|----|---------|--------|
| F01 | Docker Compose Setup | completed |
| F02 | Authentication | completed |
| F03 | RBAC | completed |
| F04 | Division Management | completed |
| F05 | Conversation System | completed |
| F06 | Database Schema | completed |

## Epic 02: AI MVP

| ID | Feature | Status |
|----|---------|--------|
| F07 | Worker Service | completed |
| F08 | Ollama Integration | completed |
| F09 | AI Orchestrator | completed |
| F10 | Ticket Extraction | completed |
| F11 | Clarifying Questions | completed |
| F12 | Conversation Summary | completed |
| F13 | AI Usage Logs | completed |
| F14 | Model Gateway | completed |
| F15 | Redis Queue | completed |

## Epic 03: Operations UI

| ID | Feature | Status |
|----|---------|--------|
| F16 | Inbox View | completed |
| F17 | Mentioned View | completed |
| F18 | Assigned View | completed |
| F19 | Watching View | completed |
| F20 | All Conversations | completed |
| F21 | Kanban Board | completed |
| F22 | Ticket Detail Panel | completed |

## Epic 04: Intelligence

| ID | Feature | Status |
|----|---------|--------|
| F23 | AI Suggested Actions | completed |
| F24 | Reminder System | completed |
| F25 | Basic SLA | completed |
| F26 | AI Search Interpreter | completed |
| F27 | Knowledge Draft | completed |
| F28 | AI Timeline | completed |

## Epic 05: Scale

| ID | Feature | Status |
|----|---------|--------|
| F29 | pgvector Search | completed |
| F30 | Cloud Model Fallback | completed |
| F31 | External Skills | completed |
| F32 | Incident Correlation | completed |
| F33 | Advanced Reporting | completed |

## Epic 06: CRM & Addon Architecture

| ID | Feature | Status |
|----|---------|--------|
| F34 | Core Feature Access | in_progress |
| F35 | Addon Access Grants | pending |
| F36 | Frontend Addon Framework | in_progress |

## Epic 07: Slack-Style Chat

| ID | Feature | Status |
|----|---------|--------|
| F37 | Thread Messages (parent_id) | pending |
| F38 | Group Chat / Channels | pending |
| F39 | Multi-file Upload | pending |
| F40 | AI Mention in Chat (@ai) | pending |
| F41 | Slack-Style Chat UI (ChatSidebar) | pending |
| F42 | Slack-Style Message Rendering | pending |
| F43 | Rich Media Composer | pending |
| F44 | Thread Panel + Group Detail Panel | pending |

## Epic 08: User Management

| ID | Feature | Status |
|----|---------|--------|
| F45 | User CRUD (Backend) | done |
| F46 | User Management Page (Frontend) | done |

### F45: User CRUD (Backend)
**Backend:** `UserController` full CRUD — `store()`, `update()`, `destroy()` (soft delete/deactivate), `assignRole()`, `roles()`. Routes: POST/PUT/DELETE users, POST /users/{user}/roles, GET /users/roles.

### F46: User Management Page (Frontend)
**Frontend:** `/users` page — table with Name, Email, Username, Role badges, Division, Edit/Deactivate. Search by name/email, filter by role. Create/Edit modal with name, email, username, password. Sidebar nav entry "Users" with PersonIcon.

---

## Epic 07 Feature Detail

### F37: Thread Messages (parent_id)
**Backend:** Migration `parent_id` + `thread_reply_count` on messages. Model: `parent()`, `replies()`, auto-increment reply count on create. `MessageController::index()` filter by `top_level` or `parent_id`.

### F38: Group Chat / Channels
**Backend:** `conversation_mode` = 'group'. `ConversationController::store()`: create with multi-participant. `Conversation::scopeMode('group')`.

### F39: Multi-file Upload
**Backend:** `MessageController::store()` terima `files[]` array, bukan single `file`. Loop create attachments.

### F40: AI Mention in Chat (@ai)
**Backend:** Deteksi `@ai` di `body_text` untuk SEMUA conversation mode (bukan hanya 'ai'). Route ke `AIJobDispatcher`.

### F41: Slack-Style Chat UI (ChatSidebar)
**Frontend:** `ChatSidebar` component — 3 sections: Channels, Direct Messages, Threads. `CreateGroupModal` untuk buat channel.

### F42: Slack-Style Message Rendering
**Frontend:** `MessageItem` — avatar 36px, sender name, timestamp, bubble. Thread indicator "3 replies". Hover actions.

### F43: Rich Media Composer
**Frontend:** `ChatComposer` — multi-file preview (image/video thumbnail), `@` mention popup, drag-drop, paste-from-clipboard, auto-resize textarea.

### F44: Thread Panel + Group Detail Panel
**Frontend:** `ThreadPanel` — slide-in right panel untuk reply thread. `GroupDetailPanel` — member list + add member.

---

## Frontend Folder Structure (complete)

```
frontend/src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root: PolarisProvider → ClientAuthWrapper
│   ├── page.tsx                  # Landing (redirect /ai-desk)
│   ├── globals.css               # Global styles
│   ├── login/                    # /login — public
│   ├── register/                 # /register — public
│   ├── chat/                     # /chat — Slack-style chat (Epic 07)
│   ├── ai-desk/                  # /ai-desk — AI intake (core)
│   ├── tickets/                  # /tickets — ticket list (core)
│   ├── kanban/                   # /kanban — kanban board (core)
│   ├── knowledge/                # /knowledge — knowledge base (core)
│   ├── search/                   # /search — global search (core)
│   ├── reports/                  # /reports — reporting (core)
│   └── addons/                   # /addons/[slug] — addon dynamic routes
│
├── components/
│   ├── layout/
│   │   └── AppLayout.tsx
│   ├── chat/
│   │   ├── ChatSidebar.tsx       ← Epic 07
│   │   ├── ChatMain.tsx          ← Epic 07
│   │   ├── ChatHeader.tsx        ← Epic 07
│   │   ├── MessageList.tsx       ← Epic 07
│   │   ├── MessageItem.tsx       ← Epic 07
│   │   ├── ChatComposer.tsx       ← Epic 07
│   │   ├── MentionPopup.tsx      ← Epic 07
│   │   ├── ThreadPanel.tsx       ← Epic 07
│   │   ├── GroupDetailPanel.tsx  ← Epic 07
│   │   ├── CreateGroupModal.tsx  ← Epic 07
│   │   ├── ConversationList.tsx  (update)
│   │   ├── NewConversation.tsx   (update)
│   │   ├── ChatWindow.tsx        (deprecated → ChatMain)
│   │   ├── types.ts
│   │   ├── utils.tsx
│   │   └── ChatComponents.tsx    ← barrel export
│   ├── ai-desk/
│   │   ├── AIDeskFilterBar.tsx
│   │   ├── AIDeskInput.tsx
│   │   ├── AIDeskThreadPanel.tsx
│   │   ├── DetailRow.tsx
│   │   └── TicketEditForm.tsx
│   ├── auth/
│   │   ├── ClientAuthWrapper.tsx
│   │   └── Can.tsx
│   └── polaris/
│       └── PolarisProvider.tsx
│
├── addons/
│   ├── registry.ts
│   └── crm-leads/page.tsx
│
├── hooks/
│   ├── useAIDesk.ts
│   ├── useTicketForm.ts
│   ├── useAddons.ts
│   └── useChat.ts               ← Epic 07
│
└── lib/
    ├── api.ts                    (update: new endpoints)
    ├── auth-context.tsx
    ├── ai-desk-types.ts
    └── ai-desk-utils.ts
```

## Phase 7: Slack-Style Chat Tasks

| Task | Description | Frontend | Backend |
|------|-------------|----------|---------|
| T57 | Migration: parent_id + thread_reply_count on messages | - | 30 min |
| T58 | Migration: conversation_mode support 'group' | - | 15 min |
| T59 | Message model: thread relations + auto-increment | - | 30 min |
| T60 | MessageController: multi-file, parent_id, AI routing all modes | - | 1 jam |
| T61 | MessageController::index: filter top_level / parent_id | - | 30 min |
| T62 | ConversationController: group create + multi-participant | - | 1 jam |
| T63 | api.ts: new endpoints (thread, group) | 15 min | - |
| T64 | useChat() hook | 1.5 jam | - |
| T65 | ChatSidebar (3 sections) | 1 jam | - |
| T66 | MessageList + MessageItem (Slack-style) | 1.5 jam | - |
| T67 | ChatComposer (rich media + mention + drag-drop) | 1.5 jam | - |
| T68 | MentionPopup (@ autocomplete) | 1 jam | - |
| T69 | ThreadPanel | 1 jam | - |
| T70 | CreateGroupModal | 1 jam | - |
| T71 | GroupDetailPanel | 30 min | - |
| T72 | Refactor chat/page.tsx (thin orchestrator) | 30 min | - |
