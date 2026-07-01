'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Banner, BlockStack, Box, Button, FormLayout, InlineGrid, InlineStack, Link, Page, Text, TextField } from '@shopify/polaris';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token } = await api.auth.login({ email, password });
      api.setToken(token);
      router.push('/chat');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-hero">
        <span className="auth-badge">AICOP Operations Workspace</span>
        <BlockStack gap="300">
          <Text as="h1" variant="heading2xl">
            Run support like an admin console, not a chat dump.
          </Text>
          <Text as="p" variant="bodyLg" tone="subdued">
            Triage conversations, convert them into tickets, and build reusable operational knowledge in one Shopify-style workspace.
          </Text>
        </BlockStack>
        <div className="auth-hero-panel">
          <BlockStack gap="400">
            <InlineGrid columns={{ xs: 1, md: 3 }} gap="300">
              <AuthStat label="Queues" value="5 live views" />
              <AuthStat label="SLA" value="2 breached" />
              <AuthStat label="Knowledge" value="Ops ready" />
            </InlineGrid>
            <Box padding="300" background="bg-surface-secondary" borderRadius="300">
              <BlockStack gap="150">
                <Text as="p" variant="headingSm">Default access</Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  `admin@aicop.local` / `password`
                </Text>
              </BlockStack>
            </Box>
          </BlockStack>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 460 }}>
        <Page>
          <div className="surface-card subdued">
            <div style={{ padding: 28 }}>
              <BlockStack gap="500">
                <BlockStack gap="150">
                  <Text as="h2" variant="heading2xl">
                    Sign in
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Access the operations inbox, queue views, and reporting workspace.
                  </Text>
                </BlockStack>

                <form onSubmit={handleLogin}>
                  <FormLayout>
                    {error ? <Banner tone="critical">{error}</Banner> : null}
                    <TextField
                      label="Email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={setEmail}
                    />
                    <TextField
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={setPassword}
                      suffix={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            fontSize: '16px',
                          }}
                          tabIndex={-1}
                        >
                          {showPassword ? '🙈' : '👁'}
                        </button>
                      }
                    />
                    <Button submit variant="primary" loading={loading} fullWidth>
                      Sign in
                    </Button>
                  </FormLayout>
                </form>

                <InlineStack align="space-between" blockAlign="center">
                  <Text as="span" variant="bodySm" tone="subdued">
                    Need a workspace account?
                  </Text>
                  <Link url="/register">Create account</Link>
                </InlineStack>
              </BlockStack>
            </div>
          </div>
        </Page>
      </div>
    </div>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token } = await api.auth.register(form);
      api.setToken(token);
      router.push('/chat');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-hero">
        <span className="auth-badge">Create Workspace Access</span>
        <BlockStack gap="300">
          <Text as="h1" variant="heading2xl">
            Bring support, ops, and AI into the same command surface.
          </Text>
          <Text as="p" variant="bodyLg" tone="subdued">
            New users land in a shared workspace built for structured triage, fast answers, and ticket execution.
          </Text>
        </BlockStack>
        <div className="auth-hero-panel">
          <BlockStack gap="300">
            <Text as="p" variant="headingSm">What you get on first login</Text>
            <BlockStack gap="150">
              <Text as="p" variant="bodyMd">Inbox queues with status filters</Text>
              <Text as="p" variant="bodyMd">Search across tickets and knowledge</Text>
              <Text as="p" variant="bodyMd">Operational dashboards and workload visibility</Text>
            </BlockStack>
          </BlockStack>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 480 }}>
        <Page>
          <div className="surface-card subdued">
            <div style={{ padding: 28 }}>
              <BlockStack gap="500">
                <BlockStack gap="150">
                  <Text as="h2" variant="heading2xl">
                    Create account
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Set up your user and enter the admin workspace.
                  </Text>
                </BlockStack>

                <form onSubmit={handleRegister}>
                  <FormLayout>
                    {error ? <Banner tone="critical">{error}</Banner> : null}
                    <TextField label="Full name" autoComplete="name" value={form.name} onChange={(value) => setForm({...form, name: value})} />
                    <TextField label="Email" type="email" autoComplete="email" value={form.email} onChange={(value) => setForm({...form, email: value})} />
                    <TextField label="Password" type="password" autoComplete="new-password" value={form.password} onChange={(value) => setForm({...form, password: value})} />
                    <TextField label="Confirm password" type="password" autoComplete="new-password" value={form.password_confirmation} onChange={(value) => setForm({...form, password_confirmation: value})} />
                    <Button submit variant="primary" loading={loading} fullWidth>
                      Create account
                    </Button>
                  </FormLayout>
                </form>

                <InlineStack align="space-between">
                  <Text as="span" variant="bodySm" tone="subdued">
                    Already have access?
                  </Text>
                  <Link url="/login">Sign in</Link>
                </InlineStack>
              </BlockStack>
            </div>
          </div>
        </Page>
      </div>
    </div>
  );
}

function AuthStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="auth-stat">
      <BlockStack gap="100">
        <Text as="p" variant="bodySm" tone="subdued">
          {label}
        </Text>
        <Text as="p" variant="headingLg">
          {value}
        </Text>
      </BlockStack>
    </div>
  );
}
