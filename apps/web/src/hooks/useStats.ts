import { useQuery } from '@tanstack/react-query';
import { fetchStats } from '../api';

export const useStats = () => {
  return useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
    refetchInterval: 30000, // Refresh every 30s
  });
};
