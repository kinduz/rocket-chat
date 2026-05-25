import type { ChatListItem } from '@app/shared/api';
import { create } from 'zustand';

type SelectedChatState = {
  selected: ChatListItem | null;
  select: (chat: ChatListItem) => void;
  clear: () => void;
};

export const useSelectedChat = create<SelectedChatState>((set) => ({
  selected: null,
  select: (chat) => set({ selected: chat }),
  clear: () => set({ selected: null }),
}));
