'use client';

import { MessageList } from './MessageList';
import { ChatComposer } from './ChatComposer';
import { BlockStack, InlineStack, Text } from '@shopify/polaris';
import type { Message } from './types';

export function ThreadPanel({
  threadId,
  messages,
  onSend,
  onClose,
  sending,
}: {
  threadId: number;
  messages: Message[];
  onSend: (text: string, files: File[]) => void;
  onClose: () => void;
  sending: boolean;
}) {
  const parentMessage = messages.length > 0
    ? messages[0] // First message is the parent (or we need to fetch parent separately)
    : null;

  return (
    <div style={{
      width: 480, borderLeft: '1px solid rgba(0,0,0,0.08)',
      display: 'flex', flexDirection: 'column', height: '100%',
      background: '#fff',
    }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <InlineStack align="space-between" blockAlign="center">
          <BlockStack gap="050">
            <Text as="h3" variant="headingSm">Thread</Text>
            <Text as="p" variant="bodySm" tone="subdued">#{threadId}</Text>
          </BlockStack>
          <button
            type="button"
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: '#6b7280' }}
          >
            ×
          </button>
        </InlineStack>
      </div>

      {/* Messages — no reply button inside thread */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <MessageList messages={messages} />
      </div>

      {/* Composer */}
      <ChatComposer onSend={(text, files) => onSend(text, files)} sending={sending} />
    </div>
  );
}
