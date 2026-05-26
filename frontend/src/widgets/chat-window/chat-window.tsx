'use client';

import { getChatDisplayName } from '@app/entities/chat';
import { MessageList } from '@app/entities/message';
import { useSelectedChat } from '@app/features/chat-selection';
import { MessageComposer, useSendMessage } from '@app/features/send-message';
import {
  type ChatMessage,
  chatsKeys,
  rcClient,
  useChats,
  useMessages,
} from '@app/shared';
import { useChatSocket, useTypingStore } from '@app/shared/realtime';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ChatHeader } from './chat-header';

export const ChatWindow = () => {
  const { t } = useTranslation();
  const selected = useSelectedChat((s) => s.selected);
  const select = useSelectedChat((s) => s.select);
  const { data: chats } = useChats();
  const queryClient = useQueryClient();
  const { joinChat, leaveChat, emitTyping } = useChatSocket();

  const selectedFromList =
    selected?.kind === 'chat'
      ? chats?.find((chat) => chat.kind === 'chat' && chat.id === selected.id)
      : undefined;
  const activeSelected = selectedFromList ?? selected;
  const chatId = activeSelected?.kind === 'chat' ? activeSelected.id : null;
  const { data: messages, isPending } = useMessages(chatId);
  const sendMessage = useSendMessage();
  const typingExpiresAt = useTypingStore((s) =>
    chatId ? s.byChat[chatId] : undefined,
  );
  const typing = !!typingExpiresAt && typingExpiresAt > Date.now();

  const scrollRef = useRef<HTMLDivElement>(null);
  const markedReadRef = useRef<Set<string>>(new Set());
  const messagesCount = messages?.length ?? 0;
  const selectedId = activeSelected?.id;

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll to bottom when messages arrive or chat switches
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messagesCount, selectedId, typing]);

  useEffect(() => {
    markedReadRef.current.clear();
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;
    joinChat(chatId);
    return () => leaveChat(chatId);
  }, [chatId, joinChat, leaveChat]);

  const handleMessageVisible = useCallback(
    (message: ChatMessage) => {
      if (!chatId || message.fromMe || markedReadRef.current.has(message.id)) {
        return;
      }

      markedReadRef.current.add(message.id);
      void rcClient.chats.markRead(chatId, message.id).then((res) => {
        if (!res.error) {
          queryClient.invalidateQueries({ queryKey: chatsKeys.all });
        }
      });
    },
    [chatId, queryClient],
  );

  if (!activeSelected) {
    return (
      <div className="text-muted-foreground flex h-full w-full items-center justify-center text-sm">
        {t('home.noChatSelected')}
      </div>
    );
  }

  const index = chats?.findIndex((c) => c.id === activeSelected.id) ?? 0;
  const title = getChatDisplayName(activeSelected, index, t);

  const handleSend = async (text: string) => {
    if (activeSelected.kind === 'chat') {
      await sendMessage.mutateAsync({
        kind: 'chat',
        chatId: activeSelected.id,
        text,
      });
      return;
    }
    const { chatId: newChatId } = await sendMessage.mutateAsync({
      kind: 'user',
      userId: activeSelected.id,
      text,
    });
    select({
      kind: 'chat',
      id: newChatId,
      name: activeSelected.name,
      firstName: activeSelected.firstName,
      lastName: activeSelected.lastName,
      avatarUrl: activeSelected.avatarUrl,
      phone: null,
      unreadCount: 0,
      lastMessage: {
        text,
        at: new Date().toISOString(),
        fromMe: true,
        delivered: false,
        read: false,
      },
    });
  };

  const hasMessages = !!messages && messages.length > 0;
  const showEmptyMessages =
    !isPending && activeSelected.kind === 'chat' && !hasMessages && !typing;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <ChatHeader
        title={title}
        avatarUrl={activeSelected.avatarUrl}
        avatarName={activeSelected.name}
        unreadCount={
          activeSelected.kind === 'chat' ? activeSelected.unreadCount : 0
        }
        typing={typing}
      />

      <div
        ref={scrollRef}
        className="relative flex-1 overflow-y-auto bg-[#1a1a1d] scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent"
      >
        {activeSelected.kind === 'chat' && (hasMessages || typing) && (
          <MessageList
            messages={messages ?? []}
            onMessageVisible={handleMessageVisible}
            typing={typing}
          />
        )}
        {showEmptyMessages && (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm">
            {t('chat.empty')}
          </div>
        )}
        {activeSelected.kind === 'user' && (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm">
            {t('chat.startNew')}
          </div>
        )}
      </div>

      <MessageComposer
        disabled={sendMessage.isPending}
        onSend={handleSend}
        onTyping={() => {
          if (chatId) emitTyping(chatId);
        }}
      />
    </div>
  );
};
