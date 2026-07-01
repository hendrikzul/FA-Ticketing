import { lazy } from 'react';

export interface AddonRoute {
  slug: string;
  label: string;
  component: React.LazyExoticComponent<React.ComponentType<unknown>>;
}

/**
 * Addon route registry.
 *
 * To register a new addon:
 * 1. Create folder: `frontend/src/addons/<slug>/`
 * 2. Create `page.tsx` with a default export
 * 3. Add entry below
 *
 * Each addon page receives no props — it uses useAuth() to check access internally.
 */
export const addonRoutes: AddonRoute[] = [
  // ── Register addons below ─────────────────────────────
  {
    slug: 'crm-leads',
    label: 'CRM Leads',
    component: lazy(() => import('./crm-leads/page')),
  },
  // {
  //   slug: 'crm-deals',
  //   label: 'CRM Deals',
  //   component: lazy(() => import('./crm-deals/page')),
  // },
];

/**
 * Look up an addon by slug.
 */
export function getAddonRoute(slug: string): AddonRoute | undefined {
  return addonRoutes.find((r) => r.slug === slug);
}
