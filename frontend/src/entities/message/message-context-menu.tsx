'use client';

import * as ContextMenu from '@radix-ui/react-context-menu';
import { CheckSquare, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type MessageContextMenuProps = {
  children: ReactNode;
  onSelect?: () => void;
  onRequestDelete?: () => void;
};

export const MessageContextMenu = ({
  children,
  onSelect,
  onRequestDelete,
}: MessageContextMenuProps) => {
  const { t } = useTranslation();
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content
          className="z-50 min-w-44 overflow-hidden rounded-lg bg-[#1f1f23] p-1 shadow-xl outline-none"
          collisionPadding={8}
        >
          {onSelect && (
            <ContextMenu.Item
              onSelect={onSelect}
              className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm text-foreground outline-none data-highlighted:bg-white/5"
            >
              <CheckSquare className="size-4" aria-hidden />
              {t('chat.message.select')}
            </ContextMenu.Item>
          )}
          {onRequestDelete && (
            <ContextMenu.Item
              onSelect={onRequestDelete}
              className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm text-red-400 outline-none data-highlighted:bg-red-500/10"
            >
              <Trash2 className="size-4" aria-hidden />
              {t('chat.message.delete')}
            </ContextMenu.Item>
          )}
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
};
