import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { useTranslation } from '../hooks/useTranslation';
import { useThemeColors } from '../hooks/useThemeColors';

export default function BottomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const t = useTranslation();
  const C = useThemeColors();

  const TABS = [
    { key: 'index', label: t.nav_dashboard, icon: 'timer-outline' as const, iconActive: 'timer' as const },
    { key: 'aktivitat', label: t.nav_activity, icon: 'time-outline' as const, iconActive: 'time' as const },
    { key: 'berichte', label: t.nav_reports, icon: 'bar-chart-outline' as const, iconActive: 'bar-chart' as const },
    { key: 'einstellungen', label: t.nav_settings, icon: 'settings-outline' as const, iconActive: 'settings' as const },
  ];

  return (
    <View style={[
      styles.wrapper,
      { paddingBottom: insets.bottom, backgroundColor: C.tabBarBg, borderTopColor: C.cardBorder },
      Platform.select({
        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.08, shadowRadius: 8 },
        android: { elevation: 12 },
      }),
    ]}>
      <View style={styles.inner}>
        {TABS.map((tab, index) => {
          const isFocused = state.index === index;
          const route = state.routes[index];
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route?.key ?? '', canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(tab.key);
          };
          return (
            <TouchableOpacity key={tab.key} style={styles.tab} onPress={onPress} activeOpacity={0.7}>
              <Ionicons name={isFocused ? tab.iconActive : tab.icon} size={22} color={isFocused ? C.actionBlue : C.outline} />
              <Text style={[styles.label, { color: isFocused ? C.actionBlue : C.outline }, isFocused && styles.labelActive]} numberOfLines={1}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1 },
  inner: { flexDirection: 'row', paddingTop: 8, paddingBottom: 4, paddingHorizontal: 8 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 6, minHeight: 52 },
  label: { fontFamily: 'Inter_400Regular', fontSize: 11, textAlign: 'center' },
  labelActive: { fontFamily: 'Inter_600SemiBold' },
});
