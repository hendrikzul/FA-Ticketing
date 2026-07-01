'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import type { ConversationDetail } from '@/lib/ai-desk-types';
import { normalizeMissingFields } from '@/lib/ai-desk-utils';
import { ChatIcon, EyeCheckMarkIcon, NoteIcon, OrderIcon } from '@shopify/polaris-icons';

const menuItems = [
  { key: 'inbox', icon: ChatIcon, label: 'AI inbox' },
  { key: 'mentioned', icon: NoteIcon, label: 'Mentions' },
  { key: 'assigned', icon: OrderIcon, label: 'Assigned' },
  { key: 'watching', icon: EyeCheckMarkIcon, label: 'Watching' },
] as const;

export function useAIDesk() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activeFilter, setActiveFilter] = useState('inbox');
  const [listQuery, setListQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [creating, setCreating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyConversationDetail = useCallback((nextDetail: ConversationDetail | null) => {
    setDetail(nextDetail);
  }, []);

  const loadConversationDetail = useCallback(async (conversationId: number) => {
    setLoadingDetail(true);
    try {
      const res = await api.conversations.show(conversationId);
      const data = (res.data as unknown as ConversationDetail) || null;
      setDetail(data);
    } catch (err) {
      console.error(err);
      setDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;

    api.conversations.show(selectedId)
      .then((res) => {
        if (active) setDetail((res.data as unknown as ConversationDetail) || null);
      })
      .catch((err) => {
        console.error(err);
        if (active) setDetail(null);
      })
      .finally(() => {
        if (active) setLoadingDetail(false);
      });

    return () => { active = false; };
  }, [selectedId]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }
  }, [newMessage]);

  const handleNewThread = useCallback(async () => {
    if (!newMessage.trim()) return;
    setCreating(true);
    try {
      const res = await api.conversations.create({
        message: newMessage.trim(),
        conversation_mode: 'ai',
      });
      const id = (res.data as { id: number }).id;
      setNewMessage('');
      setDetail(null);
      setLoadingDetail(true);
      setSelectedId(id);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  }, [newMessage]);

  // Derived values
  const latestSummary =
    detail?.aiSummaries?.[0]?.summary_text ||
    detail?.ai_summaries?.[0]?.summary_text ||
    detail?.state?.current_summary ||
    'No summary available yet';

  const missingFields = normalizeMissingFields(detail?.state?.missing_fields_json);
  const participants = detail?.participants || [];
  const watchers = detail?.watchers || [];
  const ticket = detail?.ticket;
  const assignee = ticket?.assignedUser?.name || ticket?.assigned_user?.name || 'Unassigned';
  const team = ticket?.assignedTeam?.name || ticket?.assigned_team?.name || 'No team';
  const canEditTicket = Boolean(ticket?.id);

  return {
    // State
    selectedId, setSelectedId,
    detail, loadingDetail,
    activeFilter, setActiveFilter,
    listQuery, setListQuery,
    // New thread
    newMessage, setNewMessage,
    creating,
    textareaRef,
    handleNewThread,
    // Derived
    menuItems,
    latestSummary,
    missingFields,
    participants,
    watchers,
    ticket,
    assignee,
    team,
    canEditTicket,
    // Actions
    loadConversationDetail,
  };
}
