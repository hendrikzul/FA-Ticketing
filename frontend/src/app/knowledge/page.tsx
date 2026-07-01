'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { Badge, BlockStack, InlineStack, Text, TextField } from '@shopify/polaris';

interface Article {
  id: number;
  title: string;
  status: string;
  symptoms: string;
  resolution: string;
  author: { name: string };
  published_at: string;
  tags: string[];
}

export default function KnowledgePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.knowledge.list(search ? { q: search } : {}).then((res) => setArticles((res.data as unknown as Article[]) || []));
  }, [search]);

  return (
    <AppLayout>
      <div className="app-page">
        <div className="app-page__header">
          <Text as="h1" variant="headingLg">
            Knowledge
          </Text>
          <Text as="p" variant="bodyMd" tone="subdued">
            Resolution notes, runbooks, and reusable answers in an admin-style library.
          </Text>
        </div>
        <BlockStack gap="400">
          <div className="surface-card subdued">
            <div style={{ padding: 20 }}>
            <TextField
              label="Search articles"
              value={search}
              onChange={setSearch}
              autoComplete="off"
              placeholder="refund workflow, redis cache clear, courier escalation"
            />
            </div>
          </div>
          {articles.length > 0 ? (
            <BlockStack gap="300">
              {articles.map((a) => (
                <div key={a.id} className="surface-card">
                  <div style={{ padding: 20 }}>
                    <BlockStack gap="200">
                    <InlineStack gap="200">
                      <Badge tone={a.status === 'published' ? 'success' : undefined}>{a.status}</Badge>
                      {(a.tags || []).map((t) => (
                        <Badge key={t}>{t}</Badge>
                      ))}
                    </InlineStack>
                    <Text as="h3" variant="headingMd">{a.title}</Text>
                    {a.symptoms ? <Text as="p" variant="bodyMd"><strong>Symptoms:</strong> {a.symptoms}</Text> : null}
                    {a.resolution ? <Text as="p" variant="bodyMd"><strong>Resolution:</strong> {a.resolution}</Text> : null}
                    <Text as="p" variant="bodySm" tone="subdued">
                      By {a.author?.name} · {a.published_at ? new Date(a.published_at).toLocaleDateString() : 'Draft'}
                    </Text>
                    </BlockStack>
                  </div>
                </div>
              ))}
            </BlockStack>
          ) : (
            <div className="surface-card">
              <SimpleEmptyState
                title="No knowledge articles yet"
                description="Create the first article or refine the search filter."
              />
            </div>
          )}
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
