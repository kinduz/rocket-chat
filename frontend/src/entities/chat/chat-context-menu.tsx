'use client';

import * as ContextMenu from '@radix-ui/react-context-menu';
import { Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type ChatContextMenuProps = {
  children: ReactNode;
  onDelete?: () => void;
};

export const ChatContextMenu = ({
  children,
  onDelete,
}: ChatContextMenuProps) => {
  const { t } = useTranslation();
  if (!onDelete) return <>{children}</>;
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content
          className="z-50 min-w-44 overflow-hidden rounded-lg bg-[#1f1f23] p-1 shadow-xl outline-none"
          collisionPadding={8}
        >
          <ContextMenu.Item
            onSelect={onDelete}
            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm text-red-400 outline-none data-highlighted:bg-red-500/10"
          >
            <Trash2 className="size-4" aria-hidden />
            {t('chat.context.deleteChat')}
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
};
