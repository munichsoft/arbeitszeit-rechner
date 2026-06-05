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
import { useSettingsStore } from '../store/useSettingsStore';

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

  // Cleanup: kill orphaned timer if timer feature is disabled + one-time ghost entry migration.
  useEffect(() => {
    const { activeEntryId, cancelTimer, entries, deleteEntry } = useTimeStore.getState();
    const { enableTimer } = useSettingsStore.getState();

    // 1. Kill orphaned timer if timer feature is off
    if (!enableTimer && activeEntryId) {
      cancelTimer();
    }

    // 2. One-time migration: purge ghost entries (net < 60s or stuck endTime=null)
    // Bump version key to re-run migration on all existing installs.
    const MIGRATION_KEY = 'ghost_entry_migration_v2';
    import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) => {
      AsyncStorage.getItem(MIGRATION_KEY).then(done => {
        if (done) return; // already ran
        const toDelete = entries.filter(e => {
          // Stuck active entry (endTime null and not the current active)
          if (e.endTime === null && e.id !== activeEntryId) return true;
          // Ghost: net work < 60 seconds
          if (e.endTime) {
            const net = (new Date(e.endTime).getTime() - new Date(e.startTime).getTime() - e.pauseMinutes * 60000) / 1000;
            if (net < 60) return true;
          }
          return false;
        });
        toDelete.forEach(e => deleteEntry(e.id));
        AsyncStorage.setItem(MIGRATION_KEY, '1');
      });
    });
  }, []);

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
