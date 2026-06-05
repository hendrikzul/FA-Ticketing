'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';

interface SearchResult {
  type: string;
  id: number;
  title: string;
  [key: string]: any;
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
      setResults(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <AppLayout>
      <div className="h-full p-6 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">AI Search</h2>
        <div className="flex gap-2 mb-6 max-w-2xl">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doSearch()}
            placeholder="Search conversations, tickets, knowledge... (e.g. checkout error Redis)"
            className="flex-1 px-4 py-2 border rounded-lg"
          />
          <button onClick={doSearch} disabled={searching}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-500">{results.length} results</p>
            {results.map((r, i) => (
              <div key={i} className="bg-white p-4 rounded-lg shadow border">
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded capitalize">{r.type}</span>
                <div className="font-medium mt-1">{r.title}</div>
                {r.number && <div className="text-sm text-gray-500">{r.number} · {r.priority} · {r.status}</div>}
                {r.summary && <div className="text-sm text-gray-600 mt-1">{r.summary}</div>}
              </div>
            ))}
          </div>
        )}

        {results.length === 0 && query && !searching && (
          <p className="text-gray-500">No results found.</p>
        )}
      </div>
    </AppLayout>
  );
}
