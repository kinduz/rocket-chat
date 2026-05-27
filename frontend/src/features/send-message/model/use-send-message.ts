'use client';

import { rcClient } from '@app/shared/api';
import { messagesKeys } from '@app/shared/hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type SendMessageInput =
  | { kind: 'chat'; chatId: string; text: string }
  | { kind: 'user'; userId: string; text: string };

export type SendMessageResult = { chatId: string };

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SendMessageInput): Promise<SendMessageResult> => {
      if (input.kind === 'chat') {
        const res = await rcClient.chats.sendMessage(input.chatId, input.text);
        if (res.error) throw new Error(res.message ?? res.error);
        return { chatId: res.chatId };
      }
      const res = await rcClient.chats.sendDirectMessage(
        input.userId,
        input.text,
      );
      if (res.error) throw new Error(res.message ?? res.error);
      return { chatId: res.chatId };
    },
    onSuccess: ({ chatId }) => {
      queryClient.invalidateQueries({ queryKey: messagesKeys.list(chatId) });
    },
  });
}
