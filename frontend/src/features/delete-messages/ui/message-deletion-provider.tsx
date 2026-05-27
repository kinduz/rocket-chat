'use client';

import { type ChatListItem, rcClient } from '@app/shared/api';
import { chatsKeys } from '@app/shared/hooks';
import { ConfirmDeleteDialog } from '@app/shared/ui';
import { useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useCallback, useMemo, useState } from 'react';
import {
  type DeletionKind,
  type DeletionRequest,
  MessageDeletionContext,
  type MessageDeletionContextValue,
} from '../model/use-message-deletion';

type State =
  | (DeletionRequest & { canDeleteForEveryone: boolean; kind: DeletionKind })
  | null;

type MessageDeletionProviderProps = {
  children: ReactNode;
  onAfterDelete?: (deletedIds: string[]) => void;
};

export const MessageDeletionProvider = ({
  children,
  onAfterDelete,
}: MessageDeletionProviderProps) => {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<State>(null);

  const requestDelete = useCallback((req: DeletionRequest) => {
    const kind = req.kind ?? 'message';
    if (kind === 'message' && (!req.messageIds || req.messageIds.length === 0)) {
      return;
    }
    setPending({
      ...req,
      canDeleteForEveryone: req.canDeleteForEveryone ?? false,
      kind,
    });
  }, []);

  const value = useMemo<MessageDeletionContextValue>(
    () => ({ requestDelete }),
    [requestDelete],
  );

  const handleConfirm = useCallback(
    async (forEveryone: boolean) => {
      if (!pending) return;
      const res = await rcClient.chats.deleteMessages({
        chatId: pending.chatId,
        messageIds: pending.messageIds,
        forEveryone,
      });
      if (res.error) return;
      if (pending.kind === 'chat') {
        queryClient.setQueriesData<ChatListItem[] | undefined>(
          { queryKey: chatsKeys.all },
          (prev) =>
            prev?.filter(
              (c) => !(c.kind === 'chat' && c.id === pending.chatId),
            ),
        );
      }
      onAfterDelete?.(pending.messageIds ?? []);
      setPending(null);
    },
    [pending, onAfterDelete, queryClient],
  );

  return (
    <MessageDeletionContext.Provider value={value}>
      {children}
      <ConfirmDeleteDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        count={pending?.messageIds?.length ?? 0}
        canDeleteForEveryone={pending?.canDeleteForEveryone ?? false}
        kind={pending?.kind ?? 'message'}
        onConfirm={handleConfirm}
      />
    </MessageDeletionContext.Provider>
  );
};
