'use client';

import { useAppStore } from '@app/shared';
import { Avatar } from '@app/shared/ui';
import { MoreHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ProfileHeader = () => {
  const { t } = useTranslation();
  const profile = useAppStore((state) => state.profile);
  const displayName = profile?.username?.trim() || t('home.myProfile');

  return (
    <div className="flex items-center gap-3 px-3 py-3 sidebar-compact:justify-center border-b-2 border-white/5">
      <Avatar
        src={profile?.avatarUrl}
        name={profile?.username}
        fallback={t('home.myProfile')}
        sizePx={44}
        className="shrink-0 cursor-pointer"
      />

      <div className="sidebar-compact:hidden flex min-w-0 flex-1 items-center justify-between gap-2 rounded-2xl bg-[#2c2c30] px-4 py-2">
        <span className="min-w-0 flex-1 truncate font-semibold">
          {displayName}
        </span>

        <button
          type="button"
          aria-label={t('home.chatActions')}
          className="text-muted-foreground hover:text-foreground shrink-0 cursor-pointer rounded-full p-1.5 transition-colors"
        >
          <MoreHorizontal className="size-5" aria-hidden />
        </button>
      </div>
    </div>
  );
};
