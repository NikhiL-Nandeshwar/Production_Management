'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { clearAuthSession, useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { LoadingSkeleton } from './common/states';
import { hasUsableAccessToken } from '@/lib/api/client';
export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, refetchOnWindowFocus: false },
        },
      }),
  );
  const [ready, setReady] = useState(false);
  useEffect(() => {
    Promise.all([
      useAuthStore.persist.rehydrate(),
      useUIStore.persist.rehydrate(),
    ])
      .then(() => {
        if (!hasUsableAccessToken(useAuthStore.getState().session))
          clearAuthSession();
      })
      .finally(() => setReady(true));
    return useAuthStore.subscribe((next, previous) => {
      if (
        next.session?.userId !== previous.session?.userId ||
        next.session?.companyId !== previous.session?.companyId
      )
        client.clear();
    });
  }, [client]);
  return (
    <QueryClientProvider client={client}>
      {ready ? children : <LoadingSkeleton />}
      <Toaster richColors position="top-right" closeButton />
    </QueryClientProvider>
  );
}
