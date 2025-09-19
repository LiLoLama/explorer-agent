import { createStore, del, get, set } from 'idb-keyval';
import type {
  ChatMessage,
  ConversationSummary,
  ConversationWithMessages,
  ExportedConversationData,
} from './types';

const STORE_NAME = 'explorer-agent';
const STORE_OBJECT = 'state';
const APP_VERSION_KEY = 'app-version';
const CONVERSATIONS_KEY = 'conversations';

const store = createStore(STORE_NAME, STORE_OBJECT);

const version = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.0.0';

function messagesKey(conversationId: string) {
  return `messages:${conversationId}`;
}

export async function loadConversations(): Promise<ConversationSummary[]> {
  const conversations = await get<ConversationSummary[]>(
    CONVERSATIONS_KEY,
    store,
  );
  return conversations ?? [];
}

export async function saveConversations(
  conversations: ConversationSummary[],
): Promise<void> {
  await set(CONVERSATIONS_KEY, conversations, store);
  await set(APP_VERSION_KEY, version, store);
}

export async function loadMessages(
  conversationId: string,
): Promise<ChatMessage[]> {
  const messages = await get<ChatMessage[]>(messagesKey(conversationId), store);
  return messages ?? [];
}

export async function saveMessages(
  conversationId: string,
  messages: ChatMessage[],
): Promise<void> {
  await set(messagesKey(conversationId), messages, store);
}

export async function deleteConversation(
  conversationId: string,
): Promise<void> {
  await del(messagesKey(conversationId), store);
}

export async function exportAll(): Promise<ExportedConversationData> {
  const conversations = await loadConversations();
  const withMessages: ConversationWithMessages[] = [];
  for (const conversation of conversations) {
    const messages = await loadMessages(conversation.id);
    withMessages.push({ ...conversation, messages });
  }
  return { version, conversations: withMessages };
}

export async function importAll(data: ExportedConversationData): Promise<void> {
  const sanitizedConversations = data.conversations.map((conversation) => ({
    ...conversation,
    title: sanitize(conversation.title),
  }));
  await saveConversations(sanitizedConversations);
  await Promise.all(
    sanitizedConversations.map((conversation) =>
      saveMessages(
        conversation.id,
        (
          data.conversations.find((c) => c.id === conversation.id)?.messages ??
          []
        ).map((message) => ({
          ...message,
          content: sanitize(message.content),
        })),
      ),
    ),
  );
}

export async function migrateIfNeeded(): Promise<void> {
  const storedVersion = await get<string | undefined>(APP_VERSION_KEY, store);
  if (!storedVersion) {
    await set(APP_VERSION_KEY, version, store);
    return;
  }
  if (storedVersion === version) {
    return;
  }
  // Future migrations can be added here.
  await set(APP_VERSION_KEY, version, store);
}

function sanitize(value: string): string {
  return value.replace(/[^\t\n\r\x20-\x7E]/g, '').trim();
}
