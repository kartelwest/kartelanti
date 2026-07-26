import { useQuery } from '@tanstack/react-query';
import { tasksRepo } from '@/src/database/repositories';
import type { Task } from '@/src/types';

export function useTasks() {
  const { data: tasks = [], isLoading: loading, refetch } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: () => tasksRepo.getActive(),
  });

  const saveTask = async (task: Task) => {
    await tasksRepo.save(task);
    await refetch();
  };

  const deleteTask = async (id: string) => {
    await tasksRepo.delete(id);
    await refetch();
  };

  return { tasks, loading, refresh: refetch, saveTask, deleteTask };
}
