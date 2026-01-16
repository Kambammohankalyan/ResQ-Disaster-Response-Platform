import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { get, set, del } from 'idb-keyval';
import React from 'react';
import { toast } from 'react-hot-toast';

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: any) => {
      // This catches errors from ALL queries
      if (error?.response?.status === 401 || error?.response?.status === 403) {
         // This typically happens if the Refresh Logic in Axios also failed
         // Perform Logout / Redirect
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
      gcTime: 1000 * 60 * 60 * 24, // 24 Hours. Data remains on disk in IndexedDB.
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

// Create an Async persister that uses IndexedDB via idb-keyval
const persister = createAsyncStoragePersister({
  storage: {
    getItem: async (key) => {
      return await get(key);
    },
    setItem: async (key, value) => {
      await set(key, value);
    },
    removeItem: async (key) => {
      await del(key);
    },
  },
  key: 'resq-query-cache', // Unique key prefix
  throttleTime: 1000, // Throttle saves to once per second
});

export const QueryProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ 
        persister,
        maxAge: 1000 * 60 * 60 * 24 // Persist cache for 24 hours
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
};
