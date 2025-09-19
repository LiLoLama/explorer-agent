'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:[--tw-ring-color:var(--ring)] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'aiti-gradient text-white shadow-soft backdrop-blur-md transition-shadow hover:shadow-[0_28px_60px_-32px_rgba(10,132,255,0.65)] focus-visible:[--tw-ring-color:rgba(10,132,255,0.45)]',
        secondary:
          'glass-button text-[var(--text)]/80 shadow-soft hover:text-[var(--text)] dark:text-white/80 dark:hover:text-white',
        outline:
          'border border-white/60 bg-white/10 px-5 text-[var(--text)]/80 shadow-soft backdrop-blur-md hover:bg-white/30 hover:text-[var(--text)] focus-visible:[--tw-ring-color:rgba(10,132,255,0.35)] dark:border-white/15 dark:bg-white/[0.04] dark:text-white/80 dark:hover:bg-white/[0.1] dark:hover:text-white',
        ghost:
          'text-[var(--text)]/70 hover:bg-white/40 hover:text-[var(--text)] dark:text-white/70 dark:hover:bg-white/[0.08] dark:hover:text-white',
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
