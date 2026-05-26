'use client';

import { useLogout } from '@app/features/auth/hooks/use-logout';
import { useAppStore } from '@app/shared';
import {
  Avatar,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@app/shared/ui';
import { LogOut, MoreHorizontal, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ProfileHeader = () => {
  const { t } = useTranslation();
  const profile = useAppStore((state) => state.profile);
  const logout = useLogout();

  if (!profile) {
    return (
      <div className="flex items-center gap-3 px-3 py-3 sidebar-compact:justify-center border-b-2 border-white/5">
        <div
          className="shrink-0 rounded-full bg-white/5 animate-pulse"
          style={{ width: 44, height: 44 }}
        />
        <div className="sidebar-compact:hidden flex min-w-0 flex-1 items-center justify-between gap-2 rounded-2xl bg-[#2c2c30] px-4 py-2">
          <div className="h-4 w-28 rounded bg-white/10 animate-pulse" />
          <div className="size-5 rounded bg-white/5 animate-pulse" />
        </div>
      </div>
    );
  }

  const fullName = [profile.firstName, profile.lastName]
    .map((p) => p?.trim())
    .filter(Boolean)
    .join(' ');
  const displayName =
    fullName || profile.username?.trim() || t('home.myProfile');

  return (
    <div className="flex items-center gap-3 px-3 py-3 sidebar-compact:justify-center border-b-2 border-white/5">
      <Avatar
        src={profile.avatarUrl}
        name={profile.username}
        fallback={t('home.myProfile')}
        sizePx={44}
        className="shrink-0 cursor-pointer"
      />

      <div className="sidebar-compact:hidden flex min-w-0 flex-1 items-center justify-between gap-2 rounded-2xl bg-[#2c2c30] px-4 py-2">
        <span className="min-w-0 flex-1 truncate font-semibold">
          {displayName}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={t('home.chatActions')}
              className="text-muted-foreground hover:text-foreground shrink-0 cursor-pointer rounded-full p-1.5 transition-colors outline-none focus-visible:text-foreground"
            >
              <MoreHorizontal className="size-5" aria-hidden />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => {}}>
              <Settings aria-hidden />
              <span>{t('home.settings')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={logout}>
              <LogOut aria-hidden />
              <span>{t('home.logout')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
