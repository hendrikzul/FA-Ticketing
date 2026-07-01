'use client';

import {
  Badge,
  BlockStack,
  Button,
  InlineStack,
  Select,
  Text,
  TextField,
} from '@shopify/polaris';
import type { TicketFormState } from '@/lib/ai-desk-types';
import { TICKET_TYPE_OPTIONS, TICKET_STATUS_OPTIONS, TICKET_PRIORITY_OPTIONS } from '@/lib/ai-desk-types';

export function TicketEditForm({
  form,
  onChange,
  onSave,
  saving,
  saveMessage,
  userOptions,
  divisionOptions,
}: {
  form: TicketFormState;
  onChange: (updater: (prev: TicketFormState) => TicketFormState) => void;
  onSave: () => void;
  saving: boolean;
  saveMessage: string | null;
  userOptions: { label: string; value: string }[];
  divisionOptions: { label: string; value: string }[];
}) {
  return (
    <div className="surface-card" style={{ borderStyle: 'dashed' }}>
      <div style={{ padding: 12 }}>
        <BlockStack gap="300">
          <Text as="h4" variant="headingSm">
            Ticket controls
          </Text>
          <Select
            label="Ticket type"
            options={TICKET_TYPE_OPTIONS}
            value={form.ticketType}
            onChange={(value) => onChange((prev) => ({ ...prev, ticketType: value }))}
          />
          <Select
            label="Approval requirement"
            options={[
              { label: 'Not required', value: 'false' },
              { label: 'Required', value: 'true' },
            ]}
            value={form.approvalRequired}
            onChange={(value) => onChange((prev) => ({ ...prev, approvalRequired: value }))}
          />
          <Select
            label="Priority"
            options={TICKET_PRIORITY_OPTIONS}
            value={form.priority}
            onChange={(value) => onChange((prev) => ({ ...prev, priority: value }))}
          />
          <TextField
            label="Category"
            value={form.category}
            onChange={(value) => onChange((prev) => ({ ...prev, category: value }))}
            autoComplete="off"
            placeholder="payments, workflow, infrastructure"
          />
          <Select
            label="Assigned team"
            options={divisionOptions}
            value={form.assignedTeamId}
            onChange={(value) => onChange((prev) => ({ ...prev, assignedTeamId: value }))}
          />
          <Select
            label="Assigned user"
            options={userOptions}
            value={form.assignedUserId}
            onChange={(value) => onChange((prev) => ({ ...prev, assignedUserId: value }))}
          />
          <Select
            label="Workflow status"
            options={TICKET_STATUS_OPTIONS}
            value={form.status}
            onChange={(value) => onChange((prev) => ({ ...prev, status: value }))}
          />
          <InlineStack align="space-between" blockAlign="center">
            <Text as="p" variant="bodySm" tone="subdued">
              {saveMessage || 'Update ticket draft fields directly from the AI Desk thread.'}
            </Text>
            <Button onClick={onSave} loading={saving} variant="primary">
              Save
            </Button>
          </InlineStack>
        </BlockStack>
      </div>
    </div>
  );
}
