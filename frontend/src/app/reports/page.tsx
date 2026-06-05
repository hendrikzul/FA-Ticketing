'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';

export default function ReportsPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [workload, setWorkload] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [tab, setTab] = useState('dashboard');

  useEffect(() => {
    api.reports.dashboard().then((res) => setDashboard(res.data));
    api.reports.workload().then((res) => setWorkload(res.data || []));
    api.reports.reminders().then((res) => setReminders(res.data || []));
  }, []);

  return (
    <AppLayout>
      <div className="h-full p-6 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Reports</h2>

        <div className="flex gap-2 mb-6">
          {['dashboard', 'workload', 'reminders'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm capitalize ${tab === t ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'dashboard' && dashboard && (
          <div>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <StatCard label="Total Tickets" value={dashboard.summary.total_tickets} color="blue" />
              <StatCard label="Open Tickets" value={dashboard.summary.open_tickets} color="yellow" />
              <StatCard label="Resolved Today" value={dashboard.summary.resolved_today} color="green" />
              <StatCard label="SLA Breached" value={dashboard.summary.breached_sla} color="red" />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold mb-3">By Priority</h3>
                {Object.entries(dashboard.by_priority || {}).map(([k, v]) => (
                  <div key={k} className="flex justify-between py-1">
                    <span className="text-sm">{k}</span>
                    <span className="font-medium">{String(v)}</span>
                  </div>
                ))}
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold mb-3">By Status</h3>
                {Object.entries(dashboard.by_status || {}).map(([k, v]) => (
                  <div key={k} className="flex justify-between py-1">
                    <span className="text-sm capitalize">{k.replace('_', ' ')}</span>
                    <span className="font-medium">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold mb-3">Recent Activity</h3>
              {(dashboard.recent_activity || []).map((a: any) => (
                <div key={a.id} className="flex justify-between py-2 border-b text-sm">
                  <span>{a.ticket_number}: {a.title}</span>
                  <span className="capitalize text-gray-500">{a.status.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'workload' && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-4">Staff Workload</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Name</th>
                  <th className="text-right py-2">Active Tickets</th>
                </tr>
              </thead>
              <tbody>
                {workload.map((w: any) => (
                  <tr key={w.id} className="border-b">
                    <td className="py-2">{w.name}</td>
                    <td className="text-right py-2 font-medium">{w.assigned_tickets_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'reminders' && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-4">Stale Tickets & SLA Alerts</h3>
            {reminders.length === 0 ? (
              <p className="text-gray-500 text-sm">No reminders - all tickets are on track!</p>
            ) : (
              reminders.map((r: any, i: number) => (
                <div key={i} className="border-b py-3">
                  <div className="font-medium">{r.ticket_number}: {r.title}</div>
                  <div className="text-sm text-red-600">{r.reason}</div>
                  {r.hours_stale && <div className="text-xs text-gray-500">{r.hours_stale}h stale</div>}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
  };
  return (
    <div className={`${colors[color]} p-4 rounded-lg`}>
      <div className="text-sm">{label}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
    </div>
  );
}
