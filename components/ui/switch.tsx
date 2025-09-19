'use client';

import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';

import { cn } from '@/lib/utils';

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    ref={ref}
    className={cn(
      'peer inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border border-white/60 bg-white/30 p-1 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:[--tw-ring-color:rgba(10,132,255,0.35)] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[linear-gradient(120deg,#0A84FF,#64D2FF)] data-[state=unchecked]:bg-white/30 dark:border-white/15 dark:bg-white/[0.05] dark:data-[state=unchecked]:bg-white/[0.08]',
      className,
    )}
    {...props}
  >
    <SwitchPrimitives.Thumb className="pointer-events-none block h-6 w-6 rounded-full bg-white shadow-[0_10px_24px_-18px_rgba(15,23,42,0.55)] transition-transform duration-200 data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-0 dark:bg-[var(--surface-strong)]" />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
