'use client';

import type { ChatMessage } from '@app/shared/api';
import { io, type Socket } from 'socket.io-client';

export type NewMessageEvent = { chatId: string; message: ChatMessage };
export type ChatReadEvent = {
  chatId: string;
  userId: string;
  lastReadAt: string;
};
export type ChatTypingEvent = { chatId: string; userId: string };

export interface ServerToClientEvents {
  'message:new': (e: NewMessageEvent) => void;
  'chat:read': (e: ChatReadEvent) => void;
  'chat:typing': (e: ChatTypingEvent) => void;
}

export interface ClientToServerEvents {
  'chat:join': (body: { chatId: string }) => void;
  'chat:leave': (body: { chatId: string }) => void;
  'chat:typing': (body: { chatId: string }) => void;
}

export type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

const socketOrigin = (() => {
  try {
    const url = new URL(apiUrl);
    return `${url.protocol}//${url.host}`;
  } catch {
    return 'http://localhost:3001';
  }
})();

export const createChatSocket = (token: string): ChatSocket =>
  io(socketOrigin, {
    path: '/ws',
    transports: ['websocket'],
    auth: { token },
    autoConnect: true,
    reconnection: true,
  });
