'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface UserOption {
  id: number;
  name: string;
  username?: string;
  email?: string;
}

const AI_AGENT = { id: 0, name: 'ai', username: 'ai', label: '🤖 AI Agent', type: 'ai' as const };

export function MentionPopup({
  query,
  onSelect,
  onClose,
}: {
  query: string;
  onSelect: (username: string) => void;
  onClose: () => void;
}) {
  const [users, setUsers] = useState<UserOption[]>([]);

  useEffect(() => {
    api.users.list()
      .then((res) => {
        const data = (res.data as unknown as UserOption[]) || [];
        setUsers(data);
      })
      .catch(console.error);
  }, []);

  const allOptions = [
    AI_AGENT,
    ...users.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username || u.name.toLowerCase().replace(/\s+/g, ''),
      label: `👤 ${u.name}${u.email ? ` (${u.email})` : ''}`,
      type: 'user' as const,
    })),
  ];

  const filtered = allOptions.filter((u) =>
    query === '' || u.username.toLowerCase().includes(query.toLowerCase()) || u.name.toLowerCase().includes(query.toLowerCase())
  );

  if (filtered.length === 0) {
    return (
      <div style={{
        position: 'absolute', bottom: '100%', left: 24,
        background: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: 8, minWidth: 200, zIndex: 50,
      }}>
        <div style={{ fontSize: 13, color: '#9ca3af' }}>No matches</div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'absolute', bottom: '100%', left: 24,
      background: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: 4, minWidth: 200, zIndex: 50,
    }}>
      {filtered.map((u) => (
        <button
          key={`${u.type}-${u.id}`}
          type="button"
          onClick={() => onSelect(u.username)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            width: '100%', padding: '6px 10px', border: 'none', background: 'transparent',
            cursor: 'pointer', textAlign: 'left', fontSize: 13, borderRadius: 4,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <span>{u.label}</span>
        </button>
      ))}
    </div>
  );
}
