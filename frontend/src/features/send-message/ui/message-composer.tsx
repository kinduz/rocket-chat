'use client';

import { cn } from '@app/shared/lib/utils';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { Paperclip, Plus, Send, SmilePlus, X } from 'lucide-react';
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
  onTyping?: () => void;
  editingText?: string;
  onSubmitEdit?: (text: string) => void | Promise<void>;
  onCancelEdit?: () => void;
};

export const MessageComposer = ({
  disabled,
  onSend,
  onTyping,
  editingText,
  onSubmitEdit,
  onCancelEdit,
}: MessageComposerProps) => {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendAudioRef = useRef<HTMLAudioElement | null>(null);
  const isEditing = editingText !== undefined;

  const [isEmojiPickerOpen, setEmojiPickerOpen] = useState(false);

  useEffect(() => {
    if (editingText !== undefined) {
      setText(editingText);
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (el) {
          el.focus();
          const len = el.value.length;
          el.setSelectionRange(len, len);
        }
      });
    }
  }, [editingText]);

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
    if (isEditing) {
      await onSubmitEdit?.(value);
    } else {
      const audio = sendAudioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => undefined);
      }
      await onSend(value);
    }
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape' && isEditing) {
      e.preventDefault();
      setText('');
      onCancelEdit?.();
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handleCancel = () => {
    setText('');
    onCancelEdit?.();
  };

  return (
    <div className="flex flex-col gap-1 px-3 py-3">
      {isEditing && (
        <div className="flex items-center justify-between rounded-md bg-white/5 px-3 py-1.5 text-xs text-muted-foreground">
          <span className="truncate">Editing message — Esc to cancel</span>
          <button
            type="button"
            onClick={handleCancel}
            aria-label="Cancel edit"
            className="flex size-5 items-center justify-center rounded-full hover:bg-white/10 hover:text-foreground cursor-pointer"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <ComposerIconButton
          ariaLabel={t('chat.composer.attachMenu')}
          onClick={() => {}}
        >
          <Plus className="size-5" aria-hidden />
        </ComposerIconButton>
        <div className="relative">
          <ComposerIconButton
            ariaLabel={t('chat.composer.emoji')}
            onClick={() => setEmojiPickerOpen(!isEmojiPickerOpen)}
          >
            <SmilePlus className="size-5" aria-hidden />
          </ComposerIconButton>
          {isEmojiPickerOpen && (
            <div className="absolute bottom-full left-0 mb-2">
              <EmojiPicker
                lazyLoadEmojis
                skinTonesDisabled
                theme={Theme.DARK}
                onEmojiClick={(emoji) => {
                  setText((prev) => prev + emoji.emoji);
                  onTyping?.();
                }}
              />
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 rounded-2xl bg-[#2c2c30] px-3 py-2">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (!isEditing && e.target.value.trim()) onTyping?.();
            }}
            onKeyDown={handleKeyDown}
            placeholder={t('chat.composer.placeholder')}
            aria-label={t('chat.composer.placeholder')}
            rows={1}
            disabled={disabled}
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
