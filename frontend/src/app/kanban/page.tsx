'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';

const COLUMNS = ['new', 'triaged', 'assigned', 'working', 'waiting_user', 'waiting_vendor', 'resolved', 'closed'];
const COLUMN_LABELS: Record<string, string> = {
  new: 'New', triaged: 'Triaged', assigned: 'Assigned', working: 'Working',
  waiting_user: 'Waiting User', waiting_vendor: 'Waiting Vendor', resolved: 'Resolved', closed: 'Closed',
};

const PRIORITY_COLORS: Record<string, string> = {
  P1: 'bg-red-100 text-red-800', P2: 'bg-orange-100 text-orange-800',
  P3: 'bg-yellow-100 text-yellow-800', P4: 'bg-green-100 text-green-800',
};

export default function KanbanPage() {
  const [columns, setColumns] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKanban();
  }, []);

  const loadKanban = async () => {
    try {
      const res = await api.tickets.list({ group_by: 'status' });
      setColumns(res.data || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const moveTicket = async (ticketId: number, toStatus: string) => {
    try {
      await api.tickets.updateStatus(ticketId, toStatus);
      loadKanban();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppLayout>
      <div className="h-full overflow-x-auto p-4">
        <h2 className="text-lg font-bold mb-4">Kanban Board</h2>
        <div className="flex gap-4 min-w-max">
          {COLUMNS.map((col) => (
            <div key={col} className="w-64 flex-shrink-0">
              <div className="bg-gray-100 rounded-t-lg px-3 py-2 font-semibold text-sm text-gray-700">
                {COLUMN_LABELS[col]}
                <span className="ml-2 bg-gray-300 rounded-full px-2 py-0.5 text-xs">
                  {columns[col]?.length || 0}
                </span>
              </div>
              <div className="bg-gray-50 rounded-b-lg p-2 space-y-2 min-h-[200px]">
                {columns[col]?.map((ticket: any) => (
                  <div key={ticket.id} className="bg-white p-3 rounded shadow-sm border cursor-pointer hover:shadow-md">
                    <div className="text-xs text-gray-500">{ticket.ticket_number}</div>
                    <div className="font-medium text-sm mt-1">{ticket.title}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${PRIORITY_COLORS[ticket.priority] || ''}`}>
                        {ticket.priority}
                      </span>
                      {ticket.assigned_user && (
                        <span className="text-xs text-gray-500">{ticket.assigned_user.name}</span>
                      )}
                    </div>
                    {col !== COLUMNS[COLUMNS.length - 1] && (
                      <select
                        className="mt-2 w-full text-xs border rounded p-1"
                        value=""
                        onChange={(e) => e.target.value && moveTicket(ticket.id, e.target.value)}
                      >
                        <option value="">Move to...</option>
                        {COLUMNS.filter((c) => c !== col).map((c) => (
                          <option key={c} value={c}>{COLUMN_LABELS[c]}</option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
