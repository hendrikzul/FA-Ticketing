# AICOP Product Goals

## Goal Name: Build AI Collaboration & Operations Platform MVP

## Objective

Create an internal collaboration platform with three primary workspaces: `Chat` for member messaging, `AI Desk` for AI-led IT intake, and `Tickets` for structured execution.

## Success Criteria (38 items)

1. User can create human chat thread with another member.
2. User can send chat messages in human chat.
3. User can create AI Desk thread by subject.
4. AI Desk can accept text and file/image context.
5. Observer role exists.
6. AI Orchestrator can classify IT request intent and ticket type.
7. AI Orchestrator can mark whether an AI Desk thread needs a ticket draft.
8. AI can ask clarifying questions.
9. AI can update AI Desk summary.
10. Ticket can be assigned to staff/team.
11. User can view separate Chat and AI Desk histories.
12. Tickets page works as operational list.
13. PostgreSQL stores raw messages and structured state efficiently.
14. Redis queue runs AI jobs.
15. Ollama local model is integrated.
16. AI usage logging exists.
17. Model Gateway abstraction exists.
18. Skill registry structure exists.
19. Docker Compose can run full MVP locally.
20. Documentation is complete.
21. Every IT request starts in AI Desk, not a manual ticket form.
22. Ticket type supports bugfix, development, and maintenance.
23. Development requests can be marked as needing approval before execution.
24. Ticket status workflow supports intake, triage, queueing, execution, waiting, and closure.
25. Addon architecture: Core features accessible by all authenticated users.
26. Addon architecture: Addons are gated modules with role/division/user assignment and read/write/delete levels.
27. Addon architecture: Frontend uses AuthProvider + useAuth() + Can component.
28. **Chat: Slack-style 3-panel layout — sidebar (channels + DMs + threads), main chat, thread panel.**
29. **Chat: Group chat / channel creation with multi-member selection.**
30. **Chat: Thread / subchat — reply to a message without polluting main channel.**
31. **Chat: Rich media upload — multiple files, image/video/file with preview.**
32. **Chat: AI mention (@ai) works in ALL chat types (direct, group, channel).**
33. **Chat: Message rendering — avatar, sender name, timestamp per message (Slack-style).**
34. **Chat: Mention autocomplete popup — @ triggers user list + AI Agent.**
35. **Chat: Drag-drop + paste-from-clipboard file upload.**
36. **User Management: Admin can create, edit, and deactivate users via /users page.**
37. **User Management: Role assignment per user (Admin, Manager, Staff, User, Observer).**
38. **User Management: User list with search, role filter, and table with role badges.**

## Technical Constraints

| Layer    | Technology              |
|----------|-------------------------|
| Frontend | Next.js + Tailwind + ShadCN |
| Backend  | Laravel 11 + PostgreSQL + Redis |
| Worker   | Python FastAPI + Ollama |
| AI       | Qwen3 4B / 8B + Cloud (ready) |
| Deploy   | Docker Compose |

## MVP Scope

### Must Have
Auth | Roles | Divisions | Slack-style Chat UI | AI Desk UI | Messages | Mentions | Watchers | Ticket draft creation from AI | Ticket type | Ticket state | Tickets list | AI summary | Redis queue | Ollama integration | AI usage logs | Addon architecture | Thread replies | Group chat | AI mention in chat

### Should Have
Knowledge draft | Reminder | Basic SLA | AI search interpreter | Admin addon management UI | Read receipts

### Could Have
Incident correlation | External skills | Cloud fallback | pgvector | Voice/video call | Typing indicator

### Not MVP
Kubernetes | Kafka/NATS | OpenSearch | Multi-agent complex | Full ITIL | Auto major incident

## Slack-Style Chat Architecture

### Layout

```
┌────────────┬──────────────────────┬──────────────────────┐
│  SIDEBAR   │  CHAT MAIN           │  THREAD / DETAIL     │
│            │                      │                      │
│  Channels  │  # channel-name      │  Thread: "msg.."     │
│  # umum    │  ─────────────────── │  ─────────────────── │
│  # proyek  │  👤 Fajar 10:30     │  👤 Fajar 10:30      │
│            │  Halo team!          │  Halo team!          │
│  DMs       │                      │                      │
│  🟢 Budi   │  👤 Budi 10:32      │  👤 Budi 10:32       │
│  ⚪ Citra  │  Siap, review PR     │  Detailnya?          │
│            │                      │                      │
│  Threads   │  ┌────────────────┐  │  ┌────────────────┐  │
│  💬 "Halo" │  │ @ai cek status │  │  │ reply composer │  │
│            │  │ [😀][📎][Send] │  │  └────────────────┘  │
│            │  └────────────────┘  │                      │
└────────────┴──────────────────────┴──────────────────────┘
```

### Data Flow

```
Backend
├── messages.parent_id          ← thread reply chain
├── messages.thread_reply_count ← cache untuk sidebar "3 replies"
├── conversation_mode: 'group'  ← channel mode
├── @ai mention detection       ← route ke AI worker di SEMUA mode
└── multi-file upload           ← files[] bukan single file

Frontend
├── useChat() hook              ← semua state + logic
├── ChatSidebar                 ← 3 sections (Channels, DMs, Threads)
├── MessageItem                 ← avatar + name + bubble + time + thread link
├── ChatComposer                ← rich media + mention + drag-drop
├── ThreadPanel                 ← slide-in panel kanan
└── CreateGroupModal            ← multi-select members
```

### Component Tree

```
ChatPage (thin orchestrator ~80 lines)
├── ChatSidebar
│   ├── ChannelSection (# umum, # proyek, + Add)
│   ├── DmSection (🟢 Budi, ⚪ Citra)
│   └── ThreadSection (💬 recent threads)
├── ChatMain
│   ├── ChatHeader (# channel-name 👥 4)
│   ├── MessageList
│   │   └── MessageItem (avatar, name, time, bubble, thread indicator)
│   └── ChatComposer (mention popup, files, drag-drop, send)
├── ThreadPanel (conditional — for thread replies)
│   ├── ThreadHeader
│   ├── MessageList (thread-only)
│   └── ChatComposer (thread reply)
└── GroupDetailPanel (conditional — for groups)
    ├── MemberList
    └── AddMemberButton
```

## Definition of Done

- [x] Frontend implemented
- [x] Backend implemented
- [x] Worker implemented
- [x] PostgreSQL schema created
- [x] Redis queue working
- [x] Ollama model working
- [x] Conversation UI working
- [x] Ticket draft generation working
- [x] Mentioned/Assigned/Watching/All views
- [x] Kanban working
- [x] AI summary working
- [x] AI usage logs working
- [x] README and docs complete
- [x] Addon architecture: frontend (AuthProvider, Can, registry, dynamic route)
- [ ] Addon architecture: backend (tables, middleware, addon interface, seeder)
- [ ] Slack-style chat: frontend (ChatSidebar, MessageItem, ChatComposer, ThreadPanel, CreateGroupModal)
- [x] Slack-style chat: backend (parent_id migration, multi-file, AI mention routing, group mode)
- [x] User Management: backend (UserController CRUD, role assignment, routes)
- [x] User Management: frontend (/users page, table, search, create/edit modal, sidebar nav)
