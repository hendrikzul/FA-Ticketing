"""
Orchestrator API endpoints — handles @ai mentions.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from orchestrator.engine_v2 import AIOrchestratorV2

router = APIRouter(prefix="/api/orchestrator", tags=["orchestrator"])

# Singleton
_orchestrator: Optional[AIOrchestratorV2] = None


def get_orchestrator() -> AIOrchestratorV2:
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = AIOrchestratorV2()
    return _orchestrator


class AskRequest(BaseModel):
    message: str
    conversation_id: int
    user_id: int
    parent_id: Optional[int] = None
    model: Optional[str] = None  # e.g. "deepseek:deepseek-chat"


class AskResponse(BaseModel):
    text: str
    tools_used: list = []
    usage: dict = {}


@router.post("/ask", response_model=AskResponse)
async def ask(req: AskRequest):
    """Process @ai mention and return reply."""
    if not req.message.strip():
        raise HTTPException(400, "Message is empty")

    orchestrator = get_orchestrator()
    result = await orchestrator.ask(
        message=req.message,
        conversation_id=req.conversation_id,
        user_id=req.user_id,
        parent_id=req.parent_id,
        model=req.model,
    )
    return AskResponse(
        text=result["text"],
        tools_used=result.get("tools_used", []),
        usage=result.get("usage", {}),
    )
