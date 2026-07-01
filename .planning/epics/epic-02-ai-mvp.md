# Epic 02: AI MVP

**Phase:** 2 | **Status:** completed | **Priority:** P0 - Critical

## Goal

Integrasi AI Orchestrator dengan Ollama untuk AI Desk intent detection, IT intake classification, ticket draft extraction, dan summary thread AI.

## Features

| ID | Feature | Description |
|----|---------|-------------|
| F07 | Worker Service | Python FastAPI worker |
| F08 | Ollama Integration | Connect to Ollama, pull Qwen3 4B |
| F09 | AI Orchestrator | Intent detection, AI Desk intake decision engine |
| F10 | Ticket Extraction | AI creates draft IT ticket from AI Desk thread |
| F11 | Clarifying Questions | AI asks when data is incomplete |
| F12 | Conversation Summary | AI updates summary/state |
| F13 | AI Usage Logs | Token tracking, cost estimation |
| F14 | Model Gateway | Provider abstraction layer |
| F15 | Redis Queue | Async AI job processing |

## Success Criteria

- [ ] AI Orchestrator classifies IT request intent and ticket type
- [ ] AI marks whether an AI Desk thread needs a ticket
- [ ] AI creates ticket draft from AI Desk thread
- [ ] AI asks clarifying questions
- [ ] AI summary updates after conversation
- [ ] AI usage logs record all calls

## Dependencies

- Epic 01: Foundation
