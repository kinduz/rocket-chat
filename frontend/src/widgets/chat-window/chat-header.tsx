'use client';

import { Avatar } from '@app/shared/ui';
import { Book, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type ChatHeaderProps = {
  title: string;
  avatarUrl: string | null;
  avatarName?: string | null;
};

export const ChatHeader = ({
  title,
  avatarUrl,
  avatarName,
}: ChatHeaderProps) => {
  const { t } = useTranslation();

  return (
    <header className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
      <Avatar
        src={avatarUrl}
        name={avatarName ?? title}
        fallback={title}
        sizePx={40}
        className="shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-foreground">{title}</div>
      </div>
      <div>
        <button
          type="button"
          aria-label={t('chat.actions.search')}
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer"
        >
          <Search className="size-5" aria-hidden />
        </button>
        <button
          type="button"
          aria-label={t('chat.actions.collapse')}
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer"
        >
          <Book className="size-5" aria-hidden />
        </button>
      </div>
    </header>
  );
};
