function getApiBase(): string {
  // Runtime override via localStorage (set from browser console or dev tools)
  if (typeof window !== 'undefined') {
    const override = localStorage.getItem('aicop_api_base');
    if (override) return override;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
}

const API_BASE = getApiBase();

type ApiRecord = Record<string, unknown>;

interface AuthRole {
  id?: number;
  name?: string;
  label?: string;
}

interface AuthUser extends ApiRecord {
  id: number;
  name: string;
  email: string;
  roles?: AuthRole[];
}

interface ApiError {
  message?: string;
}

let authToken: string | null = null;

function getStoredToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return authToken;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getStoredToken() || authToken;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((error as ApiError).message || `HTTP ${res.status}`);
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
    return getStoredToken() || authToken;
  },

  // Auth
  auth: {
    register: (data: { name: string; email: string; password: string; password_confirmation: string }) =>
      request<{ user: AuthUser; token: string }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: { email: string; password: string }) =>
      request<{ user: AuthUser; token: string }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
    me: () => request<{ user: AuthUser }>('/auth/me'),
  },

  // Conversations
  conversations: {
    list: (params?: { filter?: string; q?: string; page?: number; mode?: string }) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return request<ApiRecord>(`/conversations${qs ? `?${qs}` : ''}`);
    },
    create: (data: { title?: string; message: string; conversation_mode?: string; participant_ids?: number[] }) =>
      request<{ data: ApiRecord }>('/conversations', { method: 'POST', body: JSON.stringify(data) }),
    show: (id: number) => request<{ data: ApiRecord }>(`/conversations/${id}`),
    addWatcher: (conversationId: number, userId: number) =>
      request<{ message: string }>(`/conversations/${conversationId}/watchers`, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
      }),
  },

  users: {
    list: (params?: { q?: string; role?: string }) => {
      const clean: Record<string, string> = {};
      if (params) for (const [k, v] of Object.entries(params)) { if (v) clean[k] = v; }
      const qs = new URLSearchParams(clean).toString();
      return request<{ data: ApiRecord[] }>(`/users${qs ? `?${qs}` : ''}`);
    },
    create: (data: ApiRecord) => request<{ data: ApiRecord }>('/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: ApiRecord) => request<{ data: ApiRecord }>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request<{ message: string }>(`/users/${id}`, { method: 'DELETE' }),
    assignRole: (id: number, roleIds: number[]) => request<{ data: ApiRecord }>(`/users/${id}/roles`, { method: 'POST', body: JSON.stringify({ role_ids: roleIds }) }),
    roles: () => request<{ data: ApiRecord[] }>('/users/roles'),
  },

  divisions: {
    list: () => request<{ data: ApiRecord[] }>('/divisions'),
  },

  // Tickets
  tickets: {
    create: (data: { title: string; description?: string; ticket_type: string; priority?: string; category?: string; url?: string; reported_by?: string; assigned_user_id?: string; assigned_team_id?: string; files?: File[] }) => {
      if (data.files?.length) {
        const fd = new FormData();
        fd.append('title', data.title);
        if (data.description) fd.append('description', data.description);
        fd.append('ticket_type', data.ticket_type);
        if (data.priority) fd.append('priority', data.priority);
        if (data.category) fd.append('category', data.category);
        if (data.url) fd.append('url', data.url);
        if (data.assigned_team_id) fd.append('assigned_team_id', data.assigned_team_id);
        data.files.forEach((f) => fd.append('files[]', f));
        return request<{ data: ApiRecord }>('/tickets', { method: 'POST', body: fd });
      }
      return request<{ data: ApiRecord }>('/tickets', { method: 'POST', body: JSON.stringify(data) });
    },
    list: (params?: { status?: string; priority?: string; assigned_to?: number; ticket_type?: string; group_by?: string; q?: string; page?: number; per_page?: number; priority?: string }) => {
      const clean: Record<string, string> = {};
      if (params) for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') clean[k] = String(v);
      }
      const qs = new URLSearchParams(clean).toString();
      return request<ApiRecord>(`/tickets${qs ? `?${qs}` : ''}`);
    },
    show: (id: number) => request<{ data: ApiRecord }>(`/tickets/${id}`),
    update: (id: number, data: { ticket_type?: string; approval_required?: boolean; priority?: string; category?: string; assigned_user_id?: number | string | null; assigned_team_id?: number | string | null }) =>
      request<{ data: ApiRecord }>(`/tickets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    updateStatus: (id: number, status: string, note?: string) =>
      request<{ data: ApiRecord }>(`/tickets/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, note }) }),
    assign: (id: number, data: { assigned_user_id?: number; assigned_team_id?: number; note?: string }) =>
      request<{ data: ApiRecord }>(`/tickets/${id}/assign`, { method: 'POST', body: JSON.stringify(data) }),
    comments: {
      create: (ticketId: number, body: string, file?: File) => {
        if (file) {
          const fd = new FormData();
          if (body?.trim()) fd.append('body_text', body.trim());
          fd.append('file', file);
          return request<{ data: ApiRecord }>(`/tickets/${ticketId}/comments`, { method: 'POST', body: fd });
        }
        return request<{ data: ApiRecord }>(`/tickets/${ticketId}/comments`, { method: 'POST', body: JSON.stringify({ body_text: body }) });
      },
    },
  },

  // Notifications
  notifications: {
    list: (params?: Record<string, string>) => {
      const qs = new URLSearchParams(params ?? {}).toString();
      return request<{ data: ApiRecord[] }>(`/notifications${qs ? `?${qs}` : ''}`);
    },
    unreadCount: () => request<{ count: number }>('/notifications/unread-count'),
    markRead: (id: number) => request<{ message: string }>(`/notifications/${id}/read`, { method: 'POST' }),
    markAllRead: () => request<{ message: string }>('/notifications/read-all', { method: 'POST' }),
  },

  // Search
  search: (q: string) => request<{ data: ApiRecord[] }>(`/search?q=${encodeURIComponent(q)}`),

  // Knowledge Base
  knowledge: {
    list: (params?: { q?: string }) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return request<ApiRecord>(`/knowledge${qs ? `?${qs}` : ''}`);
    },
    create: (data: ApiRecord) => request<{ data: ApiRecord }>('/knowledge', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Reports
  reports: {
    dashboard: () => request<{ data: ApiRecord }>('/reports/dashboard'),
    workload: () => request<{ data: ApiRecord[] }>('/reports/workload'),
    reminders: () => request<{ data: ApiRecord[] }>('/reports/reminders'),
    sla: (ticketId: number) => request<{ data: ApiRecord }>(`/reports/sla/${ticketId}`),
  },
  messages: {
    list: (conversationId: number, params?: { page?: number; parent_id?: number; top_level?: boolean }) => {
      const qs = new URLSearchParams();
      if (params?.page) qs.set('page', String(params.page));
      if (params?.parent_id) qs.set('parent_id', String(params.parent_id));
      if (params?.top_level) qs.set('top_level', '1');
      const q = qs.toString();
      return request<ApiRecord>(`/conversations/${conversationId}/messages${q ? `?${q}` : ''}`);
    },
    send: (conversationId: number, data: { bodyText?: string; file?: File | null; files?: File[]; parentId?: number; messageType?: string }) => {
      const hasFiles = data.file || (data.files && data.files.length > 0);
      if (hasFiles) {
        const formData = new FormData();

        if (data.bodyText) formData.append('body_text', data.bodyText);
        if (data.parentId) formData.append('parent_id', String(data.parentId));
        formData.append('message_type', data.messageType || 'file');

        if (data.file) formData.append('file', data.file);
        if (data.files) {
          data.files.forEach((f) => formData.append('files[]', f));
        }

        return request<{ data: ApiRecord }>(`/conversations/${conversationId}/messages`, {
          method: 'POST',
          body: formData,
        });
      }

      return request<{ data: ApiRecord }>(`/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          body_text: data.bodyText,
          parent_id: data.parentId,
          message_type: data.messageType || 'text',
        }),
      });
    },
  },
};
