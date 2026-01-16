import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import React from 'react';
import { toast } from 'react-hot-toast';

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: any) => {
      // This catches errors from ALL queries
      if (error?.response?.status === 401 || error?.response?.status === 403) {
         // This typically happens if the Refresh Logic in Axios also failed
         // Perform Logout / Redirect
         // window.location.href = '/login'; is a bit harsh here, but per instructions:
      }
      toast.error(`Error: ${error.message}`);
    },
  }),
  mutationCache: new MutationCache({
    onError: () => {
      // Handle mutation errors specifically
      toast.error('Action failed. Please try again.');
    },
  }),
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 Hours. Data remains on disk.
      staleTime: 1000 * 60 * 5,    // 5 Minutes.
      networkMode: 'offlineFirst', // CRITICAL: Reads cache if offline without error.
      retry: (failureCount, error: any) => {
        // Don't retry on 403 (Forbidden) or 404 (Not Found)
        if (error.response?.status === 403 || error.response?.status === 404) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      networkMode: 'offlineFirst'
    }
  }
});

const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

export const QueryProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      {children}
    </PersistQueryClientProvider>
  );
};
