"""
Conversation Summarizer Skill - AI-powered conversation summarization.
Generates and updates compressed summaries as conversation context.
"""

from gateway.model_gateway import ModelGateway
from core.db_sync import DBSync


class ConversationSummarizer:
    """Generate AI summaries of conversations."""

    def __init__(self, model_gateway: ModelGateway):
        self.gateway = model_gateway
        self._cache = {}  # Simple in-memory cache

    async def generate(self, conversation_id: int, messages: list) -> str:
        """Generate a full summary from a list of messages."""
        if not messages:
            return "No messages to summarize."

        # Take last 10 messages to keep context small
        recent = messages[-10:]
        messages_text = "\n".join([
            f"[{m.get('sender_type', 'unknown')}]: {m.get('body_text', '')[:300]}"
            for m in recent
        ])

        prompt = f"""Summarize this IT support conversation in 2-3 sentences. Include:
- What is the issue/request?
- What has been done so far?
- Current status

Conversation:
{messages_text}

Summary:"""

        try:
            response = await self.gateway.chat(
                prompt=prompt,
                task_type="summary",
                temperature=0.3,
                max_tokens=200,
            )

            summary = response.text.strip()

            # Save to database
            DBSync.save_ai_summary(
                conversation_id=conversation_id,
                summary_type="conversation",
                summary_text=summary,
                memory_json={
                    "message_count": len(messages),
                    "provider": response.provider,
                    "model": response.model,
                },
            )

            # Cache
            self._cache[conversation_id] = summary

            return summary
        except Exception as e:
            print(f"Summarizer error: {e}")
            return "Summary generation failed."

    async def generate_incremental(self, conversation_id: int, new_message: str) -> str:
        """Generate/update summary incrementally with a new message."""
        existing = self._cache.get(conversation_id, "")

        prompt = f"""Previous conversation summary: "{existing}"

New message: "{new_message}"

Update the summary to incorporate this new information. Keep it 2-3 sentences.
Updated summary:"""

        try:
            response = await self.gateway.chat(
                prompt=prompt,
                task_type="summary",
                temperature=0.3,
                max_tokens=200,
            )

            summary = response.text.strip()
            self._cache[conversation_id] = summary

            # Update conversation state with summary
            DBSync.update_conversation_state(
                conversation_id=conversation_id,
                current_summary=summary,
            )

            return summary
        except Exception as e:
            print(f"Incremental summarizer error: {e}")
            return existing

    async def get_or_generate(self, conversation_id: int) -> str:
        """Get cached summary or generate from DB."""
        cached = self._cache.get(conversation_id)
        if cached:
            return cached

        # Try to get from DB
        try:
            from core.database import get_db
            db = get_db()
            result = db.execute(
                "SELECT summary_text FROM ai_summaries WHERE conversation_id = %s ORDER BY version DESC LIMIT 1",
                (conversation_id,),
            ).fetchone()
            db.close()

            if result:
                self._cache[conversation_id] = result[0]
                return result[0]
        except Exception:
            pass

        return "No summary available."
