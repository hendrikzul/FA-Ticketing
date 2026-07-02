'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

/* ── Types ── */

interface AppOption {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  env?: 'Production' | 'Staging';
  hero: string;
  heroTitle: string;
  heroDesc: string;
  features: string[];
}

/* ── Constants ── */

const APPS: AppOption[] = [
  { id: 'ticketing', name: 'Ticketing System', icon: '🎫', tagline: 'Track and resolve issues fast', env: 'Production', hero: '/hero-tickets.png', heroTitle: 'Ticketing System', heroDesc: 'Manage bugs, features, and maintenance tasks in one unified board.', features: ['Kanban & list views', 'SLA tracking', 'AI-powered triage'] },
  { id: 'aicop', name: 'AI Collaboration Platform', icon: '🤖', tagline: 'AI-first operations workspace', env: 'Production', hero: '/hero-aicop.png', heroTitle: 'AI Collaboration', heroDesc: 'Conversations that turn into structured operational work.', features: ['AI Desk intake', 'Smart summaries', 'Knowledge generation'] },
  { id: 'fa-admin', name: 'FlowerAdvisor Admin', icon: '🌸', tagline: 'Manage your flower empire', env: 'Production', hero: '/hero-fa-admin.png', heroTitle: 'FlowerAdvisor Admin', heroDesc: 'Full control over products, orders, and analytics.', features: ['Order management', 'Inventory control', 'Analytics dashboard'] },
  { id: 'finance', name: 'Finance ERP', icon: '💰', tagline: 'Financial operations hub', env: 'Staging', hero: '/hero-finance.png', heroTitle: 'Finance ERP', heroDesc: 'Invoices, expenses, and reporting in one place.', features: ['Invoice tracking', 'Expense management', 'Financial reports'] },
  { id: 'hr', name: 'HR Management', icon: '👥', tagline: 'People operations platform', env: 'Staging', hero: '/hero-hr.png', heroTitle: 'HR Management', heroDesc: 'Employee records, leave, and performance.', features: ['Employee directory', 'Leave management', 'Performance reviews'] },
  { id: 'monitoring', name: 'Monitoring Dashboard', icon: '📊', tagline: 'Infrastructure at a glance', env: 'Production', hero: '/hero-monitoring.png', heroTitle: 'Monitoring', heroDesc: 'Real-time metrics, alerts, and system health.', features: ['Real-time metrics', 'Alert configuration', 'Uptime tracking'] },
  { id: 'crm', name: 'Customer Portal', icon: '💼', tagline: 'Customer relationship center', env: 'Staging', hero: '/hero-crm.png', heroTitle: 'Customer Portal', heroDesc: 'Manage customer interactions and support tickets.', features: ['Customer profiles', 'Ticket history', 'Communication logs'] },
  { id: 'marketing', name: 'Marketing CMS', icon: '📣', tagline: 'Campaign management hub', env: 'Staging', hero: '/hero-marketing.png', heroTitle: 'Marketing CMS', heroDesc: 'Create, schedule, and analyze marketing campaigns.', features: ['Campaign builder', 'Email automation', 'Performance analytics'] },
];

/* ── Hero Backgrounds (inline SVG placeholders) ── */

const HERO_BG: Record<string, string> = {
  ticketing: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 100%)',
  aicop: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #334155 100%)',
  'fa-admin': 'linear-gradient(135deg, #831843 0%, #9d174d 40%, #be185d 100%)',
  finance: 'linear-gradient(135deg, #064e3b 0%, #065f46 40%, #047857 100%)',
  hr: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 40%, #2563eb 100%)',
  monitoring: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)',
  crm: 'linear-gradient(135deg, #3b0764 0%, #581c87 40%, #7e22ce 100%)',
  marketing: 'linear-gradient(135deg, #7c2d12 0%, #9a3412 40%, #c2410c 100%)',
};

/* ── Helper ── */

const STORAGE_KEY = 'aicop_login_prefs';

function loadPrefs(): { appId: string; email: string } {
  if (typeof window === 'undefined') return { appId: 'ticketing', email: '' };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { appId: 'ticketing', email: '' };
}

function savePrefs(appId: string, email: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ appId, email }));
}

/* ── Component ── */

export default function LoginModal() {
  const router = useRouter();
  const prefs = loadPrefs();

  const [appId, setAppId] = useState(prefs.appId);
  const [email, setEmail] = useState(prefs.email);
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [fading, setFading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const app = APPS.find(a => a.id === appId) || APPS[0];
  const filtered = APPS.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));

  /* ── Dynamic hero transition ── */

  const switchApp = useCallback((id: string) => {
    if (id === appId) return;
    setFading(true);
    setTimeout(() => { setAppId(id); setFading(false); }, 250);
    setDropdownOpen(false);
    setSearch('');
  }, [appId]);

  /* ── Caps Lock detection ── */

  const handleKeyUp = (e: React.KeyboardEvent) => {
    setCapsLock(e.getModifierState('CapsLock'));
  };

  /* ── ESC close dropdown ── */

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setDropdownOpen(false); };
    const click = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false); };
    document.addEventListener('keydown', esc);
    document.addEventListener('mousedown', click);
    return () => { document.removeEventListener('keydown', esc); document.removeEventListener('mousedown', click); };
  }, []);

  /* ── Submit ── */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      const { token } = await api.auth.login({ email, password });
      api.setToken(token);
      if (remember) savePrefs(appId, email);
      router.push('/tickets');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Hero features list ── */

  const HeroIcons: Record<number, string> = { 0: '⚡', 1: '🔒', 2: '📈' };

  return (
    <>
      <style>{`
        @keyframes wave1 { 0%,100% { transform: translate(0,0) rotate(0deg); } 33% { transform: translate(60px,-40px) rotate(5deg); } 66% { transform: translate(-40px,30px) rotate(-3deg); } }
        @keyframes wave2 { 0%,100% { transform: translate(0,0) rotate(0deg); } 33% { transform: translate(-50px,-30px) rotate(-5deg); } 66% { transform: translate(50px,20px) rotate(4deg); } }
        @keyframes wave3 { 0%,100% { transform: translate(0,0) rotate(0deg); } 33% { transform: translate(-30px,50px) rotate(3deg); } 66% { transform: translate(40px,-40px) rotate(-4deg); } }
      `}</style>
      <div style={styles.overlay}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '-25%', left: '-20%', width: '70%', height: '70%', borderRadius: '40% 60% 60% 40%', filter: 'blur(60px)', background: 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(59,130,246,0.3), transparent)', animation: 'wave1 4s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', bottom: '-25%', right: '-20%', width: '65%', height: '65%', borderRadius: '50% 40% 50% 60%', filter: 'blur(60px)', background: 'linear-gradient(225deg, rgba(16,185,129,0.35), rgba(236,72,153,0.3), transparent)', animation: 'wave2 3.5s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', top: '30%', right: '-30%', width: '55%', height: '50%', borderRadius: '60% 30% 40% 50%', filter: 'blur(60px)', background: 'linear-gradient(180deg, rgba(245,158,11,0.3), rgba(59,130,246,0.25), transparent)', animation: 'wave3 4.5s ease-in-out infinite' }} />
        </div>
        <div style={styles.modal}>
        {/* LEFT PANEL */}
        <div style={styles.left}>
          <div style={styles.leftInner}>
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
              <h1 style={styles.title}>Log in to your account</h1>
              <p style={styles.subtitle}>Choose an application, then sign in securely.</p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Application Dropdown */}
              <div style={{ marginBottom: 20 }} ref={dropdownRef}>
                <label style={styles.label}>Application</label>
                <div style={styles.dropdownTrigger} onClick={() => setDropdownOpen(!dropdownOpen)}>
                  <span>{app.icon}</span>
                  <span style={{ flex: 1, fontWeight: 500 }}>{app.name}</span>
                  {app.env && <span style={{ ...styles.badge, background: app.env === 'Production' ? '#dcfce7' : '#fef9c3', color: app.env === 'Production' ? '#166534' : '#854d0e' }}>{app.env}</span>}
                  <span style={{ color: '#9ca3af' }}>{dropdownOpen ? '▲' : '▼'}</span>
                </div>
                {dropdownOpen && (
                  <div style={styles.dropdown}>
                    <input style={styles.searchInput} placeholder="Search applications..." value={search} onChange={e => setSearch(e.target.value)} autoFocus />
                    <div style={{ maxHeight: 200, overflow: 'auto' }}>
                      {filtered.map(a => (
                        <div key={a.id} style={{ ...styles.dropdownItem, background: a.id === appId ? '#f5f3ff' : 'transparent' }} onClick={() => switchApp(a.id)}>
                          <span>{a.icon}</span>
                          <span style={{ flex: 1, fontWeight: a.id === appId ? 600 : 400 }}>{a.name}</span>
                          {a.env === 'Production' && <span style={{ fontSize: 10, color: '#166534', background: '#dcfce7', padding: '1px 6px', borderRadius: 4 }}>PROD</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Email */}
              <div style={{ marginBottom: 16 }}>
                <label style={styles.label}>Email</label>
                <input style={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" />
              </div>

              {/* Password */}
              <div style={{ marginBottom: 12 }}>
                <label style={styles.label}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input ref={passwordRef} style={{ ...styles.input, paddingRight: 40 }} type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" onKeyUp={handleKeyUp} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>{showPassword ? '🙈' : '👁'}</button>
                </div>
                {capsLock && <p style={{ color: '#f59e0b', fontSize: 11, marginTop: 4 }}>⚠ Caps Lock is on</p>}
              </div>

              {/* Remember Me */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <input type="checkbox" id="remember" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ accentColor: '#7c3aed' }} />
                <label htmlFor="remember" style={{ fontSize: 13, color: '#6b7280', cursor: 'pointer' }}>Remember me on this device</label>
              </div>

              {/* Error */}
              {error && <div style={styles.error}>{error}</div>}

              {/* Buttons */}
              <button type="submit" disabled={loading} style={{ ...styles.btnPrimary, opacity: loading ? 0.7 : 1 }}>{loading ? 'Signing in...' : 'Log in'}</button>
            </form>
          </div>
        </div>

        {/* RIGHT PANEL — Hero */}
        <div style={{ ...styles.right, background: HERO_BG[appId] || HERO_BG.ticketing }}>
          <div style={{ ...styles.heroContent, opacity: fading ? 0 : 1, transition: 'opacity 250ms ease' }}>
            <div style={styles.heroBadge}>{app.icon} {app.name}</div>
            <h2 style={styles.heroTitle}>{app.heroTitle}</h2>
            <p style={styles.heroDesc}>{app.heroDesc}</p>
            <div style={styles.features}>
              {app.features.map((f, i) => (
                <div key={i} style={styles.featureItem}>
                  <span>{HeroIcons[i] || '•'}</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Bottom tagline */}
          <div style={styles.heroTagline}>
            <span style={{ fontSize: 20 }}>{app.icon}</span>
            <div>
              <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>{app.name}</p>
              <p style={{ fontSize: 11, opacity: 0.7, margin: 0 }}>{app.tagline}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

/* ── Inline Styles ── */

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, background: '#f8fafc',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  },
  modal: {
    display: 'flex', width: 980, maxWidth: '95vw', minHeight: 580, borderRadius: 18,
    overflow: 'hidden', boxShadow: '0 25px 80px rgba(0,0,0,0.25)', background: '#fff',
    position: 'relative', zIndex: 1,
  },
  left: {
    flex: '0 0 45%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 40px',
  },
  leftInner: { width: '100%', maxWidth: 360 },
  title: { fontSize: 22, fontWeight: 700, color: '#111827', margin: 0, letterSpacing: '-0.02em' },
  subtitle: { fontSize: 13, color: '#6b7280', margin: '6px 0 0', lineHeight: 1.5 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' as const, transition: 'border-color 0.15s' },
  dropdownTrigger: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 10, cursor: 'pointer', fontSize: 14, background: '#fff' },
  dropdown: { position: 'absolute' as const, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.12)', marginTop: 4, width: 320, zIndex: 10, overflow: 'hidden' },
  searchInput: { width: '100%', padding: '10px 14px', border: 'none', borderBottom: '1px solid #f3f4f6', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const },
  dropdownItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', fontSize: 13, transition: 'background 0.1s' },
  badge: { fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 600 },
  eyeBtn: { position: 'absolute' as const, right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4 },
  btnPrimary: { width: '100%', padding: '12px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 10 },
  btnSecondary: { width: '100%', padding: '10px', background: 'transparent', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, cursor: 'pointer' },
  error: { background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14, border: '1px solid #fecaca' },
  link: { fontSize: 12, color: '#9ca3af', textDecoration: 'none' },
  right: {
    flex: 1, position: 'relative' as const, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center',
    padding: 48, overflow: 'hidden', borderRadius: '0 18px 18px 0',
  },
  heroContent: { position: 'relative' as const, zIndex: 2 },
  heroBadge: { display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '6px 14px', borderRadius: 20, fontSize: 13, color: '#fff', marginBottom: 20 },
  heroTitle: { fontSize: 28, fontWeight: 700, color: '#fff', margin: '0 0 10px', letterSpacing: '-0.03em' },
  heroDesc: { fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: '0 0 24px' },
  features: { display: 'flex', flexDirection: 'column' as const, gap: 10 },
  featureItem: { display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  heroTagline: { position: 'absolute' as const, bottom: 24, left: 32, display: 'flex', gap: 10, alignItems: 'center', color: '#fff' },
};
