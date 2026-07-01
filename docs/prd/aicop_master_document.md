# AI Collaboration & Operations Platform (AICOP)

## 1. Ringkasan Produk

**Nama Produk:** AI Collaboration & Operations Platform (AICOP)

AICOP adalah platform kolaborasi operasional internal berbasis AI yang memisahkan tiga workspace utama:

- `Chat`: member-to-member messaging seperti WhatsApp Web.
- `AI Desk`: AI-first intake seperti ChatGPT untuk semua request ke IT.
- `Tickets`: hasil kerja terstruktur untuk assignment, status, dan operasional.

Prinsip utama:

> Human chat stays human. IT intake starts in AI Desk. AI decides what operational object should be created.

Dalam AICOP, `Chat` dan `AI Desk` memiliki tujuan yang berbeda. `Chat` dipakai untuk percakapan biasa antar member. `AI Desk` dipakai untuk semua permintaan ke IT. Dari AI Desk, AI Orchestrator menentukan apakah thread membutuhkan ticket draft, lalu mengusulkan tipe seperti **bugfix**, **development**, atau **maintenance** sebelum eksekusi di `Tickets`.

---

## 2. Visi Produk

Membangun platform internal dengan `AI Desk` sebagai single front door untuk semua permintaan ke IT, sementara `Chat` tetap menjadi kanal komunikasi manusia yang ringan dan `Tickets` menjadi tempat kerja operasional.

Tujuan utama:

1. User tidak perlu mengisi form panjang untuk meminta bantuan IT.
2. Semua permintaan ke IT dimulai dari AI Desk dengan natural language.
3. AI mengubah percakapan AI Desk menjadi data terstruktur dan draft ticket bila dibutuhkan.
4. AI dapat bertanya jika data kurang.
5. AI dapat membantu search, reminder, summary, routing, dan rekomendasi tindakan.
6. Staff dan manager dapat berkomunikasi lewat Chat, intake lewat AI Desk, dan bekerja lewat Tickets.
7. Ticket type dan ticket status dipisahkan agar workflow scalable.
8. Sistem hemat token dan database tetap efisien.
9. Stack awal sederhana: frontend, backend, worker, PostgreSQL, Redis, Ollama.

---

## 3. Product Philosophy

### 3.1 Model Tradisional

```text
User
  ↓
Form Ticket
  ↓
Ticket
  ↓
Assigned Team
```

Masalah:

- User malas mengisi field.
- Ticket sering tidak lengkap.
- Kategori dan prioritas sering salah.
- Staff perlu bertanya ulang.
- Search sulit karena data tidak konsisten.

### 3.2 Model AICOP

```text
Human Communication -> Chat Thread
IT Request -> AI Desk Thread -> AI Orchestrator -> Draft Ticket / KB / Reminder / Action
```

Keunggulan:

- User cukup menulis seperti chat biasa.
- AI mengubah chat menjadi data operasional.
- AI bertanya jika informasi kurang.
- AI menjaga summary dan state agar tidak boros token.
- Semua aktivitas tersimpan sebagai conversation dan audit trail.

---

## 4. Target Pengguna

### 4.1 User

Pengguna umum yang membuat permintaan, laporan masalah, atau pertanyaan.

Hak akses:

- Membuat conversation.
- Membuat ticket melalui AI.
- Melihat ticket miliknya.
- Melihat ticket yang dia di-mention.
- Melihat ticket yang dia menjadi watcher.
- Melihat all tickets sesuai permission organisasi.
- Comment dalam conversation yang dia punya akses.

### 4.2 Staff

Tim yang menangani ticket, task, incident, atau request.

Hak akses:

- Semua hak User.
- Melihat assigned items.
- Mengubah status.
- Menambahkan internal notes.
- Mengambil ownership.
- Meminta AI summary atau suggested action.

### 4.3 Manager

Pemimpin divisi atau team.

Hak akses:

- Semua hak Staff.
- Membuat divisi.
- Menambahkan staff ke divisi.
- Assign/reassign ticket.
- Melihat workload team.
- Melihat dashboard dan report.
- Mengatur SLA basic.

### 4.4 Observer

Role read-only untuk pihak yang perlu melihat perkembangan tanpa menjadi pelaksana langsung.

Cocok untuk:

- CTO
- CEO
- Product Owner
- Auditor
- Customer Success
- Stakeholder non-teknis

Hak akses:

- Membaca conversation tertentu.
- Menerima mention.
- Menjadi watcher.
- Melihat timeline dan summary.

Batasan:

- Tidak bisa assign.
- Tidak bisa close ticket.
- Tidak bisa mengubah status.
- Tidak bisa mengubah workflow.

### 4.5 Admin

Pengelola sistem.

Hak akses:

- User management.
- Role management.
- System settings.
- Model provider settings.
- Skill registry management.
- Audit logs.

---

## 5. Konsep Utama

### 5.1 Split Workspace Model

Workspace dibagi menjadi tiga:

- `Chat`
  - private thread antar member
  - tidak memicu AI intake otomatis
- `AI Desk`
  - subject-based thread untuk request ke IT
  - AI dapat bertanya, merangkum, dan membuat draft ticket
- `Tickets`
  - list eksekusi untuk hasil AI Desk

### 5.2 Chat Workspace

Chat adalah ruang komunikasi antar manusia.

Satu chat thread dapat memiliki:

- Pesan user/staff.
- Attachments.
- Mentions.
- Watchers opsional.

### 5.3 AI Desk Workspace

AI Desk adalah pusat intake ke IT.

Satu AI Desk thread dapat memiliki:

- Pesan user.
- Pesan staff.
- Pesan AI.
- System events.
- Attachments.
- Mentions.
- Watchers.
- Ticket.
- Task.
- Incident.
- Knowledge draft.
- AI summary.
- Timeline.

### 5.4 Ticket sebagai Hasil AI Desk

Ticket draft dibuat oleh AI ketika conversation mengandung request atau issue yang perlu ditangani oleh IT.

Contoh:

```text
User:
Checkout error 500 sejak jam 10 pagi.

AI:
Saya akan bantu buatkan ticket. Apakah ini production?

User:
Ya production, semua customer terdampak.

AI:
Ticket dibuat: P1 - Checkout Error 500 Production.
```

### 5.2.1 Semua Request IT Dimulai dari Conversation

- Semua staff yang membutuhkan bantuan IT wajib memulai dari conversation.
- Conversation adalah pintu masuk tunggal untuk bug report, change request, maintenance request, access request, dan pertanyaan operasional.
- AI tidak harus selalu membuat ticket final. AI terlebih dahulu menandai `needs_ticket = yes/no`.
- Jika `needs_ticket = yes`, AI membuat **draft ticket** dan meminta klarifikasi bila data kurang.

### 5.2.2 Ticket Type Bukan Ticket Status

`bugfix`, `development`, dan `maintenance` bukan status. Ketiganya adalah **ticket type**.

Model yang direkomendasikan:

- `ticket_type`
  - `bugfix`
  - `development`
  - `maintenance`
- `ticket_status`
  - `new`
  - `triaged`
  - `waiting_approval`
  - `queued`
  - `in_progress`
  - `waiting_user`
  - `waiting_vendor`
  - `resolved`
  - `closed`
  - `rejected`
  - `cancelled`

### 5.2.3 Aturan Draft dan Approval

- `development` dapat membutuhkan approval sebelum dikerjakan.
- `maintenance` dapat membutuhkan schedule atau maintenance window.
- `bugfix` dapat membutuhkan data seperti expected behavior, actual behavior, dan reproducibility.
- Ticket tetap berasal dari conversation yang sama agar konteks tidak terpecah.

### 5.3 Mention

User dapat mention:

```text
@budi tolong cek log nginx.
@devops mohon bantu cek server production.
```

Mention akan masuk ke menu **Mentioned** milik user/team terkait.

### 5.4 Watchers

Watcher adalah user yang mengikuti perkembangan tanpa menjadi assignee.

Contoh:

- Manager menjadi watcher untuk ticket P1.
- CTO menjadi watcher untuk major incident.
- Product Owner menjadi watcher untuk issue checkout.

### 5.5 All Tickets / All Conversations

Top-level hierarchy harus memungkinkan user mengakses:

1. Ticket/conversation miliknya sendiri.
2. Ticket/conversation di mana dia di-mention.
3. Ticket/conversation yang dia watch.
4. All tickets/all conversations sesuai role dan permission.

---

## 6. Main Navigation

Menu utama disarankan:

```text
Inbox
Mentioned
Assigned
Watching
All Conversations
Kanban
Knowledge Base
AI Workspace
Reports
Settings
```

### 6.1 Inbox

Berisi conversation yang relevan langsung dengan user.

### 6.2 Mentioned

Berisi conversation/ticket di mana user di-mention.

### 6.3 Assigned

Berisi ticket/task/incident yang assigned ke user atau team.

### 6.4 Watching

Berisi item yang diikuti user sebagai watcher.

### 6.5 All Conversations

Semua conversation yang boleh dilihat sesuai permission.

### 6.6 Kanban

Tampilan visual workflow.

### 6.7 Knowledge Base

Artikel knowledge yang dibuat manual atau dibantu AI.

### 6.8 AI Workspace

Tempat bertanya ke AI tentang data operasional.

Contoh prompt:

```text
Cari semua ticket Redis minggu ini.
Buatkan summary incident checkout hari ini.
Ticket apa yang paling sering reopen bulan ini?
Siapa staff dengan workload paling tinggi?
```

---

## 7. UX Concept

### 7.1 Gabungan WhatsApp Web + ChatGPT + Ticketing Kanban

Layout utama:

```text
+-------------------+----------------------------+----------------------+
| Conversation List | Active Conversation        | Details / AI Panel   |
|                   |                            |                      |
| Inbox             | Chat messages              | Ticket State         |
| Mentioned         | AI suggested actions       | Assignee             |
| Assigned          | Attachments                | Watchers             |
| Watching          | Timeline                   | SLA                  |
| All               |                            | Summary              |
+-------------------+----------------------------+----------------------+
```

### 7.2 ChatGPT Style

- Input natural language.
- AI bertanya jika data kurang.
- AI memberikan suggested action.
- AI dapat menjawab pertanyaan tentang conversation.

### 7.3 WhatsApp Web Style

- Conversation list kiri.
- Chat utama tengah.
- Participant, watcher, attachment, dan detail kanan.
- Mention dan unread indicators.

### 7.4 Kanban Style

Kanban digunakan sebagai alternatif dari list.

Columns awal:

```text
New
Triaged
Assigned
Working
Waiting User
Waiting Vendor
Resolved
Closed
```

Card dapat berupa:

- Ticket
- Task
- Incident
- Problem
- Change Request

---

## 8. AI Orchestrator

### 8.1 Definisi

AI Orchestrator adalah pusat AI dalam sistem.

Dia bukan hanya chatbot, tetapi controller yang menentukan:

- Intent user.
- Context apa yang dibutuhkan.
- Data apa yang perlu diekstrak.
- Apakah perlu membuat ticket/task/incident.
- Tool apa yang harus dipanggil.
- Model apa yang harus digunakan.
- Apakah perlu subagent.

### 8.2 Tanggung Jawab

AI Orchestrator bertugas:

1. Intent detection.
2. Ticket intake.
3. Clarifying question.
4. Structured extraction.
5. Priority classification.
6. Category classification.
7. Assignment recommendation.
8. Summary update.
9. Reminder recommendation.
10. Search query interpretation.
11. Suggested actions.
12. Model routing.
13. Token saving.
14. Audit-friendly decision logging.

### 8.3 Flow

```text
New Message
  ↓
Backend saves raw message
  ↓
Backend queues AI job in Redis
  ↓
Worker receives job
  ↓
AI Orchestrator loads small context
  ↓
AI decides action
  ↓
Worker writes structured result to DB
  ↓
Frontend updates conversation
```

### 8.4 Context yang Dikirim ke AI

AI tidak boleh membaca seluruh chat history setiap kali.

Context maksimal:

- Current conversation summary.
- Current structured state.
- Missing fields.
- Recent 5-10 messages.
- User role.
- Ticket status.
- Relevant participants.

---

## 9. Optional Subagents

Subagent tidak wajib untuk MVP.

Default MVP:

```text
AI Orchestrator only
```

Future optional:

```text
AI Orchestrator
  ├── Ticket Agent
  ├── Search Agent
  ├── Incident Agent
  ├── Knowledge Agent
  ├── Reporting Agent
  ├── Reminder Agent
  ├── DBA Agent
  └── DevOps Agent
```

Prinsip:

- Jangan panggil subagent jika rule/SQL cukup.
- Jangan panggil model mahal jika model lokal cukup.
- Jangan menjalankan multi-agent untuk task sederhana.

---

## 10. Token Saving Strategy

### 10.1 Prinsip Utama

AI dipakai hanya saat:

- Ada bahasa natural yang perlu diubah menjadi data.
- Ada ambiguitas.
- Ada kebutuhan summary.
- Ada kebutuhan rekomendasi.
- Ada search semantic.

AI tidak dipakai untuk:

- Show my tickets.
- Change status.
- Assign ticket.
- List open ticket.
- Filter by status.

Hal-hal tersebut cukup backend/SQL.

### 10.2 Context Compression

Simpan:

- Raw messages.
- Structured state.
- AI memory/summary.

AI menggunakan:

```text
summary + state + recent messages
```

Bukan semua chat.

### 10.3 AI Usage Logs

Wajib ada tabel `ai_usage_logs`.

Fields:

- id
- user_id
- conversation_id
- ticket_id
- provider
- model
- task_type
- input_tokens
- output_tokens
- estimated_cost
- latency_ms
- status
- created_at

### 10.4 Budget Guard

Limit:

- Per user per day.
- Per conversation per day.
- Per tenant per month.
- Per task type.

Jika limit tercapai:

- AI masuk low-cost mode.
- Gunakan model lokal.
- Kurangi context.
- Matikan optional subagent.

---

## 11. Efficient Chat Storage

### 11.1 Layer 1: Raw Messages

Semua chat tetap disimpan untuk audit.

Table: `messages`

Fields:

- id
- conversation_id
- sender_type: user | staff | ai | system
- sender_id
- message_type: text | file | image | action | event
- body_text
- body_json
- created_at

### 11.2 Layer 2: Structured State

Table: `conversation_states`

Fields:

- conversation_id
- object_type
- title
- category
- priority
- status
- assigned_team_id
- assigned_user_id
- current_summary
- missing_fields_json
- extracted_fields_json
- last_activity_at

### 11.3 Layer 3: AI Memory

Table: `ai_summaries`

Fields:

- id
- conversation_id
- summary_type
- summary_text
- memory_json
- version
- created_at

Example:

```json
{
  "summary": "Checkout error 500 in production affecting all users.",
  "priority": "P1",
  "category": "Application",
  "missing_fields": ["error_log", "screenshot"],
  "decision": "Create ticket and route to Application team"
}
```

---

## 12. Simple Tech Stack

MVP stack:

```text
Frontend : Next.js
Backend  : Laravel API
Worker   : Python FastAPI Worker
DB       : PostgreSQL
Queue    : Redis
LLM      : Ollama
Deploy   : Docker Compose
```

### 12.1 Frontend

Responsibilities:

- Chat UI.
- Conversation list.
- Ticket detail panel.
- Kanban board.
- Mention UI.
- Watcher UI.
- AI suggested action buttons.

### 12.2 Backend

Responsibilities:

- Auth.
- RBAC.
- User/division management.
- Conversation API.
- Ticket API.
- Kanban API.
- Mention handling.
- Watcher handling.
- Message persistence.
- Redis queue producer.
- Audit trail.

### 12.3 Worker

Responsibilities:

- AI Orchestrator.
- Ollama integration.
- Multi-model gateway.
- AI extraction.
- AI classification.
- AI summary update.
- Reminder generation.
- Knowledge generation.
- Usage logging.

### 12.4 PostgreSQL

Responsibilities:

- Source of truth.
- Conversation data.
- Ticket data.
- User data.
- AI state.
- Usage logs.

### 12.5 Redis

Responsibilities:

- Queue.
- Cache.
- Lightweight background jobs.
- Rate limiting.

### 12.6 Ollama

Responsibilities:

- Local model inference.
- Cheap orchestrator model.
- Development model runtime.

---

## 13. Local Open Source LLM Recommendation

Untuk Mac mini / Mini Mac development:

Default:

```text
Qwen3 4B
```

More capable local model:

```text
Qwen3 8B
```

Usage:

```bash
ollama pull qwen3:4b
ollama pull qwen3:8b
```

Routing:

```text
Simple classification  → Qwen3 4B
Summary                → Qwen3 4B
Ticket intake          → Qwen3 4B / 8B
Complex RCA            → cloud model
Critical P1 incident   → cloud model
```

---

## 14. Multi-Model Provider

### 14.1 Stage 1

- Ollama only.

### 14.2 Stage 2

- Ollama
- OpenAI
- Anthropic
- Google Gemini
- Azure OpenAI

### 14.3 Model Gateway

All AI calls must go through Model Gateway.

```text
AI Orchestrator
  ↓
Model Gateway
  ↓
Provider Adapter
  ↓
Ollama / OpenAI / Anthropic / Gemini
```

### 14.4 Model Gateway Responsibilities

- Provider abstraction.
- Model routing.
- Fallback.
- Token logging.
- Latency logging.
- Cost estimation.
- Retry policy.
- Safety policy.

### 14.5 Example Model Registry

```yaml
models:
  local_orchestrator:
    provider: ollama
    model: qwen3:4b
    task_types:
      - classification
      - summary
      - ticket_intake

  local_reasoning:
    provider: ollama
    model: qwen3:8b
    task_types:
      - complex_intake
      - routing

  cloud_critical:
    provider: openai
    model: gpt-4.1
    task_types:
      - rca
      - critical_incident
```

---

## 15. AI Skill System

### 15.1 Purpose

Skill system memungkinkan AI Orchestrator memiliki kemampuan tambahan yang bisa ditambah tanpa mengubah core system.

### 15.2 Skill Directory

```text
worker/
  skills/
    ticket_creator/
    ticket_classifier/
    ticket_summarizer/
    incident_correlator/
    semantic_search/
    reminder_agent/
    knowledge_generator/
    reporting_agent/
    workload_balancer/
    external_skills/
```

### 15.3 Skill Manifest

```yaml
skill:
  name: mysql_expert
  description: Diagnose MySQL slow query and replication issues
  version: 1.0.0
  entrypoint: skills.mysql_expert.run
  input_schema: schemas/mysql_expert_input.json
  output_schema: schemas/mysql_expert_output.json
  source:
    type: github
    repository: org/mysql-expert-skill
```

### 15.4 MVP Skills

Wajib untuk MVP:

- ticket_creator
- ticket_classifier
- ticket_summarizer
- reminder_agent
- search_interpreter

Optional:

- incident_correlator
- knowledge_generator
- reporting_agent

---

## 16. Kanban

### 16.1 Purpose

Kanban adalah alternatif dari list view.

### 16.2 Supported Objects

- Ticket
- Task
- Incident
- Problem
- Change Request

### 16.3 Default Columns

```text
New
Triaged
Assigned
Working
Waiting User
Waiting Vendor
Resolved
Closed
```

### 16.4 Card Fields

- Title
- Object type
- Priority
- Status
- Assignee
- Watchers count
- Mentions count
- SLA indicator
- Last activity
- AI summary preview

### 16.5 AI in Kanban

AI suggested actions on card:

- Assign to recommended staff.
- Escalate.
- Create incident.
- Send reminder.
- Generate summary.
- Generate RCA.

---

## 17. Search

### 17.1 Phase 1: PostgreSQL Full Text Search

Search fields:

- conversation title
- current summary
- message text
- ticket tags
- status
- priority

### 17.2 Phase 2: pgvector

Add semantic search when data grows.

### 17.3 Phase 3: Hybrid Search

Combine:

- keyword search
- vector search
- filters

### 17.4 AI Search Interpreter

User:

```text
Cari issue checkout yang mirip dengan payment callback gagal.
```

AI converts to:

```json
{
  "query": "checkout payment callback failure",
  "filters": {
    "object_type": "ticket",
    "status": ["open", "resolved"]
  }
}
```

---

## 18. AI Suggested Actions

AI can suggest buttons inside conversation:

```text
[Create Ticket]
[Assign to DevOps]
[Set Priority P1]
[Ask for Screenshot]
[Create Incident]
[Generate RCA]
[Generate KB]
[Send Reminder]
[Close Ticket]
```

Suggested actions must require user confirmation before write action.

---

## 19. AI Timeline

AI generates timeline from events and messages.

Example:

```text
09:00 Conversation created
09:05 Ticket created
09:10 Assigned to DevOps
09:20 CPU spike detected
09:45 Scaling completed
10:15 Monitoring stable
11:00 Resolved
```

Timeline sources:

- messages
- system events
- status changes
- assignments
- AI decisions

---

## 20. Cross Conversation Intelligence

AI can detect patterns across conversations.

Example:

```text
15 Redis-related tickets
10 checkout failures
7 timeout reports
```

AI suggests:

```text
Possible major incident: redis-cluster-prod instability.
```

MVP: suggestion only.
Future: auto-create major incident after manager approval.

---

## 21. Knowledge Base

Resolved ticket can generate KB draft.

AI-generated KB format:

- Title
- Symptoms
- Root cause
- Resolution
- Prevention
- Related tickets
- Owner

Approval required before publishing.

---

## 22. Reminder and SLA

### 22.1 Reminder

AI can suggest reminders:

- No update for X hours.
- Waiting user for X days.
- SLA almost breached.
- Assigned staff inactive.

### 22.2 SLA

Basic SLA:

```text
P1: response 15 minutes, resolution 4 hours
P2: response 1 hour, resolution 1 day
P3: response 4 hours, resolution 3 days
P4: response 1 day, resolution 7 days
```

SLA values should be configurable.

---

## 23. Functional Requirements

### FR-001 Authentication

- Register using corporate email.
- Login/logout.
- Optional SSO in future.

### FR-002 RBAC

Roles:

- Admin
- Manager
- Staff
- User
- Observer

### FR-003 Division Management

Manager can:

- Create division.
- Add staff to division.
- Remove staff from division.
- View division workload.

### FR-004 Conversation

User can:

- Create conversation.
- Send message.
- Upload attachment.
- Mention users.
- Add watcher if permitted.

### FR-005 AI Intake

AI can:

- Understand request.
- Ask missing information.
- Create ticket draft.
- Suggest category.
- Suggest priority.
- Suggest assignee/team.

### FR-006 Ticket Management

System supports:

- Ticket creation.
- Status update.
- Assignment.
- Priority.
- Category.
- SLA.
- Watchers.
- Mentions.

### FR-007 Kanban

System supports:

- Kanban board.
- Drag and drop.
- Filter by assignee/team/status/priority.

### FR-008 Search

System supports:

- Keyword search.
- Filter search.
- AI interpreted search.

### FR-009 AI Summary

System supports:

- Conversation summary.
- Ticket summary.
- Resolution summary.
- RCA summary.

### FR-010 Knowledge Base

System supports:

- Generate KB draft from resolved ticket.
- Manual approval.
- KB search.

### FR-011 Audit Trail

System tracks:

- Message created.
- Status changed.
- Assignee changed.
- Watcher added.
- Mention created.
- AI decision.
- Suggested action accepted/rejected.

---

## 24. Non-Functional Requirements

### Performance

- API response target: <300ms for non-AI requests.
- Search target: <500ms for basic search.
- AI tasks can run async via Redis queue.

### Availability

MVP target:

- 99.5%

Future target:

- 99.9%

### Security

- OWASP Top 10 compliance.
- Role-based access control.
- Audit logs.
- Attachment validation.
- Sensitive data masking for AI context.

### Cost Control

- Local model first.
- Cloud model fallback only.
- Token logging.
- Budget guard.
- Context compression.

---

## 25. Database Tables MVP

```text
users
roles
user_roles
permissions
role_permissions

divisions
division_members

conversations
conversation_participants
conversation_states
messages
mentions
watchers
attachments

tickets
ticket_assignments
ticket_status_history

tasks
incidents
knowledge_articles

ai_summaries
ai_extractions
ai_decisions
ai_usage_logs

audit_logs
```

---

## 26. Repository Structure

```text
/
├── .goal/
│   ├── vision.md
│   ├── roadmap.md
│   ├── product-goals.md
│   └── release-goals/
│
├── .planning/
│   ├── epics/
│   ├── features/
│   ├── milestones/
│   └── sprint-plans/
│
├── .codex/
│   ├── architecture.md
│   ├── coding-standards.md
│   ├── backend-rules.md
│   ├── frontend-rules.md
│   ├── worker-rules.md
│   ├── ai-agent-rules.md
│   ├── prompt-engineering.md
│   └── security-rules.md
│
├── docs/
│   ├── prd/
│   ├── architecture/
│   ├── api/
│   ├── database/
│   ├── ux/
│   └── operations/
│
├── infra/
│   ├── docker-compose/
│   ├── nginx/
│   ├── monitoring/
│   └── deployment/
│
├── frontend/
│   └── README.md
│
├── backend/
│   └── README.md
│
├── worker/
│   └── README.md
│
├── docker/
├── scripts/
└── README.md
```

---

## 27. Codex Instructions

### 27.1 General

- Build MVP first.
- Keep architecture simple.
- Do not introduce Kafka, NATS, Kubernetes, OpenSearch, or complex microservices in MVP.
- Use PostgreSQL as source of truth.
- Use Redis for queue and cache.
- Use Ollama for local AI.
- Use AI only when needed.

### 27.2 Backend Rules

- Backend is source of truth.
- All writes go through backend.
- Worker must not bypass permission rules.
- All AI actions that modify data require backend validation.
- Keep APIs RESTful for MVP.
- Add audit log for state-changing actions.

### 27.3 Frontend Rules

- UI must feel like WhatsApp Web + ChatGPT.
- Conversation-first layout.
- Kanban must be available as alternate view.
- AI suggested actions must be visible but not intrusive.
- Mention UX must be fast.
- Watcher state must be clear.

### 27.4 Worker Rules

- Worker runs AI Orchestrator.
- All model calls go through Model Gateway.
- Log all AI usage.
- Never send full conversation history unless explicitly required.
- Always use compressed context.
- Prefer local model.
- Cloud fallback only for complex/critical tasks.

### 27.5 AI Rules

- AI must not invent operational facts.
- AI should ask clarifying questions when required data is missing.
- AI must return structured JSON for extraction tasks.
- AI suggested write actions require confirmation.
- AI decisions must be logged.

---

## 28. GSD Goal

### Goal Name

Build AI Collaboration & Operations Platform MVP

### Objective

Create a conversation-first AI operations platform where users can collaborate like WhatsApp Web, interact with AI like ChatGPT, manage work as tickets/tasks/incidents, and visualize workflow using Kanban.

### Success Criteria

1. User can create conversation.
2. User can send chat messages.
3. User can mention other users.
4. User can watch conversation.
5. Observer role exists.
6. AI Orchestrator can classify user intent.
7. AI Orchestrator can create ticket draft from chat.
8. AI can ask clarifying questions.
9. AI can update conversation summary.
10. Ticket can be assigned to staff/team.
11. User can view Inbox, Mentioned, Assigned, Watching, All Conversations.
12. Kanban view works.
13. PostgreSQL stores raw messages and structured state efficiently.
14. Redis queue runs AI jobs.
15. Ollama local model is integrated.
16. AI usage logging exists.
17. Model Gateway abstraction exists.
18. Skill registry structure exists.
19. Docker Compose can run full MVP locally.
20. Documentation is complete.

### Technical Constraints

Frontend:

- Next.js
- Tailwind
- ShadCN

Backend:

- Laravel
- PostgreSQL
- Redis

Worker:

- Python FastAPI
- Ollama integration

AI:

- Qwen3 4B local default
- Qwen3 8B optional local
- Cloud provider ready but optional

Deployment:

- Docker Compose for MVP

### Definition of Done

- Frontend implemented.
- Backend implemented.
- Worker implemented.
- PostgreSQL schema created.
- Redis queue working.
- Ollama model working.
- Conversation UI working.
- Ticket generation working.
- Mentioned view working.
- Watching view working.
- Assigned view working.
- All Conversations view working.
- Kanban working.
- AI summary working.
- AI usage logs working.
- README and docs complete.

---

## 29. MVP Scope

### Must Have

- Auth.
- Roles.
- Divisions.
- Conversation UI.
- Messages.
- Mentions.
- Watchers.
- Ticket creation from AI.
- Ticket state.
- Kanban.
- AI summary.
- Redis queue.
- Ollama integration.
- AI usage logs.

### Should Have

- Knowledge draft generation.
- Reminder suggestion.
- Basic SLA.
- AI search interpreter.

### Could Have

- Incident correlation.
- External skills.
- Cloud model fallback.
- pgvector.

### Not MVP

- Kubernetes.
- Kafka/NATS.
- OpenSearch.
- Multi-agent complex orchestration.
- Full ITIL module.
- Auto major incident without approval.

---

## 30. Roadmap

### Phase 1: Foundation

- Repo structure.
- Docker Compose.
- Auth.
- Roles.
- Divisions.
- Conversation and messages.

### Phase 2: AI MVP

- Worker.
- Ollama.
- AI Orchestrator.
- Ticket extraction.
- Summary memory.
- Usage logs.

### Phase 3: Operations UI

- Inbox.
- Mentioned.
- Assigned.
- Watching.
- All Conversations.
- Kanban.

### Phase 4: Intelligence

- AI suggested actions.
- Reminder.
- SLA.
- Search interpreter.
- Knowledge draft.

### Phase 5: Scale

- pgvector.
- Cloud model fallback.
- External skill registry.
- Incident correlation.
- Advanced reporting.

---

## 31. Final Product Statement

AICOP is not just a ticketing application.

AICOP is an AI-native collaboration and operations workspace where people work through conversations, AI turns conversations into structured operational work, and teams manage execution through chat, list, search, and Kanban.

The MVP must stay simple:

```text
Frontend + Backend + Worker + PostgreSQL + Redis + Ollama
```

The long-term architecture must remain extensible:

```text
AI Orchestrator + Skill System + Multi-Model Gateway + Kanban + Knowledge + Incident Intelligence
```
