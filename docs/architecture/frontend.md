# Frontend Architecture

## Overview

AICOP frontend adalah Next.js 15 App Router dengan Shopify Polaris UI. Pure API consumer — semua data, bisnis logika, dan akses kontrol diputuskan oleh backend Laravel. Frontend hanya membaca response API dan merender UI sesuai.

## Arsitektur Layer

```
┌──────────────────────────────────────────────────────┐
│                    Browser                           │
├──────────────────────────────────────────────────────┤
│  Next.js App Router (server + client)                │
│  ┌────────────────────────────────────────────────┐  │
│  │  PolarisProvider (UI framework)                │  │
│  │  ┌──────────────────────────────────────────┐  │  │
│  │  │  AuthProvider (auth context)             │  │  │
│  │  │  ┌────────────────────────────────────┐  │  │  │
│  │  │  │  AppLayout (shell)                 │  │  │  │
│  │  │  │  ├─ Topbar (brand, search, user)   │  │  │  │
│  │  │  │  ├─ Sidebar (nav + addon nav)      │  │  │  │
│  │  │  │  └─ Content Area                   │  │  │  │
│  │  │  │      ├─ Core Pages                  │  │  │  │
│  │  │  │      │   Chat, AI Desk, Tickets,    │  │  │  │
│  │  │  │      │   Kanban, Knowledge, Search, │  │  │  │
│  │  │  │      │   Reports                    │  │  │  │
│  │  │  │      └─ Addon Pages                 │  │  │  │
│  │  │  │          [slug]/page.tsx            │  │  │  │
│  │  │  └────────────────────────────────────┘  │  │  │
│  │  └──────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────┤
│  Backend (Laravel API)                               │
│  /auth/me  →  user + roles + permissions + addons   │
└──────────────────────────────────────────────────────┘
```

## Core vs Addon

```
AICOP Frontend
├── Core (semua authenticated user bisa akses)
│   ├── /chat        → app/chat/page.tsx
│   ├── /ai-desk     → app/ai-desk/page.tsx
│   ├── /tickets     → app/tickets/page.tsx
│   ├── /kanban      → app/kanban/page.tsx
│   ├── /knowledge   → app/knowledge/page.tsx
│   ├── /search      → app/search/page.tsx
│   └── /reports     → app/reports/page.tsx
│
└── Addons (gated, hanya user yang di-assign)
    └── /addons/[slug] → app/addons/[slug]/page.tsx
                         └─ lazy import dari src/addons/<slug>/page.tsx
```

## Auth Flow

```
1. User buka /ai-desk
2. AuthProvider mount → cek localStorage token
3. Tidak ada token → redirect /login
4. Ada token → fetch GET /auth/me
5. Response disimpan di React Context:
   - user: { id, name, email, roles }
   - roles: ["Staff"]
   - permissions: ["tickets.edit"]
   - addons: { "crm-leads": "write" }
6. AppLayout render:
   - Sidebar: Chat, AI Desk, Tickets + CRM Leads (dari addons map)
   - Content: children (page component)
7. Page component render UI
```

## Addon System Detail

### Registry Pattern

Setiap addon didaftarkan di `src/addons/registry.ts`:

```ts
export const addonRoutes: AddonRoute[] = [
  {
    slug: 'crm-leads',
    label: 'CRM Leads',
    component: lazy(() => import('./crm-leads/page')),
  },
];
```

### Dynamic Route

`app/addons/[slug]/page.tsx`:
1. Baca `slug` dari URL params
2. Cari di `addonRoutes` registry
3. Cek `hasAddon(slug)` dari context
4. Tidak punya akses → redirect ke `/`
5. Punya akses → `Suspense` + lazy-load komponen addon

### Sidebar Integration

`AppLayout` membaca `addons` dari context dan memfilter `addonRoutes`:
- Addon dengan `hasAddon(r.slug)` → muncul di sidebar
- Addon tanpa akses → tidak muncul

### Addon Page Contract

Setiap addon page harus:
```tsx
'use client';

export default function CrmLeadsPage() {
  // Optional: cek ulang akses
  const { hasAddon } = useAuth();
  if (!hasAddon('crm-leads')) return null;

  return <div>CRM Leads content...</div>;
}
```

## Component Tree

```
RootLayout (server component)
└─ PolarisProvider
   └─ ClientAuthWrapper
      └─ AuthProvider
         └─ AppLayout
            ├─ Topbar
            │  ├─ Brand (logo + name)
            │  ├─ Search input
            │  └─ User menu (avatar + name + role + logout)
            ├─ Sidebar
            │  └─ Nav items (core + addons)
            └─ Content
               └─ Page Component
                  ├─ (loading: Avatar spinner)
                  └─ (loaded: children)

Page Component contoh (AI Desk):
AIDeskPage
├─ Header (title + filter buttons)
└─ ConversationWorkspace
   ├─ Left Panel
   │  ├─ Search
   │  └─ ConversationList
   └─ Right Panel
      ├─ (no selection) → Input bar
      └─ (active) → ChatWindow + TicketEditForm
```

## State Management

| State | Lokasi | Pattern |
|-------|--------|---------|
| Auth (user, roles, addons) | AuthProvider (React Context) | Centralized, di-fetch sekali saat mount |
| Page-local state | useState di page component | Per-page, tidak perlu global |
| API data | useState + useEffect | Manual fetch, bisa diganti TanStack Query nanti |
| Form state | useState / useReducer | Ticket form, search, composer |

## API Layer

`lib/api.ts` — centralized HTTP client:
- Auto-attach `Authorization: Bearer <token>`
- Auto JSON parse
- Method group: `api.auth.*`, `api.conversations.*`, `api.tickets.*`, `api.messages.*`, `api.divisions.*`, `api.users.*`
- Token management: `api.setToken()`, `api.getToken()`, localStorage persist

## Security Notes

- Auth token disimpan di `localStorage` — cukup untuk internal app
- Tidak ada secret di frontend — semua lewat API
- Addon access gate dilakukan di dua layer:
  1. Sidebar: tidak muncul menu
  2. Route: redirect jika tidak punya akses
  3. Backend: middleware `CheckAddonAccess` (ultimate gate)
- `<Can>` component untuk conditional render di dalam page

## Tickets Page

### Architecture

`frontend/src/app/tickets/page.tsx` — single-page CRUD untuk manajemen tiket. Monolithic client component dengan list table, detail panel, create modal, comment chat, dan file viewer dalam satu file.

```
┌──────────────────────────────────────────────────────────────┐
│  TicketsPage (AppLayout)                                     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Header: [Search] [Type ▼] [Status ▼] [+ New Ticket]  │  │
│  ├───────────────────────┬────────────────────────────────┤  │
│  │  TicketList (40%)     │  TicketDetail (58%)           │  │
│  │  ┌──────────────────┐ │  ┌──────────────────────────┐ │  │
│  │  │ ID │ Title │ Sts │ │  │ Header: number, badge    │ │  │
│  │  │ TKT │ ...   │ 🟢  │ │  │ Description             │ │  │
│  │  │ TKT │ ...   │ 🔵  │ │  │ Activity Timeline       │ │  │
│  │  └──────────────────┘ │  │  ├─ status changes        │ │  │
│  │                       │  │  ├─ assignments           │ │  │
│  │                       │  │  └─ comments              │ │  │
│  │                       │  │  Attachments              │ │  │
│  │                       │  │  Comment Composer         │ │  │
│  │                       │  ├──────────────────────────┤ │  │
│  │                       │  │  Info Sidebar             │ │  │
│  │                       │  │  Status ▼ (Select)        │ │  │
│  │                       │  │  Assignee ▼ (User+Team)   │ │  │
│  │                       │  │  Reporter (read-only)     │ │  │
│  │                       │  │  Priority ▼               │ │  │
│  │                       │  │  Category ─               │ │  │
│  │                       │  │  [Save Changes]           │ │  │
│  └───────────────────────┴────────────────────────────────┘  │
│                                                               │
│  Modals: CreateTicket │ FilePreview │ ImageLightbox           │
└──────────────────────────────────────────────────────────────┘
```

### Component Structure

Halaman tickets telah diekstrak menjadi beberapa file:

```
frontend/src/app/tickets/
  page.tsx                ← orchestrator: state management + layout shell + detail panel (472 lines)
  helpers.tsx             ← pure utility functions + presentational components (98 lines)
  CreateTicketModal.tsx   ← create form + file upload preview (87 lines)
```

### State Management

| State | Type | Source |
|-------|------|--------|
| `tickets` | `TicketRow[]` | `api.tickets.list({ page })` |
| `page` / `totalPages` / `total` | number | Metadata paginasi dari response (`last_page`, `total`) |
| `detail` | `any` | `api.tickets.show(id)` |
| `edit` | `{ _dirty, priority, category }` | Local, seeded from detail. `_dirty` digunakan sebagai guard unsaved changes |
| `users` / `teams` | arrays | `api.users.list()` + `api.divisions.list()`, di-fetch saat mount |
| `chatMsg` / `chatFile` | string / File | Local comment composer |
| `form` / `files` / `previews` | object / File[] / string[] | Create form state, diteruskan ke CreateTicketModal |
| `statusSaving` / `assignSaving` / `savingD` / `sendingChat` | boolean | Loading indicators per operasi |

### API Call Mapping

| Aksi UI | Endpoint | Method | Optimistic | Side Effects |
|---------|----------|--------|------------|--------------|
| Load list | `GET /api/tickets` | `api.tickets.list({ page })` | — | Paginated (20/page), reset ke halaman 1 saat filter berubah |
| Klik row | `GET /api/tickets/{id}` | `api.tickets.show()` | — | Guard unsaved changes via `edit._dirty` confirm dialog |
| Create | `POST /api/tickets` | `api.tickets.create()` | — | Audit log, notifikasi |
| Edit priority/category | `PUT /api/tickets/{id}` | `api.tickets.update()` | ✅ | Sync conversation_states; rollback jika gagal |
| **Ganti status** | `PATCH /api/tickets/{id}/status` | `api.tickets.updateStatus()` | ✅ | Status history, resolved_at, notifikasi reporter |
| **Assign/unassign** | `POST /api/tickets/{id}/assign` | `api.tickets.assign()` | ✅ | Assignment history, auto `queued`, notifikasi assignee |
| Kirim komentar | `POST /api/tickets/{id}/comments` | `api.tickets.comments.create()` | ✅ | Multipart + screenshot paste; komentar muncul langsung di timeline |
| Set estimation | `PUT /api/tickets/{id}` | `api.tickets.update()` | — | Visible all, edit IT only; activity log |

> **Perubahan Juni-Juli 2026:**
> - Status, assignee, priority, tags, estimation, category — semua melalui **single Save button** (IT-only edit).
> - Semua perubahan dicatat di **Activity Timeline** (status → `statusHistory`, assignee → `assignments`, field changes → system comments).
> - **Enterprise Login**: modal split-layout, 8 aplikasi, searchable dropdown, dynamic hero, Remember Me.
> - **Mention system**: `@username` di chat → autocomplete dropdown → notifikasi + bell icon real-time (toast popup).
> - **Pagination**: Prev/Next + numbered page buttons, server-side 20/page.
> - **Optimistic updates**: semua mutasi update UI sebelum API call, rollback jika gagal.
> - **Filter bar**: Search, Type, Status, Priority, Staff, Reset.
> - **Excel import**: CSV → 58 tickets dari file Bugs CSV.
> - **Screenshot paste**: Cmd+V langsung jadi attachment di chat.
> - **Auto-expanding textarea**: chat input naik sampai 120px dengan animasi.
> - **Table columns**: Checkbox, #, Priority (circle badge), Title (truncated + tooltip), Type, Category, Status, Assignee, Reporter, Created.
> - **Divisi**: IT (id=1), Marketing (id=2), CS (id=3) — edit detail ticket hanya untuk divisi IT.
> - **Cloudflared tunnel**: `aicop-uat.floweradvisor.co.id` → nginx:9080 → frontend:3000 + backend:8000.
> 
> Lihat `docs/api/tickets.md` untuk detail endpoint.

### Pagination

Tabel tiket menggunakan paginasi server-side dengan navigasi Prev/Next.

**Flow:**
```
Filter/search berubah  → useEffect → setPage(1) + load(1)   (reset halaman)
Klik Prev/Next          → goPage(p)  → setPage(p) + load(p)  (navigasi)
```

**Pagination bar** — hanya muncul jika `totalPages > 1`:
```
[42 tickets · Page 1 of 3]    [← Prev] [Next →]
```

- `page` / `totalPages` / `total` diambil dari response Laravel paginator (`last_page`, `total`)
- 20 tiket per halaman (sesuai backend default)
- Prev disabled di halaman 1, Next disabled di halaman terakhir

### Activity Timeline

Detail panel menggabungkan tiga sumber data menjadi satu timeline:

```
activities = [
  ...detail.statusHistory  → { _type: 'status' },
  ...detail.assignments    → { _type: 'assignment' },
  ...detail.comments       → { _type: 'comment' },
].sort(created_at)
```

Setiap entry dirender dengan dot berwarna di timeline kiri:
- 🔵 Status change: `from_status → to_status`
- 🟣 Assignment: `assigned to {name}`
- 🟢 Comment: body text + attachment preview

### File Handling

Semua input file menggunakan konstanta `FILE_ACCEPT` dari `helpers.tsx`:
```
image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,.json,.xml,.html,.py,.js
```
Diselaraskan dengan validasi MIME type di backend (`TicketController`, `TicketCommentController`).

| Fitur | Accept | Preview |
|-------|--------|---------|
| Create attachment | `FILE_ACCEPT` | Thumbnail grid |
| Comment attachment | `FILE_ACCEPT` | Image lightbox, video player, text/markdown pre, Excel table (SheetJS, max 100 rows), download fallback |
| Activity attachment | (from server) | Same rendering logic |

**Excel preview truncation:** File `.xlsx` di-parse dengan SheetJS dan dibatasi 100 baris pertama. Jika file lebih besar, warning muncul: *"Showing first 100 rows only. Download the file for the full data."*

### Helper Functions (`helpers.tsx`)

Semua utility dan presentational component diekstrak ke `helpers.tsx`:

| Export | Type | Description |
|--------|------|-------------|
| `FILE_ACCEPT` | const | Accepted file types string |
| `fmt(v)` | function | snake_case → Title Case |
| `fmtDate(v)` | function | ISO → "Jun 26" |
| `ago(d)` | function | Relative time ("3h", "2d", "now") |
| `pdot(p)` | function | Priority → color |
| `stt(s)` | function | Status → Polaris Badge tone |
| `isImage(mime)` | function | MIME type detection |
| `isVideo(mime)` | function | MIME type detection |
| `isTextFile(mime)` | function | MIME type detection |
| `fileIcon(mime)` | function | Emoji icon per file type |
| `Field` | component | Label + children wrapper |
| `Row` | component | Key-value row display |
| `Chip` | component | Colored initial circle |

### Optimistic Updates

Semua mutasi menggunakan pattern optimistic update:

```
snapshot detail → apply perubahan langsung ke UI → API call
  ├─ success → re-fetch dari server (timestamps, IDs server-generated)
  └─ error   → rollback ke snapshot
```

| Mutasi | Optimistic data | Rollback |
|--------|----------------|----------|
| `save()` | `detail.priority`, `detail.category` | Restore `prev` + kembalikan `_dirty: true` |
| `changeStatus()` | `detail.status` | Restore `prev` |
| `changeAssignee()` | `detail.assigned_user`, `detail.assigned_team` | Restore `prev` |
| `sendChat()` | Append komentar ke `detail.comments` | Restore `prevComments` + restore `chatMsg` |
