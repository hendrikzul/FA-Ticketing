'use client';

import type { ReactNode } from 'react';
import { AppProvider } from '@shopify/polaris';
import enTranslations from '@shopify/polaris/locales/en.json';

export function PolarisProvider({ children }: { children: ReactNode }) {
  return <AppProvider i18n={enTranslations}>{children}</AppProvider>;
}
