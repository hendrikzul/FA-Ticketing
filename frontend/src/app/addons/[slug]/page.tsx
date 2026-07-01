'use client';

import { use, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getAddonRoute } from '@/addons/registry';
import { BlockStack, Spinner, Text } from '@shopify/polaris';

export default function AddonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { hasAddon, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <BlockStack gap="200" align="center">
          <Spinner size="large" />
          <Text as="p" variant="bodyMd" tone="subdued">Loading addon...</Text>
        </BlockStack>
      </div>
    );
  }

  const route = getAddonRoute(slug);

  if (!route) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <BlockStack gap="200" align="center">
          <Text as="h2" variant="headingLg">Addon not found</Text>
          <Text as="p" variant="bodyMd" tone="subdued">
            The addon &quot;{slug}&quot; is not registered.
          </Text>
        </BlockStack>
      </div>
    );
  }

  if (!hasAddon(slug)) {
    // Redirect to home if no access
    router.replace('/');
    return null;
  }

  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spinner size="large" />
      </div>
    }>
      <route.component />
    </Suspense>
  );
}
