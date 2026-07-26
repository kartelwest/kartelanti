import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import { ThemeProvider, useTheme } from '@/src/theme';
import { queryClient } from '@/src/state/queryClient';
import { runMigrations } from '@/src/database/migrations';
import { userPreferencesRepo } from '@/src/database/repositories';
import { seedSampleData } from '@/src/database/seed';

SplashScreen.preventAutoHideAsync();

function RootContent() {
  const theme = useTheme();
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    let mounted = true;
    runMigrations()
      .then(async () => {
        const prefs = await userPreferencesRepo.get();
        if (!prefs || !prefs.onboardingCompleted) {
          router.replace('/onboarding');
        } else {
          await seedSampleData();
        }
        if (mounted) setReady(true);
      })
      .catch((e) => {
        console.error(e);
        if (mounted) setReady(true);
      });
    return () => {
      mounted = false;
    };
  }, [router]);

  if (!loaded || !ready) {
    return <View style={{ flex: 1, backgroundColor: theme.colors.background }} />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="task/new" options={{ presentation: 'modal', title: 'New Task' }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RootContent />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
