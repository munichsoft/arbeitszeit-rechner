import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, addMonths, subMonths, startOfMonth } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { Spacing, Radius } from '../../constants/spacing';
import { useTimeStore } from '../../store/useTimeStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useThemeColors } from '../../hooks/useThemeColors';
import EntryEditModal from '../../components/EntryEditModal';
import FAB from '../../components/FAB';
import MonthCalendarView from '../../components/MonthCalendarView';
import type { TimeEntry } from '../../store/useTimeStore';

export default function AktivitaetScreen() {
  const C = useThemeColors();
  const { getEntriesForMonth } = useTimeStore();
  const { userName, language } = useSettingsStore();
  const initials = userName ? userName.slice(0, 2).toUpperCase() : '?';
  const locale = language === 'de' ? de : enUS;

  // Month view state
  const now = new Date();
  const [calMonth, setCalMonth] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const monthEntries = getEntriesForMonth(calMonth.getFullYear(), calMonth.getMonth());
  const monthLabel = format(calMonth, 'MMMM yyyy', { locale });

  const [editEntry, setEditEntry] = useState<TimeEntry | null>(null);
  const [entryDefaultDate, setEntryDefaultDate] = useState<Date | undefined>(undefined);
  const [entryModalVisible, setEntryModalVisible] = useState(false);

  const openEntryModal = useCallback((entry?: TimeEntry | null, date?: Date) => {
    setEditEntry(entry ?? null);
    setEntryDefaultDate(date);
    setEntryModalVisible(true);
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: C.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: C.onSurface }]}>Arbeitszeit Rechner</Text>
        <View style={[styles.avatar, { backgroundColor: C.primaryContainer }]}><Text style={[styles.avatarText, { color: C.onPrimaryContainer }]}>{initials}</Text></View>
      </View>

      {/* Month navigator */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={() => setCalMonth(m => subMonths(m, 1))} style={styles.monthNavBtn}>
          <Ionicons name="chevron-back" size={22} color={C.actionBlue} />
        </TouchableOpacity>
        <Text style={[styles.monthNavLabel, { color: C.onSurface }]}>{monthLabel}</Text>
        <TouchableOpacity
          onPress={() => setCalMonth(m => addMonths(m, 1))}
          style={styles.monthNavBtn}
          disabled={calMonth >= startOfMonth(new Date())}
        >
          <Ionicons name="chevron-forward" size={22}
            color={calMonth >= startOfMonth(new Date()) ? C.onSurfaceVariant : C.actionBlue} />
        </TouchableOpacity>
      </View>
      <MonthCalendarView
        year={calMonth.getFullYear()}
        month={calMonth.getMonth()}
        entries={monthEntries}
        onDayPress={(dateStr, existing) => {
          openEntryModal(existing ?? null, existing ? undefined : new Date(dateStr));
        }}
      />

      <FAB onPress={() => {
        openEntryModal(null, new Date(calMonth.getFullYear(), calMonth.getMonth()));
      }} />

      <EntryEditModal
        visible={entryModalVisible}
        entry={editEntry}
        defaultDate={entryDefaultDate}
        onClose={() => setEntryModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.containerPadding, paddingVertical: Spacing.sm },
  headerTitle: { fontFamily: 'Outfit_700Bold', fontSize: 20 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'Outfit_600SemiBold', fontSize: 12 },
  // Month navigator
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.containerPadding, paddingVertical: Spacing.xs, marginBottom: Spacing.xs },
  monthNavBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  monthNavLabel: { fontFamily: 'Outfit_700Bold', fontSize: 18, textTransform: 'capitalize' },
});
