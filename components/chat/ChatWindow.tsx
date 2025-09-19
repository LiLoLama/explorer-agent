'use client';

import * as React from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Composer } from '@/components/chat/Composer';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { useChatStore, useSettingsStore } from '@/lib/state';
import { useToast } from '@/components/ui/use-toast';
import type { ChatMessage } from '@/lib/types';
import { buildFormData } from '@/lib/audio';

function createId() {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ChatWindow() {
  const { toast } = useToast();
  const {
    conversations,
    activeConversationId,
    messages,
    addMessage,
    updateMessage,
    createConversation,
    selectConversation,
    init,
  } = useChatStore();
  const { webhookUrl, extraHeaders, stream } = useSettingsStore();
  const [isSending, setIsSending] = React.useState(false);
  const [isStreaming, setIsStreaming] = React.useState(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const bottomRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    void init();
  }, [init]);

  React.useEffect(() => {
    if (!activeConversationId && conversations.length > 0) {
      void selectConversation(conversations[0].id);
    }
  }, [activeConversationId, conversations, selectConversation]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeConversationId]);

  const handleSend = async (content: string, audioBlob?: Blob) => {
    let assistantMessage: ChatMessage | null = null;
    let conversationId = activeConversationId;
    try {
      setIsSending(true);
      if (!conversationId) {
        conversationId = await createConversation();
        await selectConversation(conversationId);
      }
      if (!conversationId) {
        throw new Error('Unable to determine conversation');
      }

      const userMessage: ChatMessage = {
        id: createId(),
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      };
      await addMessage(conversationId, userMessage);

      assistantMessage = {
        id: createId(),
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
        streaming: stream,
      };
      await addMessage(conversationId, assistantMessage);

      const history = [...(messages[conversationId] ?? []), userMessage];
      const payload = {
        conversationId,
        messages: history.map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
        })),
        userWebhook: webhookUrl || undefined,
        extraHeaders:
          Object.keys(extraHeaders || {}).length > 0 ? extraHeaders : undefined,
        stream,
      };

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const requestInit: RequestInit = {
        method: 'POST',
        signal: controller.signal,
      };
      if (audioBlob) {
        requestInit.body = buildFormData(payload, audioBlob);
      } else {
        requestInit.headers = { 'Content-Type': 'application/json' };
        requestInit.body = JSON.stringify(payload);
      }

      const response = await fetch('/api/chat', requestInit);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Proxy request failed');
      }

      const contentType = response.headers.get('content-type') ?? '';

      if (stream && contentType.includes('text/event-stream')) {
        setIsStreaming(true);
        assistantMessage = await processStream(
          response,
          conversationId,
          assistantMessage,
        );
      } else {
        const isJsonResponse = /(^|\b)(application\/json|\+json)(\b|$)/i.test(
          contentType,
        );
        if (isJsonResponse) {
          const data = await response.json();
          const createdAt = data.createdAt ?? new Date().toISOString();
          const content = data.content ?? '';
          await updateMessage(conversationId, {
            ...assistantMessage,
            content,
            createdAt,
            streaming: false,
          });
          assistantMessage = {
            ...assistantMessage,
            content,
            createdAt,
            streaming: false,
          };
        } else {
          const text = await response.text();
          const createdAt = new Date().toISOString();
          await updateMessage(conversationId, {
            ...assistantMessage,
            content: text,
            createdAt,
            streaming: false,
          });
          assistantMessage = {
            ...assistantMessage,
            content: text,
            createdAt,
            streaming: false,
          };
        }
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        toast({ title: 'Request cancelled' });
      } else {
        console.error(error);
        toast({
          title: 'Request failed',
          description: error instanceof Error ? error.message : 'Unknown error',
        });
        if (assistantMessage && conversationId) {
          await updateMessage(conversationId, {
            ...assistantMessage,
            error: 'Request failed',
            streaming: false,
          });
        }
      }
    } finally {
      setIsSending(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const processStream = async (
    response: Response,
    conversationId: string,
    assistantMessage: ChatMessage,
  ): Promise<ChatMessage> => {
    if (!response.body) {
      throw new Error('Stream is empty');
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let content = '';
    let currentMessage = assistantMessage;

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';
      for (const rawEvent of events) {
        const lines = rawEvent.split('\n');
        const eventLine = lines.find((line) => line.startsWith('event:')) ?? '';
        const dataLine = lines.find((line) => line.startsWith('data:')) ?? '';
        const eventName = eventLine.replace('event:', '').trim();
        const data = dataLine.replace('data:', '').trim();
        if (eventName === 'token') {
          content += data;
          await updateMessage(conversationId, {
            ...currentMessage,
            content,
            streaming: true,
          });
          currentMessage = { ...currentMessage, content, streaming: true };
        } else if (eventName === 'message') {
          try {
            const parsed = JSON.parse(data);
            content =
              typeof parsed.content === 'string' ? parsed.content : content;
            await updateMessage(conversationId, {
              ...currentMessage,
              content,
              createdAt: parsed.createdAt ?? assistantMessage.createdAt,
              streaming: false,
            });
            currentMessage = {
              ...currentMessage,
              content,
              createdAt: parsed.createdAt ?? assistantMessage.createdAt,
              streaming: false,
            };
          } catch (error) {
            console.error('Invalid message payload', error);
          }
        } else if (eventName === 'error') {
          await updateMessage(conversationId, {
            ...currentMessage,
            content: data,
            error: data,
            streaming: false,
          });
          currentMessage = {
            ...currentMessage,
            content: data,
            error: data,
            streaming: false,
          };
        } else if (eventName === 'done') {
          await updateMessage(conversationId, {
            ...currentMessage,
            content,
            streaming: false,
          });
          currentMessage = { ...currentMessage, content, streaming: false };
        }
      }
    }
    return currentMessage;
  };

  const handleStop = () => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  };

  const activeMessages = activeConversationId
    ? (messages[activeConversationId] ?? [])
    : [];

  return (
    <div className="flex h-full flex-1 flex-col">
      <ScrollArea className="flex-1 px-6 py-6">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          {activeMessages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      <Composer
        onSend={handleSend}
        disabled={isSending}
        isStreaming={isStreaming}
        onStop={handleStop}
      />
    </div>
  );
}
