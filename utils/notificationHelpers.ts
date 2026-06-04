import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTimeStore } from '../store/useTimeStore';
import { format } from 'date-fns';

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
}

export async function scheduleDailyReminder(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.cancelScheduledNotificationAsync('daily-reminder');
  } catch (err) {
    // Ignore
  }

  const { reminderEnabled, reminderTime } = useSettingsStore.getState();
  if (!reminderEnabled) return;

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  const [hourStr, minuteStr] = reminderTime.split(':');
  const targetHour = parseInt(hourStr || '20', 10);
  const targetMinute = parseInt(minuteStr || '0', 10);

  const entries = useTimeStore.getState().entries;
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayHasEntries = entries.some(
    e => format(new Date(e.startTime), 'yyyy-MM-dd') === todayStr
  );

  const targetDate = new Date();
  targetDate.setHours(targetHour, targetMinute, 0, 0);

  if (todayHasEntries) {
    targetDate.setDate(targetDate.getDate() + 1);
  } else {
    if (Date.now() > targetDate.getTime()) {
      targetDate.setDate(targetDate.getDate() + 1);
    }
  }

  const language = useSettingsStore.getState().language;
  const title = language === 'de' ? 'Zeiterfassung vergessen?' : 'Forgot to track time?';
  const body = language === 'de' 
    ? 'Du hast heute noch keine Arbeitszeiten eingetragen. Tippe hier, um eine Schicht zu erfassen.' 
    : "You haven't logged any working hours today. Tap here to record a shift.";

  await Notifications.scheduleNotificationAsync({
    identifier: 'daily-reminder',
    content: {
      title,
      body,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: targetDate,
    },
  });
}
