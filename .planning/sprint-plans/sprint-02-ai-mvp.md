# Sprint 02: AI Orchestrator

**Epic:** 02 - AI MVP | **Duration:** 2 weeks | **Status:** completed

## Sprint Goal

Build Python worker, integrate Ollama, implement AI Orchestrator with intent detection, ticket extraction, and conversation summary.

## Tasks

### Week 3: Worker & Ollama

| ID | Task | Feature | Assignee | Status |
|----|------|---------|----------|--------|
| T13 | Initialize Python FastAPI worker project | F07 | - | todo |
| T14 | Implement Ollama integration (pull, chat, health) | F08 | - | todo |
| T15 | Implement Model Gateway abstraction | F14 | - | todo |
| T16 | Implement Redis queue producer (Backend -> Redis) | F15 | - | todo |
| T17 | Implement Redis queue consumer (Worker reads jobs) | F15 | - | todo |

### Week 4: AI Intelligence

| ID | Task | Feature | Assignee | Status |
|----|------|---------|----------|--------|
| T18 | Implement AI Orchestrator (intent detection) | F09 | - | todo |
| T19 | Implement Ticket Extraction skill | F10 | - | todo |
| T20 | Implement Clarifying Questions logic | F11 | - | todo |
| T21 | Implement Conversation Summary update | F12 | - | todo |
| T22 | Implement AI Usage Logs recording | F13 | - | todo |
| T23 | Create Skill Registry structure (ticket_creator etc) | F09 | - | todo |

## Definition of Done

- [ ] Worker connects to Ollama and responds
- [ ] AI Orchestrator classifies intent correctly
- [ ] AI creates ticket draft from chat
- [ ] AI asks clarifying questions when data incomplete
- [ ] AI summary updates after conversation
- [ ] AI usage logs record token count, model, latency
- [ ] Redis queue delivers AI jobs from backend to worker
