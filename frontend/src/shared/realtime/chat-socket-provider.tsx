'use client';

import { ACCESS_TOKEN_KEY, type ChatMessage } from '@app/shared/api';
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
  type ChatReadEvent,
  type ChatSocket,
  type ChatTypingEvent,
  createChatSocket,
  type NewMessageEvent,
} from './socket';
import { useTypingStore } from './typing-store';

type ChatSocketContextValue = {
  socket: ChatSocket | null;
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  emitTyping: (chatId: string) => void;
};

const ChatSocketContext = createContext<ChatSocketContextValue>({
  socket: null,
  joinChat: () => {},
  leaveChat: () => {},
  emitTyping: () => {},
});

export const useChatSocket = () => useContext(ChatSocketContext);

type ChatSocketProviderProps = {
  children: ReactNode;
};

export function ChatSocketProvider({ children }: ChatSocketProviderProps) {
  const queryClient = useQueryClient();
  const setTyping = useTypingStore((s) => s.setTyping);
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
      queryClient.invalidateQueries({ queryKey: chatsKeys.all });
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
              return { ...m, read: true };
            }
            return m;
          });
          return changed ? next : prev;
        },
      );
    });

    s.on('chat:typing', (e: ChatTypingEvent) => {
      setTyping(e.chatId);
    });

    return () => {
      s.removeAllListeners();
      s.disconnect();
      setSocket(null);
    };
  }, [queryClient, setTyping]);

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
    };
  }, [socket]);

  return (
    <ChatSocketContext.Provider value={value}>
      {children}
    </ChatSocketContext.Provider>
  );
}
