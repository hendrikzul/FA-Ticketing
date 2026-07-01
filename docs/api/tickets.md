# Tickets API

## Overview

Tickets API menyediakan CRUD lengkap untuk tiket, termasuk manajemen status, assignment, komentar, dan attachment.

**Base URL:** `/api/tickets`

**Authentication:** Bearer token via `Authorization` header.

---

## Endpoints

### 1. List Tickets

```
GET /api/tickets
```

Mengembalikan daftar tiket dengan filter opsional. Default urutan: `created_at DESC`, paginasi 20 per halaman.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter by status. Lihat [Ticket Status](#ticket-status) |
| `ticket_type` | string | `bugfix`, `development`, `maintenance` |
| `priority` | string | `P1`, `P2`, `P3`, `P4` |
| `assigned_to` | int | User ID yang di-assign |
| `team_id` | int | Division ID |
| `reported_by` | int | User ID pelapor |
| `q` | string | Search di `title`, `description`, `ticket_number` (ILIKE) |
| `group_by` | string | `status` — mengelompokkan hasil per kolom Kanban |
| `page` | int | Halaman yang diminta (default: 1) |
| `per_page` | int | Jumlah per halaman (default: 20) |

**Response (list):**
```json
{
  "data": [
    {
      "id": 1,
      "ticket_number": "TKT-00001",
      "title": "Fix checkout timeout",
      "ticket_type": "bugfix",
      "category": "Payment",
      "priority": "P1",
      "status": "in_progress",
      "is_draft": false,
      "approval_required": false,
      "reported_by": 3,
      "assigned_user_id": 5,
      "assigned_team_id": 2,
      "due_at": null,
      "resolved_at": null,
      "closed_at": null,
      "tags": ["checkout", "payment"],
      "created_at": "2026-06-20T08:00:00Z",
      "updated_at": "2026-06-20T09:30:00Z",
      "reporter": { "id": 3, "name": "John Doe" },
      "assigned_user": { "id": 5, "name": "Jane Smith" },
      "assigned_team": { "id": 2, "name": "DevOps" }
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "total": 1
  }
}
```

**Response (group_by=status):**
```json
{
  "data": {
    "new": [],
    "triaged": [],
    "waiting_approval": [],
    "queued": [],
    "in_progress": [{ "..." }],
    "waiting_user": [],
    "waiting_vendor": [],
    "resolved": [],
    "closed": [],
    "rejected": [],
    "cancelled": []
  }
}
```

---

### 2. Create Ticket

```
POST /api/tickets
```

Membuat tiket baru secara manual (non-AI). Auto-generate `ticket_number` format `TKT-XXXXX`.

**Request Body (JSON):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | ✅ | Max 255 karakter |
| `description` | string | | Deskripsi tiket |
| `ticket_type` | string | ✅ | `bugfix`, `development`, `maintenance` |
| `category` | string | | Kategori bebas |
| `priority` | string | | Default `P4` |
| `assigned_user_id` | int | | ID user yang di-assign |
| `assigned_team_id` | int | | ID divisi |
| `tags` | array | | Array string tag |
| `due_at` | date | | Due date ISO 8601 |

**Multipart upload:** Jika ada file, gunakan `multipart/form-data` dengan field `files[]`.

**Side effects:**
- Audit log: `created`
- Notifikasi ke assignee (jika ada)
- Notifikasi ke reporter
- File attachment disimpan di `ticket-attachments/`

**Response:** `201 Created`
```json
{
  "data": {
    "id": 42,
    "ticket_number": "TKT-00042",
    "title": "Memory leak in worker",
    "status": "new",
    "priority": "P1",
    "reporter": { "id": 3, "name": "John Doe" },
    "assigned_user": { "id": 5, "name": "Jane Smith" },
    "assigned_team": { "id": 2, "name": "DevOps" }
  }
}
```

---

### 3. Show Ticket Detail

```
GET /api/tickets/{ticket}
```

Mengembalikan detail tiket lengkap dengan relasi.

**Eager-loaded relations:**
- `reporter` (id, name, username, email)
- `assignedUser` (id, name, username, email)
- `assignedTeam` (id, name)
- `assignments.assignedTo` (id, name)
- `assignments.assignedBy` (id, name)
- `comments.user` (id, name, username, avatar_url)
- `conversation.messages` (20 terbaru, ASC)

**Response:** `200 OK`
```json
{
  "data": {
    "id": 42,
    "ticket_number": "TKT-00042",
    "title": "Memory leak in worker",
    "description": "Worker OOM after 10k jobs",
    "ticket_type": "bugfix",
    "category": "Infrastructure",
    "priority": "P1",
    "status": "in_progress",
    "is_draft": false,
    "approval_required": false,
    "reporter": { "id": 3, "name": "John Doe", "username": "john", "email": "john@example.com" },
    "assigned_user": { "id": 5, "name": "Jane Smith", "username": "jane", "email": "jane@example.com" },
    "assigned_team": { "id": 2, "name": "DevOps" },
    "status_history": [
      { "id": 1, "from_status": "new", "to_status": "in_progress", "changed_by": 5, "created_at": "..." }
    ],
    "assignments": [
      { "id": 1, "assigned_to": { "id": 5, "name": "Jane Smith" }, "assigned_by": { "id": 1, "name": "Admin" }, "created_at": "..." }
    ],
    "comments": [
      { "id": 1, "body_text": "Investigating...", "user": { "id": 5, "name": "Jane Smith" }, "attachment_name": null, "created_at": "..." }
    ],
    "conversation": {
      "messages": []
    },
    "created_at": "2026-06-20T08:00:00Z",
    "updated_at": "2026-06-25T16:00:00Z"
  }
}
```

---

### 4. Update Ticket Fields

```
PUT /api/tickets/{ticket}
```

Update field tiket (partial). Hanya field yang dikirim yang diubah.

**Request Body (JSON):**

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | |
| `description` | string | |
| `ticket_type` | string | `bugfix`, `development`, `maintenance` |
| `category` | string | |
| `priority` | string | `P1`, `P2`, `P3`, `P4` |
| `assigned_user_id` | int | |
| `assigned_team_id` | int | |
| `approval_required` | boolean | |
| `tags` | array | |
| `due_at` | date | |

**Side effects:**
- Assignment baru → record di `ticket_assignments`
- Sync ke `conversation_states` jika ada `conversation_id`

> ⚠️ **Gunakan endpoint spesifik untuk status dan assignment.** `PATCH /api/tickets/{id}/status` untuk ganti status, `POST /api/tickets/{id}/assign` untuk assign. Kedua endpoint khusus ini mencatat history, mengirim notifikasi, dan menangani side-effect yang tidak dilakukan oleh `PUT` generic.

**Response:** `200 OK` — data tiket yang sudah di-refresh dengan relasi.

---

### 5. Update Ticket Status

```
PATCH /api/tickets/{ticket}/status
```

**Request Body (JSON):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | ✅ | Lihat [Ticket Status](#ticket-status) |
| `note` | string | | Catatan opsional |

**Side effects:**
- Record di `ticket_status_history` (from_status → to_status)
- `resolved_at` timestamp → auto-set saat status `resolved`
- `closed_at` timestamp → auto-set saat status `closed`
- `is_draft` → `true` untuk status `new`, `triaged`, `waiting_approval`
- Sync ke `conversation_states`
- Audit log: `status_changed`
- Notifikasi ke reporter (jika bukan yang mengubah)

**Response:** `200 OK`

---

### 6. Assign Ticket

```
POST /api/tickets/{ticket}/assign
```

Assign tiket ke user dan/atau tim. Endpoint ini khusus untuk assignment — mencatat history dan mengirim notifikasi.

**Request Body (JSON):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `assigned_user_id` | int | | ID user. `null` untuk unassign |
| `assigned_team_id` | int | | ID divisi. `null` untuk unassign |
| `note` | string | | Catatan opsional |

**Side effects:**
- Record di `ticket_assignments`
- Auto-transisi: `new` / `triaged` → `queued`
- Sync ke `conversation_states`
- Audit log: `assigned`
- Notifikasi ke assignee baru

**Response:** `200 OK`

---

### 7. Add Comment

```
POST /api/tickets/{ticket}/comments
```

Menambah komentar ke tiket. Support attachment file.

**Request Body (JSON):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `body_text` | string | | Isi komentar (max 5000 karakter) |
| `file` | file | | Attachment (multipart, max 20MB) |

**Allowed MIME types:** `text/*`, `application/json`, `application/xml`, `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.*`, `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `application/zip`, `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `video/mp4`, `video/quicktime`

**Response:** `201 Created`
```json
{
  "data": {
    "id": 15,
    "body_text": "Fixed in PR #42",
    "user": { "id": 5, "name": "Jane Smith", "username": "jane", "avatar_url": null },
    "attachment_path": "ticket-comments/1719400000_screenshot.png",
    "attachment_name": "screenshot.png",
    "mime_type": "image/png",
    "created_at": "2026-06-26T10:00:00Z"
  }
}
```

---

## Ticket Status

Status flow:

```
new → triaged → waiting_approval → queued → in_progress
                                                  ↓
                    resolved ← waiting_user ← waiting_vendor
                       ↓
                     closed
                       
rejected  (terminal)
cancelled (terminal)
```

| Status | Description |
|--------|-------------|
| `new` | Baru dibuat, belum ditriage |
| `triaged` | Sudah ditentukan kategori & prioritas |
| `waiting_approval` | Menunggu persetujuan |
| `queued` | Sudah di-assign, antri dikerjakan |
| `in_progress` | Sedang dikerjakan |
| `waiting_user` | Menunggu respons user |
| `waiting_vendor` | Menunggu pihak ketiga |
| `resolved` | Selesai dikerjakan |
| `closed` | Ditutup permanen |
| `rejected` | Ditolak |
| `cancelled` | Dibatalkan |

---

## Frontend Usage

Frontend tickets page (`frontend/src/app/tickets/page.tsx`) memanggil endpoint sebagai berikut:

| Aksi | Endpoint | Method |
|------|----------|--------|
| Load list | `/api/tickets?q=&ticket_type=&status=` | GET |
| Buka detail | `/api/tickets/{id}` | GET |
| Create tiket | `/api/tickets` | POST |
| Update priority, category | `/api/tickets/{id}` | PUT |
| Ganti status | `/api/tickets/{id}/status` | PATCH |
| Assign/unassign | `/api/tickets/{id}/assign` | POST |
| Kirim komentar | `/api/tickets/{id}/comments` | POST |
| Set estimation | `/api/tickets/{id}` | PUT |

### July 2026 Features

- **Estimation field**: `PUT /api/tickets/{id}` now accepts `estimation` (string, max 50). Examples: `1 day`, `2 days`, `1 week`.
- **Mention system**: `POST /api/tickets/{id}/comments` auto-parses `@username` patterns, creates `mentions` + `notifications` records.
- **Field change logging**: `PUT /api/tickets/{id}` now creates individual comment entries per changed field (priority, category, tags, estimation, etc).
- **Divisions**: IT (id=1), Marketing (id=2), CS (id=3). Edit ticket detail restricted to IT division.
- **Enterprise Login**: `/api/auth/login` supports multi-application login with Remember Me preferences.

Lihat `docs/architecture/frontend.md` untuk arsitektur halaman Tickets.
