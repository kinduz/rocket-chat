'use client';

import { create } from 'zustand';

type TypingState = {
  // chatId → expiresAt (epoch ms)
  byChat: Record<string, number>;
  setTyping: (chatId: string, ttlMs?: number) => void;
  clearTyping: (chatId: string) => void;
  clearExpired: () => void;
  isTyping: (chatId: string) => boolean;
};

const DEFAULT_TTL_MS = 4000;

export const useTypingStore = create<TypingState>((set, get) => ({
  byChat: {},
  setTyping: (chatId, ttlMs = DEFAULT_TTL_MS) =>
    set((s) => ({
      byChat: { ...s.byChat, [chatId]: Date.now() + ttlMs },
    })),
  clearTyping: (chatId) =>
    set((s) => {
      if (!(chatId in s.byChat)) return s;
      const next = { ...s.byChat };
      delete next[chatId];
      return { byChat: next };
    }),
  clearExpired: () => {
    const now = Date.now();
    const next: Record<string, number> = {};
    let changed = false;
    for (const [chatId, expiresAt] of Object.entries(get().byChat)) {
      if (expiresAt > now) {
        next[chatId] = expiresAt;
      } else {
        changed = true;
      }
    }
    if (changed) set({ byChat: next });
  },
  isTyping: (chatId) => {
    const expires = get().byChat[chatId];
    return !!expires && expires > Date.now();
  },
}));

if (typeof window !== 'undefined') {
  setInterval(() => useTypingStore.getState().clearExpired(), 1000);
}
