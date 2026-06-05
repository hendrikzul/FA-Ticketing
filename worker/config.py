"""
AICOP Worker configuration.
"""

import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "aicop-worker"
    debug: bool = True

    # Database
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql://aicop:aicop_secret@localhost:5432/aicop",
    )

    # Redis
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # Ollama
    ollama_host: str = os.getenv("OLLAMA_HOST", "localhost")
    ollama_port: str = os.getenv("OLLAMA_PORT", "11434")
    ollama_default_model: str = "qwen3:4b"

    # Model Gateway
    openai_api_key: str | None = os.getenv("OPENAI_API_KEY")
    anthropic_api_key: str | None = os.getenv("ANTHROPIC_API_KEY")

    class Config:
        env_file = ".env"


settings = Settings()
