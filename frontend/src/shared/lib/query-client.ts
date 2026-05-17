import { fetchChats } from '@app/shared/hooks/use-chats';
import { QueryClient } from '@tanstack/react-query';

export const makeQueryClient = () => {
  const qc = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });

  qc.setQueryDefaults(['chats', 'list'], {
    queryFn: ({ queryKey }) => {
      const q = (queryKey[2] as string | undefined) || undefined;
      return fetchChats(q);
    },
  });

  return qc;
};
