"""
AI Usage Logger - tracks all AI model calls.
"""

from datetime import datetime, timezone
from typing import Optional
from core.database import get_db


class UsageLogger:
    """Logs AI usage to PostgreSQL ai_usage_logs table."""

    def __init__(self):
        self._cached_stats = {"total_calls": 0, "total_tokens": 0, "total_cost": 0.0}

    def log(
        self,
        conversation_id: int,
        provider: str,
        model: str,
        task_type: str,
        input_tokens: int = 0,
        output_tokens: int = 0,
        latency_ms: int = 0,
        estimated_cost: float = 0.0,
        user_id: Optional[int] = None,
        ticket_id: Optional[int] = None,
        status: str = "success",
        error_message: Optional[str] = None,
    ):
        """Record an AI usage entry."""
        try:
            db = get_db()
            db.execute(
                """
                INSERT INTO ai_usage_logs
                (conversation_id, user_id, ticket_id, provider, model, task_type,
                 input_tokens, output_tokens, estimated_cost, latency_ms, status, error_message, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    conversation_id, user_id, ticket_id, provider, model, task_type,
                    input_tokens, output_tokens, estimated_cost, latency_ms, status, error_message,
                    datetime.now(timezone.utc),
                ),
            )
            db.commit()

            # Update cached stats
            self._cached_stats["total_calls"] += 1
            self._cached_stats["total_tokens"] += input_tokens + output_tokens
            self._cached_stats["total_cost"] += estimated_cost

            # Budget check
            self._check_budget()

        except Exception as e:
            print(f"UsageLogger error: {e}")
            try:
                db.rollback()
            except Exception:
                pass
        finally:
            try:
                db.close()
            except Exception:
                pass

    def get_stats(self) -> dict:
        """Get current usage statistics."""
        try:
            db = get_db()
            result = db.execute("""
                SELECT
                    COUNT(*) as total_calls,
                    COALESCE(SUM(input_tokens + output_tokens), 0) as total_tokens,
                    COALESCE(SUM(estimated_cost), 0) as total_cost
                FROM ai_usage_logs
                WHERE created_at > NOW() - INTERVAL '30 days'
            """).fetchone()
            return {
                "total_calls": result[0],
                "total_tokens": result[1],
                "total_cost": float(result[2]),
            }
        except Exception:
            return self._cached_stats
        finally:
            try:
                db.close()
            except Exception:
                pass

    def _check_budget(self):
        """Check budget limits (simple in-memory check)."""
        # Budget limits from PRD:
        # Per user per day, per conversation per day, per tenant per month
        # For MVP: just warn on console if high usage
        if self._cached_stats["total_cost"] > 10.0:
            print(f"WARNING: AI usage cost exceeded $10.00 this session")
