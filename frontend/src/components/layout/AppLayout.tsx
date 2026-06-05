'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = api.getToken();
    if (!token) {
      router.push('/login');
      return;
    }
    api.auth.me().then((res) => setUser(res.user)).catch(() => router.push('/login'));
  }, [router]);

  const logout = async () => {
    await api.auth.logout();
    api.setToken(null);
    router.push('/login');
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-indigo-700 text-white px-4 py-2 flex items-center justify-between">
        <h1 className="font-bold text-lg">AICOP</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">{user?.name} ({user?.roles?.[0]?.label || 'User'})</span>
          <button onClick={logout} className="text-sm text-indigo-200 hover:text-white">Logout</button>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
