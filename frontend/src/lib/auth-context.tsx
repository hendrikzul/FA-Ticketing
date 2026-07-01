'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';

// ── Types ──────────────────────────────────────────────

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  division_id?: number | null;
  avatar_url?: string | null;
  roles?: Array<{ id?: number; name?: string; label?: string }>;
}

export interface AuthState {
  user: AuthUser | null;
  roles: string[];
  permissions: string[];
  addons: Record<string, 'read' | 'write' | 'delete'>;
  loading: boolean;
  hasAddon: (slug: string, minLevel?: string) => boolean;
  hasPermission: (perm: string) => boolean;
  hasRole: (roleName: string) => boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

// ── Level ordering ─────────────────────────────────────

const LEVEL_ORDER: Record<string, number> = {
  read: 1,
  write: 2,
  delete: 3,
};

// ── Context ────────────────────────────────────────────

const AuthContext = createContext<AuthState | null>(null);

// ── Provider ───────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [addons, setAddons] = useState<Record<string, 'read' | 'write' | 'delete'>>({});
  const [loading, setLoading] = useState(true);

  const isPublic = pathname === '/login' || pathname === '/register';

  const refresh = useCallback(async () => {
    const token = api.getToken();
    if (!token) {
      if (!isPublic) router.push('/login');
      setLoading(false);
      return;
    }

    try {
      const res = await api.auth.me();
      const remoteUser = (res as { user?: AuthUser; roles?: string[]; permissions?: string[]; addons?: Record<string, string> }).user
        || (res as { user: AuthUser }).user;

      setUser(remoteUser ?? null);

      // Populate from enriched response (future backend contract)
      const remoteRoles = (res as { roles?: string[] }).roles;
      const remotePermissions = (res as { permissions?: string[] }).permissions;
      const remoteAddons = (res as { addons?: Record<string, string> }).addons;

      if (remoteRoles && Array.isArray(remoteRoles)) {
        setRoles(remoteRoles.map(String));
      } else if (remoteUser?.roles) {
        setRoles(remoteUser.roles.map((r) => r.name || r.label || ''));
      }

      if (remotePermissions && Array.isArray(remotePermissions)) {
        setPermissions(remotePermissions.map(String));
      }

      if (remoteAddons && typeof remoteAddons === 'object') {
        const typed: Record<string, 'read' | 'write' | 'delete'> = {};
        for (const [k, v] of Object.entries(remoteAddons)) {
          if (v === 'read' || v === 'write' || v === 'delete') typed[k] = v;
        }
        setAddons(typed);
      } else {
        setAddons({});
      }
    } catch {
      api.setToken(null);
      if (!isPublic) router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router, isPublic]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const hasAddon = useCallback(
    (slug: string, minLevel: string = 'read') => {
      const level = addons[slug];
      if (!level) return false;
      return (LEVEL_ORDER[level] || 0) >= (LEVEL_ORDER[minLevel] || 1);
    },
    [addons],
  );

  const hasPermission = useCallback(
    (perm: string) => permissions.includes(perm),
    [permissions],
  );

  const hasRole = useCallback(
    (roleName: string) => roles.includes(roleName),
    [roles],
  );

  const logout = useCallback(async () => {
    await api.auth.logout();
    api.setToken(null);
    setUser(null);
    setRoles([]);
    setPermissions([]);
    setAddons({});
    router.push('/login');
  }, [router]);

  const value: AuthState = {
    user,
    roles,
    permissions,
    addons,
    loading,
    hasAddon,
    hasPermission,
    hasRole,
    logout,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Hook ────────────────────────────────────────────────

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
