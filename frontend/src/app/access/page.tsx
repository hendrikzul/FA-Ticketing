'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  Badge, BlockStack, Button, InlineStack, Modal,
  Select, Text, TextField,
} from '@shopify/polaris';

interface Grant {
  id: string;
  user_id: number;
  division_id: number;
  module: string;
  access_level: string;
  granted_by: number;
  created_at: string;
  user?: { id: number; name: string; email: string };
  division?: { id: number; name: string };
  grantor?: { id: number; name: string };
}

interface Division { id: number; name: string; }
interface UserItem { id: number; name: string; email: string; }

const MODULES = [
  { label: 'All Modules', value: '*' },
  { label: 'Tickets', value: 'tickets' },
  { label: 'Reports', value: 'reports' },
  { label: 'Knowledge', value: 'knowledge' },
  { label: 'Users', value: 'users' },
  { label: 'Settings', value: 'settings' },
];

export default function AccessMatrixPage() {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filterUser, setFilterUser] = useState('');
  const [filterDivision, setFilterDivision] = useState('');
  const [filterModule, setFilterModule] = useState('');

  // Form
  const [formUser, setFormUser] = useState('');
  const [formDivision, setFormDivision] = useState('');
  const [formModule, setFormModule] = useState('*');
  const [formLevel, setFormLevel] = useState('read');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers = { Accept: 'application/json', Authorization: `Bearer ${token}` };

      const [grantsRes, usersRes, divRes] = await Promise.all([
        fetch(`/api/access-matrix?${new URLSearchParams({
          ...(filterUser ? { user_id: filterUser } : {}),
          ...(filterDivision ? { division_id: filterDivision } : {}),
          ...(filterModule ? { module: filterModule } : {}),
        }).toString()}`, { headers }),
        fetch('/api/users', { headers }),
        fetch('/api/divisions', { headers }),
      ]);

      if (grantsRes.ok) setGrants(((await grantsRes.json()).data || []));
      if (usersRes.ok) setUsers(((await usersRes.json()).data || []));
      if (divRes.ok) setDivisions(((await divRes.json()).data || []));
    } catch (e) { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filterUser, filterDivision, filterModule]);

  const addGrant = async () => {
    if (!formUser || !formDivision) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      await fetch('/api/access-matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_id: Number(formUser), division_id: Number(formDivision), module: formModule, access_level: formLevel }),
      });
      setShowAdd(false);
      fetchData();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const revoke = async (id: string) => {
    if (!confirm('Revoke this access?')) return;
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`/api/access-matrix/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
      fetchData();
    } catch (e) { console.error(e); }
  };

  return (
    <AppLayout>
      <div className="app-page">
        <div className="app-page__header">
          <InlineStack align="space-between" blockAlign="center">
            <BlockStack gap="050">
              <Text as="h1" variant="headingLg">Access Matrix</Text>
              <Text as="p" variant="bodyMd" tone="subdued">Manage cross-division access grants.</Text>
            </BlockStack>
            <Button variant="primary" onClick={() => setShowAdd(true)}>+ Add Access</Button>
          </InlineStack>
        </div>

        <InlineStack gap="200">
          <Select label="User" labelHidden
            options={[{ label: 'All users', value: '' }, ...users.map(u => ({ label: `${u.name} (${u.email})`, value: String(u.id) }))]}
            value={filterUser} onChange={setFilterUser} />
          <Select label="Division" labelHidden
            options={[{ label: 'All divisions', value: '' }, ...divisions.map(d => ({ label: d.name, value: String(d.id) }))]}
            value={filterDivision} onChange={setFilterDivision} />
          <Select label="Module" labelHidden
            options={[{ label: 'All modules', value: '' }, ...MODULES]}
            value={filterModule} onChange={setFilterModule} />
        </InlineStack>

        <div style={{ height: 16 }} />

        <div className="surface-card">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', textAlign: 'left' }}>
                <th style={{ padding: '10px 16px', fontSize: 13, color: '#6b7280' }}>User</th>
                <th style={{ padding: '10px 16px', fontSize: 13, color: '#6b7280' }}>Division</th>
                <th style={{ padding: '10px 16px', fontSize: 13, color: '#6b7280' }}>Module</th>
                <th style={{ padding: '10px 16px', fontSize: 13, color: '#6b7280' }}>Access</th>
                <th style={{ padding: '10px 16px', fontSize: 13, color: '#6b7280' }}>Granted By</th>
                <th style={{ padding: '10px 16px', fontSize: 13, color: '#6b7280' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {grants.map((g) => (
                <tr key={g.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <td style={{ padding: '10px 16px' }}>
                    <Text as="p" variant="bodyMd" fontWeight="medium">{g.user?.name || `#${g.user_id}`}</Text>
                    <Text as="p" variant="bodySm" tone="subdued">{g.user?.email || ''}</Text>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <Text as="p" variant="bodyMd">{g.division?.name || `#${g.division_id}`}</Text>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <Badge>{g.module === '*' ? 'All' : g.module}</Badge>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <Badge tone={g.access_level === 'manage' ? 'success' : g.access_level === 'edit' ? 'warning' : 'info'}>{g.access_level}</Badge>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <Text as="p" variant="bodyMd" tone="subdued">{g.grantor?.name || 'System'}</Text>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <Button size="slim" variant="tertiary" tone="critical" onClick={() => revoke(g.id)}>Revoke</Button>
                  </td>
                </tr>
              ))}
              {!loading && grants.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>No access grants found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add Cross-Division Access"
        primaryAction={{ content: 'Grant Access', onAction: addGrant, loading: saving }}
        secondaryActions={[{ content: 'Cancel', onAction: () => setShowAdd(false) }]}
      >
        <Modal.Section>
          <BlockStack gap="300">
            <Select label="User"
              options={[{ label: 'Select user', value: '' }, ...users.map(u => ({ label: `${u.name} (${u.email})`, value: String(u.id) }))]}
              value={formUser} onChange={setFormUser} />
            <Select label="Division"
              options={[{ label: 'Select division', value: '' }, ...divisions.map(d => ({ label: d.name, value: String(d.id) }))]}
              value={formDivision} onChange={setFormDivision} />
            <Select label="Module"
              options={MODULES}
              value={formModule} onChange={setFormModule} />
            <Select label="Access Level"
              options={[
                { label: 'View', value: 'view' },
                { label: 'Edit', value: 'edit' },
                { label: 'Manage', value: 'manage' },
              ]}
              value={formLevel} onChange={setFormLevel} />
          </BlockStack>
        </Modal.Section>
      </Modal>
    </AppLayout>
  );
}
