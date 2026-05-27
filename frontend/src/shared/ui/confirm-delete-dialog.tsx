'use client';

import { cn } from '@app/shared/lib/utils';
import * as Checkbox from '@radix-ui/react-checkbox';
import * as Dialog from '@radix-ui/react-dialog';
import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

type ConfirmDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  onConfirm: (forEveryone: boolean) => void | Promise<void>;
  canDeleteForEveryone?: boolean;
  kind?: 'message' | 'chat';
};

export const ConfirmDeleteDialog = ({
  open,
  onOpenChange,
  count,
  onConfirm,
  canDeleteForEveryone = true,
  kind = 'message',
}: ConfirmDeleteDialogProps) => {
  const { t } = useTranslation();
  const [forEveryone, setForEveryone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForEveryone(false);
      setSubmitting(false);
    }
  }, [open]);

  const title =
    kind === 'chat'
      ? t('chat.delete.chatTitle')
      : count > 1
        ? t('chat.delete.titleMany')
        : t('chat.delete.title');
  const message =
    kind === 'chat'
      ? t('chat.delete.chatConfirm')
      : count > 1
        ? t('chat.delete.confirmMany', { count })
        : t('chat.delete.confirm');

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onConfirm(forEveryone);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[#1f1f23] p-5 shadow-xl outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
          <Dialog.Title className="text-base font-semibold text-foreground">
            {title}
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground">
            {message}
          </Dialog.Description>

          {canDeleteForEveryone && (
            <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <Checkbox.Root
                checked={forEveryone}
                onCheckedChange={(v) => setForEveryone(v === true)}
                className={cn(
                  'flex size-4 items-center justify-center rounded border border-white/20 bg-transparent data-[state=checked]:border-[#2683ff] data-[state=checked]:bg-[#2683ff]',
                )}
              >
                <Checkbox.Indicator>
                  <Check className="size-3 text-white" aria-hidden />
                </Checkbox.Indicator>
              </Checkbox.Root>
              {t('chat.delete.forEveryone')}
            </label>
          )}

          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close asChild>
              <button
                type="button"
                disabled={submitting}
                className="rounded-md px-3 py-1.5 text-sm text-foreground hover:bg-white/5 cursor-pointer disabled:cursor-not-allowed"
              >
                {t('chat.delete.cancel')}
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting}
              className="rounded-md bg-red-500/90 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500 cursor-pointer disabled:cursor-not-allowed"
            >
              {t('chat.delete.submit')}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
