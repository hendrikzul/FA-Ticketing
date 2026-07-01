'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { BlockStack, InlineStack, Text, Modal } from '@shopify/polaris';
import type { Conversation } from './types';

export function ForwardModal({
  open,
  onClose,
  onForward,
  messageText,
}: {
  open: boolean;
  onClose: () => void;
  onForward: (conversationId: number) => void;
  messageText: string;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) return;
    api.conversations.list({ filter: 'all' })
      .then((res) => {
        const data = (res as { data?: Conversation[] }).data || [];
        setConversations(data as Conversation[]);
      })
      .catch(console.error);
  }, [open]);

  const filtered = conversations.filter((c) =>
    !search || (c.title || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Forward message"
      secondaryActions={[{ content: 'Cancel', onAction: onClose }]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          <div style={{
            padding: '8px 12px', borderRadius: 8,
            border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(0,0,0,0.02)',
            fontSize: 13, color: '#4a4a4a', maxHeight: 80, overflowY: 'auto',
          }}>
            {messageText.length > 200 ? messageText.slice(0, 197) + '...' : messageText}
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search channels or people..."
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 8,
              border: '1px solid rgba(0,0,0,0.12)', fontSize: 14, outline: 'none',
            }}
          />

          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <Text as="p" variant="bodyMd" tone="subdued">No conversations found.</Text>
            ) : (
              <BlockStack gap="100">
                {filtered.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onForward(c.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      width: '100%', padding: '8px 10px', border: 'none',
                      background: 'transparent', cursor: 'pointer',
                      textAlign: 'left', borderRadius: 6,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ fontWeight: 600, color: '#6b7280', fontSize: 14 }}>
                      {c.conversation_mode === 'group' ? '#' : c.conversation_mode === 'ai' ? '🤖' : '👤'}
                    </span>
                    <BlockStack gap="025">
                      <Text as="p" variant="bodyMd" fontWeight="medium">{c.title || 'Untitled'}</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        {c.conversation_mode === 'group' ? 'Channel' : c.conversation_mode === 'ai' ? 'AI Desk' : 'Direct message'}
                      </Text>
                    </BlockStack>
                  </button>
                ))}
              </BlockStack>
            )}
          </div>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}
