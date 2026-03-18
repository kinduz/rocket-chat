import { cn } from '@app/lib/utils';
import { Tooltip } from 'radix-ui';
import type { ReactNode } from 'react';

type HintProps = {
  content: ReactNode;
  className?: string;
};

export const Hint = ({ content, className }: HintProps) => (
  <Tooltip.Provider delayDuration={200}>
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex size-5 items-center justify-center rounded-full',
            'border border-[#555] text-[#888] text-[11px] leading-none',
            'hover:border-[#aaa] hover:text-[#ccc] transition-colors cursor-default',
            className,
          )}
          aria-label="hint"
        >
          <svg width="10" height="11" viewBox="0 0 10 11" fill="currentColor" aria-hidden="true">
            <text
              x="5"
              y="9.5"
              textAnchor="middle"
              fontSize="11"
              fontFamily="system-ui, sans-serif"
            >?</text>
          </svg>
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="top"
          sideOffset={6}
          className={cn(
            'z-50 max-w-[220px] rounded-lg px-3 py-2',
            'bg-[#2a2a2a] border border-[#3a3a3a]',
            'text-xs text-[#ccc] leading-relaxed',
            'animate-in fade-in-0 zoom-in-95',
          )}
        >
          {content}
          <Tooltip.Arrow className="fill-[#3a3a3a]" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  </Tooltip.Provider>
);
