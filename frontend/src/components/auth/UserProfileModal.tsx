'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Avatar, BlockStack, Button, InlineStack, Text, Modal } from '@shopify/polaris';

export function UserProfileModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user, logout, refresh, hasRole } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const initials = user?.name
    ? user.name.split(' ').slice(0, 2).map((p: string) => p[0]).join('').toUpperCase()
    : '?';

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/auth/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${api.getToken()}` },
        body: formData,
      });

      await refresh();
    } catch (err) {
      console.error('Avatar upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Profile"
      secondaryActions={[{ content: 'Close', onAction: onClose }]}
    >
      <Modal.Section>
        <BlockStack gap="500" align="center">
          {/* Avatar */}
          <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <Avatar initials={initials} customer={false} />
            )}
            <div style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 24, height: 24, borderRadius: '50%', background: '#008060',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, color: '#fff',
            }}>
              +
            </div>
            <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleAvatarUpload} />
          </div>

          {/* User info */}
          <BlockStack gap="100" align="center">
            <Text as="h2" variant="headingMd">{user?.name || 'User'}</Text>
            <Text as="p" variant="bodyMd" tone="subdued">{user?.email || ''}</Text>
            {user?.roles?.length ? (
              <InlineStack gap="100">
                {user.roles.filter((r) => r.name !== 'super_admin').map((r) => (
                  <span key={r.id} style={{
                    padding: '2px 8px', borderRadius: 12, background: 'rgba(0,128,96,0.1)',
                    fontSize: 12, color: '#005c45',
                  }}>
                    {r.label || r.name}
                  </span>
                ))}
              </InlineStack>
            ) : null}
          </BlockStack>

          {uploading && <Text as="p" variant="bodySm" tone="subdued">Uploading...</Text>}

          <div style={{ width: '100%', height: 1, background: 'rgba(0,0,0,0.08)' }} />

          {/* Settings links */}
          <BlockStack gap="200" align="start">
            {(hasRole('admin') || hasRole('super_admin')) && (
              <Button variant="plain" fullWidth textAlign="left" onClick={() => { onClose(); router.push('/users'); }}>👥 Manage Users</Button>
            )}
            {(hasRole('admin') || hasRole('super_admin')) && (
              <Button variant="plain" fullWidth textAlign="left" onClick={() => { onClose(); router.push('/access'); }}>🔐 Access Matrix</Button>
            )}
            <Button variant="plain" fullWidth textAlign="left">Change password</Button>
            <Button variant="plain" fullWidth textAlign="left">Notification settings</Button>
            <Button variant="plain" fullWidth textAlign="left" tone="critical" onClick={logout}>Log out</Button>
          </BlockStack>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}
