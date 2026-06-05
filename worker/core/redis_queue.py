"""
Redis Queue Integration for AICOP Worker.
Sends AI job results back and consumes incoming jobs.
"""

import json
import asyncio
import redis.asyncio as aioredis
from config import settings


class RedisQueue:
    """Redis queue client for AI job processing."""

    def __init__(self):
        self._redis: aioredis.Redis | None = None

    async def connect(self):
        """Connect to Redis."""
        self._redis = aioredis.from_url(settings.redis_url)
        await self._redis.ping()

    async def disconnect(self):
        """Disconnect from Redis."""
        if self._redis:
            await self._redis.close()

    async def push_job(self, job_type: str, data: dict):
        """Push an AI job to the queue."""
        if not self._redis:
            await self.connect()

        job = {"job_type": job_type, **data}
        await self._redis.lpush("aicop:ai_jobs", json.dumps(job))

    async def get_result(self, conversation_id: int, message_id: int) -> dict | None:
        """Get AI job result from Redis."""
        if not self._redis:
            await self.connect()

        key = f"aicop:ai_results:{conversation_id}:{message_id}"
        result = await self._redis.get(key)
        if result:
            return json.loads(result)
        return None

    async def consume(self, callback):
        """Continuously consume jobs from queue."""
        if not self._redis:
            await self.connect()

        while True:
            try:
                result = await self._redis.brpop("aicop:ai_jobs", timeout=5)
                if result:
                    _, job_data = result
                    job = json.loads(job_data)
                    await callback(job)
            except aioredis.ConnectionError:
                await asyncio.sleep(5)
            except Exception as e:
                print(f"Queue consumer error: {e}")
                await asyncio.sleep(1)

    async def enqueue_from_backend(self, job_type: str, conversation_id: int, **kwargs):
        """
        Called by Laravel backend to enqueue an AI job.
        Backend sends: POST to worker or pushes to Redis directly.
        """
        await self.push_job(job_type, {
            "conversation_id": conversation_id,
            **kwargs,
        })
