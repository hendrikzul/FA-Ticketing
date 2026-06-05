'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ConversationList, ChatWindow, NewConversation } from '@/components/chat/ChatComponents';

export default function ChatPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  return (
    <AppLayout>
      <div className="flex h-full">
        {/* Left: Conversation List (WhatsApp-style) */}
        <div className="w-80 border-r flex flex-col">
          <NewConversation onCreated={(id) => setSelectedId(id)} />
          <ConversationList selectedId={selectedId} onSelect={setSelectedId} />
        </div>

        {/* Center: Chat Window */}
        <div className="flex-1 flex flex-col">
          {selectedId ? (
            <ChatWindow conversationId={selectedId} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-800">AICOP</h2>
                <p className="mt-2">Select a conversation or start a new one</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Details Panel (placeholder) */}
        <div className="w-72 border-l bg-gray-50 p-4">
          <h3 className="font-semibold text-sm text-gray-600 mb-3">Details</h3>
          {selectedId ? (
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs text-gray-500">Participants</div>
                <div className="font-medium">Loading...</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Watchers</div>
                <div className="font-medium">-</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">AI Summary</div>
                <div className="text-gray-600 italic">No summary yet</div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Select a conversation</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
