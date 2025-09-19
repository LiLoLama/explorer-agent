'use client';

import {
  PanelGroup,
  Panel,
  PanelResizeHandle,
  type PanelGroupProps,
  type PanelResizeHandleProps,
} from 'react-resizable-panels';

import { cn } from '@/lib/utils';

const ResizablePanelGroup = ({ className, ...props }: PanelGroupProps) => (
  <PanelGroup className={cn('flex w-full', className)} {...props} />
);

const ResizablePanel = Panel;

const ResizableHandle = ({ className, ...props }: PanelResizeHandleProps) => (
  <PanelResizeHandle
    className={cn(
      'w-px cursor-col-resize bg-white/40 transition-colors hover:bg-[rgba(10,132,255,0.6)] dark:bg-white/10',
      className,
    )}
    {...props}
  />
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
