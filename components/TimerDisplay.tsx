import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Spacing, Radius, Shadow } from '../constants/spacing';
import { useTimeStore } from '../store/useTimeStore';
import { useTranslation } from '../hooks/useTranslation';
import { useThemeColors } from '../hooks/useThemeColors';
import { formatHHMMSS, elapsedSeconds } from '../utils/formatTime';

interface TimerDisplayProps {
  onProjectPress?: () => void;
}

export default function TimerDisplay({ onProjectPress }: TimerDisplayProps) {
  const t = useTranslation();
  const C = useThemeColors();
  const { activeEntryId, entries, projects, startTimer, stopTimer } = useTimeStore();

  const activeEntry = entries.find(e => e.id === activeEntryId) ?? null;
  const project = activeEntry ? projects.find(p => p.id === activeEntry.projectId) : null;
  const isRunning = !!activeEntry;

  const [seconds, setSeconds] = useState(activeEntry ? elapsedSeconds(activeEntry.startTime) : 0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (activeEntry) {
      setSeconds(elapsedSeconds(activeEntry.startTime));
      intervalRef.current = setInterval(() => setSeconds(elapsedSeconds(activeEntry.startTime)), 1000);
    } else {
      setSeconds(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [activeEntryId, activeEntry?.startTime]);

  const handleToggle = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isRunning) {
      stopTimer();
    } else {
      const firstProject = projects[0];
      startTimer(firstProject?.id ?? '');
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.cardBorder }]}>
      <Text style={[styles.sessionLabel, { color: C.onSurfaceVariant }]}>
        {isRunning ? t.current_session.toUpperCase() : t.no_active_session.toUpperCase()}
      </Text>

      <Text style={[styles.timerText, { color: isRunning ? C.onSurface : C.onSurfaceVariant }]}>
        {formatHHMMSS(seconds)}
      </Text>

      {isRunning && (
        <Pressable onPress={onProjectPress} style={[styles.projectChip, { backgroundColor: C.secondaryFixed }]}>
          <Ionicons name="briefcase-outline" size={13} color={C.actionBlue} />
          <Text style={[styles.projectChipText, { color: C.actionBlue }]} numberOfLines={1}>
            {project ? project.name : t.no_assignment}
          </Text>
        </Pressable>
      )}

      <TouchableOpacity
        style={[
          styles.button,
          isRunning
            ? { backgroundColor: C.error }
            : { backgroundColor: C.actionBlue, shadowColor: C.actionBlue, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
        ]}
        onPress={handleToggle}
        activeOpacity={0.85}
      >
        <Ionicons name={isRunning ? 'stop-circle-outline' : 'play-circle-outline'} size={26} color="#fff" />
        <Text style={styles.buttonText}>{isRunning ? t.timer_stop : t.timer_start}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl, padding: Spacing.lg,
    alignItems: 'center', borderWidth: 1, gap: Spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  sessionLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 0.6 },
  timerText: { fontFamily: 'Inter_700Bold', fontSize: 52, lineHeight: 60, letterSpacing: -1.04 },
  projectChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 5, maxWidth: '80%' },
  projectChipText: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, borderRadius: Radius.lg, paddingVertical: Spacing.md, width: '100%', marginTop: Spacing.xs, minHeight: 64 },
  buttonText: { fontFamily: 'Inter_700Bold', fontSize: 18, color: '#fff' },
});
