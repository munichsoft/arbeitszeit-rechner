import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Spacing, Radius } from '../constants/spacing';
import { useTranslation } from '../hooks/useTranslation';
import { useThemeColors } from '../hooks/useThemeColors';
import { WEEKDAY_LABELS, getCurrentWeekdayIndex, formatDuration } from '../utils/formatTime';
import { useSettingsStore } from '../store/useSettingsStore';

interface WeeklyProgressProps {
  currentHours: number;
  targetHours: number;
}

export default function WeeklyProgress({ currentHours, targetHours }: WeeklyProgressProps) {
  const t = useTranslation();
  const C = useThemeColors();
  const { timeFormat } = useSettingsStore();
  const progress = Math.min(currentHours / Math.max(targetHours, 1), 1);
  const activeDay = getCurrentWeekdayIndex();
  const hoursLabel = formatDuration(currentHours, timeFormat);

  return (
    <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.cardBorder }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: C.onSurface }]}>{t.weekly_progress}</Text>
        <Text style={[styles.goal, { color: C.onSurfaceVariant }]}>{t.weekly_goal}: {targetHours}h</Text>
      </View>
            <View style={styles.hoursRow}>
        <Text style={[styles.currentHours, { color: C.onSurface }]}>{hoursLabel}</Text>
        <Text style={[styles.targetLabel, { color: C.onSurfaceVariant }]}> / {targetHours}h</Text>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: C.surfaceContainerHighest }]}>
        <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: C.actionBlue }]} />
      </View>
      <View style={styles.daysRow}>
        {WEEKDAY_LABELS.map((day, idx) => (
          <Text key={day} style={[styles.dayLabel, { color: idx === activeDay ? C.actionBlue : C.onSurfaceVariant }, idx === activeDay && styles.dayLabelActive]}>
            {day}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius.xl, padding: Spacing.md, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  title: { fontFamily: 'Outfit_600SemiBold', fontSize: 15 },
  goal: { fontFamily: 'Outfit_400Regular', fontSize: 13 },
  hoursRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: Spacing.sm },
  currentHours: { fontFamily: 'Outfit_700Bold', fontSize: 28, lineHeight: 34 },
  targetLabel: { fontFamily: 'Outfit_400Regular', fontSize: 16 },
  progressTrack: { height: 10, borderRadius: Radius.full, overflow: 'hidden', marginBottom: Spacing.sm },
  progressFill: { height: '100%', borderRadius: Radius.full },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayLabel: { fontFamily: 'Outfit_400Regular', fontSize: 13, flex: 1, textAlign: 'center' },
  dayLabelActive: { fontFamily: 'Outfit_700Bold' },
});
