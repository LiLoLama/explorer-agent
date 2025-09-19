import { ConversationList } from '@/components/sidebar/ConversationList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main className="relative flex min-h-[calc(100vh-4rem)] w-full flex-1 flex-col px-4 py-6 md:px-10 md:py-10">
      <div className="absolute inset-0 -z-10 mx-auto max-w-7xl overflow-visible">
        <div className="pointer-events-none absolute inset-0 rounded-[48px] bg-gradient-to-br from-white/20 via-transparent to-white/0 blur-3xl" />
      </div>
      <div className="relative mx-auto flex w-full max-w-7xl flex-1">
        <div className="glass-panel relative flex h-full w-full flex-1 overflow-hidden rounded-[36px] border border-white/60 bg-white/60 shadow-[0_50px_100px_-65px_rgba(15,23,42,0.65)] dark:border-white/10 dark:bg-white/[0.07]">
          <ResizablePanelGroup direction="horizontal" className="h-full w-full">
            <ResizablePanel
              defaultSize={25}
              minSize={20}
              className="hidden border-r border-white/50 bg-white/20 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] md:block"
            >
              <ConversationList />
            </ResizablePanel>
            <ResizableHandle className="hidden bg-white/40 backdrop-blur md:block dark:bg-white/10" />
            <ResizablePanel defaultSize={75} minSize={50}>
              <div className="flex h-full flex-col">
                <header className="glass-toolbar flex items-center justify-between px-8 py-6 text-[var(--text)] dark:text-white">
                  <div className="space-y-1">
                    <span className="text-xs font-medium uppercase tracking-[0.4em] text-[var(--muted)] dark:text-white/60">
                      Explorer Agent
                    </span>
                    <h1 className="text-2xl font-semibold text-[var(--text)] dark:text-white">
                      {process.env.NEXT_PUBLIC_APP_NAME ?? 'Explorer Agent'}
                    </h1>
                    <p className="text-sm text-[var(--muted)] dark:text-white/70">
                      Webhook-powered conversations
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="hidden md:inline-flex"
                    >
                      <a href="/settings" aria-label="Open settings">
                        Einstellungen
                      </a>
                    </Button>
                    <div className="md:hidden">
                      <ThemeToggle />
                    </div>
                  </div>
                </header>
                <div className="border-b border-white/40 bg-white/40 px-4 py-3 backdrop-blur md:hidden dark:border-white/10 dark:bg-white/[0.05]">
                  <ConversationList enableShortcuts={false} />
                </div>
                <div className="flex-1 overflow-hidden bg-transparent">
                  <ChatWindow />
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </main>
  );
}
