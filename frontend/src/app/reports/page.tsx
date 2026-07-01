'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { Badge, BlockStack, InlineGrid, Tabs, Text } from '@shopify/polaris';

interface DashboardData {
  summary: {
    total_tickets: number;
    open_tickets: number;
    resolved_today: number;
    draft_tickets: number;
    approval_pending: number;
    breached_sla: number;
  };
  by_priority?: Record<string, number>;
  by_status?: Record<string, number>;
  by_category?: Record<string, number>;
  by_ticket_type?: Record<string, number>;
  recent_activity?: Array<{
    id: number;
    ticket_number: string;
    title: string;
    status: string;
  }>;
}

interface WorkloadItem {
  id: number;
  name: string;
  assigned_tickets_count: number;
}

interface ReminderItem {
  ticket_number: string;
  title: string;
  reason: string;
}

export default function ReportsPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [workload, setWorkload] = useState<WorkloadItem[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [tab, setTab] = useState('dashboard');

  useEffect(() => {
    api.reports.dashboard().then((res) => setDashboard(res.data as unknown as DashboardData));
    api.reports.workload().then((res) => setWorkload((res.data as unknown as WorkloadItem[]) || []));
    api.reports.reminders().then((res) => setReminders((res.data as unknown as ReminderItem[]) || []));
  }, []);

  return (
    <AppLayout>
      <div className="app-page">
        <div className="app-page__header">
          <Text as="h1" variant="headingLg">
            Reports
          </Text>
          <Text as="p" variant="bodyMd" tone="subdued">
            Operational visibility across queue health, workload, and SLA pressure.
          </Text>
        </div>
        <BlockStack gap="400">
          <Tabs
            tabs={[
              {id: 'dashboard', content: 'Dashboard'},
              {id: 'workload', content: 'Workload'},
              {id: 'reminders', content: 'Reminders'},
            ]}
            selected={['dashboard', 'workload', 'reminders'].indexOf(tab)}
            onSelect={(index) => setTab(['dashboard', 'workload', 'reminders'][index])}
          />

          {tab === 'dashboard' && dashboard ? (
            <BlockStack gap="400">
              <InlineGrid columns={{xs: 1, md: 2, lg: 4}} gap="400">
                <StatCard label="Total tickets" value={dashboard.summary.total_tickets} tone="info" />
                <StatCard label="Open tickets" value={dashboard.summary.open_tickets} tone="warning" />
                <StatCard label="Resolved today" value={dashboard.summary.resolved_today} tone="success" />
                <StatCard label="SLA breached" value={dashboard.summary.breached_sla} tone="critical" />
              </InlineGrid>

              <InlineGrid columns={{xs: 1, md: 2}} gap="400">
                <StatCard label="Draft tickets" value={dashboard.summary.draft_tickets} tone="attention" />
                <StatCard label="Approval pending" value={dashboard.summary.approval_pending} tone="warning" />
              </InlineGrid>

              <InlineGrid columns={{xs: 1, md: 2}} gap="400">
                <MetricCard title="By priority" entries={dashboard.by_priority || {}} />
                <MetricCard title="By status" entries={dashboard.by_status || {}} />
              </InlineGrid>

              <InlineGrid columns={{xs: 1, md: 2}} gap="400">
                <MetricCard title="By ticket type" entries={dashboard.by_ticket_type || {}} />
                <MetricCard title="By category" entries={dashboard.by_category || {}} />
              </InlineGrid>

              <div className="surface-card">
                <div style={{ padding: 20 }}>
                  <BlockStack gap="300">
                  <Text as="h3" variant="headingMd">Recent activity</Text>
                  {(dashboard.recent_activity || []).map((a) => (
                    <InlineGrid key={a.id} columns="1fr auto" gap="200">
                      <Text as="p" variant="bodyMd">{a.ticket_number}: {a.title}</Text>
                      <Badge>{a.status.replace('_', ' ')}</Badge>
                    </InlineGrid>
                  ))}
                  </BlockStack>
                </div>
              </div>
            </BlockStack>
          ) : null}

          {tab === 'workload' ? (
            <div className="surface-card">
              <div style={{ padding: 8 }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Active tickets</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workload.map((w) => (
                      <tr key={w.id}>
                        <td>{w.name}</td>
                        <td>{w.assigned_tickets_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {tab === 'reminders' ? (
            <div className="surface-card">
              <div style={{ padding: 20 }}>
                <BlockStack gap="300">
                <Text as="h3" variant="headingMd">Stale tickets & SLA alerts</Text>
                {reminders.length === 0 ? (
                  <Text as="p" variant="bodyMd" tone="subdued">No reminders. Everything is on track.</Text>
                ) : (
                  reminders.map((r, i) => (
                    <BlockStack key={i} gap="100">
                      <Text as="p" variant="bodyMd">{r.ticket_number}: {r.title}</Text>
                      <Text as="p" variant="bodySm" tone="critical">{r.reason}</Text>
                    </BlockStack>
                  ))
                )}
                </BlockStack>
              </div>
            </div>
          ) : null}
        </BlockStack>
      </div>
    </AppLayout>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: 'info' | 'warning' | 'attention' | 'success' | 'critical' }) {
  return (
    <div className="surface-card metric-card">
      <div style={{ padding: 20 }}>
        <BlockStack gap="200">
        <Badge tone={tone}>{label}</Badge>
        <div className="metric-card__value">{String(value)}</div>
      </BlockStack>
      </div>
    </div>
  );
}

function MetricCard({ title, entries }: { title: string; entries: Record<string, unknown> }) {
  return (
    <div className="surface-card subdued">
      <div style={{ padding: 20 }}>
        <BlockStack gap="300">
        <Text as="h3" variant="headingMd">{title}</Text>
        {Object.entries(entries).length > 0 ? (
          Object.entries(entries).map(([key, value]) => (
            <InlineGrid key={key} columns="1fr auto">
              <Text as="span" variant="bodyMd">{key.replace('_', ' ')}</Text>
              <Text as="span" variant="bodyMd" fontWeight="medium">{String(value)}</Text>
            </InlineGrid>
          ))
        ) : (
          <Text as="p" variant="bodyMd" tone="subdued">
            No data yet
          </Text>
        )}
      </BlockStack>
      </div>
    </div>
  );
}
