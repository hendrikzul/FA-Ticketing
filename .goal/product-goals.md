# AICOP Product Goals

## Goal Name: Build AI Collaboration & Operations Platform MVP

## Objective

Create a conversation-first AI operations platform where users can collaborate like WhatsApp Web, interact with AI like ChatGPT, manage work as tickets/tasks/incidents, and visualize workflow using Kanban.

## Success Criteria (20 items)

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
Auth | Roles | Divisions | Conversation UI | Messages | Mentions | Watchers | Ticket creation from AI | Ticket state | Kanban | AI summary | Redis queue | Ollama integration | AI usage logs

### Should Have
Knowledge draft | Reminder | Basic SLA | AI search interpreter

### Could Have
Incident correlation | External skills | Cloud fallback | pgvector

### Not MVP
Kubernetes | Kafka/NATS | OpenSearch | Multi-agent complex | Full ITIL | Auto major incident

## Definition of Done

- [x] Frontend implemented
- [x] Backend implemented
- [x] Worker implemented
- [x] PostgreSQL schema created
- [x] Redis queue working
- [x] Ollama model working
- [x] Conversation UI working
- [x] Ticket generation working
- [x] Mentioned/Assigned/Watching/All views
- [x] Kanban working
- [x] AI summary working
- [x] AI usage logs working
- [x] README and docs complete
