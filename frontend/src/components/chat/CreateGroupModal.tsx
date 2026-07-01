'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { BlockStack, Button, Checkbox, InlineStack, Text, TextField, Modal } from '@shopify/polaris';

interface UserOption {
  id: number;
  name: string;
  email?: string;
}

export function CreateGroupModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (id: number) => void;
}) {
  const [name, setName] = useState('');
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) return;
    api.users.list()
      .then((res) => setUsers((res.data as unknown as UserOption[]) || []))
      .catch(console.error);
  }, [open]);

  const toggleUser = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!name.trim() || selectedIds.size === 0) return;
    setCreating(true);
    try {
      const res = await api.conversations.create({
        title: name.trim(),
        message: `Group "${name.trim()}" created`,
        conversation_mode: 'group',
        participant_ids: Array.from(selectedIds),
      });
      const id = (res as { data?: { id: number } }).data?.id || 0;
      onCreated(id);
      setName('');
      setSelectedIds(new Set());
      onClose();
    } catch (err) {
      console.error('Failed to create group', err);
    } finally {
      setCreating(false);
    }
  };

  const filteredUsers = users.filter((u) =>
    !search || u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Channel"
      primaryAction={{
        content: 'Create',
        onAction: handleCreate,
        disabled: !name.trim() || selectedIds.size === 0 || creating,
        loading: creating,
      }}
      secondaryActions={[{ content: 'Cancel', onAction: onClose }]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          <TextField
            label="Channel name"
            value={name}
            onChange={setName}
            autoComplete="off"
            placeholder="e.g. tim-engineering"
          />
          <TextField
            label="Search members"
            labelHidden
            value={search}
            onChange={setSearch}
            autoComplete="off"
            placeholder="Search members..."
          />
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            <BlockStack gap="100">
              {filteredUsers.map((u) => (
                <label
                  key={u.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 8px', cursor: 'pointer', borderRadius: 4,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(u.id)}
                    onChange={() => toggleUser(u.id)}
                  />
                  <Text as="p" variant="bodyMd">{u.name}</Text>
                  {u.email ? <Text as="p" variant="bodySm" tone="subdued">{u.email}</Text> : null}
                </label>
              ))}
            </BlockStack>
          </div>
          <Text as="p" variant="bodySm" tone="subdued">
            {selectedIds.size} member{selectedIds.size !== 1 ? 's' : ''} selected
          </Text>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}
