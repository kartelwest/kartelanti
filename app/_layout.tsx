import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { ThemeProvider } from '@/src/theme';
import { queryClient } from '@/src/state/queryClient';
import { runMigrations } from '@/src/database/migrations';
import { userPreferencesRepo } from '@/src/database/repositories';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const router = useRouter();

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    runMigrations()
      .then(() => userPreferencesRepo.get())
      .then((prefs) => {
        if (!prefs || !prefs.onboardingCompleted) {
          router.replace('/onboarding');
        }
      })
      .catch(console.error);
  }, [router]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="task/new" options={{ presentation: 'modal', title: 'New Task' }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
