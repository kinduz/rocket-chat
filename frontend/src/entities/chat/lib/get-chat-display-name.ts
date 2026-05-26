import type { ChatListItem } from '@app/shared/api';
import type { TFunction } from 'i18next';
import { resolveWellKnownChatKey } from './well-known-chats';

export const getChatDisplayName = (
  chat: Pick<ChatListItem, 'name' | 'firstName' | 'lastName'>,
  index: number,
  t: TFunction,
): string => {
  const fullName = [chat.firstName, chat.lastName]
    .map((p) => p?.trim())
    .filter(Boolean)
    .join(' ');
  if (fullName) return fullName;

  const trimmed = chat.name?.trim();
  if (trimmed) {
    const knownKey = resolveWellKnownChatKey(trimmed);
    if (knownKey) return t(knownKey);
    return trimmed;
  }
  return t('home.chatFallbackName', { index: index + 1 });
};
