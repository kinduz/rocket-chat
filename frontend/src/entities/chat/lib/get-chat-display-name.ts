import type { ChatListItem } from '@app/shared/api';
import type { TFunction } from 'i18next';
import { resolveWellKnownChatKey } from './well-known-chats';

export const getChatDisplayName = (
  chat: Pick<ChatListItem, 'name'>,
  index: number,
  t: TFunction,
): string => {
  const trimmed = chat.name?.trim();
  if (trimmed) {
    const knownKey = resolveWellKnownChatKey(trimmed);
    if (knownKey) return t(knownKey);
    return trimmed;
  }
  return t('home.chatFallbackName', { index: index + 1 });
};
