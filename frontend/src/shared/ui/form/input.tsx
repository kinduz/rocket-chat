'use client';

import { cn } from '@app/shared/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import type * as React from 'react';

const inputContainerVariants = cva(
  'group/input flex items-center gap-2 rounded-2xl border border-transparent bg-clip-padding transition-colors outline-none has-aria-invalid:border-destructive has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/20 has-disabled:opacity-50 has-disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-[#2c2c30] text-foreground',
        outline: 'border-border bg-background',
        ghost: 'bg-transparent',
      },
      size: {
        sm: 'h-8 px-2.5 text-[0.8rem]',
        default: 'h-10 px-3 text-sm',
        lg: 'h-12 px-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

type InputVariantProps = VariantProps<typeof inputContainerVariants>;

type InputSlot = 'container' | 'input' | 'startSlot' | 'endSlot';

type InputClassNames = Partial<Record<InputSlot, string>>;

type InputProps = Omit<React.ComponentProps<'input'>, 'size'> &
  InputVariantProps & {
    asChild?: boolean;
    startSlot?: React.ReactNode;
    endSlot?: React.ReactNode;
    classNames?: InputClassNames;
  };

function Input({
  className,
  classNames,
  variant = 'default',
  size = 'default',
  asChild = false,
  startSlot,
  endSlot,
  ...props
}: InputProps) {
  const Comp = asChild ? Slot.Root : 'input';

  return (
    <div
      data-slot="input-container"
      data-variant={variant}
      data-size={size}
      className={cn(
        inputContainerVariants({ variant, size }),
        classNames?.container,
      )}
    >
      {startSlot ? (
        <span
          data-slot="input-start"
          className={cn(
            'text-muted-foreground shrink-0 flex items-center [&_svg]:size-4',
            classNames?.startSlot,
          )}
        >
          {startSlot}
        </span>
      ) : null}

      <Comp
        data-slot="input"
        className={cn(
          'min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed',
          classNames?.input,
          className,
        )}
        {...props}
      />

      {endSlot ? (
        <span
          data-slot="input-end"
          className={cn(
            'text-muted-foreground shrink-0 flex items-center [&_svg]:size-4',
            classNames?.endSlot,
          )}
        >
          {endSlot}
        </span>
      ) : null}
    </div>
  );
}

export type { InputClassNames, InputProps };
export { Input, inputContainerVariants };
