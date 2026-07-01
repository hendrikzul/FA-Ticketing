'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { Badge, Banner, BlockStack, Button, Divider, InlineStack, Scrollable, Text } from '@shopify/polaris';
import { AttachmentIcon, ImageIcon } from '@shopify/polaris-icons';
import { formatBytes } from './utils';
import type { Message } from './types';

export function ChatWindow({ conversationId, plain }: { conversationId: number; plain?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.messages.list(conversationId).then((res) => {
      setMessages((((res.data as unknown as Message[]) || []).slice()).sort((a: Message, b: Message) => (
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )));
    });
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim() && !selectedFile) return;
    setError('');
    setSending(true);
    try {
      const res = await api.messages.send(conversationId, {
        bodyText: input.trim() || undefined,
        file: selectedFile,
      });
      setMessages((prev) => [...prev, res.data as unknown as Message]);
      setInput('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error(err);
      setError('Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`chat-column${plain ? '' : ' surface-card'}`}>
      <div style={{ padding: 16 }}>
        <BlockStack gap="200">
          <InlineStack align="space-between" blockAlign="center">
            <BlockStack gap="050">
              <Text as="h2" variant="headingMd">Conversation #{conversationId}</Text>
              <Text as="p" variant="bodySm" tone="subdued">Real-time workspace thread</Text>
            </BlockStack>
            <Badge tone="success">Live</Badge>
          </InlineStack>
          <Divider />
          {error ? <Banner tone="critical">{error}</Banner> : null}
          <Scrollable style={{ height: '66vh' }}>
            <BlockStack gap="300">
              {messages.map((msg) => (
                <InlineStack key={msg.id} align={msg.sender_type === 'user' ? 'end' : 'start'}>
                  <div className={`message-bubble ${msg.sender_type === 'user' ? 'user' : 'system'}`}>
                    <BlockStack gap="100">
                      {msg.body_text ? (
                        <Text as="p" variant="bodyMd" tone={msg.sender_type === 'user' ? 'text-inverse' : undefined}>{msg.body_text}</Text>
                      ) : null}
                      {msg.attachments?.length ? (
                        <BlockStack gap="100">
                          {msg.attachments.map((attachment) => (
                            <div key={attachment.id} className="attachment-pill">
                              <InlineStack gap="100" blockAlign="center">
                                <span className="attachment-pill__icon">{(attachment.mime_type || '').startsWith('image/') ? 'IMG' : 'FILE'}</span>
                                <Text as="span" variant="bodySm" tone={msg.sender_type === 'user' ? 'text-inverse' : undefined}>{attachment.filename}</Text>
                              </InlineStack>
                            </div>
                          ))}
                        </BlockStack>
                      ) : null}
                      <Text as="span" variant="bodySm" tone={msg.sender_type === 'user' ? 'text-inverse' : 'subdued'}>{new Date(msg.created_at).toLocaleTimeString()}</Text>
                    </BlockStack>
                  </div>
                </InlineStack>
              ))}
              <div ref={bottomRef} />
            </BlockStack>
          </Scrollable>
          <Divider />
          <div className="chat-composer">
            <BlockStack gap="200">
              {selectedFile ? (
                <div className="composer-file-preview">
                  <InlineStack align="space-between" blockAlign="center">
                    <InlineStack gap="150" blockAlign="center">
                      <span className="composer-file-preview__icon">{selectedFile.type.startsWith('image/') ? 'IMG' : 'FILE'}</span>
                      <BlockStack gap="025">
                        <Text as="p" variant="bodySm" fontWeight="semibold">{selectedFile.name}</Text>
                        <Text as="p" variant="bodySm" tone="subdued">{formatBytes(selectedFile.size)}</Text>
                      </BlockStack>
                    </InlineStack>
                    <Button variant="plain" onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>Remove</Button>
                  </InlineStack>
                </div>
              ) : null}
              <textarea
                className="chat-composer__input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Message AICOP... ask, draft, attach context, or drop an image/file."
                rows={1}
              />
              <InlineStack align="space-between" blockAlign="center">
                <InlineStack gap="150">
                  <input ref={fileInputRef} type="file" hidden onChange={(event) => { setSelectedFile(event.target.files?.[0] || null); }} />
                  <Button icon={AttachmentIcon} onClick={() => fileInputRef.current?.click()} accessibilityLabel="Attach file" />
                  <Button icon={ImageIcon} onClick={() => fileInputRef.current?.click()} accessibilityLabel="Attach image" />
                </InlineStack>
                <Button onClick={send} variant="primary" loading={sending}>Send</Button>
              </InlineStack>
            </BlockStack>
          </div>
        </BlockStack>
      </div>
    </div>
  );
}
