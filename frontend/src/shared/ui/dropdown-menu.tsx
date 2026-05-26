'use client';

import { cn } from '@app/shared/lib/utils';
import { DropdownMenu as RDropdownMenu } from 'radix-ui';
import type * as React from 'react';

const DropdownMenu = RDropdownMenu.Root;
const DropdownMenuTrigger = RDropdownMenu.Trigger;
const DropdownMenuPortal = RDropdownMenu.Portal;
const DropdownMenuGroup = RDropdownMenu.Group;
const DropdownMenuSeparator = ({
  className,
  ...props
}: React.ComponentProps<typeof RDropdownMenu.Separator>) => (
  <RDropdownMenu.Separator
    className={cn('-mx-1 my-1 h-px bg-white/5', className)}
    {...props}
  />
);

type DropdownMenuContentProps = React.ComponentProps<
  typeof RDropdownMenu.Content
>;

const DropdownMenuContent = ({
  className,
  sideOffset = 6,
  align = 'end',
  ...props
}: DropdownMenuContentProps) => (
  <RDropdownMenu.Portal>
    <RDropdownMenu.Content
      sideOffset={sideOffset}
      align={align}
      className={cn(
        'z-50 min-w-[200px] overflow-hidden rounded-xl border border-white/5 bg-[#2c2c30] p-1 shadow-lg',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        className,
      )}
      {...props}
    />
  </RDropdownMenu.Portal>
);

type DropdownMenuItemProps = React.ComponentProps<typeof RDropdownMenu.Item> & {
  variant?: 'default' | 'destructive';
};

const DropdownMenuItem = ({
  className,
  variant = 'default',
  ...props
}: DropdownMenuItemProps) => (
  <RDropdownMenu.Item
    data-variant={variant}
    className={cn(
      'group/menu-item relative flex w-full cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none transition-colors',
      'focus:bg-white/5 data-[highlighted]:bg-white/5',
      'data-disabled:pointer-events-none data-disabled:opacity-50',
      '[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground',
      variant === 'destructive' &&
        'text-destructive focus:bg-destructive/10 data-[highlighted]:bg-destructive/10 [&_svg]:text-destructive',
      className,
    )}
    {...props}
  />
);

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
};
