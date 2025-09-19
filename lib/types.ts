export type Role = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  createdAt: string;
  streaming?: boolean;
  error?: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationWithMessages extends ConversationSummary {
  messages: ChatMessage[];
}

export interface ChatRequestPayload {
  conversationId: string;
  messages: Array<Pick<ChatMessage, 'id' | 'role' | 'content'>>;
  userWebhook?: string;
  extraHeaders?: Record<string, string>;
  stream?: boolean;
}

export interface ChatResponsePayload {
  id: string;
  role: 'assistant';
  content: string;
  createdAt: string;
  meta?: Record<string, unknown>;
}

export type SSEEventType = 'token' | 'message' | 'error' | 'done';

export interface SSEPayload {
  event: SSEEventType;
  data?: string;
}

export interface ExportedConversationData {
  version: string;
  conversations: ConversationWithMessages[];
}
