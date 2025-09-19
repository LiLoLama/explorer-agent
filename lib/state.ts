import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  deleteConversation,
  exportAll,
  importAll,
  loadConversations,
  loadMessages,
  saveConversations,
  saveMessages,
  migrateIfNeeded,
} from './storage';
import type {
  ChatMessage,
  ConversationSummary,
  ExportedConversationData,
} from './types';

interface ChatState {
  initialized: boolean;
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  messages: Record<string, ChatMessage[]>;
  init: () => Promise<void>;
  selectConversation: (id: string) => Promise<void>;
  createConversation: (title?: string) => Promise<string>;
  renameConversation: (id: string, title: string) => Promise<void>;
  duplicateConversation: (id: string) => Promise<string>;
  deleteConversation: (id: string) => Promise<void>;
  addMessage: (conversationId: string, message: ChatMessage) => Promise<void>;
  updateMessage: (
    conversationId: string,
    message: ChatMessage,
  ) => Promise<void>;
  setMessages: (
    conversationId: string,
    messages: ChatMessage[],
  ) => Promise<void>;
  exportData: () => Promise<ExportedConversationData>;
  importData: (data: ExportedConversationData) => Promise<void>;
}

interface SettingsState {
  webhookUrl: string;
  extraHeaders: Record<string, string>;
  stream: boolean;
  setWebhookUrl: (url: string) => void;
  setExtraHeaders: (headers: Record<string, string>) => void;
  setStream: (value: boolean) => void;
}

const defaultTitle = () => {
  const formatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  return `Conversation ${formatter.format(new Date())}`;
};

const createId = () => {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const useChatStore = create<ChatState>((set, get) => ({
  initialized: false,
  conversations: [],
  activeConversationId: null,
  messages: {},
  init: async () => {
    if (get().initialized) {
      return;
    }
    await migrateIfNeeded();
    const conversations = await loadConversations();
    const activeConversationId = conversations[0]?.id ?? null;
    const messages: Record<string, ChatMessage[]> = {};
    if (activeConversationId) {
      messages[activeConversationId] = await loadMessages(activeConversationId);
    }
    set({ conversations, activeConversationId, messages, initialized: true });
  },
  selectConversation: async (id) => {
    const { messages } = get();
    if (!messages[id]) {
      messages[id] = await loadMessages(id);
    }
    set({ activeConversationId: id, messages: { ...messages } });
  },
  createConversation: async (title) => {
    const id = createId();
    const now = new Date().toISOString();
    const conversation: ConversationSummary = {
      id,
      title: title?.trim() || defaultTitle(),
      createdAt: now,
      updatedAt: now,
    };
    const conversations = [conversation, ...get().conversations];
    await saveConversations(conversations);
    set({ conversations, activeConversationId: id });
    set((state) => ({ messages: { ...state.messages, [id]: [] } }));
    return id;
  },
  renameConversation: async (id, title) => {
    const conversations = get().conversations.map((conversation) =>
      conversation.id === id
        ? {
            ...conversation,
            title: title.trim(),
            updatedAt: new Date().toISOString(),
          }
        : conversation,
    );
    await saveConversations(conversations);
    set({ conversations });
  },
  duplicateConversation: async (id) => {
    const source = get().conversations.find(
      (conversation) => conversation.id === id,
    );
    if (!source) {
      throw new Error('Conversation not found');
    }
    const newId = createId();
    const now = new Date().toISOString();
    const duplicated: ConversationSummary = {
      ...source,
      id: newId,
      title: `${source.title} (Copy)`,
      createdAt: now,
      updatedAt: now,
    };
    const conversations = [duplicated, ...get().conversations];
    await saveConversations(conversations);
    const sourceMessages = await loadMessages(id);
    await saveMessages(newId, sourceMessages);
    set((state) => ({
      conversations,
      activeConversationId: newId,
      messages: { ...state.messages, [newId]: sourceMessages },
    }));
    return newId;
  },
  deleteConversation: async (id) => {
    const remaining = get().conversations.filter(
      (conversation) => conversation.id !== id,
    );
    await saveConversations(remaining);
    await deleteConversation(id);
    set((state) => {
      const { [id]: _removed, ...rest } = state.messages;
      const activeConversationId =
        state.activeConversationId === id
          ? (remaining[0]?.id ?? null)
          : state.activeConversationId;
      return { conversations: remaining, messages: rest, activeConversationId };
    });
  },
  addMessage: async (conversationId, message) => {
    const messages = [...(get().messages[conversationId] ?? []), message];
    await saveMessages(conversationId, messages);
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: messages,
      },
      conversations: state.conversations.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, updatedAt: new Date().toISOString() }
          : conversation,
      ),
    }));
  },
  updateMessage: async (conversationId, message) => {
    const messages = (get().messages[conversationId] ?? []).map((existing) =>
      existing.id === message.id ? { ...existing, ...message } : existing,
    );
    await saveMessages(conversationId, messages);
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: messages,
      },
    }));
  },
  setMessages: async (conversationId, newMessages) => {
    await saveMessages(conversationId, newMessages);
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: newMessages,
      },
    }));
  },
  exportData: async () => exportAll(),
  importData: async (data) => {
    await importAll(data);
    const conversations = await loadConversations();
    const messages: Record<string, ChatMessage[]> = {};
    for (const conversation of conversations) {
      messages[conversation.id] = await loadMessages(conversation.id);
    }
    set({
      conversations,
      messages,
      activeConversationId: conversations[0]?.id ?? null,
    });
  },
}));

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      webhookUrl: '',
      extraHeaders: {},
      stream: false,
      setWebhookUrl: (url) => set({ webhookUrl: url }),
      setExtraHeaders: (headers) => set({ extraHeaders: headers }),
      setStream: (value) => set({ stream: value }),
    }),
    {
      name: 'explorer-agent-settings',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
