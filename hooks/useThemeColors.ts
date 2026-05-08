import { useColorScheme } from 'react-native';
import { LightColors, DarkColors, type ColorPalette } from '../constants/colors';
import { useSettingsStore } from '../store/useSettingsStore';

export function useThemeColors(): ColorPalette {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const theme = useSettingsStore(s => s.theme);

  const isDark =
    theme === 'dark' ||
    (theme === 'system' && systemScheme === 'dark');

  return isDark ? DarkColors : LightColors;
}
