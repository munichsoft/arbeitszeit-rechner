import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Shadow } from '../constants/spacing';
import { useThemeColors } from '../hooks/useThemeColors';

interface FABProps {
  onPress: () => void;
  iconName?: keyof typeof Ionicons.glyphMap;
}

// Inner height of the tab bar (paddingTop + minHeight + paddingBottom)
const TAB_BAR_INNER = 64;

export default function FAB({ onPress, iconName = 'add' }: FABProps) {
  const C = useThemeColors();
  const insets = useSafeAreaInsets();
  // Sit comfortably above the tab bar: inner height + bottom safe inset + 16px gap
  const bottomOffset = TAB_BAR_INNER + insets.bottom + 16;

  return (
    <View style={[styles.wrapper, { bottom: bottomOffset }]}>
      <TouchableOpacity style={[styles.fab, { backgroundColor: C.actionBlue }]} onPress={onPress} activeOpacity={0.85}>
        <Ionicons name={iconName} size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', right: 20 },
  fab: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', ...Shadow.actionBlueGlow },
});
