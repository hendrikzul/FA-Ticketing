'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiRecord } from '@/lib/api';
import { Badge, BlockStack, Popover, Text, Button } from '@shopify/polaris';

export default function NotificationBell() {
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<ApiRecord[]>([]);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<ApiRecord | null>(null);
  const prevUnread = useRef(0);

  const fetchUnread = useCallback(async () => {
    try {
      const res: any = await api.notifications.unreadCount();
      const count = res?.count ?? 0;
      if (count > prevUnread.current && prevUnread.current > 0) {
        const itemsRes: any = await api.notifications.list({ per_page: '1' });
        const latest = itemsRes?.data?.[0];
        if (latest) { setToast(latest); setTimeout(() => setToast(null), 5000); }
      }
      prevUnread.current = count;
      setUnread(count);
    } catch { /* silent */ }
  }, []);

  const fetchItems = useCallback(async () => {
    try {
      const res: any = await api.notifications.list({ per_page: '5' });
      setItems(res?.data ?? []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchUnread();
    fetchItems();
    const timer = setInterval(() => { fetchUnread(); fetchItems(); }, 10_000);
    return () => clearInterval(timer);
  }, [fetchUnread, fetchItems]);

  const handleOpen = () => {
    setOpen(true);
    fetchItems();
  };

  const handleMarkAll = async () => {
    try {
      await api.notifications.markAllRead();
      setUnread(0);
      setItems((prev) => prev.map((i) => ({ ...i, is_read: true })));
    } catch { /* silent */ }
  };

  const handleMarkOne = async (id: number) => {
    try {
      await api.notifications.markRead(id);
      setUnread((prev) => Math.max(0, prev - 1));
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, is_read: true } : i)));
    } catch { /* silent */ }
  };

  return (
    <>
    <Popover
      active={open}
      onClose={() => setOpen(false)}
      activator={
        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={handleOpen}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z" fill="currentColor" opacity="0.3"/>
            <path d="M10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" fill="currentColor"/>
          </svg>
          {unread > 0 && (
            <div style={{
              position: 'absolute', top: -6, right: -8,
              background: 'var(--p-color-bg-fill-critical)', color: 'white',
              borderRadius: 10, minWidth: 18, height: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 600, padding: '0 4px',
            }}>
              {unread}
            </div>
          )}
        </div>
      }
    >
      <div style={{ minWidth: 300, maxWidth: 360, maxHeight: 400, overflow: 'auto' }}>
        <BlockStack gap="200">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px' }}>
            <Text as="p" variant="bodySm" fontWeight="semibold">Notifications</Text>
            {unread > 0 && (
              <Button variant="plain" size="slim" onClick={handleMarkAll}>Mark all read</Button>
            )}
          </div>
          {items.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center' }}>
              <Text as="p" variant="bodyMd" tone="subdued">No notifications</Text>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                onClick={() => { if (!item.is_read) handleMarkOne(item.id); }}
                style={{
                  padding: '10px 12px',
                  borderTop: '1px solid var(--p-color-border-subdued)',
                  cursor: 'pointer',
                  background: item.is_read ? 'transparent' : 'var(--p-color-bg-surface-hover)',
                }}
              >
                <BlockStack gap="050">
                  <Text as="p" variant="bodySm" fontWeight={item.is_read ? 'regular' : 'semibold'}>
                    {item.title}
                  </Text>
                  {item.body && (
                    <Text as="p" variant="bodyXs" tone="subdued">
                      {item.body}
                    </Text>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text as="p" variant="bodyXs" tone="subdued">
                      {formatTimeAgo(item.created_at)}
                    </Text>
                    {item.ticket_id && (
                      <span onClick={(e) => { e.stopPropagation(); router.push(`/tickets?id=${item.ticket_id}`); setOpen(false); }}
                        style={{ color: '#3b82f6', fontSize: 11, fontWeight: 600, cursor: 'pointer', padding: '2px 6px' }}>
                        detail →
                      </span>
                    )}
                  </div>
                </BlockStack>
              </div>
            ))
          )}
        </BlockStack>
      </div>
    </Popover>
    {toast && (
      <div style={{ position: 'fixed', top: 60, right: 20, background: '#1f2937', color: '#fff', padding: '14px 18px', borderRadius: 10, boxShadow: '0 8px 30px rgba(0,0,0,0.2)', zIndex: 9999, maxWidth: 340, animation: 'slideIn 0.3s ease' }}>
        <Text as="p" variant="bodySm" fontWeight="semibold">{toast.title as string}</Text>
        {toast.body && <Text as="p" variant="bodyXs"  >{(toast.body as string).slice(0, 80)}</Text>}
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button onClick={() => { router.push(`/tickets?id=${toast.ticket_id}`); setToast(null); }} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>View detail →</button>
          <button onClick={() => setToast(null)} style={{ background: 'transparent', color: '#9ca3af', border: 'none', fontSize: 12, cursor: 'pointer' }}>Dismiss</button>
        </div>
      </div>
    )}
    <style>{`@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
  </>
  );
}

function formatTimeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
