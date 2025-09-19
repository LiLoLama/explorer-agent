'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:[--tw-ring-color:var(--ring)] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'aiti-gradient text-white shadow-soft hover:opacity-95',
        secondary:
          'surface border border-black/10 text-[var(--text)]/80 shadow-soft hover:border-black/20 hover:text-[var(--text)] dark:border-white/10 dark:hover:border-white/20 dark:text-white/80',
        outline:
          'border border-black/10 bg-transparent text-[var(--text)]/80 shadow-sm hover:border-black/20 hover:bg-black/5 hover:text-[var(--text)] dark:border-white/20 dark:bg-transparent dark:text-white/80 dark:hover:bg-white/[0.08] dark:hover:text-white',
        ghost:
          'text-[var(--text)]/70 hover:bg-black/5 hover:text-[var(--text)] dark:text-white/70 dark:hover:bg-white/[0.08] dark:hover:text-white',
        destructive:
          'bg-accent-red text-white shadow-soft hover:brightness-110 focus-visible:[--tw-ring-color:rgba(255,69,58,0.6)]',
        link: 'text-[var(--text)] underline-offset-4 hover:underline dark:text-white',
      },
      size: {
        default: 'h-11 px-5',
        sm: 'h-9 px-4 text-sm',
        lg: 'h-12 px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
