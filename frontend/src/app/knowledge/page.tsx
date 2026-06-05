'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';

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
    api.knowledge.list(search ? { q: search } : {}).then((res) => setArticles(res.data || []));
  }, [search]);

  return (
    <AppLayout>
      <div className="h-full p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Knowledge Base</h2>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles..."
            className="px-4 py-2 border rounded-lg w-64"
          />
        </div>

        <div className="space-y-4">
          {articles.map((a) => (
            <div key={a.id} className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded ${a.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {a.status}
                </span>
                {(a.tags || []).map((t) => (
                  <span key={t} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">{t}</span>
                ))}
              </div>
              <h3 className="font-semibold mt-2">{a.title}</h3>
              {a.symptoms && <p className="text-sm text-gray-600 mt-1"><strong>Symptoms:</strong> {a.symptoms}</p>}
              {a.resolution && <p className="text-sm text-gray-600 mt-1"><strong>Resolution:</strong> {a.resolution}</p>}
              <div className="mt-2 text-xs text-gray-400">
                By {a.author?.name} · {a.published_at ? new Date(a.published_at).toLocaleDateString() : 'Draft'}
              </div>
            </div>
          ))}
          {articles.length === 0 && <p className="text-gray-500">No knowledge articles yet.</p>}
        </div>
      </div>
    </AppLayout>
  );
}
