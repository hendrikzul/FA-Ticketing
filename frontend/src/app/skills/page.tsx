'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  Badge, BlockStack, Button, InlineStack, Modal,
  Select, Text, TextField,
} from '@shopify/polaris';

interface Skill {
  id: string; name: string; display_name: string; description?: string;
  github_url?: string; entrypoint?: string; scope: string;
  is_active: boolean; created_at: string;
  creator?: { id: number; name: string };
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', display_name: '', description: '', github_url: '', entrypoint: '', scope: 'global',
  });

  const fetchSkills = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/skills', { headers: { Accept: 'application/json', Authorization: `Bearer ${token}` } });
      if (res.ok) setSkills(((await res.json()).data || []));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchSkills(); }, []);

  const addSkill = async () => {
    if (!form.name || !form.display_name) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      setShowAdd(false);
      setForm({ name: '', display_name: '', description: '', github_url: '', entrypoint: '', scope: 'global' });
      fetchSkills();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const toggleSkill = async (skill: Skill) => {
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`/api/skills/${skill.id}/toggle`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      fetchSkills();
    } catch (e) { console.error(e); }
  };

  const deleteSkill = async (skill: Skill) => {
    if (!confirm(`Delete "${skill.display_name}"?`)) return;
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`/api/skills/${skill.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      fetchSkills();
    } catch (e) { console.error(e); }
  };

  return (
    <AppLayout>
      <div className="app-page">
        <div className="app-page__header">
          <InlineStack align="space-between" blockAlign="center">
            <BlockStack gap="050">
              <Text as="h1" variant="headingLg">AI Skills</Text>
              <Text as="p" variant="bodyMd" tone="subdued">Manage agent skills. Add GitHub skills or custom prompts.</Text>
            </BlockStack>
            <Button variant="primary" onClick={() => setShowAdd(true)}>+ Add Skill</Button>
          </InlineStack>
        </div>

        <div style={{ height: 16 }} />

        <div className="surface-card">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', textAlign: 'left' }}>
                <th style={{ padding: '10px 16px', fontSize: 13, color: '#6b7280' }}>Name</th>
                <th style={{ padding: '10px 16px', fontSize: 13, color: '#6b7280' }}>Source</th>
                <th style={{ padding: '10px 16px', fontSize: 13, color: '#6b7280' }}>Scope</th>
                <th style={{ padding: '10px 16px', fontSize: 13, color: '#6b7280' }}>Status</th>
                <th style={{ padding: '10px 16px', fontSize: 13, color: '#6b7280' }}>Added By</th>
                <th style={{ padding: '10px 16px', fontSize: 13, color: '#6b7280' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {skills.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <td style={{ padding: '10px 16px' }}>
                    <Text as="p" variant="bodyMd" fontWeight="medium">{s.display_name}</Text>
                    {s.description && <Text as="p" variant="bodySm" tone="subdued">{s.description}</Text>}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    {s.github_url ? (
                      <Badge tone="success">GitHub</Badge>
                    ) : (
                      <Badge tone="info">Built-in</Badge>
                    )}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <Badge>{s.scope === 'global' ? 'Global' : 'User'}</Badge>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <Badge tone={s.is_active ? 'success' : 'critical'}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <Text as="p" variant="bodyMd" tone="subdued">{s.creator?.name || '—'}</Text>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <InlineStack gap="100">
                      <Button size="slim" onClick={() => toggleSkill(s)}>
                        {s.is_active ? 'Disable' : 'Enable'}
                      </Button>
                      <Button size="slim" variant="tertiary" tone="critical" onClick={() => deleteSkill(s)}>Delete</Button>
                    </InlineStack>
                  </td>
                </tr>
              ))}
              {skills.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>No skills yet. Add one to get started.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add AI Skill"
        primaryAction={{ content: 'Add Skill', onAction: addSkill, loading: saving }}
        secondaryActions={[{ content: 'Cancel', onAction: () => setShowAdd(false) }]}
      >
        <Modal.Section>
          <BlockStack gap="300">
            <TextField label="Name (slug)" value={form.name} onChange={(v) => setForm({...form, name: v})} autoComplete="off" helpText="e.g. research, browser" />
            <TextField label="Display Name" value={form.display_name} onChange={(v) => setForm({...form, display_name: v})} autoComplete="off" />
            <TextField label="Description" value={form.description} onChange={(v) => setForm({...form, description: v})} autoComplete="off" multiline={2} />
            <TextField label="GitHub URL" value={form.github_url} onChange={(v) => setForm({...form, github_url: v})} autoComplete="off" helpText="https://github.com/user/repo" />
            <TextField label="Entrypoint" value={form.entrypoint} onChange={(v) => setForm({...form, entrypoint: v})} autoComplete="off" helpText="e.g. skills.research.main:run" />
            <Select label="Scope" options={[{label:'Global',value:'global'},{label:'User',value:'user'}]} value={form.scope} onChange={(v) => setForm({...form, scope: v})} />
          </BlockStack>
        </Modal.Section>
      </Modal>
    </AppLayout>
  );
}
