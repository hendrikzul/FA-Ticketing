"""
Skill Registry - Central skill management for AI Orchestrator.
Supports built-in skills + database-backed skills (from ai_skills table).
"""

import os
import subprocess
from typing import Dict, Any, Optional
from core.database import get_db


SKILLS_DIR = os.path.join(os.path.dirname(__file__), "db_skills")  # /worker/skills/db_skills


class SkillRegistry:
    """
    Registry of AI skills. Sources:
    1. Built-in skills (hardcoded)
    2. Database skills (ai_skills table) — auto-loaded at startup
    """

    def __init__(self, load_db: bool = True):
        self._skills: Dict[str, Any] = {}
        self._register_builtin_skills()
        if load_db:
            self._load_from_database()

    # ── Built-in Skills ────────────────────────────────────

    def _register_builtin_skills(self):
        self._skills = {
            "ticket_creator": {
                "name": "ticket_creator",
                "display_name": "Ticket Creator",
                "description": "Create tickets from natural language",
                "version": "1.0.0",
                "scope": "global",
                "source": "builtin",
                "enabled": True,
            },
            "ticket_classifier": {
                "name": "ticket_classifier",
                "display_name": "Ticket Classifier",
                "description": "Classify ticket category and priority",
                "version": "1.0.0",
                "scope": "global",
                "source": "builtin",
                "enabled": True,
            },
            "ticket_summarizer": {
                "name": "ticket_summarizer",
                "display_name": "Ticket Summarizer",
                "description": "Generate conversation and ticket summaries",
                "version": "1.0.0",
                "scope": "global",
                "source": "builtin",
                "enabled": True,
            },
            "reminder_agent": {
                "name": "reminder_agent",
                "display_name": "Reminder Agent",
                "description": "Auto-remind stale tickets and SLA breaches",
                "version": "1.0.0",
                "scope": "global",
                "source": "builtin",
                "enabled": False,
            },
            "search_interpreter": {
                "name": "search_interpreter",
                "display_name": "Search Interpreter",
                "description": "Convert natural language to structured search",
                "version": "1.0.0",
                "scope": "global",
                "source": "builtin",
                "enabled": False,
            },
        }

    # ── Database-backed Skills ──────────────────────────────

    def _load_from_database(self):
        """Load active skills from ai_skills table."""
        try:
            db = get_db()
            rows = db.execute(
                "SELECT id, name, display_name, description, github_url, version, "
                "entrypoint, scope, is_active, created_by "
                "FROM ai_skills WHERE is_active = true ORDER BY name"
            ).fetchall()

            for row in rows:
                skill_id, name, display_name, desc, github_url, version, \
                    entrypoint, scope, is_active, created_by = row

                # Skip if built-in skill already registered
                if name in self._skills:
                    continue

                skill_data = {
                    "id": str(skill_id),
                    "name": name,
                    "display_name": display_name,
                    "description": desc or "",
                    "github_url": github_url,
                    "version": version or "1.0.0",
                    "entrypoint": entrypoint,
                    "scope": scope or "global",
                    "source": "database",
                    "enabled": is_active if is_active is not None else True,
                }

                # Clone GitHub repo if needed
                if github_url:
                    self._ensure_cloned(name, github_url, version)

                self._skills[name] = skill_data

        except Exception as e:
            # Table might not exist yet — graceful degradation
            print(f"[SkillRegistry] DB load skipped: {e}")

    def _ensure_cloned(self, name: str, github_url: str, version: Optional[str] = None):
        """Clone/pull a GitHub skill repo into the db_skills directory."""
        os.makedirs(SKILLS_DIR, exist_ok=True)
        target = os.path.join(SKILLS_DIR, name)

        if os.path.isdir(target):
            # Already cloned — pull latest
            try:
                subprocess.run(
                    ["git", "pull", "--ff-only"],
                    cwd=target, capture_output=True, timeout=30,
                )
            except Exception as e:
                print(f"[SkillRegistry] git pull failed for {name}: {e}")
        else:
            # Clone
            try:
                ref = f"--branch={version}" if version and version != "1.0.0" else ""
                cmd = ["git", "clone", "--depth=1"]
                if ref:
                    cmd.append(ref)
                cmd.extend([github_url, target])
                subprocess.run(cmd, capture_output=True, timeout=60)
            except Exception as e:
                print(f"[SkillRegistry] git clone failed for {name}: {e}")

    def reload(self):
        """Reload skills from database (call after adding/removing skills)."""
        self._skills = {}
        self._register_builtin_skills()
        self._load_from_database()

    # ── Public API ──────────────────────────────────────────

    def list_skills(self) -> list:
        return [
            {
                "name": s["name"],
                "display_name": s.get("display_name", s["name"]),
                "description": s.get("description", ""),
                "version": s.get("version", "1.0.0"),
                "scope": s.get("scope", "global"),
                "source": s.get("source", "builtin"),
                "enabled": s.get("enabled", True),
            }
            for s in self._skills.values()
        ]

    def get(self, name: str) -> Optional[dict]:
        return self._skills.get(name)

    def enable(self, name: str):
        if name in self._skills:
            self._skills[name]["enabled"] = True

    def disable(self, name: str):
        if name in self._skills:
            self._skills[name]["enabled"] = False

    def is_enabled(self, name: str) -> bool:
        return self._skills.get(name, {}).get("enabled", False)

    def register_external(self, name: str, display_name: str, description: str,
                          entrypoint: str = None, github_url: str = None):
        """Register an external skill at runtime (not persisted to DB)."""
        self._skills[name] = {
            "name": name,
            "display_name": display_name,
            "description": description,
            "version": "1.0.0",
            "scope": "global",
            "source": "external",
            "entrypoint": entrypoint,
            "github_url": github_url,
            "enabled": True,
        }

    @property
    def enabled_skills(self) -> dict:
        """Return only enabled skills."""
        return {k: v for k, v in self._skills.items() if v.get("enabled", True)}

    def get_skill_prompts(self) -> str:
        """Generate a prompt block listing available skills for the LLM."""
        lines = []
        for s in self._skills.values():
            if s.get("enabled", True):
                lines.append(f"- {s['name']}: {s.get('description', '')}")
        return "\n".join(lines) if lines else "No skills available."


# Singleton
_skill_registry: Optional[SkillRegistry] = None


def get_skill_registry() -> SkillRegistry:
    global _skill_registry
    if _skill_registry is None:
        _skill_registry = SkillRegistry()
    return _skill_registry
