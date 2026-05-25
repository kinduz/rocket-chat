'use client';

import { getChatDisplayName } from '@app/entities/chat';
import { useSelectedChat } from '@app/features/chat-selection';
import { useChats } from '@app/shared';
import { useTranslation } from 'react-i18next';

export const ChatWindow = () => {
  const { t } = useTranslation();
  const selected = useSelectedChat((s) => s.selected);
  const { data: chats } = useChats();

  if (!selected) {
    return (
      <div className="text-muted-foreground flex h-full w-full items-center justify-center text-sm">
        {t('home.noChatSelected')}
      </div>
    );
  }

  const index = chats?.findIndex((c) => c.id === selected.id) ?? 0;
  const title = getChatDisplayName(selected, index, t);

  return (
    <div className="flex h-full w-full items-center justify-center">
      <span className="text-foreground text-lg font-semibold">{title}</span>
    </div>
  );
};
