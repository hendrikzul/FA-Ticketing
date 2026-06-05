const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

let authToken: string | null = null;

if (typeof window !== 'undefined') {
  authToken = localStorage.getItem('auth_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  setToken(token: string | null) {
    authToken = token;
    if (token) localStorage.setItem('auth_token', token);
    else localStorage.removeItem('auth_token');
  },

  getToken() {
    return authToken;
  },

  // Auth
  auth: {
    register: (data: { name: string; email: string; password: string; password_confirmation: string }) =>
      request<{ user: any; token: string }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: { email: string; password: string }) =>
      request<{ user: any; token: string }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
    me: () => request<{ user: any }>('/auth/me'),
  },

  // Conversations
  conversations: {
    list: (params?: { filter?: string; q?: string; page?: number }) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return request<any>(`/conversations${qs ? `?${qs}` : ''}`);
    },
    create: (data: { title?: string; message: string }) =>
      request<{ data: any }>('/conversations', { method: 'POST', body: JSON.stringify(data) }),
    show: (id: number) => request<{ data: any }>(`/conversations/${id}`),
    addWatcher: (conversationId: number, userId: number) =>
      request<{ message: string }>(`/conversations/${conversationId}/watchers`, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
      }),
  },

  // Tickets
  tickets: {
    list: (params?: { status?: string; priority?: string; assigned_to?: number; group_by?: string; q?: string }) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return request<any>(`/tickets${qs ? `?${qs}` : ''}`);
    },
    show: (id: number) => request<{ data: any }>(`/tickets/${id}`),
    updateStatus: (id: number, status: string, note?: string) =>
      request<{ data: any }>(`/tickets/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, note }) }),
    assign: (id: number, data: { assigned_user_id?: number; assigned_team_id?: number; note?: string }) =>
      request<{ data: any }>(`/tickets/${id}/assign`, { method: 'POST', body: JSON.stringify(data) }),
  },

  // Search
  search: (q: string) => request<{ data: any[] }>(`/search?q=${encodeURIComponent(q)}`),

  // Knowledge Base
  knowledge: {
    list: (params?: { q?: string }) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return request<any>(`/knowledge${qs ? `?${qs}` : ''}`);
    },
    create: (data: any) => request<{ data: any }>('/knowledge', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Reports
  reports: {
    dashboard: () => request<{ data: any }>('/reports/dashboard'),
    workload: () => request<{ data: any }>('/reports/workload'),
    reminders: () => request<{ data: any }>('/reports/reminders'),
    sla: (ticketId: number) => request<{ data: any }>(`/reports/sla/${ticketId}`),
  },
  messages: {
    list: (conversationId: number, params?: { page?: number }) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return request<any>(`/conversations/${conversationId}/messages${qs ? `?${qs}` : ''}`);
    },
    send: (conversationId: number, bodyText: string) =>
      request<{ data: any }>(`/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body_text: bodyText }),
      }),
  },
};
