'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { Badge, BlockStack, Button, Text, TextField } from '@shopify/polaris';

interface SearchResult {
  type: string;
  id: number;
  title: string;
  number?: string;
  ticket_type?: string | null;
  priority?: string;
  status?: string;
  is_draft?: boolean;
  approval_required?: boolean;
  summary?: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const doSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await api.search(query);
      setResults((res.data as unknown as SearchResult[]) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <AppLayout>
      <div className="app-page">
        <div className="app-page__header">
          <Text as="h1" variant="headingLg">
            Search
          </Text>
          <Text as="p" variant="bodyMd" tone="subdued">
            Search across conversations, tickets, and operational knowledge from one admin surface.
          </Text>
        </div>
        <BlockStack gap="400">
          <div className="surface-card subdued">
            <div style={{ padding: 20 }}>
              <BlockStack gap="300">
              <TextField
                label="Search query"
                value={query}
                onChange={setQuery}
                autoComplete="off"
                placeholder="checkout error redis, refund stuck, shipping vendor latency"
              />
              <Button onClick={doSearch} variant="primary" loading={searching}>
                Search
              </Button>
              </BlockStack>
            </div>
          </div>

          {results.length > 0 ? (
            <BlockStack gap="300">
              <Text as="p" variant="bodySm" tone="subdued">
                {results.length} results
              </Text>
              {results.map((r, i) => (
                <div key={i} className="surface-card">
                  <div style={{ padding: 20 }}>
                    <BlockStack gap="200">
                    <Badge>{r.type}</Badge>
                    <Text as="h3" variant="headingMd">{r.title}</Text>
                    {r.number ? (
                      <Text as="p" variant="bodySm" tone="subdued">
                        {[
                          r.number,
                          r.ticket_type ? formatTicketType(r.ticket_type) : null,
                          r.priority,
                          r.status,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                    ) : null}
                    {r.type === 'ticket' ? (
                      <div>
                        <BlockStack gap="100">
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {r.is_draft ? <Badge tone="attention">Draft</Badge> : <Badge tone="success">Active</Badge>}
                            {r.approval_required ? <Badge tone="warning">Approval required</Badge> : null}
                          </div>
                        </BlockStack>
                      </div>
                    ) : null}
                    {r.summary ? <Text as="p" variant="bodyMd">{r.summary}</Text> : null}
                    </BlockStack>
                  </div>
                </div>
              ))}
            </BlockStack>
          ) : query && !searching ? (
            <div className="surface-card">
              <SimpleEmptyState
                title="No results found"
                description="Try a broader phrase, ticket number, or incident keyword."
              />
            </div>
          ) : null}
        </BlockStack>
      </div>
    </AppLayout>
  );
}

function SimpleEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="simple-empty-state">
      <BlockStack gap="100">
        <Text as="h3" variant="headingMd">
          {title}
        </Text>
        <Text as="p" variant="bodyMd" tone="subdued">
          {description}
        </Text>
      </BlockStack>
    </div>
  );
}

function formatTicketType(ticketType: string): string {
  return ticketType.charAt(0).toUpperCase() + ticketType.slice(1);
}
