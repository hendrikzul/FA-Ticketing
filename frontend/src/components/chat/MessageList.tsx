'use client';

import { useRef, useEffect, useState } from 'react';
import { Avatar, BlockStack, InlineStack, Text } from '@shopify/polaris';
import type { Message } from './types';

export function MessageList({
  messages,
  onThreadOpen,
  onForward,
  aiThinking = false,
}: {
  messages: Message[];
  onThreadOpen?: (messageId: number) => void;
  onForward?: (message: Message) => void;
  aiThinking?: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
      <BlockStack gap="400">
        {messages.map((msg) => (
          <MessageItem key={msg.id} message={msg} onThreadOpen={onThreadOpen} onForward={onForward} />
        ))}
        {aiThinking && (
          <div style={{ padding: '4px 24px' }}>
            <InlineStack gap="200" blockAlign="start">
              <div style={{ flexShrink: 0 }}>
                <Avatar initials="🤖" customer={false} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <InlineStack gap="200" blockAlign="baseline">
                  <Text as="p" variant="bodySm" fontWeight="semibold">AI Agent</Text>
                  <Text as="p" variant="bodySm" tone="subdued">thinking...</Text>
                </InlineStack>
                <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
                  <span className="dot-bounce" style={{ animationDelay: '0s' }}>●</span>
                  <span className="dot-bounce" style={{ animationDelay: '0.2s' }}>●</span>
                  <span className="dot-bounce" style={{ animationDelay: '0.4s' }}>●</span>
                </div>
              </div>
            </InlineStack>
          </div>
        )}
        <div ref={bottomRef} />
      </BlockStack>
    </div>
  );
}

function parseMentions(text: string): Array<{ text: string; isMention: boolean }> {
  const parts: Array<{ text: string; isMention: boolean }> = [];
  const regex = /(@\w+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), isMention: false });
    }
    parts.push({ text: match[1], isMention: true });
    lastIndex = match.index + match[1].length;
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), isMention: false });
  }
  return parts;
}

export function MessageItem({
  message,
  onThreadOpen,
  onForward,
}: {
  message: Message;
  onThreadOpen?: (messageId: number) => void;
  onForward?: (message: Message) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const isAi = message.sender_type === 'ai_agent' || message.sender_type === 'ai';
  const isSystem = message.sender_type === 'system';
  const senderName = isAi
    ? 'AI Agent'
    : isSystem
    ? 'System'
    : message.sender?.name || `User #${message.sender_id}`;
  const avatarUrl = message.sender?.avatar_url || null;
  const avatarChar = isAi ? '🤖' : (senderName[0]?.toUpperCase() || '?');
  const threadCount = message.thread_reply_count || 0;

  return (
    <div
      style={{ padding: '4px 24px' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <InlineStack gap="200" blockAlign="start">
        {/* Avatar — Polaris Avatar for consistent fallback styling */}
        <div style={{ flexShrink: 0 }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={senderName} style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} />
          ) : (
            <Avatar initials={avatarChar} customer={false} />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Sender + time */}
          <InlineStack gap="200" blockAlign="baseline">
            <Text as="p" variant="bodySm" fontWeight="semibold">{senderName}</Text>
            <Text as="p" variant="bodySm" tone="subdued">
              {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </InlineStack>

          {/* Body with colored mentions */}
          {message.body_text ? (
            <div style={{ marginTop: 2, lineHeight: 1.5, fontSize: 14, color: '#1a1a1a', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {parseMentions(message.body_text).map((part, i) =>
                part.isMention ? (
                  <span key={i} style={{ color: '#2563eb', fontWeight: 500, background: 'rgba(37,99,235,0.08)', borderRadius: 3, padding: '0 2px' }}>{part.text}</span>
                ) : (
                  <span key={i}>{part.text}</span>
                )
              )}
            </div>
          ) : null}

          {/* Attachments */}
          {message.attachments?.length ? (
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {message.attachments.map((att) => {
                const isImage = (att.mime_type || '').startsWith('image/');
                const isVideo = (att.mime_type || '').startsWith('video/');
                const fileUrl = att.url || (att.storage_path ? `${att.storage_path}` : '');

                if (isImage) {
                  return (
                    <div key={att.id}>
                      <img
                        src={fileUrl}
                        alt={att.filename}
                        onClick={() => setLightboxUrl(fileUrl)}
                        style={{
                          maxWidth: 400, maxHeight: 300, borderRadius: 8,
                          cursor: 'pointer', border: '1px solid rgba(0,0,0,0.1)',
                          objectFit: 'cover',
                        }}
                      />
                    </div>
                  );
                }

                if (isVideo) {
                  return (
                    <div key={att.id} style={{ maxWidth: 480 }}>
                      <video
                        controls
                        src={fileUrl}
                        style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8 }}
                      />
                    </div>
                  );
                }

                // Other file types
                return (
                  <a
                    key={att.id}
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '8px 14px', borderRadius: 8,
                      border: '1px solid rgba(0,0,0,0.1)', background: '#fff',
                      textDecoration: 'none', color: '#1a1a1a', fontSize: 13,
                    }}
                  >
                    <span>📎</span>
                    <span>{att.filename}</span>
                  </a>
                );
              })}
            </div>
          ) : null}

          {/* Thread indicator + Reply + Forward buttons */}
          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            {threadCount > 0 ? (
              <button
                type="button"
                onClick={() => onThreadOpen?.(message.id)}
                style={{ padding: '2px 8px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#2563eb' }}
              >
                ↩ {threadCount} {threadCount === 1 ? 'reply' : 'replies'}
              </button>
            ) : null}
            {hovered && (
              <>
                <button
                  type="button"
                  onClick={() => onThreadOpen?.(message.id)}
                  style={{ padding: '2px 8px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#6b7280' }}
                >
                  {threadCount > 0 ? 'Reply' : 'Start thread'}
                </button>
                {onForward && message.body_text ? (
                  <button
                    type="button"
                    onClick={() => onForward(message)}
                    style={{ padding: '2px 8px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#6b7280' }}
                  >
                    ↪ Forward
                  </button>
                ) : null}
              </>
            )}
          </div>
        </div>
      </InlineStack>

      {/* Lightbox */}
      {lightboxUrl ? (
        <div
          onClick={() => setLightboxUrl(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <img
            src={lightboxUrl}
            alt="Preview"
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12 }}
          />
        </div>
      ) : null}
    </div>
  );
}
