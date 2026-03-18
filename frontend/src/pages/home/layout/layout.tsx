import type { ReactNode } from 'react';

export function HomeLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex items-center justify-center">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
