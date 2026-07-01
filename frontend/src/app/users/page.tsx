'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import {
  Badge, BlockStack, Button, Checkbox, InlineStack, Modal,
  Select, Text, TextField,
} from '@shopify/polaris';

interface User {
  id: number; name: string; email: string; username?: string;
  division_id?: number; is_active: boolean; avatar_url?: string;
  roles?: Array<{ id: number; name: string; label: string }>;
  division?: { id: number; name: string } | null;
}
interface Role { id: number; name: string; label: string; }
interface Division { id: number; name: string; }

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editing, setEditing] = useState<User | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRoles, setFormRoles] = useState<number[]>([]);
  const [formDivision, setFormDivision] = useState('');

  const fetchUsers = () => {
    api.users.list({ q: search || undefined, role: roleFilter || undefined })
      .then((res) => setUsers((res.data as unknown as User[]) || []))
      .catch(console.error);
  };

  const fetchMeta = async () => {
    try {
      const [rolesRes, divRes] = await Promise.all([
        api.users.roles(),
        api.divisions.list(),
      ]);
      setRoles(((rolesRes.data || []) as unknown as Role[]).filter((r: Role) => r.name !== 'super_admin'));
      setDivisions((divRes.data || []) as unknown as Division[]);
    } catch (e) { /* ignore */ }
  };

  useEffect(() => { fetchUsers(); }, [search, roleFilter]);
  useEffect(() => { fetchMeta(); }, []);

  const openCreate = () => {
    setFormName(''); setFormEmail(''); setFormUsername('');
    setFormPassword(''); setFormRoles([]); setFormDivision('');
    setError('');
    setCreating(true);
  };

  const openEdit = (u: User) => {
    setFormName(u.name); setFormEmail(u.email);
    setFormUsername(u.username || ''); setFormPassword('');
    setFormRoles(u.roles?.map((r) => r.id) || []);
    setFormDivision(u.division_id ? String(u.division_id) : '');
    setError('');
    setEditing(u);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: formName, email: formEmail,
        username: formUsername || undefined,
        division_id: formDivision ? Number(formDivision) : undefined,
      };
      if (formPassword) payload.password = formPassword;

      if (editing) {
        await api.users.update(editing.id, payload);
        if (formRoles.length > 0) {
          await api.users.assignRole(editing.id, formRoles);
        }
      } else {
        await api.users.create({ ...payload, password: formPassword, role_ids: formRoles });
      }
      setCreating(false); setEditing(null);
      fetchUsers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save user';
      setError(message);
      console.error(err);
    }
    finally { setSaving(false); }
  };

  const deactivate = async (u: User) => {
    if (!confirm(`Deactivate ${u.name}?`)) return;
    try { await api.users.delete(u.id); fetchUsers(); }
    catch (err) { console.error(err); }
  };

  const filtered = users;

  return (
    <AppLayout>
      <div className="app-page">
        <div className="app-page__header">
          <InlineStack align="space-between" blockAlign="center">
            <BlockStack gap="050">
              <Text as="h1" variant="headingLg">Users</Text>
              <Text as="p" variant="bodyMd" tone="subdued">Manage system users and roles.</Text>
            </BlockStack>
            <Button variant="primary" onClick={openCreate}>+ New User</Button>
          </InlineStack>
        </div>

        <InlineStack gap="200">
          <div style={{ flex: 1 }}>
            <TextField label="Search" labelHidden value={search} onChange={setSearch}
              autoComplete="off" placeholder="Search by name or email..." />
          </div>
          <Select label="Role" labelHidden
            options={[
              { label: 'All roles', value: '' },
              ...roles.map((r) => ({ label: r.label || r.name, value: r.name })),
            ]}
            value={roleFilter} onChange={setRoleFilter}
          />
        </InlineStack>

        <div style={{ height: 16 }} />

        <div className="surface-card">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', textAlign: 'left' }}>
                <th style={{ padding: '10px 16px', fontSize: 13, color: '#6b7280' }}>Name</th>
                <th style={{ padding: '10px 16px', fontSize: 13, color: '#6b7280' }}>Email</th>
                <th style={{ padding: '10px 16px', fontSize: 13, color: '#6b7280' }}>Username</th>
                <th style={{ padding: '10px 16px', fontSize: 13, color: '#6b7280' }}>Roles</th>
                <th style={{ padding: '10px 16px', fontSize: 13, color: '#6b7280' }}>Division</th>
                <th style={{ padding: '10px 16px', fontSize: 13, color: '#6b7280' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <td style={{ padding: '10px 16px' }}>
                    <Text as="p" variant="bodyMd" fontWeight="medium">{u.name}</Text>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <Text as="p" variant="bodyMd">{u.email}</Text>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <Text as="p" variant="bodyMd" tone="subdued">{u.username || '-'}</Text>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <InlineStack gap="100">
                      {u.roles?.map((r) => (
                        <Badge key={r.id}>{r.label || r.name}</Badge>
                      ))}
                    </InlineStack>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <Text as="p" variant="bodyMd">{u.division?.name || '-'}</Text>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <InlineStack gap="100">
                      <Button size="slim" onClick={() => openEdit(u)}>Edit</Button>
                      {!u.roles?.some((r) => r.name === 'super_admin') && (
                      <Button size="slim" variant="tertiary" tone="critical" onClick={() => deactivate(u)}>Deactivate</Button>
                    )}
                    </InlineStack>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={creating || !!editing}
        onClose={() => { setCreating(false); setEditing(null); }}
        title={creating ? 'New User' : 'Edit User'}
        primaryAction={{ content: 'Save', onAction: save, loading: saving }}
        secondaryActions={[{ content: 'Cancel', onAction: () => { setCreating(false); setEditing(null); } }]}
      >
        <Modal.Section>
          <BlockStack gap="300">
            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 8,
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                color: '#dc2626', fontSize: 13,
              }}>
                {error}
              </div>
            )}
            <TextField label="Name" value={formName} onChange={setFormName} autoComplete="off" />
            <TextField label="Email" value={formEmail} onChange={setFormEmail} autoComplete="off" type="email" />
            <TextField label="Username" value={formUsername} onChange={setFormUsername} autoComplete="off" />
            <TextField label={editing ? 'New password (leave blank to keep)' : 'Password'}
              value={formPassword} onChange={setFormPassword} autoComplete="off" type="password" />

            {/* Division selector */}
            {divisions.length > 0 && (
              <Select
                label="Division"
                options={[
                  { label: 'None', value: '' },
                  { label: 'All', value: '-1' },
                  ...divisions.map((d) => ({ label: d.name, value: String(d.id) })),
                ]}
                value={formDivision}
                onChange={setFormDivision}
              />
            )}

            {/* Role checkboxes */}
            {roles.length > 0 && (
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd" fontWeight="medium">Roles</Text>
                {roles.map((r) => (
                  <Checkbox
                    key={r.id}
                    label={r.label || r.name}
                    checked={formRoles.includes(r.id)}
                    onChange={(checked) => {
                      setFormRoles(checked
                        ? [...formRoles, r.id]
                        : formRoles.filter((id) => id !== r.id)
                      );
                    }}
                  />
                ))}
              </BlockStack>
            )}
          </BlockStack>
        </Modal.Section>
      </Modal>
    </AppLayout>
  );
}
