import { router } from 'expo-router';
import { ScrollView, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { resetDatabase } from '@/src/database/migrations';
import { seedSampleData } from '@/src/database/seed';
import { usePreferences } from '@/src/state/usePreferences';
import { useTheme } from '@/src/theme';
import type { EnergyLevel } from '@/src/types';
import { useState } from 'react';

export default function SettingsScreen() {
  const theme = useTheme();
  const { preferences, loading, save } = usePreferences();
  const [message, setMessage] = useState('');

  if (loading || !preferences) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <Text variant="body" style={{ padding: theme.spacing.lg }}>
          Loading...
        </Text>
      </SafeAreaView>
    );
  }

  const updateEnergy = (period: 'morningEnergy' | 'afternoonEnergy' | 'eveningEnergy', value: EnergyLevel) => {
    save({ [period]: value });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg }}>
        <Text variant="heading" style={{ marginBottom: theme.spacing.lg }}>
          Settings
        </Text>

        <Card style={{ marginBottom: theme.spacing.lg }}>
          <Text variant="body" weight="600" style={{ marginBottom: theme.spacing.md }}>
            Work hours
          </Text>
          <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
            <Input
              placeholder="Start"
              value={preferences.workdayStart}
              onChangeText={(text) => save({ workdayStart: text })}
              style={{ flex: 1 }}
            />
            <Input
              placeholder="End"
              value={preferences.workdayEnd}
              onChangeText={(text) => save({ workdayEnd: text })}
              style={{ flex: 1 }}
            />
          </View>
        </Card>

        <Card style={{ marginBottom: theme.spacing.lg }}>
          <Text variant="body" weight="600" style={{ marginBottom: theme.spacing.md }}>
            Energy profile
          </Text>
          {(['morningEnergy', 'afternoonEnergy', 'eveningEnergy'] as const).map((period) => (
            <View key={period} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm }}>
              <Text variant="body">{period.replace('Energy', '')}</Text>
              <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                {(['low', 'medium', 'high'] as EnergyLevel[]).map((level) => (
                  <Button
                    key={level}
                    title={level}
                    size="sm"
                    variant={preferences[period] === level ? 'primary' : 'secondary'}
                    onPress={() => updateEnergy(period, level)}
                  />
                ))}
              </View>
            </View>
          ))}
        </Card>

        <Card style={{ marginBottom: theme.spacing.lg }}>
          <Text variant="body" weight="600" style={{ marginBottom: theme.spacing.md }}>
            Focus defaults
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm }}>
            <Text variant="body">Notifications</Text>
            <Switch
              value={preferences.notificationsEnabled}
              onValueChange={(value) => { save({ notificationsEnabled: value }); }}
            />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm }}>
            <Text variant="body">Morning brief</Text>
            <Switch
              value={preferences.morningBriefEnabled}
              onValueChange={(value) => { save({ morningBriefEnabled: value }); }}
            />
          </View>
        </Card>

        <View style={{ gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
          <Button title="Add sample data" variant="secondary" onPress={() => seedSampleData().then(() => setMessage('Sample data added.'))} />
          <Button title="Reset all local data" variant="danger" onPress={() => resetDatabase().then(() => setMessage('Database reset.'))} />
          <Button title="Run onboarding" variant="secondary" onPress={() => router.push('/onboarding')} />
        </View>

        {message ? (
          <Card style={{ backgroundColor: theme.colors.success + '15' }}>
            <Text variant="body" color="success">
              {message}
            </Text>
          </Card>
        ) : null}

        <Card style={{ marginTop: theme.spacing.lg }}>
          <Text variant="body" weight="600" style={{ marginBottom: theme.spacing.md }}>
            Privacy
          </Text>
          <Text variant="muted" color="muted">
            Northstar AI stores all personal data locally on your device. No analytics, ads, or remote AI calls are made in V1. Calendar data is read-only unless you explicitly create an event.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
