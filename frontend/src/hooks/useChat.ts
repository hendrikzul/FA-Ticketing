'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { api } from '@/lib/api';
import type { Conversation, Message } from '@/components/chat/types';

export type ChatMode = 'direct' | 'group';

export function useChat() {
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [threadId, setThreadId] = useState<number | null>(null);
  const [threadMessages, setThreadMessages] = useState<Message[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);

  // Fetch ALL conversations (human + group), split client-side
  const refreshConversations = useCallback(async () => {
    try {
      const res = await api.conversations.list({ filter: 'all' });
      // Laravel paginated response: { data: [...], current_page: 1, ... }
      const data = (res as { data?: Conversation[] }).data || [];
      setConversations(data as Conversation[]);
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    }
  }, []);

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  // Fetch messages for selected conversation (top-level only)
  useEffect(() => {
    // Close any open thread when switching conversations
    setThreadId(null);
    setThreadMessages([]);

    if (!selectedId) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    api.messages.list(selectedId, { top_level: true })
      .then((res) => {
        // Laravel paginated response: { data: [...], ... }
        const data = ((res as { data?: Message[] }).data || []) as Message[];
        setMessages(data);
      })
      .catch(console.error)
      .finally(() => setLoadingMessages(false));
  }, [selectedId]);

  // Fetch thread messages
  useEffect(() => {
    if (!selectedId || !threadId) {
      setThreadMessages([]);
      return;
    }
    api.messages.list(selectedId, { parent_id: threadId })
      .then((res) => {
        const data = ((res as { data?: Message[] }).data || []) as Message[];
        setThreadMessages(data);
      })
      .catch(console.error);
  }, [selectedId, threadId]);

  const sendMessage = useCallback(async (bodyText: string, files: File[], parentId?: number) => {
    if (!selectedId) return;
    setSending(true);

    // Optimistic: show message immediately
    const tempId = Date.now();
    const now = new Date().toISOString();
    const optimistic: Message = {
      id: tempId,
      conversation_id: selectedId,
      parent_id: parentId || null,
      sender_type: 'user',
      sender_id: 0,
      sender: { id: 0, name: 'You', username: 'you' },
      message_type: 'text',
      body_text: bodyText,
      thread_reply_count: 0,
      created_at: now,
    };

    if (parentId) {
      setThreadMessages((prev) => [...prev, optimistic]);
    } else {
      setMessages((prev) => [...prev, optimistic]);
    }

    // Show typing indicator for @ai messages
    let aiReply: any = null;
    if (bodyText.includes('@ai')) {
      setAiThinking(true);
    }

    try {
      const res: any = await api.messages.send(selectedId, { bodyText, files: files.length > 0 ? files : undefined, parentId });
      // Laravel API returns: { data: message, ai_reply: message }
      aiReply = res?.ai_reply;
      const realMsg = res?.data;

      // Replace optimistic user message with real one
      if (realMsg?.id) {
        if (parentId) {
          setThreadMessages((prev) => prev.map((m) => (m.id === tempId ? { ...realMsg, sender: realMsg.sender || { id: 0, name: 'You', username: 'you' } } : m)));
        } else {
          setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...realMsg, sender: realMsg.sender || { id: 0, name: 'You', username: 'you' } } : m)));
        }
      }

      // Inject AI reply immediately (sync mode)
      if (aiReply?.id) {
        if (parentId) {
          setThreadMessages((prev) => [...prev.filter((m) => m.id !== aiReply.id), aiReply]);
        } else {
          setMessages((prev) => [...prev.filter((m) => m.id !== aiReply.id), aiReply]);
        }
        setAiThinking(false);
      }

      // If @ai but no ai_reply (async mode), start polling
      if (bodyText.includes('@ai') && !aiReply?.id) {
        startAiPolling(selectedId, parentId, parentId ? threadMessages.length : messages.length);
      }
    } catch (err) {
      console.error('Failed to send message', err);
      // Keep optimistic message — it's saved to DB even if orchestrator call fails
      // Start polling for AI reply if @ai message
      if (bodyText.includes('@ai')) {
        startAiPolling(selectedId, parentId, parentId ? threadMessages.length : messages.length);
      }
    } finally {
      if (!bodyText.includes('@ai') || aiReply?.id) {
        setSending(false);
        setAiThinking(false);
      }
      setSending(false);
    }
  }, [selectedId]);

  // Poll for AI reply after sending @ai message (async mode)
  const startAiPolling = useCallback((convId: number, parentId: number | null | undefined, prevCount: number) => {
    // Clear any existing poll
    if (pollRef.current) clearInterval(pollRef.current);
    pollCountRef.current = 0;

    pollRef.current = setInterval(async () => {
      pollCountRef.current++;
      // Stop after 40 polls (~80 seconds)
      if (pollCountRef.current > 40) {
        if (pollRef.current) clearInterval(pollRef.current);
        setAiThinking(false);
        setSending(false);
        return;
      }

      try {
        const listParams: any = parentId ? { parent_id: parentId } : { top_level: true };
        const res = await api.messages.list(convId, listParams);
        const freshMessages = ((res as { data?: Message[] }).data || []) as Message[];
        const aiMsgs = freshMessages.filter((m) => m.sender_type === 'ai_bot' || m.sender_type === 'ai');
        
        if (aiMsgs.length > 0) {
          // AI reply arrived — stop polling, update messages
          if (pollRef.current) clearInterval(pollRef.current);
          if (parentId) {
            setThreadMessages(freshMessages);
          } else {
            setMessages(freshMessages);
          }
          setAiThinking(false);
          setSending(false);
        } else if (freshMessages.length > prevCount) {
          // Messages updated but no AI reply yet, refresh optimistic
          if (parentId) {
            setThreadMessages(freshMessages);
          } else {
            setMessages(freshMessages);
          }
        }
      } catch (_) {
        // Silent retry on next interval
      }
    }, 2000);
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const openThread = useCallback((messageId: number) => {
    setThreadId(messageId);
  }, []);

  const closeThread = useCallback(() => {
    setThreadId(null);
    setThreadMessages([]);
  }, []);

  const currentConversation = useMemo(() =>
    conversations.find((c) => c.id === selectedId) ?? null,
    [conversations, selectedId],
  );

  // Split client-side: groups vs directs
  const groups = useMemo(() =>
    conversations.filter((c) => c.conversation_mode === 'group'),
    [conversations],
  );
  const directs = useMemo(() =>
    conversations.filter((c) => !c.conversation_mode || c.conversation_mode === 'human' || c.conversation_mode === 'direct'),
    [conversations],
  );

  return {
    selectedId, setSelectedId,
    messages, loadingMessages,
    sending, sendMessage,
    threadId, threadMessages,
    openThread, closeThread,
    detailOpen, setDetailOpen,
    aiThinking,
    conversations, groups, directs,
    currentConversation,
    refreshConversations,
  };
}
