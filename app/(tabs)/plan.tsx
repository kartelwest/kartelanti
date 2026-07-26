import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { useBlocks } from '@/src/state/useBlocks';
import { useTheme } from '@/src/theme';
import { addDays, format, friendlyTime, startOfDay } from '@/src/utils/date';

export default function PlanScreen() {
  const theme = useTheme();
  const [date, setDate] = useState(startOfDay(new Date()));
  const { blocks } = useBlocks(date);

  const navigate = (days: number) => setDate((d) => addDays(d, days));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg }}>
          <Button title="<" size="sm" onPress={() => navigate(-1)} />
          <Text variant="heading">{format(date, 'EEEE, MMM d')}</Text>
          <Button title=">" size="sm" onPress={() => navigate(1)} />
        </View>

        <View style={{ marginBottom: theme.spacing.lg }}>
          {blocks.length === 0 && (
            <Card>
              <Text variant="body" color="muted" align="center">
                No plan for this day yet.
              </Text>
            </Card>
          )}
          {blocks.map((block) => (
            <Pressable
              key={block.id}
              style={{
                backgroundColor: block.isFixed ? theme.colors.border : theme.colors.surface,
                borderLeftWidth: 4,
                borderLeftColor: block.isFixed ? theme.colors.textMuted : theme.colors.primary,
                borderRadius: theme.radius.md,
                padding: theme.spacing.md,
                marginBottom: theme.spacing.md,
                ...theme.shadows.sm,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.sm }}>
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
      </ScrollView>
    </SafeAreaView>
  );
}
