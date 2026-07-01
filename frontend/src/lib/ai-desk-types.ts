export interface ConversationDetail {
  id: number;
  participants?: Array<{ id: number; name: string; username?: string; pivot?: { role?: string } }>;
  watchers?: Array<{ id: number; name: string; username?: string }>;
  state?: {
    needs_ticket?: boolean | null;
    status?: string;
    priority?: string;
    category?: string;
    ticket_type?: string;
    approval_required?: boolean | null;
    current_summary?: string;
    missing_fields_json?: string[] | Record<string, unknown>;
  } | null;
  ai_summaries?: Array<{ id: number; summary_text?: string; summary_type?: string }> | null;
  aiSummaries?: Array<{ id: number; summary_text?: string; summary_type?: string }> | null;
  ticket?: {
    id: number;
    ticket_number?: string;
    title?: string;
    ticket_type?: string | null;
    category?: string | null;
    priority?: string;
    status?: string;
    is_draft?: boolean;
    approval_required?: boolean;
    due_at?: string | null;
    assigned_user_id?: number | null;
    assigned_team_id?: number | null;
    assigned_user?: { name?: string } | null;
    assigned_team?: { name?: string } | null;
    assignedUser?: { name?: string } | null;
    assignedTeam?: { name?: string } | null;
  } | null;
}

export type MissingFieldValue = string[] | Record<string, unknown> | undefined;

export type TicketFormState = {
  ticketType: string;
  approvalRequired: string;
  priority: string;
  category: string;
  assignedTeamId: string;
  assignedUserId: string;
  status: string;
};

export type UserOption = { id: number; name: string; email?: string };
export type DivisionOption = { id: number; name: string };

export const TICKET_TYPE_OPTIONS = [
  { label: 'Not set', value: '' },
  { label: 'Bugfix', value: 'bugfix' },
  { label: 'Development', value: 'development' },
  { label: 'Maintenance', value: 'maintenance' },
];

export const TICKET_STATUS_OPTIONS = [
  { label: 'New', value: 'new' },
  { label: 'Triaged', value: 'triaged' },
  { label: 'Waiting approval', value: 'waiting_approval' },
  { label: 'Queued', value: 'queued' },
  { label: 'In progress', value: 'in_progress' },
  { label: 'Waiting user', value: 'waiting_user' },
  { label: 'Waiting vendor', value: 'waiting_vendor' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Closed', value: 'closed' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Cancelled', value: 'cancelled' },
];

export const TICKET_PRIORITY_OPTIONS = [
  { label: 'P1', value: 'P1' },
  { label: 'P2', value: 'P2' },
  { label: 'P3', value: 'P3' },
  { label: 'P4', value: 'P4' },
];
