'use client';

import { useAuth } from '@/lib/auth-context';

type CanProps = {
  /** Addon slug, e.g. 'crm-leads' */
  addon?: string;
  /** Minimum access level: 'read' | 'write' | 'delete' (default 'read') */
  level?: 'read' | 'write' | 'delete';
  /** Permission string, e.g. 'tickets.edit' */
  permission?: string;
  children: React.ReactNode;
  /** Optional fallback rendered when check fails */
  fallback?: React.ReactNode;
};

/**
 * Conditionally render children based on addon access or permission.
 *
 * @example
 * <Can addon="crm-leads" level="write">
 *   <Button>Create Lead</Button>
 * </Can>
 *
 * <Can permission="tickets.edit">
 *   <TicketForm />
 * </Can>
 */
export function Can({ addon, level = 'read', permission, children, fallback = null }: CanProps) {
  const { hasAddon, hasPermission } = useAuth();

  if (addon && !hasAddon(addon, level)) {
    return <>{fallback}</>;
  }

  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
