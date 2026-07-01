'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/lib/auth-context';
import { useChat } from '@/hooks/useChat';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { MessageList } from '@/components/chat/MessageList';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { ThreadPanel } from '@/components/chat/ThreadPanel';
import { ForwardModal } from '@/components/chat/ForwardModal';
import { NewDmModal } from '@/components/chat/NewDmModal';
import { CreateGroupModal } from '@/components/chat/CreateGroupModal';
import { GroupDetailModal } from '@/components/chat/GroupDetailPanel';
import { BlockStack, InlineStack, Text } from '@shopify/polaris';
import { InfoIcon } from '@shopify/polaris-icons';
import type { Message } from '@/components/chat/types';

export default function ChatPage() {
  const { user } = useAuth();
  const chat = useChat();
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showNewDm, setShowNewDm] = useState(false);
  const [forwardMessage, setForwardMessage] = useState<Message | null>(null);

  const isGroup = chat.currentConversation?.conversation_mode === 'group';

  const handleForward = async (targetConversationId: number) => {
    if (!forwardMessage?.body_text) return;
    try {
      const { api } = await import('@/lib/api');
      await api.messages.send(targetConversationId, {
        bodyText: '↪ Forwarded:\n' + forwardMessage.body_text,
      });
    } catch (err) {
      console.error('Forward failed', err);
    }
    setForwardMessage(null);
  };

  return (
    <AppLayout>
      <div style={{ display: 'flex', height: 'calc(100vh - 126px)', overflow: 'hidden' }}>
        <ChatSidebar
          groups={chat.groups}
          directs={chat.directs}
          selectedId={chat.selectedId}
          onSelect={chat.setSelectedId}
          onNewChat={() => setShowNewDm(true)}
          onNewGroup={() => setShowNewGroup(true)}
          threadItems={[]}
          onThreadClick={chat.openThread}
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {chat.selectedId ? (
            <>
              <div style={{ padding: '12px 24px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="050">
                    <InlineStack gap="150" blockAlign="center">
                      <Text as="h2" variant="headingMd">
                        {isGroup ? '# ' : ''}{chat.currentConversation?.title || 'Chat'}
                      </Text>
                    </InlineStack>
                    {chat.currentConversation?.participants && (
                      <Text as="p" variant="bodySm" tone="subdued">
                        {chat.currentConversation.participants.length + 1} members
                      </Text>
                    )}
                  </BlockStack>
                  {isGroup && (
                    <button
                      type="button"
                      onClick={() => chat.setDetailOpen(!chat.detailOpen)}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b7280' }}
                    >
                      <InfoIcon width="18" height="18" />
                    </button>
                  )}
                </InlineStack>
              </div>

              <MessageList
                messages={chat.messages}
                aiThinking={chat.aiThinking}
                onThreadOpen={chat.openThread}
                onForward={(msg) => setForwardMessage(msg)}
              />

              <ChatComposer
                onSend={(text, files) => chat.sendMessage(text, files)}
                sending={chat.sending}
              />
            </>
          ) : (
            <div style={{
              display: 'flex', flexDirection: 'column',
              justifyContent: 'center', alignItems: 'center',
              flex: 1, padding: 32, color: '#9ca3af',
            }}>
              <Text as="h2" variant="headingLg">Welcome, {user?.name || 'User'}</Text>
              <div style={{ height: 8 }} />
              <Text as="p" variant="bodyMd" tone="subdued">
                Select a channel or direct message to start chatting.
              </Text>
            </div>
          )}
        </div>

        {chat.threadId && (
          <ThreadPanel
            threadId={chat.threadId}
            messages={chat.threadMessages}
            onSend={(text, files) => chat.sendMessage(text, files, chat.threadId!)}
            onClose={chat.closeThread}
            sending={chat.sending}
          />
        )}

        <GroupDetailModal
          open={isGroup && chat.detailOpen}
          onClose={() => chat.setDetailOpen(false)}
          conversation={chat.currentConversation}
        />
      </div>

      <NewDmModal
        open={showNewDm}
        onClose={() => setShowNewDm(false)}
        onCreated={(id) => {
          chat.setSelectedId(id);
          chat.refreshConversations();
        }}
      />

      <ForwardModal
        open={!!forwardMessage}
        onClose={() => setForwardMessage(null)}
        onForward={handleForward}
        messageText={forwardMessage?.body_text || ''}
      />

      <CreateGroupModal
        open={showNewGroup}
        onClose={() => setShowNewGroup(false)}
        onCreated={(id) => {
          chat.setSelectedId(id);
          chat.refreshConversations();
        }}
      />
    </AppLayout>
  );
}
