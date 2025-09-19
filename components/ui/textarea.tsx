import * as React from 'react';

import { cn } from '@/lib/utils';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[140px] w-full rounded-[28px] border border-white/60 bg-white/60 px-4 py-3 text-base text-[var(--text)] shadow-[0_16px_36px_-28px_rgba(15,23,42,0.45)] backdrop-blur-lg transition placeholder:text-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:[--tw-ring-color:rgba(10,132,255,0.35)] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-white/60',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = 'Textarea';

export { Textarea };
