import { useQuery } from '@tanstack/react-query';
import { scheduleBlocksRepo } from '@/src/database/repositories';
import type { ScheduleBlock } from '@/src/types';

export function useBlocks(date: Date) {
  const { data: blocks = [], isLoading: loading, refetch } = useQuery<ScheduleBlock[]>({
    queryKey: ['blocks', date.toISOString()],
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: () => scheduleBlocksRepo.getByDate(date),
  });

  return { blocks, loading, refresh: refetch };
}
