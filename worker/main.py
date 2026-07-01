"""
AICOP Worker - AI Orchestrator Service
Full API for AI processing pipeline.
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import asyncio

from config import settings
from orchestrator.engine import AIOrchestrator
from orchestrator.router import router as orchestrator_router
from gateway.model_gateway import ModelGateway
from skills.ticket_extractor import TicketExtractor
from skills.summarizer import ConversationSummarizer
from core.database import get_db_session
from core.usage_logger import UsageLogger

app = FastAPI(
    title="AICOP Worker",
    description="AI Orchestrator for AICOP platform",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register orchestrator router (@ai endpoint)
app.include_router(orchestrator_router)

# Initialize services
model_gateway: Optional[ModelGateway] = None
orchestrator: Optional[AIOrchestrator] = None
usage_logger: Optional[UsageLogger] = None


@app.on_event("startup")
async def startup():
    global model_gateway, orchestrator, usage_logger
    try:
        model_gateway = ModelGateway()
        await model_gateway.initialize()
        orchestrator = AIOrchestrator(model_gateway)
        usage_logger = UsageLogger()
        print("AICOP Worker started - AI Orchestrator ready", flush=True)
    except Exception as e:
        print(f"AI Orchestrator init failed: {e}", flush=True)

    # Start Redis consumer
    try:
        asyncio.create_task(run_redis_consumer())
    except Exception as e:
        print(f"Redis consumer start failed: {e}", flush=True)


# ============================================
# Request/Response Models
# ============================================

class ChatMessage(BaseModel):
    conversation_id: int
    message_id: int
    sender_id: int
    body_text: str


class ExtractionResult(BaseModel):
    intent: str
    confidence: float
    ticket_fields: Optional[dict] = None
    missing_fields: list[str] = []
    suggested_actions: list[str] = []
    summary_update: Optional[str] = None
    clarifying_question: Optional[str] = None


class AIJobRequest(BaseModel):
    job_type: str  # process_message, generate_summary, extract_ticket, process_ai_mention
    conversation_id: int
    message_id: Optional[int] = None
    body_text: Optional[str] = None
    sender_id: Optional[int] = None
    parent_id: Optional[int] = None
    conversation_context: Optional[dict] = None


class AIJobResponse(BaseModel):
    status: str
    result: Optional[dict] = None
    usage: Optional[dict] = None


# ============================================
# Health & Info
# ============================================

@app.get("/health")
async def health():
    ollama_ok = await model_gateway.check_ollama() if model_gateway else False
    return {
        "status": "ok",
        "service": "aicop-worker",
        "ollama": "connected" if ollama_ok else "disconnected",
    }


@app.get("/")
async def root():
    return {"message": "AICOP Worker - AI Orchestrator", "version": "0.2.0"}


# ============================================
# Core AI Pipeline
# ============================================

@app.post("/api/process-message", response_model=ExtractionResult)
async def process_message(msg: ChatMessage):
    """
    Process an incoming message through the AI Orchestrator.
    Called by Redis consumer or backend directly.
    """
    if not orchestrator:
        raise HTTPException(status_code=503, detail="Orchestrator not initialized")

    result = await orchestrator.process_message(msg.dict())

    # Log usage
    if usage_logger and result.get("usage"):
        usage_logger.log(
            conversation_id=msg.conversation_id,
            provider=result["usage"]["provider"],
            model=result["usage"]["model"],
            task_type="message_processing",
            input_tokens=result["usage"]["input_tokens"],
            output_tokens=result["usage"]["output_tokens"],
            latency_ms=result["usage"]["latency_ms"],
        )

    return result


@app.post("/api/process-job", response_model=AIJobResponse)
async def process_job(job: AIJobRequest, background_tasks: BackgroundTasks):
    """
    Process queued AI job from Redis.
    Job types: process_message, generate_summary, extract_ticket, suggest_actions
    """
    if not orchestrator:
        raise HTTPException(status_code=503, detail="Orchestrator not initialized")

    if job.job_type == "process_message":
        result = await orchestrator.process_message({
            "conversation_id": job.conversation_id,
            "message_id": job.message_id,
            "sender_id": job.sender_id,
            "body_text": job.body_text,
        })
        return AIJobResponse(status="completed", result=result)

    elif job.job_type == "generate_summary":
        summary = await orchestrator.summarizer.generate(
            conversation_id=job.conversation_id,
            messages=job.conversation_context.get("messages", []) if job.conversation_context else [],
        )
        return AIJobResponse(status="completed", result={"summary": summary})

    elif job.job_type == "extract_ticket":
        ticket = await orchestrator.ticket_extractor.extract(
            body_text=job.body_text,
            conversation_id=job.conversation_id,
        )
        return AIJobResponse(status="completed", result={"ticket": ticket})

    elif job.job_type == "process_ai_mention":
        # Handle @ai mention: call orchestrator, save reply to DB
        from orchestrator.router import get_orchestrator as get_ai_orchestrator
        ai_orch = get_ai_orchestrator()
        result = await ai_orch.ask(
            message=job.body_text,
            conversation_id=job.conversation_id,
            user_id=job.sender_id or 0,
            parent_id=job.parent_id,
        )
        # Save AI reply to DB using the connection pool
        try:
            from core.database import SessionLocal
            from sqlalchemy import text
            import json
            db = SessionLocal()
            thread_parent = job.parent_id if job.parent_id else job.message_id
            db.execute(
                text(
                    """INSERT INTO messages (conversation_id, parent_id, sender_type, sender_id, message_type, body_text, body_json, created_at, updated_at)
                       VALUES (:cid, :pid, 'ai_bot', NULL, 'text', :body, :json, NOW(), NOW())"""
                ),
                {"cid": job.conversation_id, "pid": thread_parent, "body": result["text"],
                 "json": json.dumps({"tools_used": result.get("tools_used", []), "usage": result.get("usage", {})})}
            )
            db.commit()
            db.close()
            print(f"AI reply saved for msg {job.message_id}", flush=True)
        except Exception as e:
            print(f"Failed to save AI reply: {e}", flush=True)
        return AIJobResponse(status="completed", result=result)

    elif job.job_type == "suggest_actions":
        actions = await orchestrator.suggest_actions(
            conversation_id=job.conversation_id,
            state=job.conversation_context.get("state", {}) if job.conversation_context else {},
        )
        return AIJobResponse(status="completed", result={"actions": actions})

    else:
        raise HTTPException(status_code=400, detail=f"Unknown job type: {job.job_type}")


@app.get("/api/conversations/{conversation_id}/summary")
async def get_summary(conversation_id: int):
    """Get or generate conversation summary."""
    if not orchestrator:
        raise HTTPException(status_code=503, detail="Orchestrator not initialized")
    summary = await orchestrator.summarizer.get_or_generate(conversation_id)
    return {"conversation_id": conversation_id, "summary": summary}


@app.get("/api/models")
async def list_models():
    """List available AI models."""
    if not model_gateway:
        raise HTTPException(status_code=503, detail="Model gateway not initialized")
    models = await model_gateway.list_models()
    return {"models": models}


@app.get("/api/stats")
async def get_stats():
    """Get AI usage statistics."""
    if not usage_logger:
        return {"total_calls": 0, "total_tokens": 0, "total_cost": 0}
    stats = usage_logger.get_stats()
    return stats


# ============================================
# Redis Queue Consumer (background)
# ============================================

async def run_redis_consumer():
    """Continuously consume AI jobs from Redis queue."""
    import redis.asyncio as aioredis

    try:
        r = aioredis.from_url(settings.redis_url)
        print(f"Redis consumer started: {settings.redis_url}")

        while True:
            try:
                # Block until job available
                result = await r.brpop("aicop:ai_jobs", timeout=5)
                if result:
                    _, job_data = result
                    import json
                    job = json.loads(job_data)
                    print(f"Processing job: {job.get('job_type')} for conv {job.get('conversation_id')}")

                    try:
                        ai_job = AIJobRequest(**job)
                        response = await process_job(ai_job, BackgroundTasks())
                        # Store result
                        result_key = f"aicop:ai_results:{job.get('conversation_id')}:{job.get('message_id')}"
                        await r.setex(result_key, 3600, json.dumps(response.dict()))
                    except Exception as e:
                        print(f"Job processing error: {e}")
                        # Re-enqueue failed job so it's not lost
                        try:
                            await r.lpush("aicop:ai_jobs", job_data)
                        except Exception:
                            pass
            except aioredis.ConnectionError:
                print("Redis connection error, retrying...")
                await asyncio.sleep(5)
            except Exception as e:
                print(f"Consumer error: {e}")
                await asyncio.sleep(1)
    except Exception as e:
        print(f"Failed to start Redis consumer: {e}")
        # Don't crash the app, just log