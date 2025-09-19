import type { Metadata } from 'next';
import './globals.css';

import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || 'Explorer Agent',
  description: 'Chat UI for webhook-driven agents',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn('min-h-screen bg-background font-sans text-foreground')}
      >
        <div className="flex min-h-screen flex-col">{children}</div>
        <Toaster />
      </body>
    </html>
  );
}
