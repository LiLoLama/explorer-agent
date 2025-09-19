import * as React from 'react';

import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-2xl border border-black/10 bg-white/80 px-3 py-2 text-sm text-[var(--text)] shadow-sm transition file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:[--tw-ring-color:var(--ring)] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:bg-white/[0.05] dark:text-white',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
