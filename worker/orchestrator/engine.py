"""
AI Orchestrator Engine - Central AI decision-making unit.
Handles intent detection, routing, and coordination.
"""

import json
import re
from typing import Optional
from gateway.model_gateway import ModelGateway, ModelResponse
from skills.ticket_extractor import TicketExtractor
from skills.summarizer import ConversationSummarizer
from core.db_sync import DBSync


SYSTEM_PROMPT = """You are the AICOP AI Orchestrator, an operations AI for an IT collaboration platform.

Your responsibilities:
1. Classify user intent from messages
2. Extract structured ticket information
3. Ask clarifying questions when data is missing
4. Generate conversation summaries
5. Suggest operational actions

Rules:
- Never invent operational facts
- If data is missing, ask a single clarifying question
- Return JSON for extraction tasks
- Be concise and professional
- Work in English and Bahasa Indonesia
- All staff requests to IT start as conversations
- A ticket type is not a ticket status
- Ticket types: bugfix, development, maintenance

Available intents:
- create_ticket: User wants to create a ticket/request
- report_issue: User is reporting an incident/problem
- ask_question: User is asking for help/information
- provide_info: User is providing additional information
- status_check: User is asking about ticket status
- general_chat: General conversation, no action needed
"""


class AIOrchestrator:
    """
    Central AI Orchestrator for AICOP.
    Coordinates between Model Gateway, Skills, and Database.
    """

    def __init__(self, model_gateway: ModelGateway):
        self.gateway = model_gateway
        self.ticket_extractor = TicketExtractor(model_gateway)
        self.summarizer = ConversationSummarizer(model_gateway)

    async def process_message(self, msg: dict) -> dict:
        """
        Main processing pipeline for a new message.
        
        Steps:
        1. Classify intent
        2. Based on intent, run appropriate skill
        3. Update database state
        """
        conversation_id = msg.get("conversation_id")
        message_id = msg.get("message_id")
        body_text = msg.get("body_text", "")
        sender_id = msg.get("sender_id")

        # Step 1: Classify intent
        intent_result = await self._classify_intent(body_text)

        result = {
            "intent": intent_result["intent"],
            "confidence": intent_result["confidence"],
            "ticket_fields": None,
            "missing_fields": [],
            "suggested_actions": [],
            "summary_update": None,
            "clarifying_question": None,
            "usage": {
                "provider": intent_result.get("provider", "ollama"),
                "model": intent_result.get("model", "qwen3:4b"),
                "input_tokens": intent_result.get("input_tokens", 0),
                "output_tokens": intent_result.get("output_tokens", 0),
                "latency_ms": intent_result.get("latency_ms", 0),
            },
        }

        # Step 2: Route based on intent
        if intent_result["intent"] in ("create_ticket", "report_issue"):
            extraction = await self.ticket_extractor.extract(body_text, conversation_id)
            result["ticket_fields"] = extraction.get("ticket_fields", {})
            result["missing_fields"] = extraction.get("missing_fields", [])
            result["needs_ticket"] = extraction.get("needs_ticket", False)

            if extraction.get("needs_ticket"):
                fields = extraction["ticket_fields"]
                approval_required = bool(fields.get("approval_required", False))
                draft_status = "waiting_approval" if approval_required else "new"

                ticket_id = DBSync.create_ticket(
                    conversation_id=conversation_id,
                    title=fields.get("title", body_text[:100]),
                    description=body_text,
                    ticket_type=fields.get("ticket_type"),
                    category=fields.get("category"),
                    priority=fields.get("priority", "P3"),
                    status=draft_status,
                    is_draft=True,
                    approval_required=approval_required,
                    reported_by=sender_id,
                )

                if ticket_id:
                    result["suggested_actions"].append(f"Draft ticket #{ticket_id} created")
                    result["ticket_fields"]["ticket_id"] = ticket_id

                DBSync.update_conversation_state(
                    conversation_id=conversation_id,
                    object_type="ticket",
                    needs_ticket=True,
                    title=fields.get("title"),
                    priority=fields.get("priority"),
                    category=fields.get("category"),
                    ticket_type=fields.get("ticket_type"),
                    approval_required=approval_required,
                    status=draft_status,
                    missing_fields=extraction.get("missing_fields", []),
                    extracted_fields=fields,
                )

            if extraction.get("missing_fields"):
                # Generate clarifying question
                question = await self._generate_clarifying_question(
                    body_text, extraction["missing_fields"]
                )
                result["clarifying_question"] = question
            elif extraction.get("needs_ticket"):
                result["suggested_actions"].append("Draft ready for IT triage")
            else:
                DBSync.update_conversation_state(
                    conversation_id=conversation_id,
                    object_type=None,
                    needs_ticket=False,
                    title=body_text[:100],
                    current_summary=body_text[:500],
                    missing_fields=[],
                    extracted_fields=extraction.get("ticket_fields", {}),
                )

            # Save extraction
            if extraction.get("usage"):
                usage = extraction["usage"]
                result["usage"]["input_tokens"] += usage.get("input_tokens", 0)
                result["usage"]["output_tokens"] += usage.get("output_tokens", 0)

            DBSync.save_ai_extraction(
                conversation_id=conversation_id,
                message_id=message_id,
                extraction_type="ticket_extraction",
                input_context={"body_text": body_text, "intent": intent_result["intent"]},
                extracted_data=extraction,
                model_used=extraction.get("usage", {}).get("model", "qwen3:4b"),
            )

        elif intent_result["intent"] == "provide_info":
            # When user provides more info, re-evaluate missing fields
            result["suggested_actions"] = ["Update ticket with provided information"]

        elif intent_result["intent"] == "status_check":
            result["suggested_actions"] = ["Show ticket status"]

        elif intent_result["intent"] == "ask_question":
            result["suggested_actions"] = ["Search knowledge base"]

        else:
            # general_chat - no special action
            pass

        # Step 3: Generate summary update (if enough context)
        if body_text and len(body_text) > 30:
            try:
                summary = await self.summarizer.generate_incremental(
                    conversation_id, body_text
                )
                if summary:
                    result["summary_update"] = summary
            except Exception:
                pass

        # Step 4: Suggest actions based on state
        actions = await self._suggest_actions(conversation_id, intent_result["intent"])
        result["suggested_actions"].extend(actions)

        return result

    async def _classify_intent(self, text: str) -> dict:
        """
        Classify user intent from message text.
        Uses lightweight rules + LLM for ambiguous cases.
        """
        # Quick rule-based checks first (save tokens)
        text_lower = text.lower()

        if re.search(r'error|bug|crash|down|500|502|503|timeout|gagal|rusak', text_lower):
            return {"intent": "report_issue", "confidence": 0.85, "provider": "ollama", "model": "qwen3:4b",
                    "input_tokens": 0, "output_tokens": 0, "latency_ms": 0}

        if re.search(r'tolong|mohon|bisa bantu|please|request|minta|butuh|perlu|develop|fitur|improve|maintenance|perbaikan', text_lower):
            return {"intent": "create_ticket", "confidence": 0.85, "provider": "ollama", "model": "qwen3:4b",
                    "input_tokens": 0, "output_tokens": 0, "latency_ms": 0}

        if re.search(r'status|progress|update|bagaimana|how|kapan|when', text_lower) and len(text) < 100:
            return {"intent": "status_check", "confidence": 0.80, "provider": "ollama", "model": "qwen3:4b",
                    "input_tokens": 0, "output_tokens": 0, "latency_ms": 0}

        # For ambiguous cases, use LLM
        prompt = f"""Classify the user intent from this message. Return ONLY a JSON with keys: intent, confidence.

Intents: create_ticket, report_issue, ask_question, provide_info, status_check, general_chat

Message: "{text}"

Return JSON: {{"intent": "...", "confidence": 0.0}}"""

        try:
            response = await self.gateway.chat(
                prompt=prompt,
                task_type="classification",
                temperature=0.2,
                max_tokens=100,
                json_mode=True,
            )

            data = json.loads(response.text)
            return {
                "intent": data.get("intent", "general_chat"),
                "confidence": data.get("confidence", 0.7),
                "provider": response.provider,
                "model": response.model,
                "input_tokens": response.input_tokens,
                "output_tokens": response.output_tokens,
                "latency_ms": response.latency_ms,
            }
        except Exception as e:
            print(f"Intent classification error: {e}")
            return {"intent": "general_chat", "confidence": 0.5, "provider": "none", "model": "fallback",
                    "input_tokens": 0, "output_tokens": 0, "latency_ms": 0}

    async def _generate_clarifying_question(self, text: str, missing_fields: list) -> str:
        """Generate a clarifying question for missing ticket fields."""
        fields_str = ", ".join(missing_fields)
        prompt = f"""A user sent: "{text}"

To create a ticket, we need: {fields_str}

Ask ONE concise clarifying question in the user's language (English or Bahasa Indonesia).
Keep it friendly and professional. Just return the question, nothing else."""

        try:
            response = await self.gateway.chat(
                prompt=prompt,
                task_type="clarifying_question",
                temperature=0.5,
                max_tokens=100,
            )
            return response.text.strip()
        except Exception:
            return f"Could you please provide more information about: {', '.join(missing_fields)}?"

    async def _suggest_actions(self, conversation_id: int, intent: str) -> list:
        """Suggest next actions based on conversation context."""
        actions = []

        if intent in ("create_ticket", "report_issue"):
            actions.extend([
                "Review Draft Ticket",
                "Set Ticket Type",
                "Set Priority",
                "Assign to Team",
            ])

        return actions

    async def suggest_actions(self, conversation_id: int, state: dict) -> list:
        """Generate AI-suggested actions for a conversation (for Sprint 04)."""
        return await self._suggest_actions(conversation_id, state.get("status", "active"))
