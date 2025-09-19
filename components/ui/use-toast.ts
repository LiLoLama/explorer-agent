'use client';

import * as React from 'react';
import type { ToastProps } from '@radix-ui/react-toast';

export type Toast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
};

const listeners = new Set<(toast: Toast) => void>();

const createId = () => {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export function useToast() {
  return React.useMemo(
    () => ({
      toast: (toast: Omit<Toast, 'id'>) => {
        const id = createId();
        const payload: Toast = { ...toast, id };
        listeners.forEach((listener) => listener(payload));
        return id;
      },
    }),
    [],
  );
}

export function useToastListener(callback: (toast: Toast) => void) {
  React.useEffect(() => {
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  }, [callback]);
}
