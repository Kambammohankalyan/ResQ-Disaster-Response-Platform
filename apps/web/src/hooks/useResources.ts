import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { IResource } from '@repo/types';
import { createResource, fetchResources } from '../api';

export const useResources = () => {
  return useQuery({
    queryKey: ['resources'],
    queryFn: fetchResources,
  });
};

export const useCreateResource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createResource,
    onMutate: async (newResource) => {
      await queryClient.cancelQueries({ queryKey: ['resources'] });
      const previousResources = queryClient.getQueryData<IResource[]>(['resources']);

      const optimisticResource: IResource = {
        id: crypto.randomUUID(),
        ...newResource,
      };

      queryClient.setQueryData<IResource[]>(['resources'], (old) => 
        old ? [...old, optimisticResource] : [optimisticResource]
      );

      return { previousResources };
    },
    onError: (_err, _newResource, context) => {
      if (context?.previousResources) {
        queryClient.setQueryData(['resources'], context.previousResources);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
};
