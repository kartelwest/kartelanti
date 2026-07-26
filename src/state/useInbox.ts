import { useQuery } from '@tanstack/react-query';
import { inboxCapturesRepo } from '@/src/database/repositories';
import type { InboxCapture } from '@/src/types';

export function useInbox() {
  const { data: captures = [], isLoading: loading, refetch } = useQuery<InboxCapture[]>({
    queryKey: ['inbox'],
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: () => inboxCapturesRepo.getAll(),
  });

  const saveCapture = async (capture: InboxCapture) => {
    await inboxCapturesRepo.save(capture);
    await refetch();
  };

  const deleteCapture = async (id: string) => {
    await inboxCapturesRepo.delete(id);
    await refetch();
  };

  return { captures, loading, refresh: refetch, saveCapture, deleteCapture };
}
