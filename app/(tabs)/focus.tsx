import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { focusSessionsRepo, tasksRepo } from '@/src/database/repositories';
import { useTheme } from '@/src/theme';
import type { FocusSession, Task } from '@/src/types';
import { generateId } from '@/src/utils/id';

export default function FocusScreen() {
  const theme = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [session, setSession] = useState<FocusSession | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    tasksRepo.getActive().then(setTasks);
  }, []);

  const handleComplete = useCallback(async (completed: boolean) => {
    if (!session) return;
    const endedAt = new Date();
    const actualSeconds = Math.max(0, session.plannedDurationMinutes * 60 - remainingSeconds - session.pausedSeconds);
    const actualMinutes = Math.round(actualSeconds / 60);

    await focusSessionsRepo.save({
      ...session,
      endedAt: endedAt.toISOString(),
      actualDurationMinutes: actualMinutes,
      completed,
      updatedAt: endedAt.toISOString(),
    });

    const task = await tasksRepo.getById(session.taskId);
    if (task) {
      await tasksRepo.save({
        ...task,
        remainingDurationMinutes: Math.max(0, task.remainingDurationMinutes - actualMinutes),
        status: completed ? 'completed' : task.status,
        completedAt: completed ? endedAt.toISOString() : task.completedAt,
      });
    }

    setSession(null);
    setRemainingSeconds(0);
    setPaused(false);
    await tasksRepo.getActive().then(setTasks);
  }, [session, remainingSeconds]);

  useEffect(() => {
    if (session && !paused) {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds((s) => {
          if (s <= 1) {
            handleComplete(true);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [session, paused, handleComplete]);

  const startFocus = async () => {
    if (!selectedTaskId) return;
    const task = tasks.find((t) => t.id === selectedTaskId);
    if (!task) return;
    const duration = task.estimatedDurationMinutes;
    const newSession: FocusSession = {
      id: generateId('focus'),
      taskId: task.id,
      startedAt: new Date().toISOString(),
      plannedDurationMinutes: duration,
      pausedSeconds: 0,
      distractions: [],
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await focusSessionsRepo.save(newSession);
    setSession(newSession);
    setRemainingSeconds(duration * 60);
    setPaused(false);
  };

  const togglePause = () => {
    setPaused((p) => !p);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ padding: theme.spacing.lg, flex: 1, justifyContent: 'center' }}>
        {!session ? (
          <Card>
            <Text variant="heading" style={{ marginBottom: theme.spacing.md }}>
              Focus Mode
            </Text>
            {tasks.length === 0 ? (
              <Text variant="body" color="muted">
                No active tasks. Add one from the Inbox.
              </Text>
            ) : (
              <>
                {tasks.map((task) => (
                  <Button
                    key={task.id}
                    title={task.title}
                    variant={selectedTaskId === task.id ? 'primary' : 'secondary'}
                    style={{ marginBottom: theme.spacing.sm }}
                    onPress={() => setSelectedTaskId(task.id)}
                  />
                ))}
                <Button title="Start Focus" onPress={startFocus} disabled={!selectedTaskId} />
              </>
            )}
          </Card>
        ) : (
          <Card style={{ alignItems: 'center', paddingVertical: theme.spacing.xxl }}>
            <Text variant="title" style={{ marginBottom: theme.spacing.lg }}>
              {formatTime(remainingSeconds)}
            </Text>
            <Text variant="heading" style={{ marginBottom: theme.spacing.md }}>
              {tasks.find((t) => t.id === session.taskId)?.title}
            </Text>
            <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
              <Button title={paused ? 'Resume' : 'Pause'} onPress={togglePause} variant="secondary" />
              <Button title="Complete" onPress={() => handleComplete(true)} />
              <Button title="Stop" onPress={() => handleComplete(false)} variant="ghost" />
            </View>
          </Card>
        )}
      </View>
    </SafeAreaView>
  );
}
