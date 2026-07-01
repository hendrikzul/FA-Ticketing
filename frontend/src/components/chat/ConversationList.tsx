'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Badge, BlockStack, InlineStack, Scrollable, Text } from '@shopify/polaris';
import { labelForFilter, formatModeType, SimpleEmptyState } from './utils';
import type { Conversation } from './types';

export function ConversationList({
  selectedId,
  onSelect,
  filter,
  query,
  mode,
  title = 'Conversations',
  subtitle,
}: {
  selectedId: number | null;
  onSelect: (id: number) => void;
  filter: string;
  query: string;
  mode?: 'human' | 'ai';
  title?: string;
  subtitle?: string;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    api.conversations.list({ filter, q: query || undefined, mode }).then((res) => setConversations((res.data as unknown as Conversation[]) || []));
  }, [filter, query, mode]);

  return (
    <div className="conversation-column surface-card subdued">
      <div style={{ padding: 16 }}>
        <BlockStack gap="300">
          <InlineStack align="space-between">
            <BlockStack gap="050">
              <Text as="h2" variant="headingMd">{title}</Text>
              <Text as="p" variant="bodySm" tone="subdued">{subtitle || labelForFilter(filter, mode)}</Text>
            </BlockStack>
            <Badge tone="info">{String(conversations.length)}</Badge>
          </InlineStack>
          <Scrollable style={{ height: '72vh' }}>
            <BlockStack gap="150">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => onSelect(conv.id)}
                  className={`inbox-list-item${selectedId === conv.id ? ' active' : ''}`}
                >
                  <BlockStack gap="150">
                    <InlineStack align="space-between" blockAlign="start">
                      <Text as="h3" variant="bodyMd" fontWeight="semibold" truncate>{conv.title}</Text>
                      <Badge tone="info">{String(conv.messages_count)}</Badge>
                    </InlineStack>
                    {mode === 'ai' && conv.state?.ticket_type ? (
                      <InlineStack gap="100">
                        <Badge tone="info">{formatModeType(conv.state.ticket_type)}</Badge>
                        {conv.state.status ? <Badge>{conv.state.status}</Badge> : null}
                      </InlineStack>
                    ) : null}
                    <InlineStack align="space-between">
                      <Text as="p" variant="bodySm" tone="subdued">
                        {mode === 'human'
                          ? conv.participants?.map((p) => p.name).join(', ') || conv.creator?.name
                          : conv.creator?.name}
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">{new Date(conv.last_activity_at).toLocaleDateString()}</Text>
                    </InlineStack>
                  </BlockStack>
                </button>
              ))}
              {conversations.length === 0 ? (
                <SimpleEmptyState title="No conversations in this view" description="Start a new thread or switch filters." />
              ) : null}
            </BlockStack>
          </Scrollable>
        </BlockStack>
      </div>
    </div>
  );
}
