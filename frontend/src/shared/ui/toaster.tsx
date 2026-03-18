'use client';

import { Toaster as Sonner } from 'sonner';

export function Toaster() {
  return (
    <Sonner
      position="top-center"
      toastOptions={{
        classNames: {
          toast: 'shadow-lg rounded-lg',
          title: 'text-sm font-medium',
          description: 'text-sm',
          actionButton: 'bg-primary text-primary-foreground',
          cancelButton: 'bg-muted text-muted-foreground',
          error:
            '!bg-red-200 !text-red-600 !border-red-300 dark:!bg-red-950 dark:!text-red-400 dark:!border-none',
          success:
            '!bg-green-50 !text-green-600 !border-green-300 dark:!bg-green-950 dark:!text-green-400 dark:!border-green-800',
          warning:
            '!bg-yellow-50 !text-yellow-600 !border-yellow-300 dark:!bg-yellow-950 dark:!text-yellow-400 dark:!border-yellow-800',
          info: '!bg-blue-50 !text-blue-600 !border-blue-300 dark:!bg-blue-950 dark:!text-blue-400 dark:!border-blue-800',
        },
      }}
    />
  );
}
