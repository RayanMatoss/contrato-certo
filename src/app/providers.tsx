"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutos
            gcTime: 10 * 60 * 1000, // 10 minutos (renamed from cacheTime in v5)
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            retry: 1,
            // Ignorar erros de abort (queries canceladas são normais)
            retryOnMount: false,
          },
          mutations: {
            // Não retentar mutations que falharam por abort
            retry: (failureCount, error) => {
              if (error instanceof Error && error.name === 'AbortError') {
                return false;
              }
              return failureCount < 1;
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

