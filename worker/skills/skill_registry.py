"""
Skill Registry - Central skill management for AI Orchestrator.
Allows adding/removing skills without changing core system.
"""

from typing import Dict, Any
import importlib


class SkillRegistry:
    """
    Registry of AI skills that can be dynamically loaded.
    Supports local skills and external (GitHub) skills.
    """

    def __init__(self):
        self._skills: Dict[str, Any] = {}
        self._register_default_skills()

    def _register_default_skills(self):
        """Register built-in MVP skills."""
        self._skills = {
            "ticket_creator": {
                "name": "ticket_creator",
                "description": "Create tickets from natural language",
                "version": "1.0.0",
                "enabled": True,
            },
            "ticket_classifier": {
                "name": "ticket_classifier",
                "description": "Classify ticket category and priority",
                "version": "1.0.0",
                "enabled": True,
            },
            "ticket_summarizer": {
                "name": "ticket_summarizer",
                "description": "Generate conversation and ticket summaries",
                "version": "1.0.0",
                "enabled": True,
            },
            "reminder_agent": {
                "name": "reminder_agent",
                "description": "Auto-remind stale tickets and SLA breaches",
                "version": "1.0.0",
                "enabled": False,  # Sprint 04
            },
            "search_interpreter": {
                "name": "search_interpreter",
                "description": "Convert natural language to structured search",
                "version": "1.0.0",
                "enabled": False,  # Sprint 04
            },
        }

    def list_skills(self) -> list:
        """List all registered skills."""
        return [
            {"name": s["name"], "description": s["description"], "version": s["version"], "enabled": s["enabled"]}
            for s in self._skills.values()
        ]

    def enable(self, name: str):
        if name in self._skills:
            self._skills[name]["enabled"] = True

    def disable(self, name: str):
        if name in self._skills:
            self._skills[name]["enabled"] = False

    def is_enabled(self, name: str) -> bool:
        return self._skills.get(name, {}).get("enabled", False)

    def register_external(self, name: str, description: str, entrypoint: str):
        """Register an external skill (from GitHub, etc)."""
        self._skills[name] = {
            "name": name,
            "description": description,
            "version": "1.0.0",
            "enabled": True,
            "entrypoint": entrypoint,
            "external": True,
        }
