'use client';

import { ChatWindow } from '@/components/chat/ChatComponents';
import { AIDeskInput } from './AIDeskInput';
import { TicketEditForm } from './TicketEditForm';
import { DetailRow } from './DetailRow';
import { formatTicketType } from '@/lib/ai-desk-utils';
import { Badge, BlockStack, InlineStack, Text } from '@shopify/polaris';
import type { ConversationDetail, TicketFormState } from '@/lib/ai-desk-types';
import type { RefObject } from 'react';

export function AIDeskThreadPanel({
  selectedId,
  detail,
  loadingDetail,
  canEditTicket,
  latestSummary,
  missingFields,
  participants,
  watchers,
  ticket,
  assignee,
  team,
  // Input
  newMessage,
  onMessageChange,
  onNewThread,
  creating,
  textareaRef,
  // Ticket form
  ticketForm,
  onTicketFormChange,
  onTicketSave,
  savingTicket,
  ticketSaveMessage,
  userOptions,
  divisionOptions,
}: {
  selectedId: number | null;
  detail: ConversationDetail | null;
  loadingDetail: boolean;
  canEditTicket: boolean;
  latestSummary: string;
  missingFields: string[];
  participants: ConversationDetail['participants'];
  watchers: ConversationDetail['watchers'];
  ticket: ConversationDetail['ticket'];
  assignee: string;
  team: string;
  newMessage: string;
  onMessageChange: (value: string) => void;
  onNewThread: () => void;
  creating: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  ticketForm: TicketFormState;
  onTicketFormChange: (updater: (prev: TicketFormState) => TicketFormState) => void;
  onTicketSave: () => void;
  savingTicket: boolean;
  ticketSaveMessage: string | null;
  userOptions: { label: string; value: string }[];
  divisionOptions: { label: string; value: string }[];
}) {
  return (
    <div className="conversation-thread-panel">
      {selectedId ? (
        <ChatWindow conversationId={selectedId} plain />
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          minHeight: '60vh',
          padding: 16,
        }}>
          <Text as="h2" variant="headingLg">
            What can AI help with?
          </Text>
          <div style={{ height: 20 }} />
          <div style={{ width: '75%', maxWidth: 640 }}>
            <AIDeskInput
              value={newMessage}
              onChange={onMessageChange}
              onSubmit={onNewThread}
              creating={creating}
              textareaRef={textareaRef}
            />
          </div>
        </div>
      )}

      {selectedId ? (
        <div className="thread-context surface-card subdued">
          <div style={{ padding: 16 }}>
            <BlockStack gap="200">
              <InlineStack align="space-between">
                <Text as="h3" variant="headingSm">
                  Intake context
                </Text>
                <Badge tone={selectedId ? 'success' : 'info'}>{selectedId ? 'Active' : 'Idle'}</Badge>
              </InlineStack>
              {loadingDetail ? (
                <Text as="p" variant="bodyMd" tone="subdued">
                  Loading AI thread detail...
                </Text>
              ) : (
                <>
                  <InlineStack gap="200">
                    {detail?.state?.needs_ticket === true ? <Badge tone="info">Needs ticket</Badge> : null}
                    {detail?.state?.status ? <Badge>{detail.state.status}</Badge> : null}
                    {detail?.state?.priority ? <Badge tone="attention">{detail.state.priority}</Badge> : null}
                    {detail?.state?.ticket_type ? <Badge tone="info">{formatTicketType(detail.state.ticket_type)}</Badge> : null}
                    {detail?.state?.category ? <Badge tone="info">{detail.state.category}</Badge> : null}
                    {detail?.state?.approval_required ? <Badge tone="warning">Approval required</Badge> : null}
                  </InlineStack>
                  <DetailRow label="Participants" value={(participants ?? []).map((p) => p.name).join(', ') || 'None'} />
                  <DetailRow label="Watchers" value={(watchers ?? []).map((w) => w.name).join(', ') || 'None'} />
                  <DetailRow label="Ticket" value={ticket?.ticket_number || 'No ticket linked'} />
                  <DetailRow label="Ticket type" value={ticket?.ticket_type ? formatTicketType(ticket.ticket_type) : 'Not set'} />
                  <DetailRow label="Draft state" value={ticket ? (ticket.is_draft ? 'Draft' : 'Active') : 'No ticket'} />
                  <DetailRow label="Approval" value={ticket?.approval_required ? 'Required' : 'Not required'} />
                  <DetailRow label="Ticket status" value={ticket?.status || 'Not set'} />
                  <DetailRow label="Assignee" value={assignee} />
                  <DetailRow label="Team" value={team} />
                  {canEditTicket ? (
                    <TicketEditForm
                      form={ticketForm}
                      onChange={onTicketFormChange}
                      onSave={onTicketSave}
                      saving={savingTicket}
                      saveMessage={ticketSaveMessage}
                      userOptions={userOptions}
                      divisionOptions={divisionOptions}
                    />
                  ) : null}
                  <BlockStack gap="050">
                    <Text as="p" variant="bodySm" tone="subdued">
                      AI summary
                    </Text>
                    <Text as="p" variant="bodyMd">
                      {latestSummary}
                    </Text>
                  </BlockStack>
                  {missingFields.length > 0 ? (
                    <BlockStack gap="100">
                      <Text as="p" variant="bodySm" tone="subdued">
                        Missing fields
                      </Text>
                      <InlineStack gap="200">
                        {missingFields.map((field) => (
                          <Badge key={field} tone="warning">
                            {field}
                          </Badge>
                        ))}
                      </InlineStack>
                    </BlockStack>
                  ) : null}
                </>
              )}
            </BlockStack>
          </div>
        </div>
      ) : null}
    </div>
  );
}
