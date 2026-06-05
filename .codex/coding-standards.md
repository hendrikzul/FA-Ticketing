# AICOP Coding Standards

## General

- Build MVP first
- Keep architecture simple
- No Kafka, NATS, Kubernetes, OpenSearch in MVP
- Use PostgreSQL as source of truth
- Use Redis for queue and cache
- Use Ollama for local AI
- Use AI only when needed

## Backend (Laravel)

- Backend is source of truth
- All writes go through backend
- Worker must not bypass permission rules
- All AI actions that modify data require backend validation
- Keep APIs RESTful for MVP
- Add audit log for state-changing actions

## Frontend (Next.js)

- UI must feel like WhatsApp Web + ChatGPT
- Conversation-first layout
- Kanban must be available as alternate view
- AI suggested actions must be visible but not intrusive
- Mention UX must be fast
- Watcher state must be clear

## Worker (Python)

- Worker runs AI Orchestrator
- All model calls go through Model Gateway
- Log all AI usage
- Never send full conversation history unless explicitly required
- Always use compressed context
- Prefer local model
- Cloud fallback only for complex/critical tasks

## AI

- AI must not invent operational facts
- AI should ask clarifying questions when required data is missing
- AI must return structured JSON for extraction tasks
- AI suggested write actions require confirmation
- AI decisions must be logged
