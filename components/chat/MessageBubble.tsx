'use client';

import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ClipboardCopy } from 'lucide-react';

import { useToast } from '@/components/ui/use-toast';
import type { ChatMessage } from '@/lib/types';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const { toast } = useToast();
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      toast({ title: 'Copied to clipboard' });
    } catch (error) {
      console.error('Unable to copy message', error);
      toast({ title: 'Unable to copy message' });
    }
  };

  const isAssistant = message.role === 'assistant';
  const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={cn(
        'flex w-full',
        isAssistant ? 'justify-start' : 'justify-end',
      )}
    >
      <div
        className={cn(
          'w-full max-w-3xl space-y-3',
          isAssistant ? 'text-[var(--text)]' : 'text-white',
        )}
      >
        <div
          className={cn(
            'rounded-2xl p-4 shadow-sm transition',
            isAssistant
              ? 'border border-white/10 bg-white/[0.03]'
              : 'aiti-gradient text-white shadow',
          )}
        >
          <div className="flex items-center justify-between text-xs uppercase tracking-wide">
            <div
              className={cn(
                'font-semibold',
                isAssistant
                  ? 'text-[var(--text)]/70 dark:text-white/70'
                  : 'text-white/80',
              )}
            >
              {isAssistant ? 'Assistant' : 'You'}
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'text-xs',
                  isAssistant
                    ? 'text-[var(--muted)] dark:text-white/60'
                    : 'text-white/80',
                )}
              >
                {formattedTime}
              </span>
              <button
                type="button"
                onClick={() => void handleCopy()}
                aria-label="Copy message"
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-current/70 transition hover:opacity-80 focus:outline-none focus-visible:ring-2',
                  isAssistant
                    ? 'border-white/10 text-[var(--text)]/60 dark:text-white/70'
                    : 'border-white/20 text-white/80',
                )}
              >
                <ClipboardCopy className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="prose prose-sm mt-3 max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
