# Epic 06: CRM & Addon Architecture

**Phase:** 6 | **Status:** in_progress | **Priority:** P1 - High

## Goal

Membangun arsitektur addon yang memungkinkan:
- Core features (Chat, AI Desk, Tickets, dll) tetap terbuka untuk semua user
- Addons (CRM Leads, Deals, Inventory, dll) adalah modul gated
- Akses addon bisa via role, division, atau manual assign user
- Setiap addon punya level akses: read, write, delete
- Frontend punya framework addon: registry → sidebar → lazy-load route

## Features

| ID | Feature | Description |
|----|---------|-------------|
| F34 | Core Feature Access | Core pages auto-accessible, no permission check |
| F35 | Addon Access Grants | Backend: tables, middleware, endpoint enrichment |
| F36 | Frontend Addon Framework | AuthProvider, Can, registry, dynamic route |

## Frontend Architecture

```
AuthProvider (context)
  ├─ fetch /auth/me → user + roles + permissions + addons
  ├─ hasAddon(slug, level) → boolean
  ├─ hasPermission(perm) → boolean
  └─ hasRole(name) → boolean

AppLayout
  ├─ Sidebar: core items always + addon items (if hasAddon)
  └─ Content: page component

Addon System
  ├─ addons/registry.ts → AddonRoute[] (slug, label, lazy component)
  ├─ app/addons/[slug]/page.tsx → gate check + lazy render
  └─ components/auth/Can.tsx → <Can addon="x" level="write">
```

## Tasks

| Task | Description | Status |
|------|-------------|--------|
| T53 | Backend: addons + addon_access_grants migrations | pending |
| T54 | Backend: AddonInterface + AddonRegistry + CheckAddonAccess middleware | pending |
| T55 | Frontend: AuthProvider + useAuth() + Can component | done |
| T56 | Frontend: addon registry + dynamic route + sample addon page | done |

## Success Criteria

- [x] Core pages (Chat, AI Desk, Tickets, Kanban, Knowledge, Search, Reports) muncul di sidebar untuk semua user
- [x] Core pages bisa diakses semua authenticated user
- [x] AuthProvider mem-fetch /auth/me dan menyimpan user/roles/addons di context
- [x] `<Can addon="x" level="write">` bekerja untuk conditional render
- [x] `addons/registry.ts` siap diisi addon baru
- [x] `/addons/[slug]` route bekerja: gate check + lazy-load
- [ ] Backend `/auth/me` mengembalikan key `addons`
- [ ] Sidebar menampilkan addon items saat user punya akses
- [ ] User tanpa akses addon tidak lihat menu dan di-redirect dari route addon

## Dependencies

- Epic 01 (RBAC, Division) — role dan division sudah ada
- Backend Laravel — tabel dan middleware perlu dibuat
