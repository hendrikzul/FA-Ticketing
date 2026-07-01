'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { ConversationList } from '@/components/chat/ChatComponents';
import { AIDeskFilterBar } from '@/components/ai-desk/AIDeskFilterBar';
import { AIDeskThreadPanel } from '@/components/ai-desk/AIDeskThreadPanel';
import { useAIDesk } from '@/hooks/useAIDesk';
import { useTicketForm } from '@/hooks/useTicketForm';
import { Badge, BlockStack, InlineStack, Text, TextField } from '@shopify/polaris';
import { SearchIcon } from '@shopify/polaris-icons';

export default function AIDeskPage() {
  const desk = useAIDesk();
  const ticket = useTicketForm({
    detail: desk.detail,
    selectedId: desk.selectedId,
    onSaved: () => desk.loadConversationDetail(desk.selectedId!),
  });

  return (
    <AppLayout>
      <div className="app-page app-page--full">
        <div className="app-page__header">
          <InlineStack align="space-between" blockAlign="center">
            <Text as="h1" variant="headingLg">
              AI Desk
            </Text>
            <AIDeskFilterBar
              items={desk.menuItems}
              activeFilter={desk.activeFilter}
              onFilterChange={desk.setActiveFilter}
            />
          </InlineStack>
        </div>
        <div className="conversation-workspace">
          <div className="conversation-list-panel">
            <div className="surface-card subdued">
              <div style={{ padding: 16 }}>
                <BlockStack gap="300">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="h2" variant="headingMd">
                      AI Threads
                    </Text>
                    <Badge tone="info">
                      {desk.selectedId ? `#${desk.selectedId}` : 'No active thread'}
                    </Badge>
                  </InlineStack>
                  <TextField
                    label="Search AI threads"
                    labelHidden
                    value={desk.listQuery}
                    onChange={desk.setListQuery}
                    autoComplete="off"
                    placeholder="Search subject, issue keyword, or ticket context"
                    prefix={<SearchIcon width="16" height="16" />}
                  />
                  <ConversationList
                    mode="ai"
                    title="AI Threads"
                    subtitle="ChatGPT-style ticket intake history."
                    selectedId={desk.selectedId}
                    filter={desk.activeFilter}
                    query={desk.listQuery}
                    onSelect={(id) => {
                      desk.setSelectedId(id);
                    }}
                  />
                </BlockStack>
              </div>
            </div>
          </div>

          <AIDeskThreadPanel
            selectedId={desk.selectedId}
            detail={desk.detail}
            loadingDetail={desk.loadingDetail}
            canEditTicket={desk.canEditTicket}
            latestSummary={desk.latestSummary}
            missingFields={desk.missingFields}
            participants={desk.participants}
            watchers={desk.watchers}
            ticket={desk.ticket}
            assignee={desk.assignee}
            team={desk.team}
            newMessage={desk.newMessage}
            onMessageChange={desk.setNewMessage}
            onNewThread={desk.handleNewThread}
            creating={desk.creating}
            textareaRef={desk.textareaRef}
            ticketForm={ticket.ticketForm}
            onTicketFormChange={ticket.setTicketForm}
            onTicketSave={ticket.handleTicketSave}
            savingTicket={ticket.savingTicket}
            ticketSaveMessage={ticket.ticketSaveMessage}
            userOptions={ticket.userOptions}
            divisionOptions={ticket.divisionOptions}
          />
        </div>
      </div>
    </AppLayout>
  );
}
