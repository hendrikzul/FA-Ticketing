'use client';

import { InlineStack } from '@shopify/polaris';
import type { ComponentType } from 'react';

export interface FilterItem {
  key: string;
  icon: ComponentType<{ width?: string | number; height?: string | number }>;
  label: string;
}

export function AIDeskFilterBar({
  items,
  activeFilter,
  onFilterChange,
}: {
  items: readonly FilterItem[];
  activeFilter: string;
  onFilterChange: (key: string) => void;
}) {
  return (
    <InlineStack gap="150">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          className={`conversation-topmenu__button${activeFilter === item.key ? ' active' : ''}`}
          onClick={() => onFilterChange(item.key)}
          aria-label={item.label}
          title={item.label}
        >
          <item.icon width="18" height="18" />
          <span>{item.label}</span>
        </button>
      ))}
    </InlineStack>
  );
}
