"""
Pluggable Model Gateway — routes to the right provider.
Supports: deepseek, openai, anthropic, ollama.
"""

import os
from typing import Optional, AsyncIterator
from providers.base import BaseProvider, ModelResponse
from providers.deepseek import DeepSeekProvider


class ModelGateway:
    """Multi-provider gateway with model routing."""

    # Default model per task type — ganti via env atau config
    DEFAULT_MODELS = {
        "orchestrator": os.getenv("ORCHESTRATOR_DEFAULT_MODEL", "deepseek:deepseek-chat"),
        "ticket": os.getenv("TICKET_DEFAULT_MODEL", "deepseek:deepseek-chat"),
        "summary": os.getenv("SUMMARY_DEFAULT_MODEL", "deepseek:deepseek-chat"),
        "analysis": os.getenv("ANALYSIS_DEFAULT_MODEL", "deepseek:deepseek-reasoner"),
    }

    def __init__(self):
        self._providers: dict[str, BaseProvider] = {}
        self._register_defaults()

    def _register_defaults(self):
        """Register available providers based on env config."""
        if os.getenv("DEEPSEEK_API_KEY"):
            self._providers["deepseek"] = DeepSeekProvider()
        # OpenAI, Anthropic, Ollama will be refactored similarly

    def register(self, name: str, provider: BaseProvider):
        self._providers[name] = provider

    def get_provider(self, name: str) -> Optional[BaseProvider]:
        return self._providers.get(name)

    def list_providers(self) -> list[str]:
        return list(self._providers.keys())

    def list_all_models(self) -> list[dict]:
        models = []
        for name, provider in self._providers.items():
            for model in provider.list_models():
                models.append({"provider": name, "model": model})
        return models

    def resolve_model(self, model_spec: Optional[str] = None, task: str = "orchestrator") -> tuple[BaseProvider, str]:
        """Resolve provider + model from spec or task default."""
        spec = model_spec or self.DEFAULT_MODELS.get(task, "deepseek:deepseek-chat")
        provider_name, model_id = spec.split(":", 1)
        provider = self._providers.get(provider_name)
        if not provider:
            raise ValueError(f"Provider '{provider_name}' not configured. Set {provider_name.upper()}_API_KEY env.")
        return provider, model_id

    async def chat(
        self,
        messages: list[dict],
        model: Optional[str] = None,
        task: str = "orchestrator",
        tools: Optional[list[dict]] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> ModelResponse:
        provider, model_id = self.resolve_model(model, task)
        return await provider.chat(model_id, messages, tools, temperature, max_tokens)

    async def chat_stream(
        self,
        messages: list[dict],
        model: Optional[str] = None,
        task: str = "orchestrator",
        tools: Optional[list[dict]] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AsyncIterator[dict]:
        provider, model_id = self.resolve_model(model, task)
        async for chunk in provider.chat_stream(model_id, messages, tools, temperature, max_tokens):
            yield chunk
