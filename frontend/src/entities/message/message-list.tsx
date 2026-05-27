'use client';

import type { ChatMessage } from '@app/shared/api';
import { useTranslation } from 'react-i18next';
import { DayDivider } from './day-divider';
import { formatDayLabel } from './lib/format-day-label';
import { groupMessagesByDay } from './lib/group-messages-by-day';
import { MessageBubble } from './message-bubble';

type MessageListProps = {
  messages: ChatMessage[];
  onEdit?: (message: ChatMessage) => void;
  onDelete?: (message: ChatMessage) => void;
  typing?: boolean;
};

export const MessageList = ({
  messages,
  onEdit,
  onDelete,
  typing,
}: MessageListProps) => {
  const { t } = useTranslation();
  const groups = groupMessagesByDay(messages);

  return (
    <div className="flex flex-col gap-3 py-4">
      {groups.map((group) => (
        <section key={group.dayKey} className="flex flex-col gap-1.5">
          <DayDivider label={formatDayLabel(group.date, t)} />
          {group.messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </section>
      ))}
      {typing && <TypingBubble />}
    </div>
  );
};

const TypingBubble = () => (
  <div className="flex w-full justify-start px-4">
    <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-[#2c2c30] px-3 py-2">
      <span className="size-1.5 animate-pulse rounded-full bg-[#adaeb1]" />
      <span className="size-1.5 animate-pulse rounded-full bg-[#adaeb1] [animation-delay:150ms]" />
      <span className="size-1.5 animate-pulse rounded-full bg-[#adaeb1] [animation-delay:300ms]" />
    </div>
  </div>
);
