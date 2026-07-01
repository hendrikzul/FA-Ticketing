'use client';

import { BlockStack, Text } from '@shopify/polaris';

export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <BlockStack gap="050">
      <Text as="p" variant="bodySm" tone="subdued">
        {label}
      </Text>
      <Text as="p" variant="bodyMd">
        {value}
      </Text>
    </BlockStack>
  );
}
