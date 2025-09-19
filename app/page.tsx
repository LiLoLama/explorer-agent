import { ConversationList } from '@/components/sidebar/ConversationList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';

export default function HomePage() {
  return (
    <main className="flex h-full flex-1">
      <ResizablePanelGroup direction="horizontal" className="h-full w-full">
        <ResizablePanel
          defaultSize={25}
          minSize={20}
          className="hidden border-r md:block"
        >
          <ConversationList />
        </ResizablePanel>
        <ResizableHandle className="hidden md:block" />
        <ResizablePanel defaultSize={75} minSize={50}>
          <div className="flex h-full flex-col">
            <header className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h1 className="text-lg font-semibold">
                  {process.env.NEXT_PUBLIC_APP_NAME ?? 'Explorer Agent'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Webhook-powered conversations
                </p>
              </div>
              <a
                href="/settings"
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                aria-label="Open settings"
              >
                Settings
              </a>
            </header>
            <div className="md:hidden border-b">
              <ConversationList enableShortcuts={false} />
            </div>
            <ChatWindow />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </main>
  );
}
