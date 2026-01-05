import {
    QueryClient,
} from '@tanstack/react-query';

const  queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: attemptIndex =>
        Math.min(1000 * 2 ** attemptIndex, 30_000),

      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24h (formerly cacheTime)

      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,

      networkMode: "online",
    },
    mutations: {
      retry: 1,
      networkMode: "online",
    },
  },
});

export default queryClient;