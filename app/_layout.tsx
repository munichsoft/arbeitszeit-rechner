import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { scheduleDailyReminder } from '../utils/notificationHelpers';

import { useTimeStore } from '../store/useTimeStore';

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      scheduleDailyReminder().catch(err => console.error('Failed to schedule daily reminder on startup:', err));
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    let lastEntriesLength = useTimeStore.getState().entries.length;
    const unsubscribe = useTimeStore.subscribe((state) => {
      if (state.entries.length !== lastEntriesLength) {
        lastEntriesLength = state.entries.length;
        scheduleDailyReminder().catch(err => console.error('Failed to reschedule daily reminder on state change:', err));
      }
    });
    return () => unsubscribe();
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
