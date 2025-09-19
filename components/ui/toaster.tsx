'use client';

import * as React from 'react';
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from '@/components/ui/toast';
import {
  useToastListener,
  type Toast as ToastData,
} from '@/components/ui/use-toast';

export function Toaster() {
  const [toasts, setToasts] = React.useState<ToastData[]>([]);

  useToastListener((toast) => {
    setToasts((current) => [...current, toast]);
  });

  const handleOpenChange = (id: string, open: boolean) => {
    if (!open) {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }
  };

  return (
    <ToastProvider>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          open
          onOpenChange={(open) => handleOpenChange(toast.id, open)}
        >
          {toast.title ? <ToastTitle>{toast.title}</ToastTitle> : null}
          {toast.description ? (
            <ToastDescription>{toast.description}</ToastDescription>
          ) : null}
          {toast.action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
