import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { IIncident } from '@repo/types';
import { createIncident, fetchIncidents } from '../api';

export const useIncidents = () => {
  return useQuery({
    queryKey: ['incidents'],
    queryFn: fetchIncidents,
  });
};

export const useCreateIncident = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createIncident,
    onMutate: async (newIncident) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['incidents'] });

      // Snapshot the previous value
      const previousIncidents = queryClient.getQueryData<IIncident[]>(['incidents']);

      // Optimistically update to the new value
      const optimisticIncident: IIncident = {
        id: crypto.randomUUID(), // Temporary ID
        ...newIncident,
        status: 'OPEN',
        createdAt: new Date(),
        location: newIncident.location
      };

      queryClient.setQueryData<IIncident[]>(['incidents'], (old) => 
        old ? [...old, optimisticIncident] : [optimisticIncident]
      );

      return { previousIncidents };
    },
    onError: (_err, _newIncident, context) => {
      // Rollback on error
      if (context?.previousIncidents) {
        queryClient.setQueryData(['incidents'], context.previousIncidents);
      }
    },
    onSettled: () => {
      // Refetch after error or success to ensure sync
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });
};
