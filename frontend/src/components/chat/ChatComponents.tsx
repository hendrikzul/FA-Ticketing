'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';

interface Conversation {
  id: number;
  title: string;
  status: string;
  last_activity_at: string;
  creator: { id: number; name: string };
  messages_count: number;
}

interface Message {
  id: number;
  body_text: string;
  sender_type: string;
  sender_id: number;
  created_at: string;
}

export function ConversationList({ selectedId, onSelect }: { selectedId: number | null; onSelect: (id: number) => void }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filter, setFilter] = useState('inbox');

  useEffect(() => {
    api.conversations.list({ filter }).then((res) => setConversations(res.data || []));
  }, [filter]);

  const filters = ['inbox', 'mentioned', 'assigned', 'watching', 'all'];

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <div className="flex gap-1 overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs rounded-full capitalize ${filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${selectedId === conv.id ? 'bg-indigo-50' : ''}`}
          >
            <div className="font-medium text-sm truncate">{conv.title}</div>
            <div className="text-xs text-gray-500">{conv.creator?.name} · {conv.messages_count} msgs</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChatWindow({ conversationId }: { conversationId: number }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.messages.list(conversationId).then((res) => {
      setMessages(res.data || []);
    });
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    try {
      const res = await api.messages.send(conversationId, input);
      setMessages((prev) => [...prev, res.data]);
      setInput('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] px-4 py-2 rounded-lg ${msg.sender_type === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>
              <p className="text-sm">{msg.body_text}</p>
              <span className="text-xs opacity-60">{new Date(msg.created_at).toLocaleTimeString()}</span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 border-t flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Type a message... (use @username to mention)"
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button onClick={send} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          Send
        </button>
      </div>
    </div>
  );
}

export function NewConversation({ onCreated }: { onCreated: (id: number) => void }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const create = async () => {
    if (!message.trim()) return;
    try {
      const res = await api.conversations.create({ title: title || undefined, message });
      onCreated(res.data.id);
      setTitle('');
      setMessage('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 border-b">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)"
        className="flex-1 px-3 py-1 text-sm border rounded" />
      <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="First message"
        className="flex-[2] px-3 py-1 text-sm border rounded"
        onKeyDown={(e) => e.key === 'Enter' && create()} />
      <button onClick={create} className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">New</button>
    </div>
  );
}
