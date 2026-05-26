import type { ChatMessage } from '@app/shared/api';

export type MessageDayGroup = {
  dayKey: string;
  date: Date;
  messages: ChatMessage[];
};

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;

export const groupMessagesByDay = (
  messages: ChatMessage[],
): MessageDayGroup[] => {
  const groups: MessageDayGroup[] = [];
  let current: MessageDayGroup | null = null;

  for (const m of messages) {
    const d = new Date(m.createdAt);
    const key = dayKey(d);
    if (!current || current.dayKey !== key) {
      current = {
        dayKey: key,
        date: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
        messages: [],
      };
      groups.push(current);
    }
    current.messages.push(m);
  }

  return groups;
};
