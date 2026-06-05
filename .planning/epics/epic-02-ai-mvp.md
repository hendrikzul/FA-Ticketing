# Epic 02: AI MVP

**Phase:** 2 | **Status:** planned | **Priority:** P0 - Critical

## Goal

Integrasi AI Orchestrator dengan Ollama untuk intent detection, ticket extraction, dan conversation summary.

## Features

| ID | Feature | Description |
|----|---------|-------------|
| F07 | Worker Service | Python FastAPI worker |
| F08 | Ollama Integration | Connect to Ollama, pull Qwen3 4B |
| F09 | AI Orchestrator | Intent detection, decision engine |
| F10 | Ticket Extraction | AI creates ticket draft from chat |
| F11 | Clarifying Questions | AI asks when data is incomplete |
| F12 | Conversation Summary | AI updates summary/state |
| F13 | AI Usage Logs | Token tracking, cost estimation |
| F14 | Model Gateway | Provider abstraction layer |
| F15 | Redis Queue | Async AI job processing |

## Success Criteria

- [ ] AI Orchestrator classifies user intent
- [ ] AI creates ticket draft from conversation
- [ ] AI asks clarifying questions
- [ ] AI summary updates after conversation
- [ ] AI usage logs record all calls

## Dependencies

- Epic 01: Foundation
