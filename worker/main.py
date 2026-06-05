"""
AICOP Worker - AI Orchestrator Service
Python FastAPI application managing AI operations.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="AICOP Worker",
    description="AI Orchestrator for AICOP platform",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "aicop-worker"}


@app.get("/")
async def root():
    return {"message": "AICOP Worker - AI Orchestrator", "version": "0.1.0"}
