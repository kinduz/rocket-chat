'use client';

import { Avatar } from '@app/shared/ui';
import { Search, SquareSplitHorizontal, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type ChatHeaderProps = {
  title: string;
  avatarUrl: string | null;
  avatarName?: string | null;
  unreadCount?: number;
  typing?: boolean;
  selectedCount?: number;
  onClearSelection?: () => void;
  onDeleteSelected?: () => void;
};

export const ChatHeader = ({
  title,
  avatarUrl,
  avatarName,
  unreadCount = 0,
  typing,
  selectedCount = 0,
  onClearSelection,
  onDeleteSelected,
}: ChatHeaderProps) => {
  const { t } = useTranslation();
  const inSelection = selectedCount > 0;

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
        {(typing || unreadCount > 0) && (
          <div className="truncate text-xs text-muted-foreground">
            {typing
              ? t('chat.typing')
              : `${unreadCount} unread ${unreadCount === 1 ? 'message' : 'messages'}`}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        {inSelection ? (
          <>
            <button
              type="button"
              onClick={onClearSelection}
              aria-label={t('chat.selection.cancel')}
              className="flex h-9 items-center gap-1.5 rounded-full px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="size-4" aria-hidden />
              {t('chat.selection.cancel')}
            </button>
            <button
              type="button"
              onClick={onDeleteSelected}
              aria-label={t('chat.selection.deleteSelected')}
              className="flex h-9 items-center gap-1.5 rounded-full bg-red-500/15 px-3 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/25 cursor-pointer"
            >
              <Trash2 className="size-4" aria-hidden />
              {t('chat.selection.deleteCount', { count: selectedCount })}
            </button>
          </>
        ) : (
          <>
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
              <SquareSplitHorizontal className="size-5" aria-hidden />
            </button>
          </>
        )}
      </div>
    </header>
  );
};
