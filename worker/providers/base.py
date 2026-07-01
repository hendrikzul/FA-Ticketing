"""
Base provider interface. All AI providers implement this.
"""

from abc import ABC, abstractmethod
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


@dataclass
class ToolCall:
    id: str
    name: str
    arguments: dict


class BaseProvider(ABC):
    """Abstract base for AI model providers."""

    @abstractmethod
    async def chat(
        self,
        model: str,
        messages: list[dict],
        tools: Optional[list[dict]] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        stream: bool = False,
    ) -> ModelResponse:
        ...

    @abstractmethod
    async def chat_stream(
        self,
        model: str,
        messages: list[dict],
        tools: Optional[list[dict]] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AsyncIterator[dict]:
        """Stream chat response. Yields: {"type": "token", "text": "..."} or 
        {"type": "tool_call", "tool": ToolCall} or {"type": "done", "usage": {...}}"""
        ...

    @abstractmethod
    def supports_tools(self) -> bool:
        ...

    @abstractmethod
    def list_models(self) -> list[str]:
        ...
