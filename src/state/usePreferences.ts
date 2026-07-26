import { useQuery } from '@tanstack/react-query';
import { userPreferencesRepo } from '@/src/database/repositories';
import type { UserPreferences } from '@/src/types';

export function usePreferences() {
  const { data: preferences, isLoading: loading, refetch } = useQuery<UserPreferences | null>({
    queryKey: ['preferences'],
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: () => userPreferencesRepo.get(),
  });

  const save = async (partial: Partial<UserPreferences>) => {
    await userPreferencesRepo.upsert(partial);
    const updated = await userPreferencesRepo.get();
    await refetch();
    return updated;
  };

  return { preferences: preferences ?? null, loading, save };
}
