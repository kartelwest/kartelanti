import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { Text } from '@/components/ui/Text';
import { useSchedule } from '@/src/state/useSchedule';
import { useTasks } from '@/src/state/useTasks';
import { useTheme } from '@/src/theme';
import { friendlyDate, friendlyTime } from '@/src/utils/date';

export default function TodayScreen() {
  const theme = useTheme();
  const { tasks } = useTasks();
  const { blocks, confidence, rebuild, loading } = useSchedule(new Date());

  const today = new Date();

  const greeting = (name: string) => {
    const hour = today.getHours();
    const time = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    return `Good ${time}${name ? `, ${name}` : ''}`;
  };

  const nextItem = blocks.find((b) => new Date(b.end) > today);
  const topPriorities = useMemo(
    () =>
      tasks
        .filter((t) => t.status !== 'completed' && t.status !== 'cancelled')
        .sort(
          (a, b) =>
            priorityWeight(b.priority) - priorityWeight(a.priority),
        )
        .slice(0, 3),
    [tasks],
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <Text variant="body" style={{ padding: theme.spacing.lg }}>
          Building your day...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg }}>
        <View style={{ marginBottom: theme.spacing.lg }}>
          <Text variant="title">{greeting('')}</Text>
          <Text variant="muted" color="muted">
            {friendlyDate(today)}
          </Text>
        </View>

        {confidence && (
          <Card style={{ marginBottom: theme.spacing.lg, backgroundColor: confidenceColor(theme, confidence.level) }}>
            <Text variant="heading">Confidence: {confidence.level}</Text>
            <Text variant="body" color="muted">
              {confidence.reasons.join(' ') || 'Day looks realistic.'}
            </Text>
          </Card>
        )}

        <Card style={{ marginBottom: theme.spacing.lg }}>
          <Text variant="heading">Next up</Text>
          {nextItem ? (
            <>
              <Text variant="body">{nextItem.title}</Text>
              <Text variant="muted" color="muted">
                {friendlyTime(new Date(nextItem.start))} - {friendlyTime(new Date(nextItem.end))}
              </Text>
            </>
          ) : (
            <Text variant="muted" color="muted">
              Nothing scheduled. Use Quick Capture or Rebuild My Day.
            </Text>
          )}
        </Card>

        <View style={{ marginBottom: theme.spacing.lg }}>
          <Text variant="heading" style={{ marginBottom: theme.spacing.md }}>
            Top priorities
          </Text>
          {topPriorities.length === 0 && <Text variant="muted" color="muted">No active priorities.</Text>}
          {topPriorities.map((task) => (
            <Card key={task.id} style={{ marginBottom: theme.spacing.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text variant="body" weight="600">
                  {task.title}
                </Text>
                <Pill label={task.priority} color={pillColorForPriority(task.priority)} />
              </View>
              {task.deadline && (
                <Text variant="muted" color="muted">
                  Due {friendlyDate(new Date(task.deadline))}
                </Text>
              )}
            </Card>
          ))}
        </View>

        <View style={{ marginBottom: theme.spacing.lg }}>
          <Text variant="heading" style={{ marginBottom: theme.spacing.md }}>
            Timeline
          </Text>
          {blocks.length === 0 && <Text variant="muted" color="muted">No blocks scheduled yet.</Text>}
          {blocks.map((block) => (
            <Pressable
              key={block.id}
              onPress={() => {}}
              style={{
                backgroundColor: block.isFixed ? theme.colors.border : theme.colors.primaryMuted,
                borderRadius: theme.radius.md,
                padding: theme.spacing.md,
                marginBottom: theme.spacing.sm,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="body" weight="600">
                  {block.title}
                </Text>
                <Text variant="muted" color="muted">
                  {friendlyTime(new Date(block.start))}
                </Text>
              </View>
              {!block.isFixed && <Text variant="caption" color="muted">{block.explanation}</Text>}
            </Pressable>
          ))}
        </View>

        <View style={{ gap: theme.spacing.md }}>
          <Button title="Quick Capture" onPress={() => router.push('/task/new')} />
          <Button title="Rebuild My Day" onPress={() => rebuild()} variant="secondary" />
          <Button title="Start Focus" onPress={() => router.push('/(tabs)/focus')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function priorityWeight(priority: string): number {
  switch (priority) {
    case 'urgent':
      return 4;
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
    default:
      return 1;
  }
}

function confidenceColor(theme: ReturnType<typeof useTheme>, level: string): string {
  if (level === 'high') return theme.colors.success + '15';
  if (level === 'medium') return theme.colors.warning + '15';
  return theme.colors.danger + '15';
}

function pillColorForPriority(priority: string): 'danger' | 'warning' | 'muted' {
  if (priority === 'urgent') return 'danger';
  if (priority === 'high') return 'warning';
  return 'muted';
}
