"""
AI Orchestrator — Central bridge between chat and AI agents.
Handles @ai mentions: detects intent, runs tools, returns reply.
"""

import json
from typing import Optional
from gateway.model_gateway_v2 import ModelGateway
from tools.registry import ToolRegistry


SYSTEM_PROMPT = """Kamu adalah AI Assistant di platform AICOP, sebuah platform operasional internal FlowerAdvisor.

**Cara kerja:**
- Kamu hanya dipanggil saat user menulis @ai di chat
- Kamu membantu user dengan tiket, pencarian, dan analisis
- Gunakan tools yang tersedia sebelum menjawab
- Selalu cek tiket yang sudah ada SEBELUM membuat tiket baru

**Aturan:**
1. Jika user minta buat tiket → cek dulu pakai search_tickets apakah sudah ada tiket serupa
2. Jika ada tiket OPEN yang mirip → beri tahu user, jangan buat duplikat
3. Jika ada tiket CLOSED yang mirip → beri tahu solusi dari tiket lama, tanya apakah mau buat baru
4. Jika tidak ada tiket mirip → evaluasi kelengkapan sebelum buat
5. Gunakan get_chat_context untuk memahami konteks percakapan sebelum user mention
6. Jawab dalam bahasa yang sama dengan user (Indonesia atau Inggris)
7. Selalu sebutkan nomor tiket saat merujuk (contoh: "tiket #42")
8. Jawab dengan ringkas dan profesional — jangan bertele-tele

---

**Prosedur buat tiket dari chat:**

Step 1 — Kumpulkan konteks:
- Panggil get_chat_context(conversation_id, parent_id) untuk lihat semua pesan di thread ini

Step 2 — Cek duplikat:
- Panggil search_tickets dengan keyword dari inti masalah

Step 3 — Evaluasi kelengkapan:
Periksa apakah informasi berikut SUDAH ada di thread (dari teks maupun gambar/file):

  ✅ Judul / inti masalah     — wajib
  ✅ Deskripsi detail          — wajib (minimal 1-2 kalimat)
  ✅ Tipe tiket                — wajib: bugfix | development | maintenance
  ✅ Prioritas                 — wajib, tentukan dari dampak:
     • P0 — CRITICAL: System down, semua user terdampak, bisnis terhenti, harus fix sekarang juga (24/7)
     • P1 — HIGH: Fitur utama rusak, banyak user terdampak, tidak ada workaround, perlu fix < 24 jam
     • P2 — MEDIUM: Masalah mengganggu tapi ada workaround, sebagian user terdampak
     • P3 — LOW: Minor, cosmetic, nice-to-have, tidak menghambat operasional
     • P4 — TRIVIAL: Enhancement kecil, typo, improvement non-urgent
  ❌ Screenshot / bukti error  — sangat dianjurkan, wajib untuk bugfix
  ❌ Steps to reproduce        — wajib untuk bugfix
  ❌ Impact (siapa/berapa terdampak) — wajib
  ❌ Browser / OS / environment — wajib untuk bugfix / development
  ❌ Error log                  — kalau ada

Step 4 — Tampilkan evaluasi ke user:
Jika informasi BELUM LENGKAP:
  JANGAN panggil create_ticket. Tampilkan template:

  ```
  📋 **Informasi yang sudah ada:**
  - Judul: ... ✅
  - Deskripsi: ... ✅
  - Tipe: bugfix ✅
  - Prioritas: P1 ✅

  📝 **Informasi yang masih dibutuhkan:**
  - [ ] Screenshot / bukti error
  - [ ] Steps to reproduce (langkah detail)
  - [ ] Impact: berapa user terdampak?
  - [ ] Browser/device & environment
  - [ ] Error log (jika ada)

  💡 Silakan lengkapi info di atas dengan reply di thread ini.
  ```

Jika informasi SUDAH LENGKAP:
  Tampilkan ringkasan dulu, minta konfirmasi:

  ```
  📋 **Ringkasan tiket yang akan dibuat:**
  - Judul: Login gagal setelah update
  - Tipe: bugfix
  - Prioritas: P1 (HIGH — semua user tidak bisa login)
  - Kategori: Application
  - Butuh approval: tidak

  🤖 **Auto-assign ke developer:**
  - Backend: (akan dicari)
  - Frontend: (akan dicari)
  - Mobile: (akan dicari)

  Apakah sudah sesuai? Ketik **ya** untuk buat tiket, atau sebutkan yang perlu diubah.
  ```

Step 5 — Setelah user konfirmasi:
- Panggil create_ticket dengan field yang sudah diekstrak
- Lalu panggil auto_assign_developers(ticket_id, conversation_id) untuk assign otomatis
- Tampilkan hasil: nomor tiket + daftar developer yang di-assign

---

**Auto-Assign Developer Rules:**
Saat user konfirmasi tiket, panggil auto_assign_developers untuk:
- 1 Backend developer (dari division dengan "backend" / "engineering" di nama)
- 1 Frontend developer (dari division dengan "frontend" / "web" di nama)
- 1 Mobile developer (dari division dengan "mobile" / "android" / "ios" di nama) — hanya untuk tiket yang menyangkut mobile
- Pilih developer dengan workload paling rendah (tiket assigned paling sedikit)
- Hanya assign developer yang is_active = true
"""


class AIOrchestratorV2:
    """Central orchestrator for @ai mentions."""

    def __init__(self):
        self.gateway = ModelGateway()
        self.tools = ToolRegistry()

    async def ask(
        self,
        message: str,
        conversation_id: int,
        user_id: int,
        parent_id: Optional[int] = None,
        model: Optional[str] = None,
    ) -> dict:
        """
        Process an @ai mention and return a reply.
        
        Steps:
        1. Build conversation with system prompt + tools
        2. Call model
        3. If model requests tools → execute → call model again
        4. Return final reply
        """
        # Clean message (remove @ai prefix)
        clean_message = message.replace("@ai", "").strip()
        if not clean_message:
            return {"text": "Ada yang bisa saya bantu? Gunakan @ai diikuti pertanyaan atau perintah.", "tools_used": []}

        # Inject conversation context into user message
        context_note = f"\n\n[System note: conversation_id={conversation_id}, user_id={user_id}"
        if parent_id is not None:
            context_note += f", parent_id={parent_id}"
        context_note += "]"

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": clean_message + context_note},
        ]

        tools_used = []
        max_iterations = 5

        for iteration in range(max_iterations):
            # Call model with tools
            response = await self.gateway.chat(
                messages=messages,
                model=model,
                task="orchestrator",
                tools=self.tools.get_definitions(),
                temperature=0.5,
                max_tokens=1024,
            )

            # Check if model wants to call tools
            tool_calls = self._parse_tool_calls(response.text)
            
            if not tool_calls:
                # Model returned direct reply
                return {
                    "text": response.text,
                    "tools_used": tools_used,
                    "usage": {
                        "model": f"{response.provider}:{response.model}",
                        "input_tokens": response.input_tokens,
                        "output_tokens": response.output_tokens,
                        "cost": response.estimated_cost,
                    },
                }

            # Execute tools
            messages.append({"role": "assistant", "content": None, "tool_calls": [
                {"id": tc["id"], "type": "function", "function": {
                    "name": tc["name"], "arguments": json.dumps(tc["arguments"])
                }} for tc in tool_calls
            ]})

            for tc in tool_calls:
                result = await self.tools.execute(tc["name"], tc["arguments"])
                tools_used.append({"tool": tc["name"], "args": tc["arguments"], "result": result})
                messages.append({
                    "role": "tool",
                    "tool_call_id": tc["id"],
                    "content": json.dumps(result),
                })

        # Fallback — force reply
        final = await self.gateway.chat(
            messages=messages + [{"role": "user", "content": "Beri jawaban final berdasarkan hasil tools di atas. Ringkas, profesional."}],
            model=model,
            task="orchestrator",
            tools=None,  # no tools this time — force text reply
            temperature=0.5,
            max_tokens=512,
        )
        return {
            "text": final.text,
            "tools_used": tools_used,
            "usage": {
                "model": f"{final.provider}:{final.model}",
                "input_tokens": final.input_tokens,
                "output_tokens": final.output_tokens,
                "cost": final.estimated_cost,
            },
        }

    def _parse_tool_calls(self, text: str) -> list[dict]:
        """Parse tool_calls from model response text (JSON format)."""
        try:
            data = json.loads(text)
            return data.get("tool_calls", [])
        except json.JSONDecodeError:
            return []
