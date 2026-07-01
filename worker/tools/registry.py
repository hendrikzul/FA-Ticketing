"""
Tools for the AI Orchestrator.
Each tool is a function that the AI agent can call.
"""

import re
import httpx
from core.db_sync import DBSync


# ── Tool Registry ──────────────────────────────────────────

class ToolRegistry:
    """Registry of tools available to AI agents."""

    def __init__(self):
        self._tools: dict[str, dict] = {}
        self._register_defaults()

    def _register_defaults(self):
        self._tools = {
            "search_tickets": {
                "function": search_tickets,
                "definition": {
                    "type": "function",
                    "function": {
                        "name": "search_tickets",
                        "description": "Cari tiket yang mirip berdasarkan keyword, termasuk tiket open dan closed. Gunakan ini sebelum membuat tiket baru untuk cek apakah sudah ada tiket serupa.",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "query": {
                                    "type": "string",
                                    "description": "Keyword atau topik yang dicari, misal: 'checkout error', 'login bug'",
                                },
                            },
                            "required": ["query"],
                        },
                    },
                },
            },
            "get_ticket": {
                "function": get_ticket,
                "definition": {
                    "type": "function",
                    "function": {
                        "name": "get_ticket",
                        "description": "Ambil detail lengkap satu tiket berdasarkan ID-nya.",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "ticket_id": {
                                    "type": "integer",
                                    "description": "ID tiket yang ingin dilihat",
                                },
                            },
                            "required": ["ticket_id"],
                        },
                    },
                },
            },
            "create_ticket": {
                "function": create_ticket,
                "definition": {
                    "type": "function",
                    "function": {
                        "name": "create_ticket",
                        "description": "Buat tiket baru. Hanya panggil ini jika sudah yakin tidak ada tiket open yang mirip DAN user sudah konfirmasi.",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "title": {"type": "string", "description": "Judul tiket"},
                                "description": {"type": "string", "description": "Deskripsi detail tiket"},
                                "ticket_type": {
                                    "type": "string",
                                    "enum": ["bugfix", "development", "maintenance"],
                                    "description": "Tipe tiket",
                                },
                                "priority": {
                                    "type": "string",
                                    "enum": ["P0", "P1", "P2", "P3", "P4"],
                                    "description": "Prioritas: P0=critical system down, P1=high, P2=medium, P3=low, P4=trivial",
                                },
                                "category": {"type": "string", "description": "Kategori (opsional)"},
                                "conversation_id": {"type": "integer", "description": "ID conversation"},
                                "reported_by": {"type": "integer", "description": "User ID pelapor"},
                            },
                            "required": ["title", "description", "ticket_type", "priority"],
                        },
                    },
                },
            },
            "get_chat_context": {
                "function": get_chat_context,
                "definition": {
                    "type": "function",
                    "function": {
                        "name": "get_chat_context",
                        "description": "Ambil konteks percakapan terbaru (pesan-pesan sebelumnya) untuk memahami situasi. Jika ada parent_id, hanya ambil pesan dalam thread itu.",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "conversation_id": {
                                    "type": "integer",
                                    "description": "ID conversation",
                                },
                                "parent_id": {
                                    "type": "integer",
                                    "description": "ID parent message untuk ambil thread spesifik (opsional). Jika diberikan, hanya ambil parent + replies dalam thread.",
                                },
                                "limit": {
                                    "type": "integer",
                                    "description": "Jumlah pesan terakhir yg diambil (default 15)",
                                },
                            },
                            "required": ["conversation_id"],
                        },
                    },
                },
            },
            "web_search": {
                "function": web_search,
                "definition": {
                    "type": "function",
                    "function": {
                        "name": "web_search",
                        "description": "Cari di internet (DuckDuckGo) dan kembalikan hasil pencarian. Gunakan untuk mencari informasi terkini, dokumentasi, error message, atau topik apapun.",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "query": {
                                    "type": "string",
                                    "description": "Kata kunci pencarian",
                                },
                            },
                            "required": ["query"],
                        },
                    },
                },
            },
            "fetch_url": {
                "function": fetch_url,
                "definition": {
                    "type": "function",
                    "function": {
                        "name": "fetch_url",
                        "description": "Ambil dan baca konten dari sebuah URL (HTML akan di-strip jadi plain text). Gunakan untuk membaca dokumentasi, artikel, atau halaman web yang URL-nya sudah diketahui.",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "url": {
                                    "type": "string",
                                    "description": "URL lengkap yang ingin dibaca, misal: https://example.com/docs",
                                },
                            },
                            "required": ["url"],
                        },
                    },
                },
            },
            "auto_assign_developers": {
                "function": auto_assign_developers,
                "definition": {
                    "type": "function",
                    "function": {
                        "name": "auto_assign_developers",
                        "description": "Auto-assign developer ke tiket yang baru dibuat. Mencari 1 backend, 1 frontend, dan 1 mobile developer (jika relevan) dengan workload terendah. Panggil SETELAH create_ticket berhasil.",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "ticket_id": {
                                    "type": "integer",
                                    "description": "ID tiket yang baru dibuat",
                                },
                                "conversation_id": {
                                    "type": "integer",
                                    "description": "ID conversation sumber tiket",
                                },
                            },
                            "required": ["ticket_id", "conversation_id"],
                        },
                    },
                },
            },
        }

    def get_definitions(self) -> list[dict]:
        """Get OpenAI-format tool definitions."""
        return [t["definition"] for t in self._tools.values()]

    async def execute(self, name: str, arguments: dict) -> dict:
        """Execute a tool by name."""
        tool = self._tools.get(name)
        if not tool:
            return {"error": f"Tool '{name}' not found"}
        try:
            result = await tool["function"](**arguments)
            return {"success": True, "data": result}
        except Exception as e:
            return {"success": False, "error": str(e)}


# ── Tool Functions ──────────────────────────────────────────

async def search_tickets(query: str) -> dict:
    """Search for similar tickets by keyword."""
    sql = """
        SELECT id, title, status, priority, ticket_type, 
               created_at, updated_at
        FROM tickets
        WHERE (title ILIKE :p1 OR description ILIKE :p2)
          AND deleted_at IS NULL
        ORDER BY 
            CASE status 
                WHEN 'new' THEN 1 
                WHEN 'in_progress' THEN 2 
                WHEN 'waiting_approval' THEN 3
                WHEN 'waiting' THEN 4
                WHEN 'closed' THEN 5
            END,
            updated_at DESC
        LIMIT 5
    """
    pattern = f"%{query}%"
    rows = DBSync.query(sql, {"p1": pattern, "p2": pattern})
    return {
        "query": query,
        "found": len(rows),
        "tickets": [
            {
                "id": r[0], "title": r[1], "status": r[2],
                "priority": r[3], "ticket_type": r[4],
                "created_at": str(r[5]), "updated_at": str(r[6]),
            }
            for r in rows
        ],
    }


async def get_ticket(ticket_id: int) -> dict:
    """Get full ticket details."""
    sql = """
        SELECT id, title, description, status, priority, ticket_type,
               category, approval_required, created_at, updated_at
        FROM tickets WHERE id = :tid AND deleted_at IS NULL
    """
    row = DBSync.query_one(sql, {"tid": ticket_id})
    if not row:
        return {"error": f"Ticket #{ticket_id} not found"}
    return {
        "id": row[0], "title": row[1], "description": row[2],
        "status": row[3], "priority": row[4], "ticket_type": row[5],
        "category": row[6], "approval_required": row[7],
        "created_at": str(row[8]), "updated_at": str(row[9]),
    }


async def create_ticket(
    title: str, description: str, ticket_type: str, priority: str,
    category: str = None, conversation_id: int = None, reported_by: int = None,
) -> dict:
    """Create a new ticket."""
    # Validate priority
    valid_priorities = {"P0", "P1", "P2", "P3", "P4"}
    if priority not in valid_priorities:
        priority = "P3"  # default fallback

    ticket_id = DBSync.create_ticket(
        conversation_id=conversation_id,
        title=title,
        description=description,
        ticket_type=ticket_type,
        category=category,
        priority=priority,
        status="new",
        reported_by=reported_by,
    )
    if ticket_id:
        return {"ticket_id": ticket_id, "title": title, "status": "new", "priority": priority}
    return {"error": "Failed to create ticket"}


async def get_chat_context(conversation_id: int, parent_id: int = None, limit: int = 15) -> dict:
    """Get recent messages from a conversation, optionally scoped to a thread."""
    if parent_id is not None:
        # Thread-aware: ambil parent message + semua reply dalam thread
        sql = """
            SELECT m.sender_id, m.body_text, m.created_at, m.parent_id
            FROM messages m
            WHERE m.conversation_id = :cid
              AND (m.id = :pid OR m.parent_id = :pid2)
            ORDER BY m.created_at ASC
            LIMIT :lim
        """
        rows = DBSync.query(sql, {"cid": conversation_id, "pid": parent_id, "pid2": parent_id, "lim": limit})
    else:
        # No thread: ambil pesan terbaru dari conversation
        sql = """
            SELECT m.sender_id, m.body_text, m.created_at, m.parent_id
            FROM messages m
            WHERE m.conversation_id = :cid
            ORDER BY m.created_at DESC
            LIMIT :lim
        """
        rows = DBSync.query(sql, {"cid": conversation_id, "lim": limit})
        rows = list(reversed(rows))

    return {
        "conversation_id": conversation_id,
        "parent_id": parent_id,
        "messages": [
            {"sender_id": r[0], "text": r[1], "time": str(r[2]), "parent_id": r[3]}
            for r in rows
        ],
    }


async def auto_assign_developers(ticket_id: int, conversation_id: int) -> dict:
    """
    Auto-assign developers to a ticket with workload-based selection.
    Assigns 1 backend, 1 frontend, and optionally 1 mobile developer.
    """
    assigned = {}

    # ── Helper: find least-loaded developer in a division ──
    def find_dev(division_keywords: list[str]) -> dict | None:
        """Find the least-loaded active developer from divisions matching keywords."""
        keyword_patterns = " OR ".join([f"d.name ILIKE :kw{i}" for i in range(len(division_keywords))])
        params = {f"kw{i}": f"%{kw}%" for i, kw in enumerate(division_keywords)}

        sql = f"""
            SELECT u.id, u.name, u.username, d.name as division_name,
                   COALESCE(t_count.open_tickets, 0) as workload
            FROM users u
            JOIN division_members dm ON dm.user_id = u.id
            JOIN divisions d ON d.id = dm.division_id
            LEFT JOIN (
                SELECT assigned_user_id, COUNT(*) as open_tickets
                FROM tickets
                WHERE status NOT IN ('closed', 'resolved')
                  AND deleted_at IS NULL
                  AND assigned_user_id IS NOT NULL
                GROUP BY assigned_user_id
            ) t_count ON t_count.assigned_user_id = u.id
            WHERE u.is_active = true
              AND u.deleted_at IS NULL
              AND ({keyword_patterns})
            ORDER BY workload ASC, u.name ASC
            LIMIT 1
        """

        row = DBSync.query_one(sql, params)
        if not row:
            return None
        return {
            "user_id": row[0],
            "name": row[1],
            "username": row[2],
            "division": row[3],
            "workload": int(row[4]),
        }

    # ── Assign: Backend ──
    backend = find_dev(["backend", "back-end", "engineering", "eng"])
    if backend:
        DBSync.create_ticket_assignment(
            ticket_id=ticket_id,
            assigned_to=backend["user_id"],
            note=f"Auto-assigned: {backend['division']} (workload: {backend['workload']})"
        )
        assigned["backend"] = backend

    # ── Assign: Frontend ──
    frontend = find_dev(["frontend", "front-end", "web", "fe"])
    if frontend:
        DBSync.create_ticket_assignment(
            ticket_id=ticket_id,
            assigned_to=frontend["user_id"],
            note=f"Auto-assigned: {frontend['division']} (workload: {frontend['workload']})"
        )
        assigned["frontend"] = frontend

    # ── Assign: Mobile ──
    mobile = find_dev(["mobile", "android", "ios", "flutter", "react native"])
    if mobile:
        DBSync.create_ticket_assignment(
            ticket_id=ticket_id,
            assigned_to=mobile["user_id"],
            note=f"Auto-assigned: {mobile['division']} (workload: {mobile['workload']})"
        )
        assigned["mobile"] = mobile

    return {
        "ticket_id": ticket_id,
        "assigned": assigned,
        "summary": {
            role: {"name": dev["name"], "division": dev["division"], "workload": dev["workload"]}
            for role, dev in assigned.items()
        },
    }


# ── Web Browsing Tools (Obscura) ──────────────────────────

OBSCURA = "http://host.docker.internal:9779/mcp"
_RPC_ID = 0


async def _mcp(method: str, params: dict = None) -> dict:
    """Call Obscura MCP JSON-RPC endpoint."""
    global _RPC_ID
    _RPC_ID += 1
    try:
        async with httpx.AsyncClient(timeout=25) as c:
            r = await c.post(OBSCURA, json={"jsonrpc": "2.0", "id": _RPC_ID, "method": method, "params": params or {}})
            if r.status_code != 200:
                return {"error": f"MCP HTTP {r.status_code}"}
            data = r.json()
            if "error" in data:
                return {"error": data["error"].get("message", str(data["error"]))}
            return data.get("result", {})
    except Exception as e:
        return {"error": str(e)}


async def web_search(query: str) -> dict:
    """Search via Obscura: navigate Google, extract snapshot."""
    import urllib.parse
    try:
        # Navigate to Google search
        nav = await _mcp("tools/call", {"name": "browser_navigate", "arguments": {
            "url": f"https://www.google.com/search?q={urllib.parse.quote(query)}&hl=en",
            "waitUntil": "networkidle0",
        }})
        if nav.get("error"):
            return {"query": query, "found": 0, "results": [], "note": nav["error"]}

        # Get page content
        snap = await _mcp("tools/call", {"name": "browser_snapshot", "arguments": {}})
        content = snap.get("content", [])
        text = ""
        if isinstance(content, list):
            for item in content:
                if isinstance(item, dict):
                    text += item.get("text", "") + " "
                elif isinstance(item, str):
                    text += item + " "
        elif isinstance(content, str):
            text = content

        # Parse results from snapshot text
        results = []
        lines = text.split("\n")
        for line in lines[:50]:
            line = line.strip()
            if len(line) > 20:
                results.append({"title": line[:120], "url": "", "snippet": line[:300]})

        return {"query": query, "found": len(results), "results": results, "_engine": "obscura (Google)"}
    except Exception as e:
        return {"query": query, "found": 0, "results": [], "note": str(e)}


async def fetch_url(url: str) -> dict:
    """Fetch URL via Obscura: navigate + snapshot."""
    try:
        nav = await _mcp("tools/call", {"name": "browser_navigate", "arguments": {
            "url": url, "waitUntil": "networkidle0",
        }})
        if nav.get("error"):
            return {"error": nav["error"], "url": url}

        snap = await _mcp("tools/call", {"name": "browser_snapshot", "arguments": {}})
        content = snap.get("content", [])
        text = ""
        if isinstance(content, list):
            for item in content:
                if isinstance(item, dict):
                    text += item.get("text", "") + " "
                elif isinstance(item, str):
                    text += item + " "
        elif isinstance(content, str):
            text = content

        if len(text) > 5000:
            text = text[:5000] + "..."
        return {"url": url, "content": text, "length": len(text), "_engine": "obscura"}
    except Exception as e:
        return {"error": str(e), "url": url}
