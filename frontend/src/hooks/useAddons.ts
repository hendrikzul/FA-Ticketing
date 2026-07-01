'use client';

import { useAuth } from '@/lib/auth-context';

export function useAddons() {
  const { addons, hasAddon } = useAuth();
  return { addons, hasAddon };
}
