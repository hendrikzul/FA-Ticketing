import { BlockStack, Text } from '@shopify/polaris';

export function labelForFilter(filter: string, mode?: 'human' | 'ai'): string {
  if (mode === 'human') return 'Private member-to-member chat threads';
  if (mode === 'ai') return 'AI intake history grouped by subject';
  if (filter === 'mentioned') return 'Mentions';
  if (filter === 'assigned') return 'Assigned to me';
  if (filter === 'watching') return 'Watching';
  if (filter === 'all') return 'All conversations';
  return 'Inbox';
}

export function formatModeType(ticketType: string): string {
  return ticketType.charAt(0).toUpperCase() + ticketType.slice(1);
}

export function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function SimpleEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="simple-empty-state">
      <BlockStack gap="100">
        <Text as="h3" variant="headingMd">{title}</Text>
        <Text as="p" variant="bodyMd" tone="subdued">{description}</Text>
      </BlockStack>
    </div>
  );
}
