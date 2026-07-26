import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { userPreferencesRepo } from '@/src/database/repositories';
import { useTheme } from '@/src/theme';
import type { EnergyLevel } from '@/src/types';

export default function OnboardingScreen() {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [sleepTime, setSleepTime] = useState('23:00');
  const [workdayStart, setWorkdayStart] = useState('09:00');
  const [workdayEnd, setWorkdayEnd] = useState('17:00');
  const [preferredFocusSessionLength, setPreferredFocusSessionLength] = useState('50');
  const [minimumBreakLength, setMinimumBreakLength] = useState('10');
  const [maximumFocusedWorkHours, setMaximumFocusedWorkHours] = useState('6');
  const [morningEnergy, setMorningEnergy] = useState<EnergyLevel>('high');
  const [afternoonEnergy, setAfternoonEnergy] = useState<EnergyLevel>('medium');
  const [eveningEnergy, setEveningEnergy] = useState<EnergyLevel>('low');
  const [defaultPrepBuffer, setDefaultPrepBuffer] = useState('15');
  const [defaultTravelBuffer, setDefaultTravelBuffer] = useState('0');

  const finish = async () => {
    await userPreferencesRepo.upsert({
      name,
      wakeTime,
      sleepTime,
      workdayStart,
      workdayEnd,
      preferredFocusSessionLength: parseInt(preferredFocusSessionLength, 10) || 50,
      minimumBreakLength: parseInt(minimumBreakLength, 10) || 10,
      maximumFocusedWorkHoursPerDay: parseInt(maximumFocusedWorkHours, 10) || 6,
      morningEnergy,
      afternoonEnergy,
      eveningEnergy,
      defaultPrepBufferMinutes: parseInt(defaultPrepBuffer, 10) || 15,
      defaultTravelBufferMinutes: parseInt(defaultTravelBuffer, 10) || 0,
      onboardingCompleted: true,
    });
    router.replace('/(tabs)');
  };

  const renderEnergy = (
    label: string,
    value: EnergyLevel,
    onChange: (v: EnergyLevel) => void,
  ) => (
    <View key={label} style={{ marginBottom: theme.spacing.md }}>
      <Text variant="body" weight="600" style={{ marginBottom: theme.spacing.sm }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        {(['low', 'medium', 'high'] as EnergyLevel[]).map((level) => (
          <Button
            key={level}
            title={level}
            variant={value === level ? 'primary' : 'secondary'}
            size="sm"
            onPress={() => onChange(level)}
          />
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg }}>
        <Text variant="title" style={{ marginBottom: theme.spacing.sm }}>
          Welcome to Northstar AI
        </Text>
        <Text variant="muted" color="muted" style={{ marginBottom: theme.spacing.lg }}>
          A few quick questions to build a realistic daily plan for you.
        </Text>

        <Card style={{ marginBottom: theme.spacing.lg }}>
          <Text variant="body" weight="600" style={{ marginBottom: theme.spacing.md }}>
            About you
          </Text>
          <Input placeholder="Your name" value={name} onChangeText={setName} style={{ marginBottom: theme.spacing.md }} />
          <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
            <Input placeholder="Wake time" value={wakeTime} onChangeText={setWakeTime} style={{ flex: 1 }} />
            <Input placeholder="Sleep time" value={sleepTime} onChangeText={setSleepTime} style={{ flex: 1 }} />
          </View>
        </Card>

        <Card style={{ marginBottom: theme.spacing.lg }}>
          <Text variant="body" weight="600" style={{ marginBottom: theme.spacing.md }}>
            Workday
          </Text>
          <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
            <Input placeholder="Start" value={workdayStart} onChangeText={setWorkdayStart} style={{ flex: 1 }} />
            <Input placeholder="End" value={workdayEnd} onChangeText={setWorkdayEnd} style={{ flex: 1 }} />
          </View>
          <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
            <Input placeholder="Focus min" value={preferredFocusSessionLength} onChangeText={setPreferredFocusSessionLength} style={{ flex: 1 }} keyboardType="number-pad" />
            <Input placeholder="Break min" value={minimumBreakLength} onChangeText={setMinimumBreakLength} style={{ flex: 1 }} keyboardType="number-pad" />
          </View>
          <Input placeholder="Max focused hours per day" value={maximumFocusedWorkHours} onChangeText={setMaximumFocusedWorkHours} style={{ marginTop: theme.spacing.md }} keyboardType="number-pad" />
        </Card>

        <Card style={{ marginBottom: theme.spacing.lg }}>
          <Text variant="body" weight="600" style={{ marginBottom: theme.spacing.md }}>
            Energy profile
          </Text>
          {renderEnergy('Morning', morningEnergy, setMorningEnergy)}
          {renderEnergy('Afternoon', afternoonEnergy, setAfternoonEnergy)}
          {renderEnergy('Evening', eveningEnergy, setEveningEnergy)}
        </Card>

        <Card style={{ marginBottom: theme.spacing.lg }}>
          <Text variant="body" weight="600" style={{ marginBottom: theme.spacing.md }}>
            Buffers
          </Text>
          <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
            <Input placeholder="Prep buffer (min)" value={defaultPrepBuffer} onChangeText={setDefaultPrepBuffer} style={{ flex: 1 }} keyboardType="number-pad" />
            <Input placeholder="Travel buffer (min)" value={defaultTravelBuffer} onChangeText={setDefaultTravelBuffer} style={{ flex: 1 }} keyboardType="number-pad" />
          </View>
        </Card>

        <Button title="Get started" onPress={finish} />
      </ScrollView>
    </SafeAreaView>
  );
}
