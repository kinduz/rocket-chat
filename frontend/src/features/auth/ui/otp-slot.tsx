import { cn } from '@app/shared/lib/utils';
import type { SlotProps } from 'input-otp';

export const OtpSlot = ({ char, isActive, hasFakeCaret }: SlotProps) => (
  <div
    className={cn(
      'relative flex size-14 max-md:size-11 items-center justify-center',
      'rounded-xl border border-[#3A3A3A] bg-[#2A2A2A]',
      'text-xl font-medium text-white',
      'transition-all duration-150',
      isActive && 'border-primary ring-2 ring-primary/30',
    )}
  >
    {char ?? <span className="text-[#555]">—</span>}
    {hasFakeCaret && (
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="h-6 w-px animate-caret-blink bg-white" />
      </span>
    )}
  </div>
);
