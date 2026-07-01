# Epic 08: User Management

**Phase:** 8 | **Status:** done | **Priority:** P1 - High

## Goal

Membangun fitur manajemen user agar admin dapat:
- Melihat daftar semua user dengan role dan division
- Mencari user berdasarkan nama/email
- Filter user berdasarkan role
- Membuat user baru dengan role assignment
- Mengedit data user (nama, email, username, password)
- Menonaktifkan (deactivate) user
- Mengelola role assignment per user

## Features

| ID | Feature | Description | Status |
|----|---------|-------------|--------|
| F45 | User CRUD (Backend) | UserController: store, update, destroy, assignRole, roles endpoint | done |
| F46 | User Management Page (Frontend) | /users page with table, search, filter, create/edit modal, sidebar nav | done |

## Backend

```
UserController
├── index(Request)           GET /users?q=&role=
├── store(Request)           POST /users
├── update(Request, User)    PUT /users/{user}
├── destroy(User)            DELETE /users/{user} → deactivate
├── assignRole(Request, User) POST /users/{user}/roles
└── roles()                  GET /users/roles
```

## Frontend

```
/app/users/page.tsx
├── Search bar (by name/email)
├── Role filter dropdown
├── User table
│   ├── Name, Email, Username
│   ├── Role badges (Admin, Manager, Staff, etc.)
│   ├── Division name
│   └── Edit / Deactivate buttons
├── Create User modal
│   ├── Name, Email, Username, Password
│   └── Save
└── Edit User modal
    ├── Name, Email, Username
    ├── Password (optional — leave blank to keep)
    └── Save
```

Sidebar: "Users" nav item dengan `PersonIcon` (setelah Tickets).

## Tasks

| Task | Description | Layer | Status |
|------|-------------|-------|--------|
| T73 | UserController full CRUD + role assignment + routes | Backend | done |
| T74 | /users page (table, search, modal, sidebar nav) | Frontend | done |

## Success Criteria

- [x] Admin bisa melihat daftar semua user di /users
- [x] Pencarian user berdasarkan nama/email berfungsi
- [x] Filter berdasarkan role berfungsi
- [x] Role badges ditampilkan per user
- [x] Create user modal: input name, email, username, password
- [x] Edit user modal: edit field + optional password change
- [x] Deactivate user: soft delete (is_active = false)
- [x] Sidebar menampilkan "Users" nav item

## Dependencies

- Epic 01 (RBAC) — roles table sudah ada
- Epic 01 (Auth) — auth:sanctum middleware
