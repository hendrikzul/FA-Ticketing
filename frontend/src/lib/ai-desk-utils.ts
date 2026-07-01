import type { MissingFieldValue } from './ai-desk-types';

export function normalizeMissingFields(value: MissingFieldValue): string[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }

  return Object.entries(value)
    .filter(([, entryValue]) => Boolean(entryValue))
    .map(([key]) => key);
}

export function formatTicketType(ticketType: string): string {
  return ticketType.charAt(0).toUpperCase() + ticketType.slice(1);
}
