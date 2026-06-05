# Prompt Engineering

## Context Strategy

AI uses compressed context:
```text
summary + state + recent messages
```

Not full chat history.

## Context Max

- Current conversation summary
- Current structured state
- Missing fields
- Recent 5-10 messages
- User role
- Ticket status
- Relevant participants

## Output Format

Extraction tasks must return structured JSON.

## Rules

- AI must not invent operational facts
- Ask clarifying questions when data is missing
- Write actions require user confirmation
- All decisions must be logged
