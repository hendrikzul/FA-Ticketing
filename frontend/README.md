# AICOP Frontend

Next.js 15+ App Router dengan Shopify Polaris UI. Frontend pure API consumer — semua data dan logika akses dari backend Laravel.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| UI | Shopify Polaris |
| Styling | Tailwind CSS + CSS Modules |
| Language | TypeScript |

## Folder Structure

```
frontend/src/
├── app/                          # Next.js App Router routes
│   ├── layout.tsx                # Root layout (PolarisProvider + AuthProvider)
│   ├── page.tsx                  # Landing (redirect ke /ai-desk)
│   ├── globals.css               # Global styles
│   ├── login/                    # /login
│   ├── register/                 # /register
│   ├── chat/                     # /chat — human chat
│   ├── ai-desk/                  # /ai-desk — AI intake (core feature)
│   ├── tickets/                  # /tickets — ticket list
│   ├── kanban/                   # /kanban — kanban board
│   ├── knowledge/                # /knowledge — knowledge base
│   ├── search/                   # /search — global search
│   ├── reports/                  # /reports — reporting
│   └── addons/                   # /addons/[slug] — dynamic addon routes
│       └── [slug]/
│           └── page.tsx          # Gate akses + lazy-load addon component
│
├── components/                   # Shared components
│   ├── layout/
│   │   └── AppLayout.tsx         # Shell: topbar, sidebar, content area
│   ├── chat/
│   │   └── ChatComponents.tsx    # ChatWindow, ConversationList, NewConversation
│   ├── auth/
│   │   ├── ClientAuthWrapper.tsx # Client boundary untuk AuthProvider
│   │   └── Can.tsx               # <Can addon="..." level="..."> wrapper
│   └── polaris/
│       └── PolarisProvider.tsx   # Polaris AppProvider wrapper
│
├── addons/                       # Addon modules (lazy-loaded, gated)
│   ├── registry.ts               # addonRoutes[] — daftar addon terdaftar
│   └── <addon-slug>/             # Satu folder per addon
│       └── page.tsx              # Default export: halaman addon
│
├── hooks/                        # Custom React hooks
│   └── useAddons.ts             # useAddons() — shortcut ke addons map
│
└── lib/                          # Core utilities
    ├── api.ts                    # HTTP client (centralized API calls)
    └── auth-context.tsx          # AuthProvider + useAuth()
```

## Auth & Addon Architecture

### Alur Auth

```
RootLayout (server)
  └─ PolarisProvider
      └─ ClientAuthWrapper (client boundary)
          └─ AuthProvider        ← fetch /auth/me, simpan user/roles/addons
              └─ AppLayout       ← baca useAuth(), render sidebar + children
                  └─ Page        ← baca useAuth() / useAddons() / Can
```

### Response `/auth/me` (kontrak dengan backend)

```json
{
  "user": {
    "id": 1,
    "name": "Fajar",
    "email": "fajar@example.com",
    "roles": [{ "name": "Staff", "label": "Staff" }]
  },
  "roles": ["Staff"],
  "permissions": ["tickets.edit", "kanban.view"],
  "addons": {
    "crm-leads": "write",
    "inventory": "read"
  }
}
```

Key `addons` menentukan addon mana yang muncul di sidebar client.

### Gating levels

| Level | Arti |
|-------|------|
| `read` | Bisa lihat data addon |
| `write` | Bisa buat/edit data addon |
| `delete` | Bisa hapus data addon |

### Cara menambah addon baru

1. Buat folder: `frontend/src/addons/<slug>/`
2. Buat `page.tsx` dengan `export default function AddonPage() { ... }`
3. Daftarkan di `frontend/src/addons/registry.ts`:
   ```ts
   {
     slug: 'crm-leads',
     label: 'CRM Leads',
     component: lazy(() => import('./crm-leads/page')),
   }
   ```
4. Backend assign addon ke role/division/user via `addon_access_grants`
5. Frontend otomatis: sidebar muncul menu, `/addons/<slug>` bisa diakses

### Cara pakai di komponen

```tsx
import { useAuth } from '@/lib/auth-context';
import { Can } from '@/components/auth/Can';

// Cek akses addon
const { hasAddon } = useAuth();
if (hasAddon('crm-leads', 'write')) { ... }

// Conditional render
<Can addon="crm-leads" level="write">
  <Button>Create Lead</Button>
</Can>

// Cek permission
<Can permission="tickets.edit">
  <TicketForm />
</Can>
```

## Getting Started

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api` | Backend API base URL |

## Related Docs

- [Frontend Architecture](../../docs/architecture/frontend.md)
- [PRD Master Document](../../docs/prd/aicop_master_document.md)
- [Product Goals](../../.goal/product-goals.md)
- [Roadmap](../../.goal/roadmap.md)
