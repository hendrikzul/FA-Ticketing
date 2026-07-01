'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import type { ConversationDetail, TicketFormState, UserOption, DivisionOption } from '@/lib/ai-desk-types';

const DEFAULT_FORM: TicketFormState = {
  ticketType: '',
  approvalRequired: 'false',
  priority: 'P3',
  category: '',
  assignedTeamId: '',
  assignedUserId: '',
  status: 'new',
};

export function useTicketForm({
  detail,
  selectedId,
  onSaved,
}: {
  detail: ConversationDetail | null;
  selectedId: number | null;
  onSaved?: () => void;
}) {
  const [ticketForm, setTicketForm] = useState<TicketFormState>(DEFAULT_FORM);
  const [savingTicket, setSavingTicket] = useState(false);
  const [ticketSaveMessage, setTicketSaveMessage] = useState<string | null>(null);
  const [assignableUsers, setAssignableUsers] = useState<UserOption[]>([]);
  const [divisions, setDivisions] = useState<DivisionOption[]>([]);

  // Load users + divisions once
  useEffect(() => {
    api.users.list()
      .then((res) => setAssignableUsers((res.data as unknown as UserOption[]) || []))
      .catch((err) => console.error(err));

    api.divisions.list()
      .then((res) => setDivisions((res.data as unknown as DivisionOption[]) || []))
      .catch((err) => console.error(err));
  }, []);

  // Sync form from detail when detail changes
  useEffect(() => {
    if (!detail?.ticket) {
      setTicketForm(DEFAULT_FORM);
      return;
    }
    const t = detail.ticket;
    setTicketForm({
      ticketType: t.ticket_type || '',
      approvalRequired: t.approval_required ? 'true' : 'false',
      priority: t.priority || 'P3',
      category: t.category || '',
      assignedTeamId: t.assigned_team_id ? String(t.assigned_team_id) : '',
      assignedUserId: t.assigned_user_id ? String(t.assigned_user_id) : '',
      status: t.status || 'new',
    });
  }, [detail?.ticket?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTicketSave = useCallback(async () => {
    const ticket = detail?.ticket;
    if (!ticket?.id || !selectedId) return;

    setSavingTicket(true);
    setTicketSaveMessage(null);

    try {
      const approvalRequired = ticketForm.approvalRequired === 'true';

      await api.tickets.update(ticket.id, {
        ticket_type: ticketForm.ticketType || undefined,
        approval_required: approvalRequired,
        priority: ticketForm.priority || undefined,
        category: ticketForm.category || undefined,
      });

      const assignedTeamId = ticketForm.assignedTeamId ? Number(ticketForm.assignedTeamId) : undefined;
      const assignedUserId = ticketForm.assignedUserId ? Number(ticketForm.assignedUserId) : undefined;
      const teamChanged = assignedTeamId !== (ticket.assigned_team_id || undefined);
      const userChanged = assignedUserId !== (ticket.assigned_user_id || undefined);

      if (teamChanged || userChanged) {
        await api.tickets.assign(ticket.id, {
          assigned_team_id: assignedTeamId,
          assigned_user_id: assignedUserId,
        });
      }

      if (ticketForm.status !== (ticket.status || 'new')) {
        await api.tickets.updateStatus(ticket.id, ticketForm.status);
      }

      setTicketSaveMessage('Ticket updated');
      onSaved?.();
    } catch (err) {
      console.error(err);
      setTicketSaveMessage(err instanceof Error ? err.message : 'Failed to update ticket');
    } finally {
      setSavingTicket(false);
    }
  }, [detail?.ticket, selectedId, ticketForm, onSaved]);

  const userOptions: { label: string; value: string }[] = [
    { label: 'Unassigned', value: '' },
    ...assignableUsers.map((user) => ({
      label: user.email ? `${user.name} (${user.email})` : user.name,
      value: String(user.id),
    })),
  ];

  const divisionOptions: { label: string; value: string }[] = [
    { label: 'No team', value: '' },
    ...divisions.map((division) => ({ label: division.name, value: String(division.id) })),
  ];

  return {
    ticketForm, setTicketForm,
    savingTicket,
    ticketSaveMessage,
    handleTicketSave,
    userOptions,
    divisionOptions,
  };
}
