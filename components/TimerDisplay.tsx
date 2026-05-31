import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Spacing, Radius, Shadow } from '../constants/spacing';
import { useTimeStore } from '../store/useTimeStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTranslation } from '../hooks/useTranslation';
import { useThemeColors } from '../hooks/useThemeColors';
import { formatHHMMSS } from '../utils/formatTime';

interface TimerDisplayProps {
  onProjectPress?: () => void;
}

export default function TimerDisplay({ onProjectPress }: TimerDisplayProps) {
  const t = useTranslation();
  const C = useThemeColors();
  const { activeEntryId, activePauseStart, entries, projects, startTimer, stopTimer, togglePause } = useTimeStore();
  const { language } = useSettingsStore();

  const activeEntry = entries.find(e => e.id === activeEntryId) ?? null;
  const project = activeEntry ? projects.find(p => p.id === activeEntry.projectId) : null;
  const isRunning = !!activeEntry;

  const getRunningSeconds = () => {
    if (!activeEntry) return 0;
    const startMs = new Date(activeEntry.startTime).getTime();
    let endMs = Date.now();
    if (activePauseStart) {
      endMs = new Date(activePauseStart).getTime();
    }
    const elapsedMs = endMs - startMs;
    const pauseMs = activeEntry.pauseMinutes * 60000;
    return Math.max(0, Math.floor((elapsedMs - pauseMs) / 1000));
  };

  const [seconds, setSeconds] = useState(getRunningSeconds());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (activeEntry) {
      setSeconds(getRunningSeconds());
      if (activePauseStart) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => setSeconds(getRunningSeconds()), 1000);
      }
    } else {
      setSeconds(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [activeEntryId, activeEntry?.startTime, activeEntry?.pauseMinutes, activePauseStart]);

  const handleToggle = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isRunning) {
      stopTimer();
    } else {
      if (projects.length > 1) {
        setShowPicker(true);
      } else {
        startTimer(projects[0]?.id ?? '');
      }
    }
  };

  const handleStart = (projectId: string) => {
    setShowPicker(false);
    startTimer(projectId);
  };

  return (
    <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.cardBorder }]}>
      <Text style={[styles.sessionLabel, { color: activePauseStart ? C.warningAmber : C.onSurfaceVariant }]}>
        {isRunning 
          ? (activePauseStart ? (language === 'de' ? 'PAUSIERT' : 'PAUSED') : t.current_session.toUpperCase()) 
          : t.no_active_session.toUpperCase()}
      </Text>

      <Text style={[styles.timerText, { color: isRunning ? C.onSurface : C.onSurfaceVariant }]}>
        {formatHHMMSS(seconds)}
      </Text>

      {isRunning && (
        <Pressable onPress={() => { if(projects.length > 1) setShowPicker(true); }} style={[styles.projectChip, { backgroundColor: C.surface, borderWidth: 1, borderColor: C.actionBlue }]}>
          <Ionicons name="briefcase-outline" size={13} color={C.actionBlue} />
          <Text style={[styles.projectChipText, { color: C.actionBlue }]} numberOfLines={1}>
            {project ? project.name : t.no_assignment}
          </Text>
        </Pressable>
      )}

      <View style={styles.buttonRow}>
        {isRunning ? (
          <>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: activePauseStart ? C.actionBlue : C.warningAmber }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                togglePause();
              }}
            >
              <Ionicons name={activePauseStart ? 'play-outline' : 'pause-outline'} size={24} color="#fff" />
              <Text style={styles.actionBtnText}>{activePauseStart ? (language === 'de' ? 'Fortsetzen' : 'Resume') : (language === 'de' ? 'Pause' : 'Pause')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: C.error }]}
              onPress={handleToggle}
            >
              <Ionicons name="stop-circle-outline" size={24} color="#fff" />
              <Text style={styles.actionBtnText}>{t.timer_stop}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: C.actionBlue, shadowColor: C.actionBlue, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 }]}
            onPress={handleToggle}
          >
            <Ionicons name="play-circle-outline" size={26} color="#fff" />
            <Text style={styles.buttonText}>{t.timer_start}</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={showPicker} transparent animationType="fade" onRequestClose={() => setShowPicker(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowPicker(false)}>
          <View style={[styles.modalContent, { backgroundColor: C.surface }]}>
            <Text style={[styles.modalTitle, { color: C.onSurface }]}>{language === 'de' ? 'Job auswählen' : 'Select Job'}</Text>
            {projects.map(p => (
              <TouchableOpacity key={p.id} style={[styles.pickerItem, { borderBottomColor: C.cardBorder }]} onPress={() => handleStart(p.id)}>
                <Text style={[styles.pickerItemText, { color: C.onSurface }]}>{p.name}</Text>
                {p.client ? <Text style={[styles.pickerItemSub, { color: C.onSurfaceVariant }]}>{p.client}</Text> : null}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowPicker(false)}>
              <Text style={[styles.cancelButtonText, { color: C.error }]}>{t.cancel}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl, padding: Spacing.lg,
    alignItems: 'center', borderWidth: 1, gap: Spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  sessionLabel: { fontFamily: 'Outfit_600SemiBold', fontSize: 12, letterSpacing: 0.6 },
  timerText: { fontFamily: 'Outfit_700Bold', fontSize: 56, lineHeight: 64, letterSpacing: -1.04 },
  projectChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 5, maxWidth: '80%' },
  projectChipText: { fontFamily: 'Outfit_500Medium', fontSize: 13 },
  buttonRow: { flexDirection: 'row', width: '100%', gap: Spacing.sm, marginTop: Spacing.xs },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, borderRadius: Radius.lg, paddingVertical: Spacing.md, minHeight: 64 },
  actionBtnText: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#fff' },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, borderRadius: Radius.lg, paddingVertical: Spacing.md, width: '100%', minHeight: 64 },
  buttonText: { fontFamily: 'Outfit_700Bold', fontSize: 18, color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  modalContent: { width: '100%', borderRadius: Radius.xl, padding: Spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  modalTitle: { fontFamily: 'Outfit_700Bold', fontSize: 18, marginBottom: Spacing.md, textAlign: 'center' },
  pickerItem: { paddingVertical: Spacing.md, borderBottomWidth: 1 },
  pickerItemText: { fontFamily: 'Outfit_600SemiBold', fontSize: 16 },
  pickerItemSub: { fontFamily: 'Outfit_400Regular', fontSize: 13, marginTop: 2 },
  cancelButton: { marginTop: Spacing.lg, paddingVertical: Spacing.sm, alignItems: 'center' },
  cancelButtonText: { fontFamily: 'Outfit_600SemiBold', fontSize: 16 },
});
