'use client';

import type { RefObject } from 'react';
import { PlusIcon } from '@shopify/polaris-icons';

export function AIDeskInput({
  value,
  onChange,
  onSubmit,
  creating,
  textareaRef,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  creating: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}) {
  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'flex-end',
      gap: 8,
      padding: '8px 12px',
      borderRadius: 18,
      border: '1px solid rgba(0,0,0,0.1)',
      background: '#fff',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      transition: 'border-color 120ms, box-shadow 120ms',
    }}>
      <button
        type="button"
        aria-label="Attach file"
        style={{
          width: 30,
          height: 30,
          borderRadius: '50%',
          border: '1px solid rgba(0,0,0,0.1)',
          background: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          alignSelf: 'flex-end',
          marginBottom: 4,
        }}
      >
        <PlusIcon width="18" height="18" />
      </button>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
        placeholder="Describe the IT issue or request..."
        rows={1}
        style={{
          flex: 1,
          minWidth: 140,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          resize: 'none',
          fontSize: 14,
          lineHeight: '22px',
          padding: '4px 2px',
          fontFamily: 'inherit',
          color: '#1a1a1a',
          maxHeight: 160,
          overflowY: 'auto',
        }}
      />
      <button
        type="button"
        onClick={onSubmit}
        disabled={!value.trim() || creating}
        aria-label="Send"
        style={{
          width: 30,
          height: 30,
          borderRadius: '50%',
          border: 'none',
          background: value.trim() && !creating ? '#008060' : '#d2d5d8',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: value.trim() && !creating ? 'pointer' : 'default',
          flexShrink: 0,
          alignSelf: 'flex-end',
          marginBottom: 4,
          transition: 'background 120ms',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 7L13 7M13 7L8 2M13 7L8 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}
