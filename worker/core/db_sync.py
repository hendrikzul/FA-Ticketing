"""
Database sync utilities for Worker service.
Syncs AI results back to Laravel PostgreSQL database.
"""

from typing import Optional
from core.database import get_db


class DBSync:
    """Sync AI orchestrator results to the database."""

    @staticmethod
    def update_conversation_state(
        conversation_id: int,
        title: Optional[str] = None,
        priority: Optional[str] = None,
        category: Optional[str] = None,
        status: Optional[str] = None,
        current_summary: Optional[str] = None,
        missing_fields: Optional[list] = None,
        extracted_fields: Optional[dict] = None,
    ):
        """Update or create conversation state."""
        import json
        try:
            db = get_db()

            # Upsert conversation state
            existing = db.execute(
                "SELECT id FROM conversation_states WHERE conversation_id = %s",
                (conversation_id,),
            ).fetchone()

            if existing:
                updates = []
                params = []
                if title:
                    updates.append("title = %s")
                    params.append(title)
                if priority:
                    updates.append("priority = %s")
                    params.append(priority)
                if category:
                    updates.append("category = %s")
                    params.append(category)
                if status:
                    updates.append("status = %s")
                    params.append(status)
                if current_summary:
                    updates.append("current_summary = %s")
                    params.append(current_summary)
                if missing_fields is not None:
                    updates.append("missing_fields_json = %s")
                    params.append(json.dumps(missing_fields))
                if extracted_fields is not None:
                    updates.append("extracted_fields_json = %s")
                    params.append(json.dumps(extracted_fields))

                if updates:
                    updates.append("last_activity_at = NOW()")
                    params.append(conversation_id)
                    db.execute(
                        f"UPDATE conversation_states SET {', '.join(updates)} WHERE conversation_id = %s",
                        params,
                    )
            else:
                db.execute(
                    """
                    INSERT INTO conversation_states
                    (conversation_id, object_type, title, category, priority, status,
                     current_summary, missing_fields_json, extracted_fields_json, last_activity_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                    """,
                    (
                        conversation_id, "ticket", title, category, priority, status,
                        current_summary,
                        json.dumps(missing_fields) if missing_fields else None,
                        json.dumps(extracted_fields) if extracted_fields else None,
                    ),
                )

            db.commit()
        except Exception as e:
            print(f"DBSync error: {e}")
            try:
                db.rollback()
            except Exception:
                pass
        finally:
            try:
                db.close()
            except Exception:
                pass

    @staticmethod
    def save_ai_summary(
        conversation_id: int,
        summary_type: str,
        summary_text: str,
        memory_json: Optional[dict] = None,
    ):
        """Save AI-generated summary."""
        import json
        try:
            db = get_db()

            # Get current version
            current = db.execute(
                "SELECT MAX(version) FROM ai_summaries WHERE conversation_id = %s AND summary_type = %s",
                (conversation_id, summary_type),
            ).fetchone()
            version = (current[0] or 0) + 1

            db.execute(
                """
                INSERT INTO ai_summaries (conversation_id, summary_type, summary_text, memory_json, version)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (conversation_id, summary_type, summary_text, json.dumps(memory_json) if memory_json else None, version),
            )
            db.commit()
        except Exception as e:
            print(f"DBSync summary error: {e}")
            try:
                db.rollback()
            except Exception:
                pass
        finally:
            try:
                db.close()
            except Exception:
                pass

    @staticmethod
    def save_ai_extraction(
        conversation_id: int,
        message_id: Optional[int],
        extraction_type: str,
        input_context: dict,
        extracted_data: dict,
        model_used: str,
    ):
        """Save AI extraction result."""
        import json
        try:
            db = get_db()
            db.execute(
                """
                INSERT INTO ai_extractions (conversation_id, message_id, extraction_type,
                    input_context_json, extracted_data_json, model_used)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    conversation_id, message_id, extraction_type,
                    json.dumps(input_context), json.dumps(extracted_data), model_used,
                ),
            )
            db.commit()
        except Exception as e:
            print(f"DBSync extraction error: {e}")
            try:
                db.rollback()
            except Exception:
                pass
        finally:
            try:
                db.close()
            except Exception:
                pass

    @staticmethod
    def create_ticket(
        conversation_id: int,
        title: str,
        description: Optional[str] = None,
        category: Optional[str] = None,
        priority: str = "P3",
        status: str = "new",
        reported_by: Optional[int] = None,
        assigned_team_id: Optional[int] = None,
        assigned_user_id: Optional[int] = None,
        tags: Optional[list] = None,
    ) -> Optional[int]:
        """Create a ticket in the database. Returns ticket ID."""
        import json
        try:
            db = get_db()

            # Get next ticket number
            last = db.execute("SELECT MAX(id) FROM tickets").fetchone()
            next_id = (last[0] or 0) + 1
            ticket_number = f"TKT-{next_id:05d}"

            result = db.execute(
                """
                INSERT INTO tickets (conversation_id, ticket_number, title, description,
                    category, priority, status, reported_by, assigned_team_id, assigned_user_id, tags)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (
                    conversation_id, ticket_number, title, description,
                    category, priority, status, reported_by, assigned_team_id, assigned_user_id,
                    json.dumps(tags) if tags else None,
                ),
            )
            ticket_id = result.fetchone()[0]

            # Update conversation object reference
            db.execute(
                "UPDATE conversations SET object_type = 'ticket', object_id = %s WHERE id = %s",
                (ticket_id, conversation_id),
            )

            # Log audit
            db.execute(
                """
                INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
                VALUES (%s, 'created', 'ticket', %s, %s)
                """,
                (reported_by, ticket_id, json.dumps({"title": title, "priority": priority})),
            )

            db.commit()
            return ticket_id
        except Exception as e:
            print(f"DBSync create_ticket error: {e}")
            try:
                db.rollback()
            except Exception:
                pass
            return None
        finally:
            try:
                db.close()
            except Exception:
                pass
