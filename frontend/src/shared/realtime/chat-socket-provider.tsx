'use client';

import {
  ACCESS_TOKEN_KEY,
  type ChatListItem,
  type ChatMessage,
} from '@app/shared/api';
import { chatsKeys, messagesKeys } from '@app/shared/hooks';
import { useQueryClient } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  type ChatDeletedEvent,
  type ChatDeliveredEvent,
  type ChatReadEvent,
  type ChatSocket,
  type ChatTypingEvent,
  createChatSocket,
  type MessagesDeletedEvent,
  type MessageUpdatedEvent,
  type NewMessageEvent,
} from './socket';
import { useTypingStore } from './typing-store';

type ChatSocketContextValue = {
  socket: ChatSocket | null;
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  emitTyping: (chatId: string) => void;
  resetTypingThrottle: (chatId: string) => void;
};

const ChatSocketContext = createContext<ChatSocketContextValue>({
  socket: null,
  joinChat: () => {},
  leaveChat: () => {},
  emitTyping: () => {},
  resetTypingThrottle: () => {},
});

export const useChatSocket = () => useContext(ChatSocketContext);

type ChatSocketProviderProps = {
  children: ReactNode;
};

const updateChatListOnNewMessage = (
  prev: ChatListItem[] | undefined,
  e: NewMessageEvent,
): ChatListItem[] | undefined => {
  if (!prev) return prev;
  const idx = prev.findIndex((c) => c.kind === 'chat' && c.id === e.chatId);
  if (idx < 0) return prev;
  const chat = prev[idx];
  if (chat.kind !== 'chat') return prev;
  const updated: ChatListItem = {
    ...chat,
    unreadCount: e.message.fromMe ? 0 : chat.unreadCount + 1,
    lastMessage: {
      text: e.message.text,
      at: e.message.createdAt,
      fromMe: e.message.fromMe,
      delivered: e.message.delivered,
      read: e.message.read,
    },
  };
  const next = [updated, ...prev.slice(0, idx), ...prev.slice(idx + 1)];
  return next;
};

export function ChatSocketProvider({ children }: ChatSocketProviderProps) {
  const queryClient = useQueryClient();
  const setTyping = useTypingStore((s) => s.setTyping);
  const clearTyping = useTypingStore((s) => s.clearTyping);
  const [socket, setSocket] = useState<ChatSocket | null>(null);
  const lastTypingEmittedAt = useRef<Record<string, number>>({});

  useEffect(() => {
    const token = Cookies.get(ACCESS_TOKEN_KEY);
    if (!token) return;

    const s = createChatSocket(token);
    setSocket(s);

    s.on('message:new', (e: NewMessageEvent) => {
      queryClient.setQueryData<ChatMessage[] | undefined>(
        messagesKeys.list(e.chatId),
        (prev) => {
          if (!prev) return prev;
          if (prev.some((m) => m.id === e.message.id)) return prev;
          return [...prev, e.message];
        },
      );

      let chatExistedInCache = false;
      queryClient.setQueriesData<ChatListItem[] | undefined>(
        { queryKey: chatsKeys.all },
        (prev) => {
          if (!prev) return prev;
          if (prev.some((c) => c.kind === 'chat' && c.id === e.chatId)) {
            chatExistedInCache = true;
          }
          return updateChatListOnNewMessage(prev, e);
        },
      );
      if (!chatExistedInCache) {
        queryClient.invalidateQueries({ queryKey: chatsKeys.all });
      }

      // Other side's message arrived → they stopped typing.
      if (!e.message.fromMe) {
        clearTyping(e.chatId);
      }
    });

    s.on('chat:delivered', (e: ChatDeliveredEvent) => {
      const deliveredUntil = new Date(e.lastDeliveredAt).getTime();
      queryClient.setQueryData<ChatMessage[] | undefined>(
        messagesKeys.list(e.chatId),
        (prev) => {
          if (!prev) return prev;
          let changed = false;
          const next = prev.map((m) => {
            if (
              m.fromMe &&
              !m.delivered &&
              new Date(m.createdAt).getTime() <= deliveredUntil
            ) {
              changed = true;
              return { ...m, delivered: true };
            }
            return m;
          });
          return changed ? next : prev;
        },
      );
      queryClient.setQueriesData<ChatListItem[] | undefined>(
        { queryKey: chatsKeys.all },
        (prev) =>
          prev?.map((c) => {
            if (
              c.kind === 'chat' &&
              c.id === e.chatId &&
              c.lastMessage?.fromMe &&
              !c.lastMessage.delivered &&
              new Date(c.lastMessage.at).getTime() <= deliveredUntil
            ) {
              return {
                ...c,
                lastMessage: { ...c.lastMessage, delivered: true },
              };
            }
            return c;
          }),
      );
    });

    s.on('chat:read', (e: ChatReadEvent) => {
      const readUntil = new Date(e.lastReadAt).getTime();
      queryClient.setQueryData<ChatMessage[] | undefined>(
        messagesKeys.list(e.chatId),
        (prev) => {
          if (!prev) return prev;
          let changed = false;
          const next = prev.map((m) => {
            if (
              m.fromMe &&
              !m.read &&
              new Date(m.createdAt).getTime() <= readUntil
            ) {
              changed = true;
              return { ...m, delivered: true, read: true };
            }
            return m;
          });
          return changed ? next : prev;
        },
      );
      queryClient.setQueriesData<ChatListItem[] | undefined>(
        { queryKey: chatsKeys.all },
        (prev) =>
          prev?.map((c) => {
            if (
              c.kind === 'chat' &&
              c.id === e.chatId &&
              c.lastMessage?.fromMe &&
              !c.lastMessage.read &&
              new Date(c.lastMessage.at).getTime() <= readUntil
            ) {
              return {
                ...c,
                lastMessage: {
                  ...c.lastMessage,
                  delivered: true,
                  read: true,
                },
              };
            }
            return c;
          }),
      );
    });

    s.on('message:updated', (e: MessageUpdatedEvent) => {
      queryClient.setQueryData<ChatMessage[] | undefined>(
        messagesKeys.list(e.chatId),
        (prev) => {
          if (!prev) return prev;
          let changed = false;
          const next = prev.map((m) => {
            if (m.id === e.message.id) {
              changed = true;
              return e.message;
            }
            return m;
          });
          return changed ? next : prev;
        },
      );
      queryClient.setQueriesData<ChatListItem[] | undefined>(
        { queryKey: chatsKeys.all },
        (prev) =>
          prev?.map((c) => {
            if (
              c.kind === 'chat' &&
              c.id === e.chatId &&
              c.lastMessage &&
              new Date(c.lastMessage.at).getTime() ===
                new Date(e.message.createdAt).getTime()
            ) {
              return {
                ...c,
                lastMessage: { ...c.lastMessage, text: e.message.text },
              };
            }
            return c;
          }),
      );
    });

    s.on('messages:deleted', (e: MessagesDeletedEvent) => {
      const removedIds = new Set(e.messageIds);
      let lastRemoved = false;
      queryClient.setQueryData<ChatMessage[] | undefined>(
        messagesKeys.list(e.chatId),
        (prev) => {
          if (!prev) return prev;
          if (!prev.some((m) => removedIds.has(m.id))) return prev;
          if (removedIds.has(prev[prev.length - 1]?.id)) lastRemoved = true;
          return prev.filter((m) => !removedIds.has(m.id));
        },
      );
      if (lastRemoved || e.unreadDecrement > 0) {
        queryClient.setQueriesData<ChatListItem[] | undefined>(
          { queryKey: chatsKeys.all },
          (prev) => {
            if (!prev) return prev;
            const messages = queryClient.getQueryData<ChatMessage[]>(
              messagesKeys.list(e.chatId),
            );
            const lastMsg = messages?.[messages.length - 1] ?? null;
            return prev.map((c) => {
              if (c.kind !== 'chat' || c.id !== e.chatId) return c;
              const next: ChatListItem = { ...c };
              if (lastRemoved) {
                next.lastMessage = lastMsg
                  ? {
                      text: lastMsg.text,
                      at: lastMsg.createdAt,
                      fromMe: lastMsg.fromMe,
                      delivered: lastMsg.delivered,
                      read: lastMsg.read,
                    }
                  : null;
              }
              if (e.unreadDecrement > 0) {
                next.unreadCount = Math.max(
                  0,
                  next.unreadCount - e.unreadDecrement,
                );
              }
              return next;
            });
          },
        );
      }
    });

    s.on('chat:typing', (e: ChatTypingEvent) => {
      setTyping(e.chatId);
    });

    s.on('chat:deleted', (e: ChatDeletedEvent) => {
      queryClient.removeQueries({ queryKey: messagesKeys.list(e.chatId) });
      queryClient.setQueriesData<ChatListItem[] | undefined>(
        { queryKey: chatsKeys.all },
        (prev) =>
          prev?.filter((c) => !(c.kind === 'chat' && c.id === e.chatId)),
      );
    });

    return () => {
      s.removeAllListeners();
      s.disconnect();
      setSocket(null);
    };
  }, [queryClient, setTyping, clearTyping]);

  const value = useMemo<ChatSocketContextValue>(() => {
    return {
      socket,
      joinChat: (chatId) => socket?.emit('chat:join', { chatId }),
      leaveChat: (chatId) => socket?.emit('chat:leave', { chatId }),
      emitTyping: (chatId) => {
        if (!socket) return;
        const now = Date.now();
        const last = lastTypingEmittedAt.current[chatId] ?? 0;
        if (now - last < 1500) return;
        lastTypingEmittedAt.current[chatId] = now;
        socket.emit('chat:typing', { chatId });
      },
      resetTypingThrottle: (chatId) => {
        lastTypingEmittedAt.current[chatId] = 0;
      },
    };
  }, [socket]);

  return (
    <ChatSocketContext.Provider value={value}>
      {children}
    </ChatSocketContext.Provider>
  );
}
