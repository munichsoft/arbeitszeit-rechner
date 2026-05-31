import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, Radius } from '../constants/spacing';
import { useThemeColors } from '../hooks/useThemeColors';

interface EmptyStateProps {
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
  hint: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export default function EmptyState({ iconName, title, hint, ctaLabel, onCta }: EmptyStateProps) {
  const C = useThemeColors();
  return (
    <View style={styles.container}>
      <View style={[styles.iconWrapper, { backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.cardBorder }]}>
        <Ionicons name={iconName} size={48} color={C.actionBlue} />
      </View>
      <Text style={[styles.title, { color: C.onSurface }]}>{title}</Text>
      <Text style={[styles.hint, { color: C.onSurfaceVariant }]}>{hint}</Text>
      {ctaLabel && onCta && (
        <TouchableOpacity style={[styles.cta, { backgroundColor: C.actionBlue }]} onPress={onCta}>
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.xl },
  iconWrapper: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  title: { fontFamily: 'Outfit_700Bold', fontSize: 20, textAlign: 'center', marginBottom: Spacing.sm },
  hint: { fontFamily: 'Outfit_400Regular', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.lg },
  cta: { borderRadius: Radius.lg, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 2 },
  ctaText: { fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: '#fff' },
});
