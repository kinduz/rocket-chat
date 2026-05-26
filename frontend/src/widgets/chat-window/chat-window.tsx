'use client';

import { getChatDisplayName } from '@app/entities/chat';
import { MessageList } from '@app/entities/message';
import { useSelectedChat } from '@app/features/chat-selection';
import { MessageComposer, useSendMessage } from '@app/features/send-message';
import { useChats, useMessages } from '@app/shared';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ChatHeader } from './chat-header';

export const ChatWindow = () => {
  const { t } = useTranslation();
  const selected = useSelectedChat((s) => s.selected);
  const select = useSelectedChat((s) => s.select);
  const { data: chats } = useChats();

  const chatId = selected?.kind === 'chat' ? selected.id : null;
  const { data: messages, isPending } = useMessages(chatId);
  const sendMessage = useSendMessage();

  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesCount = messages?.length ?? 0;
  const selectedId = selected?.id;

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll to bottom when messages arrive or chat switches
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messagesCount, selectedId]);

  if (!selected) {
    return (
      <div className="text-muted-foreground flex h-full w-full items-center justify-center text-sm">
        {t('home.noChatSelected')}
      </div>
    );
  }

  const index = chats?.findIndex((c) => c.id === selected.id) ?? 0;
  const title = getChatDisplayName(selected, index, t);

  const handleSend = async (text: string) => {
    if (selected.kind === 'chat') {
      await sendMessage.mutateAsync({
        kind: 'chat',
        chatId: selected.id,
        text,
      });
      return;
    }
    const { chatId: newChatId } = await sendMessage.mutateAsync({
      kind: 'user',
      userId: selected.id,
      text,
    });
    select({
      kind: 'chat',
      id: newChatId,
      name: selected.name,
      firstName: selected.firstName,
      lastName: selected.lastName,
      avatarUrl: selected.avatarUrl,
      phone: null,
      lastMessage: { text, at: new Date().toISOString(), fromMe: true },
    });
  };

  const hasMessages = !!messages && messages.length > 0;
  const showEmptyMessages =
    !isPending && selected.kind === 'chat' && !hasMessages;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <ChatHeader
        title={title}
        avatarUrl={selected.avatarUrl}
        avatarName={selected.name}
      />

      <div
        ref={scrollRef}
        className="relative flex-1 overflow-y-auto bg-[#1a1a1d]"
      >
        {selected.kind === 'chat' && hasMessages && (
          <MessageList messages={messages} />
        )}
        {showEmptyMessages && (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm">
            {t('chat.empty')}
          </div>
        )}
        {selected.kind === 'user' && (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm">
            {t('chat.startNew')}
          </div>
        )}
      </div>

      <MessageComposer
        disabled={sendMessage.isPending}
        onSend={handleSend}
      />
    </div>
  );
};
