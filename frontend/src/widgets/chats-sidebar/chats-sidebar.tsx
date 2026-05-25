'use client';

import { ChatList } from '@app/entities/chat';
import { useSelectedChat } from '@app/features/chat-selection';
import { useChats } from '@app/shared';
import { useTranslation } from 'react-i18next';
import { ProfileHeader } from './profile-header';

export const ChatsSidebar = () => {
  const { data: chats } = useChats();
  const selected = useSelectedChat((s) => s.selected);
  const select = useSelectedChat((s) => s.select);

  const { t } = useTranslation();

  return (
    <aside className="@container/sidebar flex h-full w-full flex-col overflow-hidden">
      <ProfileHeader />
      <div className="flex-1 overflow-y-auto mt-4">
        <div className="items-start gap-1 flex flex-col">
          <span className="sidebar-compact:hidden font-bold text-l ml-6">
            {t('home.yourChats')}
          </span>
          <ChatList
            chats={chats ?? []}
            selectedId={selected?.id ?? null}
            onSelect={select}
          />
        </div>
      </div>
    </aside>
  );
};
