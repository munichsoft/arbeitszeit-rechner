import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { useTimeStore } from '../../store/useTimeStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useTranslation } from '../../hooks/useTranslation';
import { useThemeColors } from '../../hooks/useThemeColors';
import TimerDisplay from '../../components/TimerDisplay';
import WeeklyProgress from '../../components/WeeklyProgress';
import TimeEntryCard from '../../components/TimeEntryCard';
import EntryEditModal from '../../components/EntryEditModal';
import EmptyState from '../../components/EmptyState';
import { formatEarnings, formatDuration } from '../../utils/formatTime';
import { runAllChecks } from '../../utils/germanLaborLaw';
import type { TimeEntry } from '../../store/useTimeStore';

export default function DashboardScreen() {
  const router = useRouter();
  const t = useTranslation();
  const C = useThemeColors();
  const { entries, projects, getWeeklyHours, getMonthlyHours, getTodayHours } = useTimeStore();
  const { hourlyRate, currencySymbol, weeklyTargetHours, userName, timeFormat } = useSettingsStore();

  const [editEntry, setEditEntry] = useState<TimeEntry | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const weeklyHours = getWeeklyHours();
  const monthlyHours = getMonthlyHours();
  const todayHours = getTodayHours();
  const todayEarnings = formatEarnings(todayHours, hourlyRate, currencySymbol);

  // ArbZG checks
  const todayEntries = entries.filter(e => {
    const d = new Date(e.startTime);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  const warnings = runAllChecks(todayHours, todayHours, 30, todayEntries);

  // Recent 3 entries
  const recentEntries = [...entries]
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 3);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: C.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: C.onSurfaceVariant }]}>
            {userName ? `Hallo, ${userName.split(' ')[0]} 👋` : '👋'}
          </Text>
          <Text style={[styles.headerTitle, { color: C.onSurface }]}>Arbeitszeit Rechner</Text>
        </View>
        <View style={[styles.avatar, { backgroundColor: C.primaryContainer }]}>
          <Text style={[styles.avatarText, { color: C.onPrimaryContainer }]}>
            {userName ? userName.slice(0, 2).toUpperCase() : '?'}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

              {/* ArbZG Warning */}
        {warnings.length > 0 && (
          <View style={[styles.warningBanner, { backgroundColor: C.warningAmber + '22', borderColor: C.warningAmber + '66' }]}>
            <Ionicons name="warning-outline" size={16} color={C.warningAmber} />
            <Text style={[styles.warningText, { color: C.warningAmber }]} numberOfLines={3}>{warnings[0].message}</Text>
          </View>
        )}

        {/* Timer */}
        <TimerDisplay />

        {/* Weekly Progress */}
        <WeeklyProgress currentHours={weeklyHours} targetHours={weeklyTargetHours} />

                {/* Quick stat row */}
        <View style={styles.statRow}>
          <View style={[styles.statCard, { backgroundColor: C.surface, borderColor: C.cardBorder }]}>
            <Ionicons name="cash-outline" size={18} color={C.onSurfaceVariant} />
            <Text style={[styles.statLabel, { color: C.onSurfaceVariant }]}>{t.todays_earnings}</Text>
            <Text style={[styles.statValue, { color: C.onSurface }]}>{todayEarnings}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: C.surface, borderColor: C.cardBorder }]}>
            <Ionicons name="calendar-outline" size={18} color={C.onSurfaceVariant} />
            <Text style={[styles.statLabel, { color: C.onSurfaceVariant }]}>{t.monthly_hours}</Text>
            <Text style={[styles.statValue, { color: C.onSurface }]}>{formatDuration(monthlyHours, timeFormat)}</Text>
          </View>
        </View>

                {/* Recent Entries */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: C.onSurface }]}>{t.recent_entries}</Text>
          <TouchableOpacity onPress={() => router.push('/aktivitat')}>
            <Text style={[styles.sectionLink, { color: C.actionBlue }]}>{t.view_all}</Text>
          </TouchableOpacity>
        </View>

        {recentEntries.length === 0 ? (
          <EmptyState
            iconName="timer-outline"
            title={t.empty_dashboard_title}
            hint={t.empty_dashboard_hint}
          />
        ) : (
          recentEntries.map(entry => (
            <TimeEntryCard
              key={entry.id}
              entry={entry}
              compact
              onPress={() => { setEditEntry(entry); setEditModalVisible(true); }}
            />
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <EntryEditModal visible={editModalVisible} entry={editEntry} onClose={() => setEditModalVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.containerPadding, paddingVertical: Spacing.sm },
  greeting: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.containerPadding, gap: Spacing.sm },
  warningBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.xs, borderRadius: Radius.lg, padding: Spacing.sm, borderWidth: 1 },
  warningText: { fontFamily: 'Inter_500Medium', fontSize: 13, flex: 1, lineHeight: 18 },
  statRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: { flex: 1, borderRadius: Radius.xl, padding: Spacing.md, borderWidth: 1, ...Shadow.level1, gap: 4 },
  statLabel: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  statValue: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.xs },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  sectionLink: { fontFamily: 'Inter_500Medium', fontSize: 14 },
});
