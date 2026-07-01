'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  Badge, BlockStack, Button, InlineStack, Modal,
  Text, TextField, Spinner,
} from '@shopify/polaris';
import { PlusIcon, SearchIcon } from '@shopify/polaris-icons';
import type { Conversation } from './types';

interface Member {
  id: number;
  name: string;
  username?: string;
  email?: string;
  pivot?: { role?: string };
}

interface SearchableUser {
  id: number;
  name: string;
  username?: string;
}

export function GroupDetailModal({
  open,
  onClose,
  conversation,
}: {
  open: boolean;
  onClose: () => void;
  conversation: Conversation | null;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<SearchableUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<number | null>(null);

  const fetchMembers = () => {
    if (!conversation) return;
    api.conversations.show(conversation.id)
      .then((res) => {
        const data = (res as { data?: { participants?: Member[] } }).data;
        setMembers(data?.participants || []);
      })
      .catch(console.error);
  };

  useEffect(() => {
    if (!open || !conversation) return;
    fetchMembers();
  }, [open, conversation]);

  const searchUsers = (query: string) => {
    setUserSearch(query);
    if (query.length < 1) { setSearchResults([]); return; }
    setSearching(true);
    api.users.list({ q: query })
      .then((res) => {
        const all = (res.data || []) as unknown as SearchableUser[];
        // Filter out existing members
        const existingIds = new Set(members.map((m) => m.id));
        setSearchResults(all.filter((u) => !existingIds.has(u.id)));
      })
      .catch(console.error)
      .finally(() => setSearching(false));
  };

  const addMember = async (userId: number) => {
    if (!conversation) return;
    setAdding(userId);
    try {
      const token = localStorage.getItem('auth_token');
      const headers = { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const res = await fetch(`${API_BASE}/conversations/${conversation.id}/participants`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ user_id: userId }),
      });
      if (res.ok) {
        fetchMembers();
        setShowAddMember(false);
        setUserSearch('');
        setSearchResults([]);
      } else {
        const err = await res.json().catch(() => ({ message: 'Failed to add member' }));
        console.error(err);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAdding(null);
    }
  };

  return (
    <>
      <Modal
        open={open && !showAddMember}
        onClose={onClose}
        title={`# ${conversation?.title || 'Channel'}`}
        secondaryActions={[{ content: 'Close', onAction: onClose }]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h3" variant="headingSm">Members</Text>
              <Badge>{String(members.length)}</Badge>
            </InlineStack>

            <BlockStack gap="150">
              {members.map((m) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 6,
                    background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 600, color: '#4a4a4a',
                  }}>
                    {(m.name || m.username || '?')[0].toUpperCase()}
                  </div>
                  <BlockStack gap="025">
                    <Text as="p" variant="bodyMd" fontWeight="medium">{m.name || m.username}</Text>
                    <Text as="p" variant="bodySm" tone="subdued">{m.pivot?.role || 'member'}</Text>
                  </BlockStack>
                </div>
              ))}
            </BlockStack>

            <Button icon={PlusIcon} fullWidth onClick={() => setShowAddMember(true)}>Add member</Button>
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Add Member Modal */}
      <Modal
        open={open && showAddMember}
        onClose={() => { setShowAddMember(false); setUserSearch(''); setSearchResults([]); }}
        title="Add Member"
        secondaryActions={[{ content: 'Back', onAction: () => { setShowAddMember(false); setUserSearch(''); setSearchResults([]); } }]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <TextField
              label="Search users"
              labelHidden
              value={userSearch}
              onChange={searchUsers}
              autoComplete="off"
              placeholder="Type name or email..."
              prefix={<SearchIcon width="16" height="16" />}
            />

            {searching && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
                <Spinner size="small" />
              </div>
            )}

            {!searching && searchResults.length === 0 && userSearch.length > 0 && (
              <Text as="p" variant="bodyMd" tone="subdued">No users found.</Text>
            )}

            {!searching && searchResults.length > 0 && (
              <BlockStack gap="100">
                {searchResults.map((u) => (
                  <div key={u.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 10px', borderRadius: 6,
                    border: '1px solid rgba(0,0,0,0.08)',
                  }}>
                    <InlineStack gap="200" blockAlign="center">
                      <div style={{
                        width: 28, height: 28, borderRadius: 4,
                        background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 600, color: '#4a4a4a',
                      }}>
                        {(u.name || u.username || '?')[0].toUpperCase()}
                      </div>
                      <Text as="p" variant="bodyMd" fontWeight="medium">{u.name || u.username}</Text>
                    </InlineStack>
                    <Button
                      size="slim"
                      loading={adding === u.id}
                      onClick={() => addMember(u.id)}
                    >
                      Add
                    </Button>
                  </div>
                ))}
              </BlockStack>
            )}
          </BlockStack>
        </Modal.Section>
      </Modal>
    </>
  );
}
