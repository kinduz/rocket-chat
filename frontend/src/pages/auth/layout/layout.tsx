import type { ReactNode } from "react";

export function AuthLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
