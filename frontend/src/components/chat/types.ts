export interface Conversation {
  id: number;
  title: string;
  status: string;
  conversation_mode?: string;
  last_activity_at: string;
  creator: { id: number; name: string };
  messages_count: number;
  participants?: Array<{ id: number; name: string }>;
  state?: {
    ticket_type?: string | null;
    status?: string | null;
  } | null;
}

export interface Attachment {
  id: number;
  filename: string;
  mime_type?: string;
  size_bytes?: number;
  storage_path?: string;
  url?: string;
}

export interface Message {
  id: number;
  conversation_id?: number;
  parent_id?: number | null;
  body_text: string | null;
  message_type?: string;
  sender_type: string;
  sender_id: number;
  sender?: { id: number; name: string; username?: string; avatar_url?: string } | null;
  created_at: string;
  thread_reply_count?: number;
  attachments?: Attachment[];
}
