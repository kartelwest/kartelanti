import { Link, Stack } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/src/theme';

export default function NotFoundScreen() {
  const theme = useTheme();
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: theme.colors.background }}>
        <Text variant="title" style={{ marginBottom: 12 }}>
          Oops
        </Text>
        <Text variant="body" color="muted" style={{ marginBottom: 24, textAlign: 'center' }}>
          This screen does not exist.
        </Text>
        <Link href="/(tabs)" asChild>
          <Button title="Go home" />
        </Link>
      </View>
    </>
  );
}
