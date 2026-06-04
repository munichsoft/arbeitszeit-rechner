import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useTimeStore } from '../store/useTimeStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { format } from 'date-fns';

interface BackupData {
  version: number;
  app: 'arbeitszeit-rechner';
  timestamp: string;
  timeStore: {
    entries: any[];
    projects: any[];
    activeEntryId: string | null;
    activePauseStart: string | null;
  };
  settingsStore: {
    language: any;
    theme: any;
    userName: string;
    userEmail: string;
    hourlyRate: number;
    currencySymbol: any;
    weeklyTargetHours: number;
    timeFormat: any;
    pushNotifications: boolean;
    weeklyEmailSummary: boolean;
    showEarnings: boolean;
    enableTimer: boolean;
    jobStartDate: string | null;
    workingDays: number[];
    reminderEnabled?: boolean;
    reminderTime?: string;
  };
}

export async function exportBackup(): Promise<void> {
  const timeState = useTimeStore.getState();
  const settingsState = useSettingsStore.getState();

  const backup: BackupData = {
    version: 1,
    app: 'arbeitszeit-rechner',
    timestamp: new Date().toISOString(),
    timeStore: {
      entries: timeState.entries,
      projects: timeState.projects,
      activeEntryId: timeState.activeEntryId,
      activePauseStart: timeState.activePauseStart,
    },
    settingsStore: {
      language: settingsState.language,
      theme: settingsState.theme,
      userName: settingsState.userName,
      userEmail: settingsState.userEmail,
      hourlyRate: settingsState.hourlyRate,
      currencySymbol: settingsState.currencySymbol,
      weeklyTargetHours: settingsState.weeklyTargetHours,
      timeFormat: settingsState.timeFormat,
      pushNotifications: settingsState.pushNotifications,
      weeklyEmailSummary: settingsState.weeklyEmailSummary,
      showEarnings: settingsState.showEarnings,
      enableTimer: settingsState.enableTimer,
      jobStartDate: settingsState.jobStartDate,
      workingDays: settingsState.workingDays,
      reminderEnabled: settingsState.reminderEnabled,
      reminderTime: settingsState.reminderTime,
    },
  };

  const backupString = JSON.stringify(backup, null, 2);
  const filename = `Backup_Arbeitszeit_${format(new Date(), 'yyyy-MM-dd')}.json`;
  const uri = FileSystem.documentDirectory + filename;
  
  await FileSystem.writeAsStringAsync(uri, backupString, { encoding: 'utf8' });
  
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/json', UTI: 'public.json' });
  }
}

export async function importBackup(): Promise<boolean> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return false;
    }

    const fileUri = result.assets[0].uri;
    const fileContent = await FileSystem.readAsStringAsync(fileUri, { encoding: 'utf8' });
    const backup: BackupData = JSON.parse(fileContent);

    // Validate structure
    if (
      backup.app !== 'arbeitszeit-rechner' ||
      !backup.timeStore ||
      !Array.isArray(backup.timeStore.entries) ||
      !Array.isArray(backup.timeStore.projects) ||
      !backup.settingsStore
    ) {
      throw new Error('Invalid backup structure');
    }

    // Update time store
    useTimeStore.setState({
      entries: backup.timeStore.entries,
      projects: backup.timeStore.projects,
      activeEntryId: backup.timeStore.activeEntryId || null,
      activePauseStart: backup.timeStore.activePauseStart || null,
    });

    // Update settings store
    useSettingsStore.setState({
      language: backup.settingsStore.language,
      theme: backup.settingsStore.theme,
      userName: backup.settingsStore.userName || '',
      userEmail: backup.settingsStore.userEmail || '',
      hourlyRate: backup.settingsStore.hourlyRate || 0,
      currencySymbol: backup.settingsStore.currencySymbol || '€',
      weeklyTargetHours: backup.settingsStore.weeklyTargetHours || 40,
      timeFormat: backup.settingsStore.timeFormat || 'HH:MM',
      pushNotifications: backup.settingsStore.pushNotifications !== false,
      weeklyEmailSummary: !!backup.settingsStore.weeklyEmailSummary,
      showEarnings: !!backup.settingsStore.showEarnings,
      enableTimer: !!backup.settingsStore.enableTimer,
      jobStartDate: backup.settingsStore.jobStartDate || null,
      workingDays: backup.settingsStore.workingDays || [1, 2, 3, 4, 5],
      reminderEnabled: !!backup.settingsStore.reminderEnabled,
      reminderTime: backup.settingsStore.reminderTime || '20:00',
    });

    return true;
  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  }
}
