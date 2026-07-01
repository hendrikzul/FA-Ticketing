'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { BlockStack, Button, Modal, Select, Text, TextField } from '@shopify/polaris';

export function NewDmModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (id: number) => void;
}) {
  const [message, setMessage] = useState('');
  const [participantId, setParticipantId] = useState('');
  const [users, setUsers] = useState<Array<{ id: number; name: string; email?: string }>>([]);

  useEffect(() => {
    if (!open) return;
    api.users.list()
      .then((res) => setUsers((res.data as unknown as Array<{ id: number; name: string; email?: string }>) || []))
      .catch((err) => console.error(err));
    setMessage('');
    setParticipantId('');
  }, [open]);

  const create = async () => {
    if (!message.trim() || !participantId) return;
    try {
      const res = await api.conversations.create({
        message,
        conversation_mode: 'human',
        participant_ids: [Number(participantId)],
      });
      onCreated((res.data as { id: number }).id);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Direct Message"
      primaryAction={{
        content: 'Start chat',
        onAction: create,
        disabled: !message.trim() || !participantId,
      }}
      secondaryActions={[{ content: 'Cancel', onAction: onClose }]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          <Select
            label="Recipient"
            options={[{ label: 'Select member', value: '' }].concat(users.map((user) => ({
              label: user.email ? `${user.name} (${user.email})` : user.name,
              value: String(user.id),
            })))}
            value={participantId}
            onChange={setParticipantId}
          />
          <TextField
            label="Message"
            autoComplete="off"
            value={message}
            onChange={setMessage}
            multiline={3}
            placeholder="Write your message..."
          />
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}
