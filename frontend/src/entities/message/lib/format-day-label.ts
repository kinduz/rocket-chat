import type { TFunction } from 'i18next';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const formatDayLabel = (date: Date, t: TFunction): string => {
  const today = startOfDay(new Date());
  const diffDays = Math.round(
    (today.getTime() - startOfDay(date).getTime()) / MS_PER_DAY,
  );

  if (diffDays === 0) return t('chat.day.today');
  if (diffDays === 1) return t('chat.day.yesterday');

  const sameYear = date.getFullYear() === today.getFullYear();
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
};
