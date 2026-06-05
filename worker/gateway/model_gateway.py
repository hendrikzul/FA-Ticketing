"""
Model Gateway - Provider abstraction layer.
Routes AI calls to the appropriate provider (Ollama, OpenAI, Anthropic).
"""

import time
import httpx
from typing import Optional, AsyncIterator
from dataclasses import dataclass


@dataclass
class ModelResponse:
    text: str
    provider: str
    model: str
    input_tokens: int
    output_tokens: int
    latency_ms: int
    estimated_cost: float


class ModelGateway:
    """
    Multi-provider AI gateway.
    - Ollama: local models (qwen3:4b, qwen3:8b)
    - OpenAI: cloud models (gpt-4.1)
    - Anthropic: cloud models (claude)
    """

    def __init__(self):
        self._ollama_base = "http://localhost:11434"
        self._openai_api_key = None
        self._anthropic_api_key = None
        self._client = None
        self._model_registry = {
            # Task -> preferred models in priority order
            "classification": ["ollama:qwen3:4b"],
            "ticket_intake": ["ollama:qwen3:4b"],
            "summary": ["ollama:qwen3:4b"],
            "complex_intake": ["ollama:qwen3:8b"],
            "routing": ["ollama:qwen3:8b"],
            "clarifying_question": ["ollama:qwen3:4b"],
            "suggested_actions": ["ollama:qwen3:4b"],
            "rca": ["ollama:qwen3:8b"],  # cloud optional
            "critical_incident": ["ollama:qwen3:8b"],  # cloud optional
        }

    async def initialize(self):
        """Initialize HTTP client and check connections."""
        import os
        self._client = httpx.AsyncClient(timeout=60.0)
        self._ollama_base = f"http://{os.getenv('OLLAMA_HOST', 'localhost')}:{os.getenv('OLLAMA_PORT', '11434')}"
        self._openai_api_key = os.getenv("OPENAI_API_KEY")
        self._anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")

    async def check_ollama(self) -> bool:
        """Check if Ollama is reachable."""
        try:
            if not self._client:
                self._client = httpx.AsyncClient(timeout=10.0)
            resp = await self._client.get(f"{self._ollama_base}/api/tags")
            return resp.status_code == 200
        except Exception:
            return False

    async def list_models(self) -> list:
        """List available models from all providers."""
        models = []

        # Ollama
        try:
            resp = await self._client.get(f"{self._ollama_base}/api/tags")
            if resp.status_code == 200:
                for m in resp.json().get("models", []):
                    models.append({"provider": "ollama", "model": m["name"], "status": "available"})
        except Exception:
            models.append({"provider": "ollama", "model": "qwen3:4b", "status": "unavailable"})

        # OpenAI (check if key configured)
        if self._openai_api_key:
            models.append({"provider": "openai", "model": "gpt-4.1", "status": "configured"})

        # Anthropic
        if self._anthropic_api_key:
            models.append({"provider": "anthropic", "model": "claude-sonnet-4-20250514", "status": "configured"})

        return models

    async def chat(
        self,
        prompt: str,
        task_type: str = "classification",
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 512,
        json_mode: bool = False,
    ) -> ModelResponse:
        """
        Send chat completion request through appropriate provider.
        Tries models in priority order, falls back on failure.
        """
        preferred_models = self._model_registry.get(task_type, ["ollama:qwen3:4b"])

        start_time = time.time()

        for model_spec in preferred_models:
            provider, model = model_spec.split(":", 1)

            try:
                if provider == "ollama":
                    result = await self._ollama_chat(prompt, model, system_prompt, temperature, max_tokens, json_mode)
                elif provider == "openai" and self._openai_api_key:
                    result = await self._openai_chat(prompt, model, system_prompt, temperature, max_tokens, json_mode)
                elif provider == "anthropic" and self._anthropic_api_key:
                    result = await self._anthropic_chat(prompt, model, system_prompt, temperature, max_tokens, json_mode)
                else:
                    continue

                latency = int((time.time() - start_time) * 1000)
                return ModelResponse(
                    text=result["text"],
                    provider=provider,
                    model=model,
                    input_tokens=result.get("input_tokens", len(prompt.split())),
                    output_tokens=result.get("output_tokens", len(result["text"].split())),
                    latency_ms=latency,
                    estimated_cost=0.0 if provider == "ollama" else self._estimate_cost(
                        provider, model, result.get("input_tokens", 0), result.get("output_tokens", 0)
                    ),
                )

            except Exception as e:
                print(f"Model {model_spec} failed: {e}, trying next...")
                continue

        # All models failed - return error response
        latency = int((time.time() - start_time) * 1000)
        return ModelResponse(
            text="I apologize, but I'm unable to process your request at the moment. Please try again later.",
            provider="none",
            model="fallback",
            input_tokens=len(prompt.split()),
            output_tokens=20,
            latency_ms=latency,
            estimated_cost=0.0,
        )

    async def _ollama_chat(
        self, prompt: str, model: str, system_prompt: Optional[str],
        temperature: float, max_tokens: int, json_mode: bool
    ) -> dict:
        """Chat with Ollama local model."""
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
        }

        if json_mode:
            payload["format"] = "json"

        resp = await self._client.post(
            f"{self._ollama_base}/api/chat", json=payload
        )

        if resp.status_code != 200:
            raise Exception(f"Ollama error: {resp.text}")

        data = resp.json()
        return {
            "text": data["message"]["content"],
            "input_tokens": data.get("prompt_eval_count", 0),
            "output_tokens": data.get("eval_count", 0),
        }

    async def pull_model(self, model_name: str) -> bool:
        """Pull a model from Ollama."""
        try:
            resp = await self._client.post(
                f"{self._ollama_base}/api/pull",
                json={"name": model_name, "stream": False},
                timeout=300.0,
            )
            return resp.status_code == 200
        except Exception as e:
            print(f"Failed to pull model {model_name}: {e}")
            return False

    async def _openai_chat(
        self, prompt: str, model: str, system_prompt: Optional[str],
        temperature: float, max_tokens: int, json_mode: bool
    ) -> dict:
        """Chat with OpenAI API."""
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        resp = await self._client.post(
            "https://api.openai.com/v1/chat/completions",
            json=payload,
            headers={"Authorization": f"Bearer {self._openai_api_key}"},
        )

        data = resp.json()
        return {
            "text": data["choices"][0]["message"]["content"],
            "input_tokens": data["usage"]["prompt_tokens"],
            "output_tokens": data["usage"]["completion_tokens"],
        }

    async def _anthropic_chat(
        self, prompt: str, model: str, system_prompt: Optional[str],
        temperature: float, max_tokens: int, json_mode: bool
    ) -> dict:
        """Chat with Anthropic API."""
        payload = {
            "model": model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": [{"role": "user", "content": prompt}],
        }

        if system_prompt:
            payload["system"] = system_prompt

        resp = await self._client.post(
            "https://api.anthropic.com/v1/messages",
            json=payload,
            headers={
                "x-api-key": self._anthropic_api_key,
                "anthropic-version": "2023-06-01",
            },
        )

        data = resp.json()
        return {
            "text": data["content"][0]["text"],
            "input_tokens": data["usage"]["input_tokens"],
            "output_tokens": data["usage"]["output_tokens"],
        }

    def _estimate_cost(self, provider: str, model: str, input_tokens: int, output_tokens: int) -> float:
        """Estimate API cost."""
        rates = {
            "openai": {"gpt-4.1": (2.50, 10.00)},  # $/1M input, $/1M output
            "anthropic": {"claude-sonnet-4-20250514": (3.00, 15.00)},
        }
        provider_rates = rates.get(provider, {})
        model_rates = provider_rates.get(model, (0, 0))
        return (input_tokens / 1_000_000) * model_rates[0] + (output_tokens / 1_000_000) * model_rates[1]