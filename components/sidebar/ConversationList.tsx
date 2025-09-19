'use client';

import * as React from 'react';
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
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Button
          className="flex-1"
          onClick={() => void handleCreate()}
          aria-label="New conversation"
        >
          <Plus className="mr-2 h-4 w-4" /> New
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => void handleExport()}
          aria-label="Export conversations"
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Import conversations"
        >
          <Upload className="h-4 w-4" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleImport}
          aria-hidden
        />
      </div>
      <Button
        variant="secondary"
        className="justify-start"
        onClick={() => setCommandOpen(true)}
        aria-label="Search conversations"
      >
        <Search className="mr-2 h-4 w-4" /> Search (Ctrl/Cmd + K)
      </Button>
      <ScrollArea className="flex-1">
        <div className="space-y-1">
          {conversations.map((conversation) => {
            const isActive = conversation.id === activeConversationId;
            const isEditing = editingId === conversation.id;
            return (
              <div
                key={conversation.id}
                className={
                  'group flex items-center justify-between rounded-md border border-transparent px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground' +
                  (isActive ? ' bg-accent text-accent-foreground' : '')
                }
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
                      className="h-8"
                    />
                    <Button type="submit" size="sm" variant="secondary">
                      Save
                    </Button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleSelect(conversation)}
                    className="flex flex-1 items-center gap-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Conversation options"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
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
  );
}
