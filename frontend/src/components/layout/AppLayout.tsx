'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useAddons } from '@/hooks/useAddons';
import { addonRoutes } from '@/addons/registry';
import NotificationBell from '@/components/ui/NotificationBell';
import { UserProfileModal } from '@/components/auth/UserProfileModal';
import Link from 'next/link';
import Image from 'next/image';
import { Avatar, Text } from '@shopify/polaris';
import { ChatIcon, NotificationIcon, OrderIcon, SearchIcon } from '@shopify/polaris-icons';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const { hasAddon } = useAddons();
  const [headerSearch, setHeaderSearch] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const initials = user?.name
    ? user.name
        .split(' ')
        .slice(0, 2)
        .map((part: string) => part[0])
        .join('')
        .toUpperCase()
    : 'AI';

  const coreNavItems = [
    { label: 'Chat', url: '/chat', icon: ChatIcon },
    { label: 'AI Desk', url: '/ai-desk', icon: NotificationIcon },
    { label: 'Tickets', url: '/tickets', icon: OrderIcon },
  ];

  // Dynamic addon nav items — only show if user has at least read access
  const addonNavItems = addonRoutes
    .filter((r) => hasAddon(r.slug))
    .map((r) => ({
      label: r.label,
      url: `/addons/${r.slug}`,
      icon: OrderIcon,
    }));

  const navItems = [...coreNavItems, ...addonNavItems];

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="app-topbar__inner">
          <div className="app-topbar__brand">
            <Image
              src="/floweradvisor-logo.ico"
              alt="FlowerAdvisor logo"
              className="app-topbar__brand-logo"
              width={36}
              height={36}
            />
            <div className="app-topbar__brand-copy">
              <Text as="p" variant="headingSm">
                FlowerAdvisor
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Admin console
              </Text>
            </div>
          </div>

          <label className="app-topbar__search" aria-label="Search">
            <SearchIcon width="18" height="18" />
            <input
              value={headerSearch}
              onChange={(event) => setHeaderSearch(event.target.value)}
              placeholder="Search"
              autoComplete="off"
            />
            <span className="app-topbar__search-shortcut">Ctrl K</span>
          </label>

          <div className="app-topbar__actions">
            <div className="app-topbar__icon-button" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <NotificationBell />
            </div>
            <div
              className="app-topbar__user"
              style={{ cursor: 'pointer' }}
              onClick={() => setProfileOpen(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') setProfileOpen(true); }}
            >
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <Avatar initials={initials} customer={false} />
              )}
              <div className="app-topbar__user-copy">
                <Text as="p" variant="bodySm" fontWeight="medium">
                  {user?.name || 'Loading user'}
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  {user?.roles?.[0]?.label || user?.roles?.[0]?.name || 'Operations user'}
                </Text>
              </div>
            </div>
            <button type="button" className="app-topbar__logout" onClick={logout}>
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="app-middle">
         <div className={`app-middle__panel${collapsed ? ' app-middle__panel--collapsed' : ''}`}>
           <aside className={`app-sidebar${collapsed ? ' app-sidebar--collapsed' : ''}`}>
             <button
               className="app-sidebar__toggle"
               onClick={() => setCollapsed(!collapsed)}
               title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
               aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
             >
               {collapsed ? '▶' : '◀'}
             </button>
             <nav className="app-sidebar__nav" aria-label="Primary">
               {navItems.map((item) => (
                 <Link
                   key={item.url}
                   href={item.url}
                   title={collapsed ? item.label : undefined}
                   className={`app-sidebar__link${pathname === item.url || pathname.startsWith(item.url + '/') ? ' active' : ''}`}
                 >
                   <item.icon width="18" height="18" />
                   {!collapsed && <span>{item.label}</span>}
                 </Link>
               ))}
             </nav>
           </aside>

          <section className="app-content">
            {loading ? (
              <div className="app-content__loading">
                <Avatar initials="AI" customer={false} />
              </div>
            ) : (
              children
            )}
          </section>
        </div>
      </main>

      <footer className="app-bottom" />

      <UserProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}
