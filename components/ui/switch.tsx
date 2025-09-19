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
      'peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border border-black/10 bg-black/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:[--tw-ring-color:var(--ring)] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-aiti-gold-500 data-[state=unchecked]:bg-black/20 dark:border-white/15 dark:bg-white/[0.05] dark:data-[state=unchecked]:bg-white/[0.08]',
      className,
    )}
    {...props}
  >
    <SwitchPrimitives.Thumb className="pointer-events-none block h-5 w-5 rounded-full bg-white shadow-soft ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0 dark:bg-[var(--surface)]" />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
