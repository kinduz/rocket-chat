import { type ChatListItem, rcClient } from '@app/shared/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const chatsKeys = {
  all: ['chats'] as const,
  list: (q?: string) => ['chats', 'list', q ?? ''] as const,
};

export const fetchChats = async (q?: string): Promise<ChatListItem[]> => {
  const res = await rcClient.chats.getChats(q);
  console.log('res', res);

  if (res.error) {
    throw new Error(res.message ?? res.error);
  }
  return res;
};

export function useChats(q?: string) {
  return useQuery({
    queryKey: chatsKeys.list(q),
    queryFn: () => fetchChats(q),
  });
}

export function useInvalidateChats() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: chatsKeys.all });
}
