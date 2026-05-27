'use client';

import { getChatDisplayName } from '@app/entities/chat';
import { MessageList } from '@app/entities/message';
import { useSelectedChat } from '@app/features/chat-selection';
import { useMessageDeletion } from '@app/features/delete-messages';
import { MessageComposer, useSendMessage } from '@app/features/send-message';
import sendSoundUrl from '@app/features/send-message/assets/send.mp3';
import {
  type ChatListItem,
  type ChatMessage,
  chatsKeys,
  rcClient,
  useChats,
  useMessages,
} from '@app/shared';
import { useChatSocket, useTypingStore } from '@app/shared/realtime';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChatHeader } from './chat-header';

export const ChatWindow = () => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { t } = useTranslation();
  const selected = useSelectedChat((s) => s.selected);
  const select = useSelectedChat((s) => s.select);
  const { data: chats } = useChats();
  const queryClient = useQueryClient();
  const { joinChat, leaveChat, emitTyping, resetTypingThrottle } =
    useChatSocket();
  const { requestDelete } = useMessageDeletion();

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
  const lastSentReadAtByChatRef = useRef<Record<string, number>>({});
  const wasAtBottomRef = useRef<boolean>(true);
  const messagesCount = messages?.length ?? 0;
  const selectedId = activeSelected?.id;
  const sendAudioRef = useRef<HTMLAudioElement | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: snap to bottom on chat switch
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    wasAtBottomRef.current = true;
  }, [selectedId]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll to bottom on new message only if we were already there
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (wasAtBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messagesCount]);

  useEffect(() => {
    if (!chatId) return;
    joinChat(chatId);
    return () => leaveChat(chatId);
  }, [chatId, joinChat, leaveChat]);

  const latestIncoming = useMemo(() => {
    if (!messages) return null;
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (!m.fromMe) return m;
    }
    return null;
  }, [messages]);

  useEffect(() => {
    const audio = new Audio(sendSoundUrl);
    audio.preload = 'auto';
    sendAudioRef.current = audio;
    return () => {
      sendAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!chatId || !latestIncoming) return;
    const ts = new Date(latestIncoming.createdAt).getTime();
    const sent = lastSentReadAtByChatRef.current[chatId] ?? 0;
    if (ts <= sent) return;

    const targetChatId = chatId;
    const messageId = latestIncoming.id;
    lastSentReadAtByChatRef.current[targetChatId] = ts;

    void rcClient.chats
      .markRead(targetChatId, messageId)
      .then((res) => {
        if (res.error) {
          if (lastSentReadAtByChatRef.current[targetChatId] === ts) {
            lastSentReadAtByChatRef.current[targetChatId] = sent;
          }
          return;
        }
        queryClient.setQueriesData<ChatListItem[] | undefined>(
          { queryKey: chatsKeys.all },
          (prev) =>
            prev?.map((c) =>
              c.kind === 'chat' && c.id === targetChatId
                ? { ...c, unreadCount: 0 }
                : c,
            ),
        );
      })
      .catch(() => {
        if (lastSentReadAtByChatRef.current[targetChatId] === ts) {
          lastSentReadAtByChatRef.current[targetChatId] = sent;
        }
      });
  }, [chatId, latestIncoming, queryClient]);

  const [editing, setEditing] = useState<{ id: string; text: string } | null>(
    null,
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset editing / selection when switching chats
  useEffect(() => {
    setEditing(null);
    setSelectedIds(new Set());
  }, [chatId]);

  const handleStartEdit = useCallback((message: ChatMessage) => {
    setEditing({ id: message.id, text: message.text });
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditing(null);
  }, []);

  const handleSubmitEdit = useCallback(
    async (text: string) => {
      if (!chatId || !editing) return;
      const value = text.trim();
      if (!value) return;
      if (value === editing.text) {
        setEditing(null);
        return;
      }
      const res = await rcClient.chats.editMessage(chatId, editing.id, value);
      if (res.error) return;
      const audio = sendAudioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => undefined);
      }
      setEditing(null);
    },
    [chatId, editing],
  );

  const selectionActive = selectedIds.size > 0;

  const handleSelect = useCallback((message: ChatMessage) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.add(message.id);
      return next;
    });
  }, []);

  const handleToggleSelection = useCallback((message: ChatMessage) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(message.id)) next.delete(message.id);
      else next.add(message.id);
      return next;
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Prune selection if messages disappear (deletion, chat switch handled separately).
  useEffect(() => {
    if (!messages) return;
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const visible = new Set(messages.map((m) => m.id));
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (visible.has(id)) next.add(id);
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [messages]);

  const isOwn = useCallback(
    (ids: string[]) =>
      ids.every((id) => messages?.find((m) => m.id === id)?.fromMe === true),
    [messages],
  );

  const handleRequestDelete = useCallback(
    (message: ChatMessage) => {
      if (!chatId) return;
      requestDelete({
        chatId,
        messageIds: [message.id],
        canDeleteForEveryone: message.fromMe,
      });
    },
    [chatId, requestDelete],
  );

  const handleRequestDeleteSelected = useCallback(() => {
    if (!chatId || selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    requestDelete({
      chatId,
      messageIds: ids,
      canDeleteForEveryone: isOwn(ids),
    });
  }, [chatId, requestDelete, selectedIds, isOwn]);

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
    if (chatId) resetTypingThrottle(chatId);
    const el = scrollRef.current;
    if (el) {
      wasAtBottomRef.current = true;
      el.scrollTop = el.scrollHeight;
    }
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
        selectedCount={selectedIds.size}
        onClearSelection={handleClearSelection}
        onDeleteSelected={handleRequestDeleteSelected}
      />

      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          const distanceFromBottom =
            el.scrollHeight - el.scrollTop - el.clientHeight;
          wasAtBottomRef.current = distanceFromBottom < 40;
        }}
        className="relative flex-1 overflow-y-auto bg-[#1a1a1d] scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent"
      >
        {activeSelected.kind === 'chat' && (hasMessages || typing) && (
          <MessageList
            messages={messages ?? []}
            typing={typing}
            selectedIds={selectedIds}
            selectionActive={selectionActive}
            onEdit={handleStartEdit}
            onSelect={handleSelect}
            onRequestDelete={handleRequestDelete}
            onToggleSelection={handleToggleSelection}
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
        editingText={editing?.text}
        onSubmitEdit={handleSubmitEdit}
        onCancelEdit={handleCancelEdit}
      />
    </div>
  );
};
