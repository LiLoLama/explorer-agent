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
            'rounded-3xl p-5 shadow-soft transition-all duration-300',
            isAssistant
              ? 'border border-white/60 bg-white/60 text-[var(--text)] shadow-[0_28px_60px_-40px_rgba(15,23,42,0.4)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05] dark:text-white'
              : 'bg-gradient-to-r from-[#0A84FF] via-[#64D2FF] to-[#007AFF] text-white shadow-[0_30px_80px_-45px_rgba(10,132,255,0.85)]',
          )}
        >
          <div className="flex items-center justify-between text-[0.7rem] font-semibold uppercase tracking-[0.4em]">
            <div
              className={cn(
                'font-semibold',
                isAssistant
                  ? 'text-[var(--text)]/60 dark:text-white/70'
                  : 'text-white/80',
              )}
            >
              {isAssistant ? 'Assistant' : 'You'}
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'text-xs font-medium',
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
                  'flex h-8 w-8 items-center justify-center rounded-full border text-current/70 transition hover:opacity-85 focus:outline-none focus-visible:ring-2',
                  isAssistant
                    ? 'border-white/50 bg-white/30 text-[var(--text)]/60 backdrop-blur-md dark:border-white/15 dark:bg-white/[0.08] dark:text-white/80'
                    : 'border-white/40 bg-white/30 text-white/80 backdrop-blur-md',
                )}
              >
                <ClipboardCopy className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div
            className={cn(
              'prose prose-sm mt-4 max-w-none transition-colors dark:prose-invert',
              isAssistant ? 'text-[var(--text)] dark:text-white' : 'text-white',
            )}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
