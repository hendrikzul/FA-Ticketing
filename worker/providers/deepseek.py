"""
DeepSeek provider — OpenAI-compatible API.
Supports: deepseek-chat, deepseek-reasoner.
"""

import time
import os
from typing import Optional, AsyncIterator
import httpx
from .base import BaseProvider, ModelResponse, ToolCall


class DeepSeekProvider(BaseProvider):
    def __init__(self):
        self.api_key = os.getenv("DEEPSEEK_API_KEY", "")
        self.base_url = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1")
        self._client: Optional[httpx.AsyncClient] = None
        self._models = ["deepseek-chat", "deepseek-reasoner"]

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                timeout=120.0,
            )
        return self._client

    def list_models(self) -> list[str]:
        return self._models[:]

    def supports_tools(self) -> bool:
        return True

    async def chat(
        self,
        model: str = "deepseek-chat",
        messages: list[dict] = None,
        tools: Optional[list[dict]] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        stream: bool = False,
    ) -> ModelResponse:
        client = await self._get_client()
        start = time.time()

        payload = {
            "model": model,
            "messages": messages or [],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": False,
        }
        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = "auto"

        resp = await client.post("/chat/completions", json=payload)
        data = resp.json()

        if resp.status_code != 200:
            raise Exception(f"DeepSeek error {resp.status_code}: {data}")

        choice = data["choices"][0]
        msg = choice["message"]
        latency = int((time.time() - start) * 1000)

        text = msg.get("content", "") or ""
        
        # Handle tool calls in non-streaming mode
        if msg.get("tool_calls"):
            tool_calls = []
            for tc in msg["tool_calls"]:
                import json
                tool_calls.append(ToolCall(
                    id=tc["id"],
                    name=tc["function"]["name"],
                    arguments=json.loads(tc["function"]["arguments"]),
                ))
            text = json.dumps({"tool_calls": [
                {"id": t.id, "name": t.name, "arguments": t.arguments}
                for t in tool_calls
            ]})

        usage = data.get("usage", {})
        return ModelResponse(
            text=text,
            provider="deepseek",
            model=model,
            input_tokens=usage.get("prompt_tokens", 0),
            output_tokens=usage.get("completion_tokens", 0),
            latency_ms=latency,
            estimated_cost=self._estimate_cost(model, usage),
        )

    async def chat_stream(
        self,
        model: str = "deepseek-chat",
        messages: list[dict] = None,
        tools: Optional[list[dict]] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AsyncIterator[dict]:
        client = await self._get_client()

        payload = {
            "model": model,
            "messages": messages or [],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True,
        }
        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = "auto"

        tool_calls_buffer: dict = {}
        async with client.stream("POST", "/chat/completions", json=payload) as resp:
            async for line in resp.aiter_lines():
                if not line.startswith("data: "):
                    continue
                data_str = line[6:]
                if data_str == "[DONE]":
                    yield {"type": "done", "usage": {}}
                    break

                import json
                data = json.loads(data_str)
                delta = data.get("choices", [{}])[0].get("delta", {})

                if delta.get("content"):
                    yield {"type": "token", "text": delta["content"]}

                if delta.get("tool_calls"):
                    for tc in delta["tool_calls"]:
                        idx = tc.get("index", 0)
                        if idx not in tool_calls_buffer:
                            tool_calls_buffer[idx] = {"id": tc.get("id", ""), "name": "", "arguments": ""}
                        if tc.get("function", {}).get("name"):
                            tool_calls_buffer[idx]["name"] = tc["function"]["name"]
                        if tc.get("function", {}).get("arguments"):
                            tool_calls_buffer[idx]["arguments"] += tc["function"]["arguments"]

                finish = choice.get("finish_reason") if (choice := data.get("choices", [{}])[0]) else None
                if finish == "tool_calls" and tool_calls_buffer:
                    for tc in tool_calls_buffer.values():
                        yield {
                            "type": "tool_call",
                            "tool": ToolCall(
                                id=tc["id"],
                                name=tc["name"],
                                arguments=json.loads(tc["arguments"]),
                            ),
                        }
                    tool_calls_buffer = {}

    def _estimate_cost(self, model: str, usage: dict) -> float:
        prices = {
            "deepseek-chat": (0.14, 0.28),      # input, output per 1M tokens
            "deepseek-reasoner": (0.55, 2.19),
        }
        inp_price, out_price = prices.get(model, (0.14, 0.28))
        inp_cost = usage.get("prompt_tokens", 0) / 1_000_000 * inp_price
        out_cost = usage.get("completion_tokens", 0) / 1_000_000 * out_price
        return round(inp_cost + out_cost, 6)
