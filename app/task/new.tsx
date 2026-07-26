import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { tasksRepo } from '@/src/database/repositories';
import { useTheme } from '@/src/theme';
import type { Context, EnergyLevel, Priority, TimeOfDay } from '@/src/types';
import { generateId } from '@/src/utils/id';

export default function NewTaskScreen() {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('30');
  const [priority, setPriority] = useState<Priority>('medium');
  const [energy, setEnergy] = useState<EnergyLevel>('medium');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('any');
  const [context, setContext] = useState<Context>('computer');

  const save = async () => {
    if (!title.trim()) return;
    await tasksRepo.save({
      id: generateId('task'),
      title: title.trim(),
      notes: '',
      status: 'planned',
      priority,
      estimatedDurationMinutes: parseInt(duration, 10) || 30,
      remainingDurationMinutes: parseInt(duration, 10) || 30,
      preferredTimeOfDay: timeOfDay,
      energyRequirement: energy,
      context,
      projectOrCategory: '',
      splittable: parseInt(duration, 10) >= 60,
      minimumChunkMinutes: 15,
      maximumChunkMinutes: 120,
      dependencyIds: [],
      isFixed: false,
      nonNegotiable: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    router.back();
  };

  const renderOptions = <T extends string>(
    label: string,
    options: readonly T[],
    value: T,
    onChange: (v: T) => void,
  ) => (
    <View key={label} style={{ marginBottom: theme.spacing.md }}>
      <Text variant="body" weight="600" style={{ marginBottom: theme.spacing.sm }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
        {options.map((opt) => (
          <Button
            key={opt}
            title={opt}
            variant={value === opt ? 'primary' : 'secondary'}
            size="sm"
            onPress={() => onChange(opt)}
          />
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg }}>
        <Text variant="heading" style={{ marginBottom: theme.spacing.lg }}>
          New Task
        </Text>
        <Card style={{ marginBottom: theme.spacing.lg }}>
          <Input placeholder="Task title" value={title} onChangeText={setTitle} style={{ marginBottom: theme.spacing.md }} />
          <Input placeholder="Duration (minutes)" value={duration} onChangeText={setDuration} keyboardType="number-pad" style={{ marginBottom: theme.spacing.md }} />
          {renderOptions('Priority', ['low', 'medium', 'high', 'urgent'] as const, priority, setPriority)}
          {renderOptions('Energy', ['low', 'medium', 'high'] as const, energy, setEnergy)}
          {renderOptions('Preferred time', ['morning', 'afternoon', 'evening', 'any'] as const, timeOfDay, setTimeOfDay)}
          {renderOptions('Context', ['computer', 'phone', 'errands', 'home', 'work', 'creative', 'administrative'] as const, context, setContext)}
        </Card>
        <Button title="Save Task" onPress={save} />
      </ScrollView>
    </SafeAreaView>
  );
}
