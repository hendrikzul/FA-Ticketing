'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Badge, BlockStack, Button, InlineStack, Modal, Select, Text, TextField } from '@shopify/polaris';
import * as XLSX from 'xlsx';
import { fmt, fmtDate, ago, pdot, stt, isImage, isVideo, isTextFile, fileIcon, Field, Row, Chip, FILE_ACCEPT } from './helpers';
import CreateTicketModal from './CreateTicketModal';

interface TicketRow {
  id: number; ticket_number: string; title: string; ticket_type?: string | null;
  category?: string | null; priority: string; status: string; is_draft?: boolean;
  approval_required?: boolean; assigned_user?: { name: string } | null;
  assigned_team?: { name: string } | null; reporter?: { name: string } | null;
  created_at?: string; updated_at?: string; description?: string; url?: string | null;
  attachments?: any[]; statusHistory?: any[]; assignments?: any[]; comments?: any[];
}

const TYPES = [{ label: 'All types', value: '' }, { label: 'Bugfix', value: 'bugfix' }, { label: 'Development', value: 'development' }, { label: 'Maintenance', value: 'maintenance' }];
const STATUSES = [{ label: 'All', value: '' }, { label: 'New', value: 'new' }, { label: 'Triaged', value: 'triaged' }, { label: 'In progress', value: 'in_progress' }, { label: 'Resolved', value: 'resolved' }, { label: 'Closed', value: 'closed' }, { label: 'Rejected', value: 'rejected' }, { label: 'Cancelled', value: 'cancelled' }];
const PRIO = [{ label: 'P1 — Critical', value: 'P1' }, { label: 'P2 — High', value: 'P2' }, { label: 'P3 — Medium', value: 'P3' }, { label: 'P4 — Low', value: 'P4' }];

export default function TicketsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const isIT = user?.division_id === 1;
  const isManager = isIT && user?.roles?.some((r: any) => r.name === 'Manager' || r.label === 'Manager');
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [q, setQ] = useState(''); const [tp, setTp] = useState(''); const [st, setSt] = useState(''); const [pr, setPr] = useState(''); const [sf, setSf] = useState('');
  const [sortBy, setSortBy] = useState('id'); const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');
  const toggleSort = (col: string) => { if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortBy(col); setSortDir('asc'); } };
  const sortArrow = (col: string) => sortBy === col ? (sortDir === 'asc' ? '▲' : '▼') : '';
  const sortedTickets = [...tickets].sort((a: any, b: any) => {
    let va = a[sortBy] ?? '', vb = b[sortBy] ?? '';
    if (sortBy === 'assigned_user') { va = a.assigned_user?.name || ''; vb = b.assigned_user?.name || ''; }
    if (sortBy === 'reporter') { va = a.reporter?.name || ''; vb = b.reporter?.name || ''; }
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });
  const th = (col: string, label: string, w?: number) => (
    <th style={{ padding: '10px 12px', fontWeight: 600, color: '#6b7280', fontSize: 11, textTransform: 'uppercase', cursor: 'pointer', ...w ? { width: w } : {} }} onClick={() => toggleSort(col)}>
      {label} {sortArrow(col)}
    </th>
  );
  const [showCreate, setShowCreate] = useState(false); const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', ticket_type: 'bugfix', priority: 'P4', url: '' });
  const [files, setFiles] = useState<File[]>([]); const [previews, setPreviews] = useState<string[]>([]);

  const [detailId, setDetailId] = useState<number | null>(null); const [detail, setDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [edit, setEdit] = useState<Record<string, any>>({ _dirty: false }); const [savingD, setSavingD] = useState(false);
  const [chatMsg, setChatMsg] = useState(''); const [sendingChat, setSendingChat] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false); const [mentionIdx, setMentionIdx] = useState(0);
  const [mentionFilter, setMentionFilter] = useState(''); const chatInputRef = useRef<HTMLInputElement>(null);
  const [fileViewer, setFileViewer] = useState<{ name: string; url: string; type: string; text?: string; _rows?: any[][]; _sheet?: string; _truncated?: boolean } | null>(null);
  const [chatFile, setChatFile] = useState<File | null>(null); const [chatPreview, setChatPreview] = useState('');
  const chatFileRef = useRef<HTMLInputElement>(null);
  const [lightbox, setLightbox] = useState(''); const [zoom, setZoom] = useState(1);
  const [statusSaving, setStatusSaving] = useState(false);
  const [assignSaving, setAssignSaving] = useState(false);
  const [users, setUsers] = useState<{ id: number; name: string }[]>([]);
  const [teams, setTeams] = useState<{ id: number; name: string }[]>([]);

  const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(1); const [total, setTotal] = useState(0);

  const load = (p?: number) => {
    const pg = p ?? page;
    api.tickets.list({ q: q || undefined, ticket_type: tp || undefined, status: st || undefined, priority: pr || undefined, assigned_to: sf ? parseInt(sf) : undefined, page: pg })
      .then((res: any) => { setTickets(res.data || []); setTotalPages(res.last_page || 1); setTotal(res.total || 0); })
      .catch(console.error);
  };

  const goPage = (p: number) => { setPage(p); load(p); };

  useEffect(() => { setPage(1); load(1); }, [q, tp, st, pr, sf]);
  useEffect(() => {
    api.users.list().then((res: any) => setUsers(res.data || [])).catch(console.error);
    api.divisions.list().then((res: any) => setTeams(res.data || [])).catch(console.error);
  }, []);

  // Auto-open ticket from URL param (e.g. /tickets?id=155)
  useEffect(() => {
    const tid = searchParams.get('id');
    if (tid) { const id = parseInt(tid, 10); if (id && !isNaN(id)) open(id); }
  }, [searchParams]);

  const open = async (id: number) => {
    if (edit._dirty && id !== detailId) {
      if (!confirm('You have unsaved changes. Discard and switch ticket?')) return;
    }
    setDetailId(id); setLoadingDetail(true);
    try {
      const res: any = await api.tickets.show(id); const d = res?.data; setDetail(d);
      if (d) setEdit({ _dirty: false, priority: d.priority || 'P4', category: d.category || '', status: d.status, tags: d.tags || [], estimation: d.estimation || '', assigned_user_id: d.assigned_user?.id ? String(d.assigned_user.id) : '', assigned_team_id: d.assigned_team?.id ? String(d.assigned_team.id) : '1' });
    } catch (e) { console.error(e); } finally { setLoadingDetail(false); }
  };
  const close = () => { setDetailId(null); setDetail(null); };

  const save = async () => {
    if (!detailId || !edit._dirty) return; setSavingD(true);
    const prev = detail;
    const optim = {
      ...detail,
      priority: edit.priority,
      category: edit.category,
      status: edit.status,
      assigned_user: users.find(u => String(u.id) === String(edit.assigned_user_id)) || null,
      assigned_team: teams.find(t => String(t.id) === String(edit.assigned_team_id)) || null,
    };
    setDetail(optim);
    setTickets(prev => prev.map(t => t.id === detailId ? { ...t, status: edit.status, assigned_user: optim.assigned_user, assigned_team: optim.assigned_team } : t));
    setEdit({ ...edit, _dirty: false });
    try {
      if (edit.status !== undefined && edit.status !== prev.status) {
        await api.tickets.updateStatus(detailId, edit.status);
      }
      if ((edit.assigned_user_id !== undefined || edit.assigned_team_id !== undefined) &&
          (edit.assigned_user_id !== String(prev.assigned_user?.id || '') || edit.assigned_team_id !== String(prev.assigned_team?.id || ''))) {
        await api.tickets.assign(detailId, {
          assigned_user_id: edit.assigned_user_id ? parseInt(edit.assigned_user_id) : null,
          assigned_team_id: edit.assigned_team_id ? parseInt(edit.assigned_team_id) : null,
        });
      }
      if (edit.priority !== undefined || edit.category !== undefined || edit.tags !== undefined || edit.estimation !== undefined) {
        const p: any = {};
        if (edit.priority !== undefined) p.priority = edit.priority;
        if (edit.category !== undefined) p.category = edit.category;
        if (edit.tags !== undefined) p.tags = edit.tags;
        if (edit.estimation !== undefined) p.estimation = edit.estimation;
        await api.tickets.update(detailId, p);
      }
      open(detailId);
    } catch (e) { console.error(e); setDetail(prev); setEdit({ ...edit, _dirty: true }); }
    finally { setSavingD(false); }
  };

  const create = async () => {
    if (!form.title || !form.ticket_type) return; setSaving(true);
    try {
      const res: any = await api.tickets.create({ ...form, files: files.length > 0 ? files : undefined });
      const t = res?.data as TicketRow; setShowCreate(false);
      setForm({ title: '', description: '', ticket_type: 'bugfix', priority: 'P4', url: '' });
      setFiles([]); setPreviews([]);
      if (t?.id) setTickets(p => [t, ...p]); load();
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const pickChatFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setChatFile(f);
      if (f.type.startsWith('image/') || f.type.startsWith('video/')) {
        setChatPreview(URL.createObjectURL(f));
      } else {
        setChatPreview('');
      }
    }
  };
  const clearChatFile = () => { setChatFile(null); if (chatPreview) URL.revokeObjectURL(chatPreview); setChatPreview(''); };

  const sendChat = async () => {
    if ((!chatMsg.trim() && !chatFile) || !detailId) return;
    const prevComments = detail?.comments || [];
    const optimistic = { id: -Date.now(), body_text: chatMsg.trim(), _type: 'comment', user: { name: 'You' }, attachment_name: chatFile?.name || null, created_at: new Date().toISOString() };
    setDetail({ ...detail, comments: [optimistic, ...prevComments] });
    const msg = chatMsg; const file = chatFile;
    setSendingChat(true); setChatMsg(''); clearChatFile(); setMentionOpen(false);
    try {
      await api.tickets.comments.create(detailId, msg.trim(), file || undefined);
      open(detailId);
    } catch (e) { console.error(e); setDetail({ ...detail, comments: prevComments }); setChatMsg(msg); }
    finally { setSendingChat(false); }
  };

  const mentionFiltered = users.filter(u => u.name.toLowerCase().includes(mentionFilter.toLowerCase())).slice(0, 6);

  const insertMention = (user: { id: number; name: string }) => {
    const before = chatMsg.slice(0, chatMsg.lastIndexOf('@', chatInputRef.current?.selectionStart || chatMsg.length));
    const after = chatMsg.slice(chatInputRef.current?.selectionStart || chatMsg.length);
    setChatMsg(`${before}@${user.name} ${after}`);
    setMentionOpen(false);
    setTimeout(() => chatInputRef.current?.focus(), 50);
  };

  const handleChatKey = (e: React.KeyboardEvent) => {
    if (mentionOpen) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIdx(i => Math.min(i + 1, mentionFiltered.length - 1)); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setMentionIdx(i => Math.max(i - 1, 0)); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); if (mentionFiltered[mentionIdx]) insertMention(mentionFiltered[mentionIdx]); return; }
      if (e.key === 'Escape') { setMentionOpen(false); return; }
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); }
  };

  const handleChatChange = (val: string) => {
    setChatMsg(val);
    const cursor = chatInputRef.current?.selectionStart || val.length;
    const beforeCursor = val.slice(0, cursor);
    const match = beforeCursor.match(/@(\w*)$/);
    if (match) {
      setMentionFilter(match[1] || '');
      setMentionOpen(true);
      setMentionIdx(0);
    } else {
      setMentionOpen(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        e.preventDefault();
        const blob = items[i].getAsFile();
        if (blob) {
          const file = new File([blob], `screenshot-${Date.now()}.png`, { type: blob.type });
          if (chatPreview) URL.revokeObjectURL(chatPreview);
          setChatFile(file);
          setChatPreview(URL.createObjectURL(file));
        }
        return;
      }
    }
  };

  const activities = detail ? [
    ...(detail.statusHistory || []).map((x: any) => ({ ...x, _type: 'status' })),
    ...(detail.assignments || []).map((x: any) => ({ ...x, _type: 'assignment' })),
    ...(detail.comments || []).map((x: any) => ({ ...x, _type: 'comment' })),
  ].sort((a: any, b: any) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime()) : [];

  return (
    <AppLayout>
      {lightbox && (
        <div onClick={() => { setLightbox(''); setZoom(1); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={lightbox} alt="" onClick={e => e.stopPropagation()} onWheel={e => { e.preventDefault(); e.stopPropagation(); setZoom(z => Math.max(0.5, Math.min(5, z + (e.deltaY > 0 ? -0.2 : 0.2)))); }}
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8, transform: `scale(${zoom})`, transition: 'transform 0.15s ease', cursor: zoom > 1 ? 'zoom-out' : 'zoom-in' }} />
          <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, background: 'rgba(0,0,0,0.6)', borderRadius: 10, padding: '8px 14px' }}>
            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.3))} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', width: 32, height: 32, borderRadius: 6, fontSize: 18, cursor: 'pointer' }}>−</button>
            <button onClick={() => setZoom(1)} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', padding: '0 12px', height: 32, borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>{Math.round(zoom * 100)}%</button>
            <button onClick={() => setZoom(z => Math.min(5, z + 0.3))} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', width: 32, height: 32, borderRadius: 6, fontSize: 18, cursor: 'pointer' }}>+</button>
          </div>
          <button onClick={() => { setLightbox(''); setZoom(1); }} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', fontSize: 24, width: 40, height: 40, borderRadius: 20, cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* File Viewer Modal */}
      <Modal
        open={!!fileViewer}
        onClose={() => setFileViewer(null)}
        title={fileViewer?.name || 'File Preview'}
        secondaryActions={[{ content: 'Close', onAction: () => setFileViewer(null) }]}
        primaryAction={fileViewer ? { content: 'Download', onAction: () => { const a = document.createElement('a'); a.href = fileViewer.url; a.download = fileViewer.name; a.click(); } } : undefined}
      >
        <Modal.Section>
          <div style={{ maxHeight: '70vh', overflow: 'auto' }}>
            {fileViewer?._rows ? (
              <div style={{ overflow: 'auto' }}>
                {fileViewer._truncated && (
                  <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 6, padding: '8px 12px', marginBottom: 8 }}>
                    <Text as="p" variant="bodySm">⚠️ Showing first 100 rows only. Download the file for the full data ({fileViewer._rows.length} rows shown).</Text>
                  </div>
                )}
                <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
                  <tbody>
                    {fileViewer._rows.map((row, ri) => (
                      <tr key={ri}>
                        {row.map((cell: any, ci: number) => (
                          <td key={ci} style={{ border: '1px solid #e5e7eb', padding: '4px 8px', whiteSpace: 'nowrap', background: ri === 0 ? '#f0f9ff' : undefined, fontWeight: ri === 0 ? 600 : undefined }}>
                            {String(cell ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : fileViewer?.text ? (
              <pre style={{ margin: 0, fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'ui-monospace, monospace' }}>{fileViewer.text}</pre>
            ) : fileViewer?.type?.startsWith('image/') ? (
              <img src={fileViewer.url} alt={fileViewer.name} style={{ maxWidth: '100%', borderRadius: 8 }} />
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                <BlockStack gap="300" align="center">
                  <Text as="p" variant="bodyMd" tone="subdued">No preview available</Text>
                  <Text as="p" variant="bodySm" tone="subdued">Click Download to get the file</Text>
                </BlockStack>
              </div>
            )}
          </div>
        </Modal.Section>
      </Modal>

      <div style={{ padding: '20px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <InlineStack align="space-between" blockAlign="center">
          <BlockStack gap="050">
            <Text as="p" variant="bodySm" tone="subdued">Dashboard / Ticketing System</Text>
            <Text as="h1" variant="headingXl" fontWeight="semibold">Ticketing System</Text>
          </BlockStack>
          <Button variant="primary" onClick={() => setShowCreate(true)}>+ New Ticket</Button>
        </InlineStack>

        <div style={{ marginTop: 12 }} />
        <div style={{ background: '#fff', borderRadius: 10, padding: '10px 16px', display: 'flex', gap: 12, alignItems: 'center', border: '1px solid #e5e7eb' }}>
          <TextField label="" labelHidden value={q} onChange={setQ} placeholder="Search tickets..." autoComplete="off" />
          <div style={{ width: 180 }}><Select label="" labelHidden options={TYPES} value={tp} onChange={setTp} /></div>
          <div style={{ width: 180 }}><Select label="" labelHidden options={STATUSES} value={st} onChange={setSt} /></div>
          <div style={{ width: 180 }}><Select label="" labelHidden options={[{ label: 'All Priority', value: '' }, { label: 'P1 — Critical', value: 'P1' }, { label: 'P2 — High', value: 'P2' }, { label: 'P3 — Medium', value: 'P3' }, { label: 'P4 — Low', value: 'P4' }]} value={pr} onChange={setPr} /></div>
          <div style={{ width: 180 }}><Select label="" labelHidden options={[{ label: 'All Staff', value: '' }, ...users.map(u => ({ label: u.name, value: String(u.id) }))]} value={sf} onChange={v => { setSf(v); setPage(1); setTimeout(() => load(1), 50); }} /></div>
          <div style={{ flex: 1 }} /><Button variant="secondary" onClick={() => { setQ(''); setTp(''); setSt(''); setPr(''); setSf(''); }}>Reset</Button>
        </div>

        <div style={{ marginTop: 12 }} />
        <div style={{ display: 'flex', gap: 12 }}>
          {/* LEFT TABLE */}
          <div style={{ flex: detailId ? '0 0 40%' : '1', background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', overflow: 'auto', maxHeight: 'calc(100vh - 220px)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: '#fafbfc', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0 }}>
                <th style={{ width: 36, padding: '10px 8px' }}><input type="checkbox" /></th>
                {th('id', '#', 50)}
                {th('priority', 'Priority', 70)}
                {th('title', 'Title')}
                {!detailId && th('ticket_type', 'Type', 95)}
                {!detailId && th('url', 'URL', 110)}
                {th('status', 'Status', 100)}
                {th('assigned_user', 'Assignee', 120)}
                {th('reporter', 'Reporter', 100)}
                {th('created_at', 'Created', 90)}
                {!detailId && th('estimation', 'Est.', 80)}
              </tr></thead>
              <tbody>
                {sortedTickets.map(t => (
                  <tr key={t.id} onClick={() => open(t.id)} style={{ cursor: 'pointer', borderBottom: '1px solid #f3f4f6', background: detailId === t.id ? '#eff6ff' : 'transparent' }}
                    onMouseEnter={e => { if (detailId !== t.id) e.currentTarget.style.background = '#f9fafb'; }}
                    onMouseLeave={e => { if (detailId !== t.id) e.currentTarget.style.background = 'transparent'; }}>
                    <td style={{ padding: '10px 8px' }}><input type="checkbox" onClick={e => e.stopPropagation()} /></td>
                    <td style={{ padding: '10px 12px' }}><Text as="span" variant="bodySm" fontWeight="medium" tone="subdued">{t.ticket_number}</Text></td>
                    <td style={{ padding: '10px 12px' }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 16, background: pdot(t.priority), color: '#fff', fontSize: 11, fontWeight: 700 }}>{t.priority}</span></td>
                    <td style={{ padding: '10px 12px', maxWidth: detailId ? 200 : 300 }} title={t.title}>
                      <Text as="p" variant="bodyMd" fontWeight="medium" truncate>{t.title}</Text>
                    </td>
                    {!detailId && <td style={{ padding: '10px 12px' }}><span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: t.ticket_type === 'bugfix' ? '#fef2f2' : t.ticket_type === 'development' ? '#eff6ff' : '#f0fdf4', color: t.ticket_type === 'bugfix' ? '#dc2626' : t.ticket_type === 'development' ? '#3b82f6' : '#16a34a' }}>{fmt(t.ticket_type || '—')}</span></td>}
                    {!detailId && <td style={{ padding: '10px 12px' }}>{t.url ? <a href={t.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: '#3b82f6', fontSize: 13 }}>🔗</a> : <Text as="span" variant="bodySm" tone="subdued">—</Text>}</td>}
                    <td style={{ padding: '10px 12px' }}><Badge tone={stt(t.status)}>{fmt(t.status)}</Badge></td>
                    <td style={{ padding: '10px 12px' }}><Text as="span" variant="bodySm">{t.assigned_user?.name || <Text as="span" tone="subdued">—</Text>}</Text></td>
                    <td style={{ padding: '10px 12px' }}><Text as="span" variant="bodySm">{t.reporter?.name || <Text as="span" tone="subdued">—</Text>}</Text></td>
                    <td style={{ padding: '10px 12px' }}><Text as="span" variant="bodySm" tone="subdued">{t.created_at ? new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</Text></td>
                    {!detailId && <td style={{ padding: '10px 12px' }}><Text as="span" variant="bodySm" tone="subdued">{t.estimation || '—'}</Text></td>}
                  </tr>
                ))}
                {tickets.length === 0 && <tr><td colSpan={11}><div style={{ padding: 40, textAlign: 'center' }}><Text as="p" variant="bodyMd" tone="subdued">No tickets match.</Text></div></td></tr>}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderTop: '1px solid #e5e7eb', background: '#fafbfc' }}>
                <Button variant="tertiary" size="slim" disabled={page <= 1} onClick={() => goPage(page - 1)}>←</Button>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => goPage(p)}
                      style={{ minWidth: 28, height: 28, borderRadius: 6, border: page === p ? '2px solid #3b82f6' : '1px solid #e5e7eb', background: page === p ? '#eff6ff' : '#fff', color: page === p ? '#3b82f6' : '#6b7280', fontSize: 12, fontWeight: page === p ? 700 : 400, cursor: 'pointer' }}>
                      {p}
                    </button>
                  ))}
                </div>
                <Button variant="tertiary" size="slim" disabled={page >= totalPages} onClick={() => goPage(page + 1)}>→</Button>
              </div>
            )}
          </div>

          {/* RIGHT DETAIL */}
          {detailId && detail && (
            <div style={{ flex: '0 0 58%', background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', overflow: 'auto', maxHeight: 'calc(100vh - 220px)' }}>
              <div style={{ padding: '14px 16px', background: '#fafbfc', borderBottom: '1px solid #e5e7eb' }}>
                <InlineStack align="space-between" blockAlign="start">
                  <BlockStack gap="050">
                    <InlineStack gap="150" blockAlign="center"><Text as="p" variant="bodySm" tone="subdued" fontWeight="medium">{detail.ticket_number}</Text><Badge tone={stt(detail.status)}>{fmt(detail.status)}</Badge></InlineStack>
                    <Text as="h2" variant="headingMd" fontWeight="bold">{detail.title}</Text>
                  </BlockStack>
                  <Button variant="tertiary" onClick={close}>✕</Button>
                </InlineStack>
                {/* CTA Action Buttons */}
                {isIT && (
                  <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {detail.status === 'new' && isManager && (
                      <>
                        <button onClick={async () => { const s = 'resolved'; setTickets(prev => prev.map(t => t.id === detailId ? { ...t, status: s } : t)); await api.tickets.updateStatus(detailId, s); open(detailId); }} style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: '#22c55e', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>✅ Resolved</button>
                        <button onClick={async () => { const s = 'rejected'; setTickets(prev => prev.map(t => t.id === detailId ? { ...t, status: s } : t)); await api.tickets.updateStatus(detailId, s); open(detailId); }} style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>❌ Reject</button>
                        <button onClick={async () => { const s = 'cancelled'; setTickets(prev => prev.map(t => t.id === detailId ? { ...t, status: s } : t)); await api.tickets.updateStatus(detailId, s); open(detailId); }} style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: '#6b7280', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>🚫 Cancel</button>
                      </>
                    )}
                    {detail.status === 'triaged' && detail.assigned_user?.id === user?.id && (
                      <button onClick={async () => { const s = 'in_progress'; setTickets(prev => prev.map(t => t.id === detailId ? { ...t, status: s } : t)); await api.tickets.updateStatus(detailId, s); open(detailId); }} style={{ padding: '8px 24px', borderRadius: 8, border: 'none', background: '#22c55e', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>▶ Start Working</button>
                    )}
                    {isManager && (detail.status === 'triaged' || detail.status === 'in_progress') && (
                      <>
                        <button onClick={async () => { const s = 'rejected'; setTickets(prev => prev.map(t => t.id === detailId ? { ...t, status: s } : t)); await api.tickets.updateStatus(detailId, s); open(detailId); }} style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>❌ Reject</button>
                        <button onClick={async () => { const s = 'cancelled'; setTickets(prev => prev.map(t => t.id === detailId ? { ...t, status: s } : t)); await api.tickets.updateStatus(detailId, s); open(detailId); }} style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: '#6b7280', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>🚫 Cancel</button>
                      </>
                    )}
                    {detail.status === 'in_progress' && detail.assigned_user?.id === user?.id && (
                      <button onClick={async () => { const s = 'resolved'; setTickets(prev => prev.map(t => t.id === detailId ? { ...t, status: s } : t)); await api.tickets.updateStatus(detailId, s); open(detailId); }} style={{ padding: '8px 24px', borderRadius: 8, border: 'none', background: '#22c55e', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>✅ Done</button>
                    )}
                    {detail.status === 'resolved' && isManager && (
                      <>
                        <button onClick={async () => { const s = 'closed'; setTickets(prev => prev.map(t => t.id === detailId ? { ...t, status: s } : t)); await api.tickets.updateStatus(detailId, s); open(detailId); }} style={{ padding: '8px 24px', borderRadius: 8, border: 'none', background: '#7c3aed', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>🔒 Close</button>
                        <button onClick={async () => { const s = 'in_progress'; setTickets(prev => prev.map(t => t.id === detailId ? { ...t, status: s } : t)); await api.tickets.updateStatus(detailId, s); open(detailId); }} style={{ padding: '6px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', color: '#6b7280', fontSize: 13, cursor: 'pointer' }}>Reopen</button>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
                {/* MAIN COLUMN */}
                <div style={{ flex: '0 0 62%', padding: 14, borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <div style={{ flex: 1, overflow: 'auto' }}>
                    {/* URL & Attachments */}
                    {(detail.url || (detail.attachments?.length > 0)) && (
                      <div style={{ marginBottom: 14 }}>
                        {detail.url && (
                          <div style={{ marginBottom: 10 }}>
                            <Text as="p" variant="bodySm" fontWeight="semibold" tone="subdued">🔗 URL</Text>
                            <a href={detail.url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontSize: 13, wordBreak: 'break-all' }}>{detail.url}</a>
                          </div>
                        )}
                        {detail.attachments?.length > 0 && (
                          <div>
                            <Text as="p" variant="bodySm" fontWeight="semibold" tone="subdued">📎 Attachments ({detail.attachments.length})</Text>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                              {detail.attachments.map((a: any) => (
                                <div key={a.id} style={{ cursor: 'pointer', borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb', width: 100, height: 72, position: 'relative', background: '#f9fafb' }}
                                  onClick={() => {
                                    const url = '/storage/' + a.storage_path;
                                    if (a.mime_type?.startsWith('image/')) setLightbox(url);
                                    else {
                                      const isXlsx = a.mime_type?.includes('sheet') || a.mime_type?.includes('excel') || a.filename?.endsWith('.xlsx');
                                      if (isXlsx) {
                                        fetch(url).then(r => r.arrayBuffer()).then(buf => {
                                          const wb = XLSX.read(buf, { type: 'array' });
                                          const sh = wb.SheetNames[0];
                                          const rows = XLSX.utils.sheet_to_json(wb.Sheets[sh], { header: 1 });
                                          setFileViewer({ name: a.filename, url, type: a.mime_type, _rows: rows.slice(0, 100), _sheet: sh, _truncated: rows.length > 100 });
                                        }).catch(() => setFileViewer({ name: a.filename, url, type: a.mime_type }));
                                      } else if (isTextFile(a.mime_type)) {
                                        fetch(url).then(r => r.text()).then(t => setFileViewer({ name: a.filename, url, type: a.mime_type, text: t })).catch(() => {});
                                      } else {
                                        setFileViewer({ name: a.filename, url, type: a.mime_type });
                                      }
                                    }
                                  }}>
                                  {a.mime_type?.startsWith('image/') ? (
                                    <img src={'/storage/' + a.storage_path} alt={a.filename} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : a.mime_type?.startsWith('video/') ? (
                                    <video src={'/storage/' + a.storage_path} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 4 }}>
                                      <span style={{ fontSize: 20 }}>{fileIcon(a.mime_type)}</span>
                                      <span style={{ fontSize: 9, color: '#6b7280', marginTop: 2, textAlign: 'center', lineHeight: 1.1 }}>{(a.filename || '').slice(-12)}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {detail.description && (
                      <div style={{ background: '#f8f9fb', borderRadius: 8, padding: '12px 16px', borderLeft: '3px solid #3b82f6', marginBottom: 14 }}>
                        <Text as="p" variant="bodySm" fontWeight="semibold" tone="subdued">Description</Text>
                        <div style={{ marginTop: 4, lineHeight: 1.6 }}><Text as="p" variant="bodyMd">{detail.description}</Text></div>
                      </div>
                    )}

                    <Text as="p" variant="bodySm" fontWeight="semibold" tone="subdued">Activity</Text>
                    <div style={{ marginTop: 10, borderLeft: '2px solid #e5e7eb', paddingLeft: 14 }}>
                      {activities.length > 0 ? activities.map((entry: any, i: number) => {
                        const name = entry._type === 'comment' ? (entry.user?.name || 'User') : (entry.changed_by?.name || entry.assigned_by?.name || 'System');
                        const when = entry.created_at ? new Date(entry.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
                        let color = '#3b82f6';
                        if (entry._type === 'comment') color = '#10b981';
                        else if (entry._type === 'assignment') color = '#6366f1';
                        return (
                          <div key={i} style={{ position: 'relative', paddingBottom: 14 }}>
                            <div style={{ position: 'absolute', left: -19, top: 4, width: 10, height: 10, borderRadius: 5, background: color, border: '2px solid #fff', boxShadow: '0 0 0 1px #e5e7eb' }} />
                            <InlineStack gap="100" blockAlign="start">
                              <Chip letter={(name || '?')[0]} color={color} />
                              <BlockStack gap="025">
                                <Text as="p" variant="bodySm"><strong>{name}</strong> {entry._type !== 'comment' ? (entry._type === 'assignment' ? `assigned to ${entry.assigned_to?.name || 'Unknown'}` : `${fmt(entry.from_status || '')} → ${fmt(entry.to_status || '')}`) : ''}</Text>
                                {entry._type === 'comment' && entry.body_text && <Text as="p" variant="bodySm">{entry.body_text}</Text>}
                                {/* Attachment thumbnail */}
                                {entry.attachment_name && (
                                  <div style={{ marginTop: 6 }}>
                                    {isImage(entry.mime_type) ? (
                                      <img src={'/storage/' + entry.attachment_path} alt={entry.attachment_name} style={{ maxWidth: 240, maxHeight: 180, borderRadius: 8, cursor: 'pointer', border: '1px solid #e5e7eb' }}
                                        onClick={() => setLightbox('/storage/' + entry.attachment_path)} />
                                    ) : isVideo(entry.mime_type) ? (
                                      <video src={'/storage/' + entry.attachment_path} controls style={{ maxWidth: 320, maxHeight: 200, borderRadius: 8 }} />
                                    ) : (
                                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 12px', background: isTextFile(entry.mime_type) ? '#f0fdf4' : '#f9fafb', borderRadius: 6, border: '1px solid #e5e7eb', cursor: 'pointer' }}
                                        onClick={async () => {
                                          const url = '/storage/' + entry.attachment_path;
                                          const isXlsx = entry.mime_type?.includes('sheet') || entry.mime_type?.includes('excel') || entry.mime_type?.includes('xls') || entry.attachment_name?.endsWith('.xlsx') || entry.attachment_name?.endsWith('.xls');
                                          if (isXlsx) {
                                            try {
                                              const r = await fetch(url); const buf = await r.arrayBuffer();
                                              const wb = XLSX.read(buf, { type: 'array' });
                                              const firstSheet = wb.SheetNames[0];
                                               const rows = XLSX.utils.sheet_to_json(wb.Sheets[firstSheet], { header: 1 }) as any[][];
                                              const maxRows = 100;
                                              const truncated = rows.length > maxRows;
                                              setFileViewer({ name: entry.attachment_name, url, type: entry.mime_type, text: '', _rows: rows.slice(0, maxRows), _sheet: firstSheet, _truncated: truncated });
                                            } catch { setFileViewer({ name: entry.attachment_name, url, type: entry.mime_type }); }
                                          } else if (isTextFile(entry.mime_type)) {
                                            try { const r = await fetch(url); const t = await r.text(); setFileViewer({ name: entry.attachment_name, url, type: entry.mime_type, text: t }); }
                                            catch { setFileViewer({ name: entry.attachment_name, url, type: entry.mime_type }); }
                                          } else {
                                            setFileViewer({ name: entry.attachment_name, url, type: entry.mime_type });
                                          }
                                        }}>
                                        <span>{fileIcon(entry.mime_type)}</span>
                                        <Text as="p" variant="bodySm">{entry.attachment_name}</Text>
                                      </div>
                                    )}
                                  </div>
                                )}
                                <Text as="p" variant="bodySm" tone="subdued">{when} ({ago(entry.created_at)})</Text>
                              </BlockStack>
                            </InlineStack>
                          </div>
                        );
                      }) : <div style={{ padding: '20px 0', textAlign: 'center' }}><Text as="p" variant="bodySm" tone="subdued">No activity yet</Text></div>}
                    </div>

                    {detail.attachments?.length > 0 && (
                      <div style={{ marginTop: 16 }}>
                        <Text as="p" variant="bodySm" fontWeight="semibold" tone="subdued">Attachments ({detail.attachments.length})</Text>
                        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {detail.attachments.map((a: any) => (
                            <div key={a.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 10px', background: '#fafbfc', borderRadius: 6, border: '1px solid #f0f0f0' }}>
                              <span>{a.mime_type?.startsWith('image/') ? '🖼' : '📎'}</span>
                              <div style={{ flex: 1, minWidth: 0 }}><Text as="p" variant="bodySm" truncate>{a.filename}</Text></div>
                              <Text as="p" variant="bodySm" tone="subdued">{a.size_bytes ? `${Math.round(a.size_bytes / 1024)} KB` : ''}</Text>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chat input with file upload */}
                  <div style={{ padding: '10px 0 0', borderTop: '1px solid #f0f0f0', marginTop: 10 }}>
                    {chatFile && (
                      <div style={{ position: 'relative', display: 'inline-block', marginBottom: 8 }}>
                        {chatFile?.type?.startsWith('image/') ? (
                          <img src={chatPreview} alt="preview" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb', cursor: 'pointer' }}
                            onClick={() => setLightbox(chatPreview)} />
                        ) : chatFile?.type?.startsWith('video/') ? (
                          <video src={chatPreview} style={{ width: 120, height: 68, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb' }} />
                        ) : isTextFile(chatFile?.type || '') ? (
                          <div style={{ width: 120, height: 68, background: '#fafbfc', borderRadius: 6, border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            onClick={() => { const r = new FileReader(); r.onload = () => setFileViewer({ name: chatFile?.name || '', url: chatPreview, type: chatFile?.type || '', text: r.result as string }); r.readAsText(chatFile!); }}>
                            <span style={{ fontSize: 18 }}>{fileIcon(chatFile?.type || '')}</span>
                            <span style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>{(chatFile?.name || '').slice(-20)}</span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '4px 10px', background: '#f0f0ff', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}
                            onClick={() => setFileViewer({ name: chatFile?.name || '', url: chatPreview, type: chatFile?.type || '' })}>
                            <span>{fileIcon(chatFile?.type || '')}</span><span>{chatFile?.name}</span>
                          </div>
                        )}
                        <button onClick={clearChatFile} style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: 9, border: 'none', background: '#ef4444', color: '#fff', fontSize: 10, cursor: 'pointer', lineHeight: '18px' }}>✕</button>
                      </div>
                    )}
                    <InlineStack gap="100" blockAlign="center">
                      <input ref={chatFileRef} type="file" accept={FILE_ACCEPT} onChange={pickChatFile} style={{ display: 'none' }} />
                      <Button variant="tertiary" size="slim" onClick={() => chatFileRef.current?.click()}>📎</Button>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <textarea ref={chatInputRef as any} value={chatMsg} onChange={e => { handleChatChange(e.target.value); const el = e.target; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px'; }} onKeyDown={handleChatKey} onPaste={handlePaste}
                          placeholder="Type a message... Use @ to mention" rows={1}
                          style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 6, padding: '6px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box', resize: 'none', minHeight: 32, maxHeight: 120, transition: 'height 0.15s ease', fontFamily: 'inherit' }} />
                        {mentionOpen && mentionFiltered.length > 0 && (
                          <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', marginBottom: 4, maxHeight: 180, overflow: 'auto', zIndex: 20 }}>
                            {mentionFiltered.map((u, i) => (
                              <div key={u.id} onClick={() => insertMention(u)}
                                style={{ padding: '6px 12px', cursor: 'pointer', fontSize: 13, background: i === mentionIdx ? '#eff6ff' : 'transparent', display: 'flex', gap: 8, alignItems: 'center' }}>
                                <Chip letter={u.name[0]} color="#6366f1" size={20} />
                                <span>{u.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button variant="primary" size="slim" loading={sendingChat} onClick={sendChat}>Send</Button>
                    </InlineStack>
                  </div>
                </div>

                {/* INFO SIDEBAR */}
                <div style={{ flex: 1, padding: 14 }}>
                  <BlockStack gap="300">
                    <Field label="Type">
                      <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, background: detail.ticket_type === 'bugfix' ? '#fef2f2' : detail.ticket_type === 'development' ? '#eff6ff' : '#f0fdf4', color: detail.ticket_type === 'bugfix' ? '#dc2626' : detail.ticket_type === 'development' ? '#3b82f6' : '#16a34a' }}>
                        {fmt(detail.ticket_type || '—')}
                      </span>
                    </Field>
                    <Field label="Assignee">
                      <BlockStack gap="200">
                        <Select
                          label="User"
                          options={[{ label: 'Unassigned', value: '' }, ...users.map(u => ({ label: u.name, value: String(u.id) }))]}
                          value={edit.assigned_user_id || ''}
                          onChange={v => setEdit({ ...edit, assigned_user_id: v, _dirty: true })}
                          disabled={!isIT}
                        />
                      </BlockStack>
                    </Field>
                    <Field label="Reporter">
                      <InlineStack gap="100" blockAlign="center"><Chip letter={(detail.reporter?.name || '?')[0]} color="#3b82f6" /><Text as="p" variant="bodyMd">{detail.reporter?.name || 'Unknown'}</Text></InlineStack>
                    </Field>
                    <Field label="Priority">
                      <Select label="" labelHidden options={PRIO} value={edit.priority} onChange={v => setEdit({ ...edit, priority: v, _dirty: true })} disabled={!isIT} />
                    </Field>
                    <BlockStack gap="200">
                      <Text as="p" variant="bodySm" fontWeight="semibold" tone="subdued">SLA & Dates</Text>
                      <div style={{ background: '#fafbfc', borderRadius: 8, padding: 10 }}>
                        <BlockStack gap="150">
                          <Row l="Created" v={detail.created_at} /><Row l="Created by" v={detail.reporter?.name} /><Row l="Updated" v={detail.updated_at} />
                        </BlockStack>
                      </div>
                    </BlockStack>
                    <Field label="Estimation">
                      <Select label="" labelHidden options={[{ label: 'Not set', value: '' }, { label: '1 day', value: '1 day' }, { label: '2 days', value: '2 days' }, { label: '3 days', value: '3 days' }, { label: '5 days', value: '5 days' }, { label: '1 week', value: '1 week' }, { label: '2 weeks', value: '2 weeks' }, { label: '1 month', value: '1 month' }]} value={edit.estimation || ''} onChange={v => setEdit({ ...edit, estimation: v, _dirty: true })} disabled={!isIT} />
                    </Field>
                    {edit._dirty && isIT && <Button variant="primary" loading={savingD} onClick={save}>Save Changes</Button>}
                  </BlockStack>
                </div>
              </div>
            </div>
          )}
        </div>

        <CreateTicketModal
          key={form.priority + form.ticket_type}
          open={showCreate}
          onClose={() => setShowCreate(false)}
          saving={saving}
          form={form}
          setForm={setForm}
          files={files}
          setFiles={setFiles}
          previews={previews}
          setPreviews={setPreviews}
          create={create}
        />
      </div>
    </AppLayout>
  );
}
