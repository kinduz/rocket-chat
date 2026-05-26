'use client';

import { cn } from '@app/shared/lib/utils';
import { Paperclip, Plus, Send, SmilePlus } from 'lucide-react';
import {
  type KeyboardEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import sendSoundUrl from '../assets/send.mp3';

const COMPOSER_MAX_HEIGHT_PX = 320;

type MessageComposerProps = {
  disabled?: boolean;
  onSend: (text: string) => void | Promise<void>;
};

export const MessageComposer = ({ disabled, onSend }: MessageComposerProps) => {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(sendSoundUrl);
    audio.preload = 'auto';
    sendAudioRef.current = audio;
    return () => {
      sendAudioRef.current = null;
    };
  }, []);

  const canSend = !disabled && text.trim().length > 0;

  // biome-ignore lint/correctness/useExhaustiveDependencies: recalculate height whenever text changes
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const next = Math.min(el.scrollHeight, COMPOSER_MAX_HEIGHT_PX);
    el.style.height = `${next}px`;
    el.style.overflowY =
      el.scrollHeight > COMPOSER_MAX_HEIGHT_PX ? 'auto' : 'hidden';
  }, [text]);

  const submit = async () => {
    if (!canSend) return;
    const value = text.trim();
    setText('');
    const audio = sendAudioRef.current;
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => undefined);
    }
    await onSend(value);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex items-end gap-2 px-3 py-3">
      <ComposerIconButton
        ariaLabel={t('chat.composer.attachMenu')}
        onClick={() => {}}
      >
        <Plus className="size-5" aria-hidden />
      </ComposerIconButton>

      <ComposerIconButton
        ariaLabel={t('chat.composer.emoji')}
        onClick={() => {}}
      >
        <SmilePlus className="size-5" aria-hidden />
      </ComposerIconButton>

      <div className="flex min-w-0 flex-1 rounded-2xl bg-[#2c2c30] px-3 py-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('chat.composer.placeholder')}
          aria-label={t('chat.composer.placeholder')}
          rows={1}
          disabled={disabled}
          autoFocus
          className="block w-full resize-none bg-transparent text-sm leading-snug text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />
      </div>

      <ComposerIconButton
        ariaLabel={t('chat.composer.attachFile')}
        onClick={() => {}}
      >
        <Paperclip className="size-5" aria-hidden />
      </ComposerIconButton>

      <button
        type="button"
        disabled={!canSend}
        onClick={submit}
        aria-label={t('chat.composer.send')}
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-full transition-colors',
          canSend
            ? 'bg-[#2683ff] text-white hover:bg-[#1f6fd9] cursor-pointer'
            : 'bg-[#2c2c30] text-muted-foreground cursor-not-allowed',
        )}
      >
        <Send className="size-5" aria-hidden />
      </button>
    </div>
  );
};

type ComposerIconButtonProps = {
  ariaLabel: string;
  onClick: () => void;
  children: React.ReactNode;
};

const ComposerIconButton = ({
  ariaLabel,
  onClick,
  children,
}: ComposerIconButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={ariaLabel}
    className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer"
  >
    {children}
  </button>
);
