'use client';

import { AuthProvider } from '@/lib/auth-context';

export function ClientAuthWrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
