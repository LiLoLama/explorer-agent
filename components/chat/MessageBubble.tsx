'use client';

import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ClipboardCopy } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

  const roleVariant = message.role === 'assistant' ? 'default' : 'secondary';
  const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Card
      className={cn(
        'p-4',
        message.role === 'assistant' ? 'bg-muted/50' : 'bg-background',
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={roleVariant}>{message.role}</Badge>
          <span className="text-xs text-muted-foreground">{formattedTime}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => void handleCopy()}
          aria-label="Copy message"
        >
          <ClipboardCopy className="h-4 w-4" />
        </Button>
      </div>
      <div className="prose prose-sm mt-3 max-w-none dark:prose-invert">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {message.content}
        </ReactMarkdown>
      </div>
    </Card>
  );
}
