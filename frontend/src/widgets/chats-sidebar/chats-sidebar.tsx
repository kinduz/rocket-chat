'use client';

import { ChatList, ChatListSkeleton } from '@app/entities/chat';
import { ChatSearchInput, useDebouncedValue } from '@app/features/chat-search';
import { useSelectedChat } from '@app/features/chat-selection';
import { useChats } from '@app/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ProfileHeader } from './profile-header';

const SEARCH_DEBOUNCE_MS = 300;

export const ChatsSidebar = () => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const trimmedQuery = query.trim();
  const debouncedQuery = useDebouncedValue(trimmedQuery, SEARCH_DEBOUNCE_MS);
  const isSearching = trimmedQuery.length > 0;
  const isDebouncing = trimmedQuery !== debouncedQuery;

  const {
    data: chats,
    isFetching,
    isPending,
  } = useChats(debouncedQuery.length > 0 ? debouncedQuery : undefined);

  const selected = useSelectedChat((s) => s.selected);
  const select = useSelectedChat((s) => s.select);

  const showSkeleton = isPending || isDebouncing || (isSearching && isFetching);
  const items = chats ?? [];

  return (
    <aside className="@container/sidebar flex h-full w-full flex-col overflow-hidden">
      <ProfileHeader />

      <div className="sidebar-compact:hidden px-3 pt-3">
        <ChatSearchInput value={query} onChange={setQuery} />
      </div>

      <div className="flex-1 overflow-y-auto mt-4">
        <div className="items-start gap-1 flex flex-col">
          {!isSearching && (
            <span className="sidebar-compact:hidden font-bold text-l ml-6">
              {t('home.yourChats')}
            </span>
          )}

          {showSkeleton ? (
            <ChatListSkeleton />
          ) : items.length === 0 ? (
            <div className="sidebar-compact:hidden text-muted-foreground text-sm px-6 py-2">
              {t('home.nothingFound')}
            </div>
          ) : (
            <ChatList
              chats={items}
              selectedId={selected?.id ?? null}
              onSelect={select}
            />
          )}
        </div>
      </div>
    </aside>
  );
};
