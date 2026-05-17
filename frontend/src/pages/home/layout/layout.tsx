import { getRcClient } from '@app/shared/api/server';
import { chatsKeys } from '@app/shared/hooks';
import { makeQueryClient } from '@app/shared/lib/query-client';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import type { ReactNode } from 'react';

export async function HomeLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const qc = makeQueryClient();

  await qc.prefetchQuery({
    queryKey: chatsKeys.list(),
    queryFn: async () => {
      const rc = await getRcClient();
      const res = await rc.chats.getChats();
      if (res.error) throw new Error(res.message ?? res.error);
      return res;
    },
  });

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <div className="h-dvh w-dvw md:p-4">
        <div className="h-full w-full md:bg-main-content-primary overflow-hidden">
          {children}
        </div>
      </div>
    </HydrationBoundary>
  );
}
