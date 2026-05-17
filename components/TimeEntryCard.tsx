import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, Radius } from '../constants/spacing';
import { useTimeStore, getDurationHours, type TimeEntry } from '../store/useTimeStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTranslation } from '../hooks/useTranslation';
import { useThemeColors } from '../hooks/useThemeColors';
import { formatTimeRange, formatDuration, formatEarnings, formatHHMMSS, elapsedSeconds } from '../utils/formatTime';

interface TimeEntryCardProps {
  entry: TimeEntry;
  onPress?: () => void;
  onResume?: () => void;
  compact?: boolean;
}

export default function TimeEntryCard({ entry, onPress, onResume, compact = false }: TimeEntryCardProps) {
  const t = useTranslation();
  const C = useThemeColors();
  const { projects, activeEntryId, stopTimer } = useTimeStore();
  const { currencySymbol, hourlyRate, timeFormat, showEarnings } = useSettingsStore();

  const project = projects.find(p => p.id === entry.projectId);
  const isActive = entry.id === activeEntryId;

  const [liveSeconds, setLiveSeconds] = useState(isActive ? elapsedSeconds(entry.startTime) : 0);
  useEffect(() => {
    if (!isActive) { setLiveSeconds(0); return; }
    setLiveSeconds(elapsedSeconds(entry.startTime));
    const interval = setInterval(() => setLiveSeconds(elapsedSeconds(entry.startTime)), 1000);
    return () => clearInterval(interval);
  }, [isActive, entry.startTime]);

  const durationHours = isActive ? liveSeconds / 3600 : getDurationHours(entry);
  const rate = project?.hourlyRate ?? hourlyRate;
  const earnings = formatEarnings(durationHours, rate, currencySymbol);
  const timeRange = formatTimeRange(entry.startTime, isActive ? null : entry.endTime);
  const durationLabel = isActive ? formatHHMMSS(liveSeconds) : formatDuration(durationHours, timeFormat);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={styles.wrapper}>
      <View style={[styles.card, { backgroundColor: C.surface, borderColor: isActive ? C.activeBlue : C.cardBorder }]}>
        {isActive && <View style={[styles.leftBorder, { backgroundColor: C.activeBlue }]} />}
        <View style={styles.content}>
          <View style={styles.row}>
            <Text style={[styles.projectName, { color: C.onSurface }]} numberOfLines={1}>
              {project?.name ?? t.no_assignment}
            </Text>
            <Text style={[styles.duration, { color: isActive ? C.activeBlue : C.onSurface }]}>
              {durationLabel}
            </Text>
          </View>
          <View style={styles.row}>
            {project && (
              <View style={[styles.chip, { backgroundColor: project.color + '28' }]}>
                <Text style={[styles.chipText, { color: project.color }]}>{project.client}</Text>
              </View>
            )}
            <Text style={[styles.timeRange, { color: C.onSurfaceVariant }]}>{timeRange}</Text>
          </View>
          {!compact && (
            <View style={[styles.row, styles.bottomRow]}>
              {showEarnings && (
                <Text style={[styles.earnings, { color: C.onSurface }]}>{entry.billable ? earnings : '—'}</Text>
              )}
              <TouchableOpacity
                onPress={() => isActive ? stopTimer() : onResume?.()}
                style={[styles.actionBtn, { backgroundColor: isActive ? C.errorContainer : C.surfaceContainerLow }]}
                hitSlop={12}
              >
                <Ionicons name={isActive ? 'stop' : 'play'} size={16} color={isActive ? C.error : C.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: Spacing.xs },
  card: { borderRadius: Radius.xl, borderWidth: 1, overflow: 'hidden', flexDirection: 'row', minHeight: 80, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  leftBorder: { width: 4 },
  content: { flex: 1, padding: Spacing.md, gap: 6, justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bottomRow: { marginTop: 4 },
  projectName: { fontFamily: 'Inter_600SemiBold', fontSize: 15, flex: 1, marginRight: Spacing.xs },
  duration: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  chip: { borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  chipText: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  timeRange: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  earnings: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  actionBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
