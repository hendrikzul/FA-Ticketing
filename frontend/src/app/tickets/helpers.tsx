import { BlockStack, Text } from '@shopify/polaris';

/** Accepted file types for ticket attachments and comments — aligned with backend validation */
export const FILE_ACCEPT = 'image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,.json,.xml,.html,.py,.js,.md,.log,.yml,.yaml';

/** snake_case → Title Case */
export function fmt(v: string): string {
  return v.split('_').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

/** ISO date → "Jun 26" */
export function fmtDate(v: any): string {
  if (!v) return '—';
  try { return new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  catch { return String(v); }
}

/** Relative time: "3h", "2d", "now" */
export function ago(d: string | null | undefined): string {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

/** Priority → color */
export function pdot(p: string): string {
  if (p === 'P1') return '#ef4444';
  if (p === 'P2') return '#f59e0b';
  if (p === 'P3') return '#3b82f6';
  return '#6b7280';
}

/** Status → Polaris Badge tone */
export function stt(s: string): 'attention' | 'info' | 'success' | 'critical' | 'warning' | 'new' {
  if (s === 'new') return 'new';
  if (s === 'in_progress' || s === 'queued') return 'info';
  if (s === 'resolved' || s === 'closed') return 'success';
  if (s === 'rejected' || s === 'cancelled') return 'critical';
  if (s?.startsWith('waiting')) return 'warning';
  return 'info';
}

/** MIME type detection */
export function isImage(mime?: string): boolean { return (mime || '').startsWith('image/'); }
export function isVideo(mime?: string): boolean { return (mime || '').startsWith('video/'); }

export function isTextFile(mime?: string): boolean {
  const t = (mime || '').toLowerCase();
  return t.startsWith('text/') || t.includes('json') || t.includes('xml') || t.includes('csv') || t.includes('javascript');
}

export function fileIcon(mime?: string): string {
  const t = (mime || '').toLowerCase();
  if (t.includes('pdf')) return '📄';
  if (t.includes('sheet') || t.includes('excel') || t.includes('xls')) return '📊';
  if (t.includes('word') || t.includes('doc')) return '📝';
  if (t.includes('zip') || t.includes('rar') || t.includes('tar')) return '📦';
  if (t.includes('text') || t.includes('json') || t.includes('csv')) return '📃';
  return '📎';
}

/* ── Presentational Components ── */

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <BlockStack gap="050">
      <Text as="p" variant="bodySm" fontWeight="semibold" tone="subdued">{label}</Text>
      {children}
    </BlockStack>
  );
}

export function Row({ l, v }: { l: string; v: any }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <Text as="p" variant="bodySm" tone="subdued">{l}</Text>
      <Text as="p" variant="bodySm" fontWeight="medium">{v ? fmtDate(v) : '—'}</Text>
    </div>
  );
}

export function Chip({ letter, color, size }: { letter: string; color: string; size?: number }) {
  const s = size || 22;
  return (
    <div style={{
      width: s, height: s, borderRadius: s / 2, background: color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(s * 0.42), fontWeight: 600, flexShrink: 0,
    }}>
      {letter.toUpperCase()}
    </div>
  );
}
