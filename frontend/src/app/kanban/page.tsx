'use client';

import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { Badge, BlockStack, InlineGrid, InlineStack, Select, Text } from '@shopify/polaris';

const COLUMNS = ['new', 'triaged', 'waiting_approval', 'queued', 'in_progress', 'waiting_user', 'waiting_vendor', 'resolved', 'closed', 'rejected', 'cancelled'];
const COLUMN_LABELS: Record<string, string> = {
  new: 'New',
  triaged: 'Triaged',
  waiting_approval: 'Waiting Approval',
  queued: 'Queued',
  in_progress: 'In Progress',
  waiting_user: 'Waiting User',
  waiting_vendor: 'Waiting Vendor',
  resolved: 'Resolved',
  closed: 'Closed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};
const TYPE_OPTIONS = [
  { label: 'All types', value: '' },
  { label: 'Bugfix', value: 'bugfix' },
  { label: 'Development', value: 'development' },
  { label: 'Maintenance', value: 'maintenance' },
];

interface TicketCard {
  id: number;
  ticket_number: string;
  title: string;
  ticket_type?: string | null;
  priority: string;
  status: string;
  is_draft?: boolean;
  approval_required?: boolean;
  assigned_user?: {name: string} | null;
}

export default function KanbanPage() {
  const [columns, setColumns] = useState<Record<string, TicketCard[]>>({});
  const [ticketType, setTicketType] = useState('');

  const loadBoard = async (activeType: string) => {
    const res = await api.tickets.list({ group_by: 'status', ticket_type: activeType || undefined });
    setColumns((res.data as unknown as Record<string, TicketCard[]>) || {});
  };

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await api.tickets.list({ group_by: 'status', ticket_type: ticketType || undefined });
        if (active) {
          setColumns((res.data as unknown as Record<string, TicketCard[]>) || {});
        }
      } catch (err) {
        console.error(err);
      }
    })();

    return () => {
      active = false;
    };
  }, [ticketType]);

  const moveTicket = async (ticketId: number, toStatus: string) => {
    try {
      await api.tickets.updateStatus(ticketId, toStatus);
      await loadBoard(ticketType);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppLayout>
      <div className="app-page app-page--full">
        <div className="app-page__header">
          <Text as="h1" variant="headingLg">
            Kanban
          </Text>
          <Text as="p" variant="bodyMd" tone="subdued">
            Ticket execution lanes for draft intake, approval, queueing, execution, and closure.
          </Text>
        </div>
        <div className="surface-card subdued" style={{ marginBottom: 16 }}>
          <div style={{ padding: 16 }}>
            <InlineStack align="space-between" blockAlign="center">
              <Text as="p" variant="bodyMd" fontWeight="medium">
                Filter by ticket type
              </Text>
              <div style={{ minWidth: 220 }}>
                <Select
                  label="Ticket type"
                  labelHidden
                  options={TYPE_OPTIONS}
                  value={ticketType}
                  onChange={setTicketType}
                />
              </div>
            </InlineStack>
          </div>
        </div>
        <div style={{overflowX: 'auto'}}>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(10, minmax(260px, 1fr))', gap: 16, minWidth: 2680}}>
            {COLUMNS.map((col) => (
              <div key={col} className="surface-card subdued kanban-column">
                <div style={{ padding: 16 }}>
                  <BlockStack gap="300">
                  <InlineGrid columns="1fr auto">
                    <Text as="h2" variant="headingMd">{COLUMN_LABELS[col]}</Text>
                    <Badge>{String(columns[col]?.length || 0)}</Badge>
                  </InlineGrid>
                  <BlockStack gap="300">
                    {columns[col]?.map((ticket) => (
                      <div key={ticket.id} className="surface-card">
                        <div style={{ padding: 16 }}>
                          <BlockStack gap="200">
                          <Text as="p" variant="bodySm" tone="subdued">{ticket.ticket_number}</Text>
                          <Text as="p" variant="bodyMd" fontWeight="medium">{ticket.title}</Text>
                          <InlineStack gap="150">
                            {ticket.ticket_type ? <Badge tone="info">{formatType(ticket.ticket_type)}</Badge> : null}
                            {ticket.is_draft ? <Badge tone="attention">Draft</Badge> : null}
                            {ticket.approval_required ? <Badge tone="warning">Needs approval</Badge> : null}
                          </InlineStack>
                          <InlineGrid columns="auto 1fr" gap="200">
                            <Badge tone={priorityTone(ticket.priority)}>{ticket.priority}</Badge>
                            <Text as="span" variant="bodySm" tone="subdued">
                              {ticket.assigned_user?.name || 'Unassigned'}
                            </Text>
                          </InlineGrid>
                          {col !== COLUMNS[COLUMNS.length - 1] ? (
                            <Select
                              label="Move ticket"
                              labelHidden
                              options={[
                                {label: 'Move to...', value: ''},
                                ...COLUMNS.filter((c) => c !== col).map((c) => ({label: COLUMN_LABELS[c], value: c})),
                              ]}
                              value=""
                              onChange={(value) => value && moveTicket(ticket.id, value)}
                            />
                          ) : null}
                          </BlockStack>
                        </div>
                      </div>
                    ))}
                  </BlockStack>
                </BlockStack>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function priorityTone(priority: string): 'critical' | 'warning' | 'success' | 'info' {
  if (priority === 'P1') return 'critical';
  if (priority === 'P2') return 'warning';
  if (priority === 'P4') return 'success';
  return 'info';
}

function formatType(ticketType: string): string {
  return ticketType.charAt(0).toUpperCase() + ticketType.slice(1);
}
