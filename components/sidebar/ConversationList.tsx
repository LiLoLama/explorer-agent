'use client';

import * as React from 'react';
import Image from 'next/image';
import { MoreHorizontal, Plus, Upload, Download, Search } from 'lucide-react';

import { useChatStore } from '@/lib/state';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useToast } from '@/components/ui/use-toast';
import type { ConversationSummary } from '@/lib/types';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils';

interface ConversationListProps {
  onConversationSelected?: (id: string) => void;
  enableShortcuts?: boolean;
}

export function ConversationList({
  onConversationSelected,
  enableShortcuts = true,
}: ConversationListProps) {
  const {
    conversations,
    activeConversationId,
    selectConversation,
    createConversation,
    renameConversation,
    duplicateConversation,
    deleteConversation,
    exportData,
    importData,
    init,
  } = useChatStore();
  const { toast } = useToast();
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [newTitle, setNewTitle] = React.useState('');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [commandOpen, setCommandOpen] = React.useState(false);

  React.useEffect(() => {
    void init();
  }, [init]);

  React.useEffect(() => {
    if (!enableShortcuts) {
      return;
    }
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enableShortcuts]);

  const handleSelect = async (conversation: ConversationSummary) => {
    await selectConversation(conversation.id);
    onConversationSelected?.(conversation.id);
    setCommandOpen(false);
  };

  const startRename = (conversation: ConversationSummary) => {
    setEditingId(conversation.id);
    setNewTitle(conversation.title);
  };

  const submitRename = async () => {
    if (!editingId) {
      return;
    }
    const trimmed = newTitle.trim();
    if (!trimmed) {
      toast({ title: 'Title is required' });
      return;
    }
    await renameConversation(editingId, trimmed);
    setEditingId(null);
    setNewTitle('');
  };

  const handleDuplicate = async (conversation: ConversationSummary) => {
    try {
      const id = await duplicateConversation(conversation.id);
      onConversationSelected?.(id);
      toast({ title: 'Conversation duplicated' });
    } catch (error) {
      console.error('Duplicate conversation failed', error);
      toast({ title: 'Unable to duplicate conversation' });
    }
  };

  const handleDelete = async (conversation: ConversationSummary) => {
    await deleteConversation(conversation.id);
    toast({ title: 'Conversation deleted' });
  };

  const handleExport = async () => {
    const data = await exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `explorer-agent-conversations-${new Date().toISOString()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Chats exported' });
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      await importData(parsed);
      toast({ title: 'Chats imported' });
    } catch (error) {
      console.error('Import conversations failed', error);
      toast({ title: 'Import failed', description: 'Invalid file format' });
    } finally {
      event.target.value = '';
    }
  };

  const handleCreate = async () => {
    const id = await createConversation();
    await selectConversation(id);
    onConversationSelected?.(id);
  };

  return (
    <div className="h-full p-4">
      <div className="flex h-full flex-col gap-4 rounded-2xl border border-black/5 bg-white/80 p-4 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex items-center justify-between rounded-2xl border border-black/5 bg-black/5 px-3 py-2 text-sm text-[var(--text)]/80 dark:border-white/10 dark:bg-white/[0.08] dark:text-white/80">
          <div className="flex items-center gap-2">
            <Image src="/favicon.svg" alt="AITI" width={24} height={24} className="h-6 w-6" />
            <span className="font-medium">AI Training Institute</span>
          </div>
          <ThemeToggle />
        </div>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => void handleCreate()}
            aria-label="New conversation"
            className="aiti-gradient flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium text-white shadow-soft transition hover:opacity-90 focus:outline-none focus-visible:ring-2"
          >
            <Plus className="h-4 w-4" /> Neu
          </button>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => void handleExport()}
              aria-label="Export conversations"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-[var(--text)]/70 transition hover:text-[var(--text)] focus:outline-none focus-visible:ring-2 dark:border-white/10 dark:text-white/70 dark:hover:text-white"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Import conversations"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-[var(--text)]/70 transition hover:text-[var(--text)] focus:outline-none focus-visible:ring-2 dark:border-white/10 dark:text-white/70 dark:hover:text-white"
            >
              <Upload className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              aria-label="Search conversations"
              className="surface flex flex-1 items-center gap-2 rounded-2xl border border-black/10 px-3 py-2 text-sm text-[var(--text)]/70 transition hover:border-black/20 hover:text-[var(--text)] focus:outline-none focus-visible:ring-2 dark:border-white/10 dark:text-white/70 dark:hover:border-white/20 dark:hover:text-white"
            >
              <Search className="h-4 w-4" /> Suche (Ctrl/Cmd + K)
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImport}
            aria-hidden
          />
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-2">
          {conversations.map((conversation) => {
            const isActive = conversation.id === activeConversationId;
            const isEditing = editingId === conversation.id;
            return (
              <div
                key={conversation.id}
                className={cn(
                  'group flex items-center justify-between gap-2 rounded-2xl px-3 py-2 text-sm transition',
                  isActive
                    ? 'aiti-gradient text-white shadow'
                    : 'border border-black/10 bg-white/70 text-[var(--text)]/80 hover:border-black/20 hover:text-[var(--text)] dark:border-white/10 dark:bg-white/[0.03] dark:text-white/70 dark:hover:bg-white/[0.08] dark:hover:text-white',
                )}
              >
                {isEditing ? (
                  <form
                    className="flex flex-1 items-center gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void submitRename();
                    }}
                  >
                    <Input
                      value={newTitle}
                      onChange={(event) => setNewTitle(event.target.value)}
                      autoFocus
                      className="h-9 rounded-2xl border-black/10 bg-white/80 text-sm text-[var(--text)] focus-visible:ring-2 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      className="aiti-gradient rounded-2xl px-3 py-2 text-xs text-white shadow-soft hover:opacity-90"
                    >
                      Speichern
                    </Button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleSelect(conversation)}
                    className="flex flex-1 items-center gap-2 text-left font-medium text-current outline-none focus-visible:ring-2"
                  >
                    <span
                      className="flex-1 truncate"
                      title={conversation.title}
                    >
                      {conversation.title}
                    </span>
                  </button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Conversation options"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-current/80 transition hover:text-current focus:outline-none focus-visible:ring-2"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={() => startRename(conversation)}
                    >
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => void handleDuplicate(conversation)}
                    >
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onSelect={() => void handleDelete(conversation)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      </ScrollArea>
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Search conversations" />
        <CommandList>
          <CommandEmpty>No conversations found.</CommandEmpty>
          <CommandGroup heading="Conversations">
            {conversations.map((conversation) => (
              <CommandItem
                key={conversation.id}
                value={conversation.title}
                onSelect={() => void handleSelect(conversation)}
              >
                {conversation.title}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  </div>
  );
}
