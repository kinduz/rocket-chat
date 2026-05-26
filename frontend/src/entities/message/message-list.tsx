'use client';

import type { ChatMessage } from '@app/shared/api';
import { useTranslation } from 'react-i18next';
import { DayDivider } from './day-divider';
import { formatDayLabel } from './lib/format-day-label';
import { groupMessagesByDay } from './lib/group-messages-by-day';
import { MessageBubble } from './message-bubble';

type MessageListProps = {
  messages: ChatMessage[];
};

export const MessageList = ({ messages }: MessageListProps) => {
  const { t } = useTranslation();
  const groups = groupMessagesByDay(messages);

  return (
    <div className="flex flex-col gap-3 py-4">
      {groups.map((group) => (
        <section key={group.dayKey} className="flex flex-col gap-1.5">
          <DayDivider label={formatDayLabel(group.date, t)} />
          {group.messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
        </section>
      ))}
    </div>
  );
};
