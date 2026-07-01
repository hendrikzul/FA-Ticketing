'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Can } from '@/components/auth/Can';
import {
  Badge,
  BlockStack,
  Button,
  InlineStack,
  Select,
  Text,
  TextField,
} from '@shopify/polaris';

// ── Mock data (until backend API is ready) ──────────────

interface Lead {
  id: number;
  name: string;
  company: string;
  email: string;
  status: 'new' | 'contacted' | 'qualified' | 'lost';
}

const MOCK_LEADS: Lead[] = [
  { id: 1, name: 'Alice Chen', company: 'Acme Corp', email: 'alice@acme.com', status: 'new' },
  { id: 2, name: 'Bob Smith', company: 'Globex Inc', email: 'bob@globex.com', status: 'contacted' },
  { id: 3, name: 'Carol Davis', company: 'Initech', email: 'carol@initech.com', status: 'qualified' },
  { id: 4, name: 'Dan Wilson', company: 'Umbrella Co', email: 'dan@umbrella.com', status: 'lost' },
];

const STATUS_COLOR: Record<string, 'info' | 'success' | 'attention' | 'critical'> = {
  new: 'info',
  contacted: 'attention',
  qualified: 'success',
  lost: 'critical',
};

// ── Page ────────────────────────────────────────────────

export default function CrmLeadsPage() {
  const { hasAddon } = useAuth();
  const [leads] = useState<Lead[]>(MOCK_LEADS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Double-gate: redirect handled by parent route, but guard here too
  if (!hasAddon('crm-leads')) return null;

  const filtered = leads.filter((l) => {
    if (search && !l.name.toLowerCase().includes(search.toLowerCase()) && !l.company.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && l.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="app-page">
      <div className="app-page__header">
        <InlineStack align="space-between" blockAlign="center">
          <BlockStack gap="050">
            <Text as="h1" variant="headingLg">CRM Leads</Text>
            <Text as="p" variant="bodyMd" tone="subdued">Manage sales leads and pipeline.</Text>
          </BlockStack>
          <Can addon="crm-leads" level="write">
            <Button variant="primary">+ New Lead</Button>
          </Can>
        </InlineStack>
      </div>

      <InlineStack gap="200" blockAlign="center">
        <div style={{ flex: 1 }}>
          <TextField
            label="Search leads"
            labelHidden
            value={search}
            onChange={setSearch}
            autoComplete="off"
            placeholder="Search by name or company..."
          />
        </div>
        <Select
          label="Status"
          labelHidden
          options={[
            { label: 'All statuses', value: '' },
            { label: 'New', value: 'new' },
            { label: 'Contacted', value: 'contacted' },
            { label: 'Qualified', value: 'qualified' },
            { label: 'Lost', value: 'lost' },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </InlineStack>

      <div style={{ height: 16 }} />

      <div className="surface-card">
        <div style={{ padding: 16 }}>
          <BlockStack gap="200">
            {filtered.length === 0 ? (
              <Text as="p" variant="bodyMd" tone="subdued">No leads found.</Text>
            ) : (
              filtered.map((lead) => (
                <div
                  key={lead.id}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <BlockStack gap="050">
                    <Text as="p" variant="bodyMd" fontWeight="medium">{lead.name}</Text>
                    <Text as="p" variant="bodySm" tone="subdued">{lead.company} — {lead.email}</Text>
                  </BlockStack>
                  <InlineStack gap="200" blockAlign="center">
                    <Badge tone={STATUS_COLOR[lead.status]}>{lead.status}</Badge>
                    <Can addon="crm-leads" level="write">
                      <Button size="slim">Edit</Button>
                    </Can>
                    <Can addon="crm-leads" level="delete">
                      <Button size="slim" variant="tertiary" tone="critical">Delete</Button>
                    </Can>
                  </InlineStack>
                </div>
              ))
            )}
          </BlockStack>
        </div>
      </div>
    </div>
  );
}
