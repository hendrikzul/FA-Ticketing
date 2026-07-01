"""
Ticket Extractor Skill - AI-powered ticket field extraction.
Extracts structured ticket data from natural language messages.
"""

import json
from gateway.model_gateway import ModelGateway


class TicketExtractor:
    """Extract ticket fields from user messages using AI."""

    def __init__(self, model_gateway: ModelGateway):
        self.gateway = model_gateway

    async def extract(self, body_text: str, conversation_id: int) -> dict:
        """
        Extract structured ticket fields from a message.

        Returns:
            - ticket_fields: extracted structured data
            - missing_fields: fields that need clarification
            - usage: token/model info
        """
        prompt = f"""Extract ticket information from this message. Return JSON only.

Message: "{body_text}"

Extract these fields if present:
- title: short summary of the issue/request (max 100 chars)
- description: detailed description
- ticket_type: one of [bugfix, development, maintenance]
- category: one of [Application, Infrastructure, Network, Database, Security, General]
- priority: one of [P1, P2, P3, P4]
  - P1: production down, all users affected, critical
  - P2: major impact, workaround available
  - P3: moderate impact, limited users
  - P4: minor, cosmetic, request
- impact: who/how many affected
- urgency: how quickly needed
- approval_required: true for development requests needing review/approval, otherwise false

Also list fields that are MISSING and needed for a complete ticket.
Also decide:
- needs_ticket: true if this conversation should become a draft IT ticket
- ready_to_create: true if there is enough information to create a useful draft immediately

Return JSON:
{{
  "ticket_fields": {{
    "title": "...",
    "description": "...",
    "ticket_type": "bugfix",
    "category": "...",
    "priority": "P3",
    "impact": "...",
    "urgency": "...",
    "approval_required": false
  }},
  "needs_ticket": true,
  "missing_fields": ["screenshot", "error_log"],
  "ready_to_create": false
}}"""

        try:
            response = await self.gateway.chat(
                prompt=prompt,
                task_type="ticket_intake",
                temperature=0.2,
                max_tokens=300,
                json_mode=True,
            )

            data = json.loads(response.text)

            return {
                "ticket_fields": data.get("ticket_fields", {}),
                "needs_ticket": data.get("needs_ticket", False),
                "missing_fields": data.get("missing_fields", []),
                "ready_to_create": data.get("ready_to_create", False),
                "usage": {
                    "provider": response.provider,
                    "model": response.model,
                    "input_tokens": response.input_tokens,
                    "output_tokens": response.output_tokens,
                    "latency_ms": response.latency_ms,
                },
            }
        except Exception as e:
            print(f"TicketExtractor error: {e}")
            return {
                "ticket_fields": {"title": body_text[:100], "ticket_type": "maintenance", "approval_required": False},
                "needs_ticket": True,
                "missing_fields": ["ticket_type", "category", "priority"],
                "ready_to_create": False,
                "usage": {"provider": "none", "model": "fallback", "input_tokens": 0, "output_tokens": 0, "latency_ms": 0},
            }
