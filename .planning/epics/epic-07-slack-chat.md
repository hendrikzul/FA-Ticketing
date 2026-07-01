# Epic 07: Slack-Style Chat

**Phase:** 7 | **Status:** pending | **Priority:** P0 - Critical

## Goal

Membangun chat experience ala Slack dengan:
- 3-panel layout: sidebar (channels + DMs + threads), main chat, thread/detail panel
- Group chat / channel creation dengan multi-member selection
- Thread / subchat — reply ke pesan tanpa mengotori channel utama
- Rich media upload — multiple file, image/video/file dengan preview
- AI mention (`@ai`) berfungsi di SEMUA tipe chat
- Message rendering: avatar + sender name + timestamp (Slack-style)
- Mention autocomplete popup
- Drag-drop + paste-from-clipboard upload

## Features

| ID | Feature | Description |
|----|---------|-------------|
| F37 | Thread Messages (parent_id) | Backend: parent_id column, thread relations, reply count |
| F38 | Group Chat / Channels | Backend: conversation_mode='group', multi-participant create |
| F39 | Multi-file Upload | Backend: files[] array input |
| F40 | AI Mention in Chat (@ai) | Backend: detect @ai in ALL modes, dispatch to worker |
| F41 | Slack-Style Chat UI | Frontend: ChatSidebar 3-section |
| F42 | Slack-Style Message Rendering | Frontend: MessageItem avatar+name+bubble+time |
| F43 | Rich Media Composer | Frontend: multi-file preview, mention, drag-drop, paste |
| F44 | Thread Panel + Group Detail | Frontend: slide-in right panels |

## Architecture

```
Backend
├── messages.parent_id           ← thread reply chain
├── messages.thread_reply_count  ← cache untuk sidebar "3 replies"
├── conversation_mode: 'group'   ← new channel mode
├── @ai detection ALL modes      ← AIJobDispatcher::dispatch()
└── multi-file upload            ← files[] validation

Frontend
├── useChat() hook               ← all state + logic
├── ChatSidebar                  ← 3 sections
├── ChatMain                     ← header + messages + composer
├── MessageItem                  ← avatar + name + bubble + time
├── ChatComposer                 ← rich media + mention + drag-drop
├── ThreadPanel                  ← slide-in thread replies
├── GroupDetailPanel             ← member list
└── CreateGroupModal             ← multi-select members
```

## Tasks

| Task | Description | Layer | Status |
|------|-------------|-------|--------|
| T57 | Migration: parent_id + thread_reply_count | Backend | pending |
| T58 | Migration: conversation_mode group | Backend | pending |
| T59 | Message model: thread relations | Backend | pending |
| T60 | MessageController: multi-file, parent_id, AI routing | Backend | pending |
| T61 | MessageController::index: filter top_level/parent_id | Backend | pending |
| T62 | ConversationController: group create | Backend | pending |
| T63 | api.ts: new endpoints | Frontend | pending |
| T64 | useChat() hook | Frontend | pending |
| T65 | ChatSidebar | Frontend | pending |
| T66 | MessageList + MessageItem | Frontend | pending |
| T67 | ChatComposer | Frontend | pending |
| T68 | MentionPopup | Frontend | pending |
| T69 | ThreadPanel | Frontend | pending |
| T70 | CreateGroupModal | Frontend | pending |
| T71 | GroupDetailPanel | Frontend | pending |
| T72 | Refactor chat/page.tsx | Frontend | pending |

## Success Criteria

- [ ] Channel list di sidebar menampilkan group conversations
- [ ] Direct message list menampilkan user conversations
- [ ] Thread section menampilkan recent threads
- [ ] Create group modal: multi-select users → buat group conversation
- [ ] MessageItem: avatar 36px + nama + timestamp + bubble
- [ ] Thread indicator "3 replies" di bawah pesan
- [ ] Klik thread → ThreadPanel slide-in dari kanan
- [ ] ChatComposer: upload multiple files dengan preview image/video
- [ ] ChatComposer: ketik @ → MentionPopup muncul
- [ ] MentionPopup: filter user + AI Agent
- [ ] Kirim @ai → AI worker memproses dan balas sebagai system message
- [ ] Drag-drop file ke composer langsung upload
- [ ] Paste image dari clipboard langsung upload
- [ ] GroupDetailPanel: member list + add member button
- [ ] chat/page.tsx < 100 lines

## Dependencies

- Epic 01 (Conversation System, RBAC) — conversations + participants already exist
- Epic 02 (AI Worker) — AIJobDispatcher already exists, needs mode check removal
- Epic 06 (AuthProvider) — useAuth() needed in chat
