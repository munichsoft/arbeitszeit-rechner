import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Language } from '../utils/i18n';

export type CurrencySymbol = '€' | '$' | '£' | 'CHF';
export type TimeFormat = 'HH:MM' | 'decimal';
export type Theme = 'light' | 'dark' | 'system';

interface SettingsState {
  language: Language;
  theme: Theme;
  userName: string;
  userEmail: string;
  hourlyRate: number;
  currencySymbol: CurrencySymbol;
  weeklyTargetHours: number;
  timeFormat: TimeFormat;
  pushNotifications: boolean;
  weeklyEmailSummary: boolean;
  showEarnings: boolean;
  enableTimer: boolean; // live shift timer (disabled by default)
  jobStartDate: string | null; // ISO date string, used as floor for cumulative overtime
  workingDays: number[]; // 1=Mon, 2=Tue, ..., 7=Sun

  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  setUserName: (name: string) => void;
  setUserEmail: (email: string) => void;
  setHourlyRate: (rate: number) => void;
  setCurrencySymbol: (symbol: CurrencySymbol) => void;
  setWeeklyTargetHours: (hours: number) => void;
  setTimeFormat: (format: TimeFormat) => void;
  setPushNotifications: (enabled: boolean) => void;
  setWeeklyEmailSummary: (enabled: boolean) => void;
  setShowEarnings: (enabled: boolean) => void;
  setEnableTimer: (enabled: boolean) => void;
  setJobStartDate: (date: string | null) => void;
  setWorkingDays: (days: number[]) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'de' as Language,
      theme: 'system' as Theme,
      userName: '',
      userEmail: '',
      hourlyRate: 0,
      currencySymbol: '€',
      weeklyTargetHours: 40,
      timeFormat: 'HH:MM' as TimeFormat,
      pushNotifications: true,
      weeklyEmailSummary: false,
      showEarnings: false,
      enableTimer: false,
      jobStartDate: null,
      workingDays: [1, 2, 3, 4, 5],

      setLanguage: (lang) => set({ language: lang }),
      setTheme: (theme) => set({ theme }),
      setUserName: (name) => set({ userName: name }),
      setUserEmail: (email) => set({ userEmail: email }),
      setHourlyRate: (rate) => set({ hourlyRate: rate }),
      setCurrencySymbol: (symbol) => set({ currencySymbol: symbol }),
      setWeeklyTargetHours: (hours) => set({ weeklyTargetHours: hours }),
      setTimeFormat: (format) => set({ timeFormat: format }),
      setPushNotifications: (enabled) => set({ pushNotifications: enabled }),
      setWeeklyEmailSummary: (enabled) => set({ weeklyEmailSummary: enabled }),
      setShowEarnings: (enabled) => set({ showEarnings: enabled }),
      setEnableTimer: (enabled) => set({ enableTimer: enabled }),
      setJobStartDate: (date) => set({ jobStartDate: date }),
      setWorkingDays: (days) => set({ workingDays: days }),
    }),
    {
      name: 'settings-store-v3',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
