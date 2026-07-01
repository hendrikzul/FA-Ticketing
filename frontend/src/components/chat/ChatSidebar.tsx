'use client';

import { BlockStack, Text } from '@shopify/polaris';
import { ChatIcon, PlusIcon } from '@shopify/polaris-icons';
import type { Conversation } from './types';

export function ChatSidebar({
  groups,
  directs,
  selectedId,
  onSelect,
  onNewChat,
  onNewGroup,
  threadItems,
  onThreadClick,
}: {
  groups: Conversation[];
  directs: Conversation[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onNewChat: () => void;
  onNewGroup: () => void;
  threadItems: { id: number; title: string; channel: string; count: number }[];
  onThreadClick: (messageId: number) => void;
}) {
  return (
    <div style={{ width: 260, borderRight: '1px solid rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Channels */}
      <div style={{ padding: '12px 16px 4px' }}>
        <Text as="p" variant="bodySm" tone="subdued" fontWeight="semibold">CHANNELS</Text>
      </div>
      <div style={{ flex: '0 0 auto', maxHeight: '30%', overflowY: 'auto' }}>
        {groups.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => onSelect(g.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              width: '100%', padding: '6px 16px', border: 'none', background: selectedId === g.id ? 'rgba(0,128,96,0.08)' : 'transparent',
              cursor: 'pointer', textAlign: 'left', fontSize: 14,
              color: selectedId === g.id ? '#005c45' : '#1a1a1a',
            }}
          >
            <span style={{ fontWeight: 600 }}>#</span>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.title}</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onNewGroup}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          width: '100%', padding: '4px 16px', border: 'none', background: 'transparent',
          cursor: 'pointer', fontSize: 13, color: '#6b7280',
        }}
      >
        <PlusIcon width="14" height="14" />
        <span>Add Channel</span>
      </button>

      <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '4px 12px' }} />

      {/* Direct Messages */}
      <div style={{ padding: '8px 16px 4px' }}>
        <Text as="p" variant="bodySm" tone="subdued" fontWeight="semibold">DIRECT MESSAGES</Text>
      </div>
      <div style={{ flex: '0 0 auto', maxHeight: '30%', overflowY: 'auto' }}>
        {directs.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => onSelect(d.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              width: '100%', padding: '6px 16px', border: 'none', background: selectedId === d.id ? 'rgba(0,128,96,0.08)' : 'transparent',
              cursor: 'pointer', textAlign: 'left', fontSize: 14,
              color: selectedId === d.id ? '#005c45' : '#1a1a1a',
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onNewChat}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          width: '100%', padding: '4px 16px', border: 'none', background: 'transparent',
          cursor: 'pointer', fontSize: 13, color: '#6b7280',
        }}
      >
        <PlusIcon width="14" height="14" />
        <span>New DM</span>
      </button>

      {/* Threads */}
      {threadItems.length > 0 && (
        <>
          <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '4px 12px' }} />
          <div style={{ padding: '8px 16px 4px' }}>
            <Text as="p" variant="bodySm" tone="subdued" fontWeight="semibold">THREADS</Text>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {threadItems.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onThreadClick(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', padding: '6px 16px', border: 'none', background: 'transparent',
                  cursor: 'pointer', textAlign: 'left', fontSize: 13, color: '#4a4a4a',
                }}
              >
                <span>💬</span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>{t.count}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
