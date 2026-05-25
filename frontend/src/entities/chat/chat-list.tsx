'use client';

import type { ChatListItem as ChatListItemType } from '@app/shared/api';
import { ChatListItem } from './chat-list-item';

type ChatListProps = {
  chats: ChatListItemType[];
  selectedId?: string | null;
  onSelect?: (chat: ChatListItemType) => void;
};

export const ChatList = ({ chats, selectedId, onSelect }: ChatListProps) => {
  return (
    <ul className="flex flex-col gap-1 px-2 py-2 w-full">
      {chats.map((chat, index) => (
        <li key={chat.id}>
          <ChatListItem
            chat={chat}
            index={index}
            selected={selectedId === chat.id}
            onSelect={onSelect}
          />
        </li>
      ))}
    </ul>
  );
};
