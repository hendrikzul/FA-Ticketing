'use client';

import { useRef } from 'react';
import { BlockStack, Button, Modal, Select, Text, TextField } from '@shopify/polaris';
import { FILE_ACCEPT } from './helpers';

const TYPES = [
  { label: 'Bugfix', value: 'bugfix' },
  { label: 'Development', value: 'development' },
  { label: 'Maintenance', value: 'maintenance' },
];

const PRIO = [
  { label: 'P1 — Critical', value: 'P1' },
  { label: 'P2 — High', value: 'P2' },
  { label: 'P3 — Medium', value: 'P3' },
  { label: 'P4 — Low', value: 'P4' },
];

interface CreateTicketModalProps {
  open: boolean;
  onClose: () => void;
  saving: boolean;
  form: { title: string; description: string; ticket_type: string; priority: string; url: string };
  setForm: (f: CreateTicketModalProps['form']) => void;
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  previews: string[];
  setPreviews: React.Dispatch<React.SetStateAction<string[]>>;
  create: () => Promise<void>;
}

export default function CreateTicketModal({
  open, onClose, saving, form, setForm, files, setFiles, previews, setPreviews, create,
}: CreateTicketModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const fc = (e: React.ChangeEvent<HTMLInputElement>) => {
    const s = Array.from(e.target.files || []);
    setFiles(p => [...p, ...s]);
    s.forEach(f => setPreviews(p => [...p, URL.createObjectURL(f)]));
  };

  const rm = (i: number) => {
    setFiles(p => p.filter((_, j) => j !== i));
    setPreviews(p => { URL.revokeObjectURL(p[i]); return p.filter((_, j) => j !== i); });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Ticket"
      primaryAction={{ content: 'Create Ticket', onAction: create, loading: saving }}
      secondaryActions={[{ content: 'Cancel', onAction: onClose }]}
    >
      <Modal.Section>
        <BlockStack gap="300">
          <TextField label="Title" value={form.title} onChange={v => setForm({ ...form, title: v })} autoComplete="off" required />
          <TextField label="Description" value={form.description} onChange={v => setForm({ ...form, description: v })} autoComplete="off" multiline={3} />
          <Select label="Type" options={TYPES} value={form.ticket_type} onChange={v => setForm({ ...form, ticket_type: v })} />
          <Select label="Priority" options={PRIO} value={form.priority} onChange={v => setForm({ ...form, priority: v })} />
          <TextField label="URL (optional)" value={form.url} onChange={v => setForm({ ...form, url: v })} autoComplete="off" placeholder="https://..." />
          <BlockStack gap="200">
            <Text as="p" variant="bodySm" fontWeight="medium">Attachments</Text>
            <input ref={fileRef} type="file" multiple accept={FILE_ACCEPT} onChange={fc} style={{ fontSize: 13 }} />
            {previews.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {previews.map((url, i) => (
                  <div key={i} style={{ position: 'relative', width: 100, height: 72, borderRadius: 6, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                    {files[i]?.type?.startsWith('video/') ? (
                      <video src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                    <button type="button" onClick={() => rm(i)} style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: 9, border: 'none', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 10, cursor: 'pointer' }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </BlockStack>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}
