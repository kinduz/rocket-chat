'use client';

import { type ChatMessage, rcClient } from '@app/shared/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const messagesKeys = {
  all: ['messages'] as const,
  list: (chatId: string) => ['messages', 'list', chatId] as const,
};

export const fetchMessages = async (chatId: string): Promise<ChatMessage[]> => {
  const res = await rcClient.chats.listMessages(chatId);
  if (res.error) {
    throw new Error(res.message ?? res.error);
  }
  return res;
};

export function useMessages(chatId?: string | null) {
  return useQuery({
    enabled: !!chatId,
    queryKey: messagesKeys.list(chatId ?? ''),
    queryFn: () => fetchMessages(chatId as string),
  });
}

export function useInvalidateMessages() {
  const qc = useQueryClient();
  return (chatId?: string) =>
    qc.invalidateQueries({
      queryKey: chatId ? messagesKeys.list(chatId) : messagesKeys.all,
    });
}
