import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Pill } from '@/components/ui/Pill';
import { Text } from '@/components/ui/Text';
import { tasksRepo } from '@/src/database/repositories';
import { LocalTaskLanguageParser, parsedResultToInboxCapture } from '@/src/services/parser';
import { useInbox } from '@/src/state/useInbox';
import { useTheme } from '@/src/theme';
import type { Task } from '@/src/types';
import { generateId } from '@/src/utils/id';

export default function InboxScreen() {
  const theme = useTheme();
  const { captures, saveCapture, deleteCapture } = useInbox();
  const [input, setInput] = useState('');

  const handleCapture = async () => {
    if (!input.trim()) return;
    const parser = new LocalTaskLanguageParser();
    const parsed = await parser.parse(input, { today: new Date() });
    const capture = parsedResultToInboxCapture(input, parsed);
    await saveCapture(capture);
    setInput('');
  };

  const confirmCapture = async (capture: ReturnType<typeof parsedResultToInboxCapture>) => {
    const task: Task = {
      id: generateId('task'),
      title: capture.parsedTitle ?? capture.rawInput,
      notes: `Captured from: ${capture.rawInput}`,
      status: 'planned',
      priority: capture.parsedPriority ?? 'medium',
      estimatedDurationMinutes: capture.parsedDurationMinutes ?? 30,
      remainingDurationMinutes: capture.parsedDurationMinutes ?? 30,
      deadline: capture.parsedDeadline,
      preferredTimeOfDay: capture.parsedPreferredTimeOfDay ?? 'any',
      energyRequirement: capture.parsedEnergy ?? 'medium',
      context: capture.parsedContext ?? 'computer',
      projectOrCategory: '',
      splittable: (capture.parsedDurationMinutes ?? 30) >= 60,
      minimumChunkMinutes: 15,
      maximumChunkMinutes: 120,
      dependencyIds: [],
      recurrenceRule: capture.parsedRecurrence,
      isFixed: false,
      nonNegotiable: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await tasksRepo.save(task);
    await deleteCapture(capture.id);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ padding: theme.spacing.lg }}>
        <Text variant="heading" style={{ marginBottom: theme.spacing.md }}>
          Inbox
        </Text>
        <Input
          placeholder="Call insurance tomorrow at 10 for 30 minutes"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleCapture}
          returnKeyType="send"
        />
        <Button title="Capture" onPress={handleCapture} style={{ marginTop: theme.spacing.md }} />
      </View>

      <FlatList
        data={captures}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: theme.spacing.lg }}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: theme.spacing.md }}>
            <Text variant="body" weight="600">
              {item.parsedTitle ?? item.rawInput}
            </Text>
            <Text variant="muted" color="muted">
              {item.rawInput}
            </Text>
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginVertical: theme.spacing.sm, flexWrap: 'wrap' }}>
              {item.parsedDurationMinutes && <Pill label={`${item.parsedDurationMinutes} min`} color="primary" />}
              {item.parsedDeadline && <Pill label={new Date(item.parsedDeadline).toLocaleDateString()} color="warning" />}
              {item.parsedPriority && <Pill label={item.parsedPriority} color="muted" />}
            </View>
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              <Button title="Approve" size="sm" onPress={() => confirmCapture(item)} />
              <Button title="Delete" size="sm" variant="danger" onPress={() => deleteCapture(item.id)} />
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <Text variant="body" color="muted" align="center" style={{ marginTop: theme.spacing.xl }}>
            Inbox is empty. Capture a task above.
          </Text>
        }
      />
    </SafeAreaView>
  );
}
