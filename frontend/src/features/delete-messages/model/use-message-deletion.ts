'use client';

import { createContext, useContext } from 'react';

export type DeletionKind = 'message' | 'chat';

export type DeletionRequest = {
  chatId: string;
  /** Omit / empty to target the whole chat (must use kind='chat'). */
  messageIds?: string[];
  canDeleteForEveryone?: boolean;
  kind?: DeletionKind;
};

export type MessageDeletionContextValue = {
  requestDelete: (req: DeletionRequest) => void;
};

export const MessageDeletionContext =
  createContext<MessageDeletionContextValue | null>(null);

export const useMessageDeletion = (): MessageDeletionContextValue => {
  const ctx = useContext(MessageDeletionContext);
  if (!ctx) {
    throw new Error(
      'useMessageDeletion must be used within MessageDeletionProvider',
    );
  }
  return ctx;
};
