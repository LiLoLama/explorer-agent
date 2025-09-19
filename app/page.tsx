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
    <main className="relative isolate flex min-h-screen w-full flex-1 flex-col overflow-hidden bg-transparent">
      <div className="pointer-events-none absolute inset-x-0 top-[-30%] -z-20 h-[480px] bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.65),transparent_60%)] blur-[72px]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-[-45%] -z-20 h-[520px] bg-[radial-gradient(circle_at_bottom,rgba(14,165,233,0.5),transparent_55%)] blur-[90px]" />
      <div className="pointer-events-none absolute inset-0 -z-30 bg-[linear-gradient(180deg,#020617_0%,#0b1120_55%,#020617_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_18%,rgba(125,211,252,0.22),transparent_60%),radial-gradient(circle_at_85%_14%,rgba(147,197,253,0.2),transparent_58%),radial-gradient(circle_at_50%_85%,rgba(14,165,233,0.18),transparent_60%)]" />
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-16 pt-24 sm:px-6 lg:px-10">
        <div className="flex flex-col gap-6 text-left text-white sm:items-center sm:text-center lg:items-start lg:text-left">
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-sky-200 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" aria-hidden />
            Explorer Agent
          </div>
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              {process.env.NEXT_PUBLIC_APP_NAME ?? 'Explorer Agent'}
            </h1>
            <p className="max-w-2xl text-base text-slate-200 sm:mx-auto sm:text-lg lg:mx-0">
              Steuere komplexe Automatisierungen, verwalte Konversationen und erlebe ein reaktionsschnelles Interface, das sich auf allen Geräten intuitiv anfühlt.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-100">
            <Button
              asChild
              size="sm"
              className="aiti-gradient rounded-full px-5 py-2 text-sm font-semibold text-white shadow-[0_20px_40px_-24px_rgba(59,130,246,0.8)] hover:scale-[1.015] hover:bg-transparent hover:opacity-95 focus-visible:ring-offset-0"
            >
              <a href="/settings" aria-label="Einstellungen öffnen">
                Einstellungen
              </a>
            </Button>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.32em] text-slate-200 backdrop-blur md:hidden">
              <span className="font-medium">Theme</span>
              <ThemeToggle />
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-1">
          <div className="glass-panel relative flex h-full w-full flex-1 overflow-hidden rounded-[40px] border border-white/10 bg-white/5 shadow-[0_60px_120px_-60px_rgba(15,23,42,0.85)]">
            <ResizablePanelGroup direction="horizontal" className="h-full w-full">
              <ResizablePanel
                defaultSize={26}
                minSize={20}
                className="hidden border-r border-white/10 bg-white/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] lg:block"
              >
                <div className="h-full w-full overflow-hidden">
                  <ConversationList />
                </div>
              </ResizablePanel>
              <ResizableHandle className="hidden bg-white/10 backdrop-blur lg:block" />
              <ResizablePanel defaultSize={74} minSize={50}>
                <div className="flex h-full flex-col">
                  <header className="glass-toolbar flex flex-col gap-4 border-b border-white/10 px-6 py-6 text-[var(--text)] dark:text-white sm:flex-row sm:items-center sm:justify-between sm:gap-6 lg:px-8">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-600 dark:text-sky-200/80">
                        Webhook-Konversationen
                      </p>
                      <p className="text-xl font-semibold text-[var(--text)] dark:text-white">
                        Echtzeit-Kommunikation neu gedacht
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-200/80">
                        Verfolge den Austausch deiner Agenten in einer klar strukturierten Oberfläche.
                      </p>
                    </div>
                    <div className="hidden items-center gap-3 sm:flex">
                      <ThemeToggle />
                    </div>
                  </header>
                  <div className="border-b border-white/10 bg-white/5 px-4 py-3 backdrop-blur lg:hidden">
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
      </div>
    </main>
  );
}
