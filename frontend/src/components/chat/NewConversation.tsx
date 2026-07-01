'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { BlockStack, Button, Select, Text, TextField } from '@shopify/polaris';

export function NewConversation({
  onCreated,
  mode = 'ai',
}: {
  onCreated: (id: number) => void;
  mode?: 'human' | 'ai';
}) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [participantId, setParticipantId] = useState('');
  const [users, setUsers] = useState<Array<{ id: number; name: string; email?: string }>>([]);

  useEffect(() => {
    if (mode !== 'human') return;
    api.users.list()
      .then((res) => setUsers((res.data as unknown as Array<{ id: number; name: string; email?: string }>) || []))
      .catch((err) => console.error(err));
  }, [mode]);

  const create = async () => {
    if (!message.trim()) return;
    try {
      const res = await api.conversations.create({
        title: title || undefined,
        message,
        conversation_mode: mode,
        participant_ids: mode === 'human' && participantId ? [Number(participantId)] : undefined,
      });
      onCreated((res.data as { id: number }).id);
      setTitle('');
      setMessage('');
      setParticipantId('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="surface-card subdued">
      <div style={{ padding: 20 }}>
        <BlockStack gap="300">
          <BlockStack gap="100">
            <Text as="h2" variant="headingMd">{mode === 'human' ? 'Start chat' : 'Start AI thread'}</Text>
            <Text as="p" variant="bodySm" tone="subdued">
              {mode === 'human' ? 'Open a private chat with another member.' : 'Open a new AI intake thread for ticket drafting.'}
            </Text>
          </BlockStack>
          {mode === 'human' ? (
            <Select
              label="Recipient"
              options={[{ label: 'Select member', value: '' }].concat(users.map((user) => ({
                label: user.email ? `${user.name} (${user.email})` : user.name,
                value: String(user.id),
              })))}
              value={participantId}
              onChange={setParticipantId}
            />
          ) : null}
          <TextField
            label={mode === 'human' ? 'Title' : 'Subject'}
            autoComplete="off"
            value={title}
            onChange={setTitle}
            placeholder={mode === 'human' ? 'Optional chat title...' : 'Refund bug, vendor workflow, VPN maintenance...'}
          />
          <TextField
            label="First message"
            autoComplete="off"
            value={message}
            onChange={setMessage}
            multiline={3}
            placeholder={mode === 'human' ? 'Write your message.' : 'Describe the IT issue or request for AI intake.'}
          />
          <Button onClick={create} variant="primary">{mode === 'human' ? 'New chat' : 'New AI thread'}</Button>
        </BlockStack>
      </div>
    </div>
  );
}
