import { ConversationList } from '@/components/sidebar/ConversationList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function HomePage() {
  return (
    <main className="flex h-full flex-1 bg-transparent">
      <ResizablePanelGroup direction="horizontal" className="h-full w-full">
        <ResizablePanel
          defaultSize={25}
          minSize={20}
          className="hidden border-r border-white/10 md:block"
        >
          <ConversationList />
        </ResizablePanel>
        <ResizableHandle className="hidden md:block" />
        <ResizablePanel defaultSize={75} minSize={50}>
          <div className="flex h-full flex-col">
            <header className="flex items-center justify-between border-b border-white/10 bg-white/50 px-6 py-4 backdrop-blur dark:bg-white/[0.04]">
              <div className="space-y-1">
                <h1 className="text-lg font-semibold text-[var(--text)]">
                  {process.env.NEXT_PUBLIC_APP_NAME ?? 'Explorer Agent'}
                </h1>
                <p className="text-sm text-[var(--muted)]">
                  Webhook-powered conversations
                </p>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href="/settings"
                  className="text-sm font-medium text-[var(--text)]/80 underline-offset-4 transition hover:text-[var(--text)] hover:underline dark:text-white/80"
                  aria-label="Open settings"
                >
                  Settings
                </a>
                <div className="md:hidden">
                  <ThemeToggle />
                </div>
              </div>
            </header>
            <div className="border-b border-white/10 md:hidden">
              <ConversationList enableShortcuts={false} />
            </div>
            <ChatWindow />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </main>
  );
}
