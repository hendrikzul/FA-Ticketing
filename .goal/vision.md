# AICOP Vision

Membangun platform internal dengan tiga workspace utama: `Chat` untuk komunikasi antar member, `AI Desk` sebagai single front door untuk permintaan ke IT, dan `Tickets` untuk eksekusi operasional yang terstruktur.

## Prinsip Utama

> Human chat stays human. IT intake starts in AI Desk. AI decides what operational object should be created.

Dalam AICOP, tidak semua conversation memiliki fungsi yang sama. `Chat` dipakai untuk komunikasi antar manusia seperti WhatsApp Web. `AI Desk` dipakai untuk semua permintaan ke IT seperti ChatGPT. Dari AI Desk, AI Orchestrator menentukan apakah thread membutuhkan ticket draft, lalu mengusulkan ticket type seperti **bugfix**, **development**, atau **maintenance** sebelum work dieksekusi di `Tickets`.

## Tujuan Utama

1. User tidak perlu mengisi form panjang untuk meminta bantuan IT.
2. Semua permintaan ke IT dimulai dari AI Desk dengan natural language.
3. AI mengubah percakapan AI Desk menjadi data terstruktur dan ticket draft bila dibutuhkan.
4. AI dapat bertanya jika data kurang.
5. AI dapat membantu search, reminder, summary, routing, dan rekomendasi tindakan.
6. Staff dan manager dapat berkomunikasi lewat Chat, intake lewat AI Desk, dan bekerja lewat Tickets.
7. Ticket type dan status dipisahkan dengan jelas agar workflow scalable.
8. Sistem hemat token dan database tetap efisien.
9. Stack awal sederhana: frontend, backend, worker, PostgreSQL, Redis, Ollama.

## Product Philosophy

### Model AICOP

```text
Member Chat -> Human Conversation
IT Request -> AI Desk Thread -> AI Orchestrator -> Draft Ticket / KB / Reminder / Action
```

## Final Statement

AICOP is not just a ticketing application. AICOP is a split-workspace collaboration platform where human chat stays lightweight, AI Desk turns IT requests into structured draft work, and IT teams manage execution through Tickets.
