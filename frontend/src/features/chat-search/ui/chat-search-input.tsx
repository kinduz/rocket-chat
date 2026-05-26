'use client';

import { Input, type InputClassNames } from '@app/shared/ui';
import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type ChatSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export const ChatSearchInput = ({ value, onChange }: ChatSearchInputProps) => {
  const { t } = useTranslation();

  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={t('home.searchPlaceholder')}
      aria-label={t('home.searchPlaceholder')}
      classNames={{ container: 'h-10 text-base' }}
      startSlot={<Search aria-hidden />}
      endSlot={
        value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label={t('home.clearSearch')}
            className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors flex items-center"
          >
            <X aria-hidden className="size-4" />
          </button>
        ) : null
      }
    />
  );
};
