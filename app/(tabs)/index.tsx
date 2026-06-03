import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format, startOfWeek, addDays } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { useTimeStore, getDurationHours } from '../../store/useTimeStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useTranslation } from '../../hooks/useTranslation';
import { useThemeColors } from '../../hooks/useThemeColors';
import TimerDisplay from '../../components/TimerDisplay';
import TimeEntryCard from '../../components/TimeEntryCard';
import EntryEditModal from '../../components/EntryEditModal';
import FAB from '../../components/FAB';
import EmptyState from '../../components/EmptyState';
import { formatEarnings, formatDuration } from '../../utils/formatTime';
import { runAllChecks } from '../../utils/germanLaborLaw';
import type { TimeEntry } from '../../store/useTimeStore';

type OvertimeMode = 'week' | 'month' | 'year';

function formatOvertimeDelta(hours: number): string {
  const abs = Math.abs(hours);
  const h = Math.floor(abs);
  const m = Math.round((abs - h) * 60);
  const sign = hours >= 0 ? '+' : '−';
  if (h === 0) return `${sign}${m}m`;
  if (m === 0) return `${sign}${h}h`;
  return `${sign}${h}h ${m}m`;
}

export default function DashboardScreen() {
  const router = useRouter();
  const t = useTranslation();
  const C = useThemeColors();
  const { entries, getWeeklyHours, getMonthlyHours, getTodayHours, getTodayEarnings, getWeeklyOvertime, getCumulativeOvertime } = useTimeStore();
  const { hourlyRate, currencySymbol, weeklyTargetHours, userName, timeFormat, showEarnings, enableTimer, jobStartDate, language } = useSettingsStore();
  const locale = language === 'de' ? de : enUS;

  const [editEntry, setEditEntry] = useState<TimeEntry | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [defaultDate, setDefaultDate] = useState<Date | undefined>(undefined);
  const [overtimeMode, setOvertimeMode] = useState<OvertimeMode>('week');

  const weeklyHours = getWeeklyHours();
  const monthlyHours = getMonthlyHours();
  const todayHours = getTodayHours();
  const todayEarnings = `${currencySymbol}${getTodayEarnings(hourlyRate).toFixed(2)}`;

  // Overtime calculations
  const weeklyOT = getWeeklyOvertime(weeklyTargetHours);
  const now = new Date();
  const jobFloor = jobStartDate ? new Date(jobStartDate) : null;
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  // If jobStartDate is set, use it as floor (whichever is later)
  const monthSince = jobFloor && jobFloor > startOfMonth ? jobFloor : startOfMonth;
  const yearSince  = jobFloor ?? startOfYear;
  // Cumulative past completed weeks + current running week delta
  const monthlyOT = getCumulativeOvertime(weeklyTargetHours, monthSince) + weeklyOT;
  const yearlyOT  = getCumulativeOvertime(weeklyTargetHours, yearSince)  + weeklyOT;

  const activeOT = overtimeMode === 'week' ? weeklyOT : overtimeMode === 'month' ? monthlyOT : yearlyOT;
  const otLabel = overtimeMode === 'week' ? t.overtime_this_week : overtimeMode === 'month' ? t.overtime_this_month : t.overtime_this_year;
  const isPositive = activeOT >= 0;

  // Theme-aware overtime colors — explicit palettes per mode
  const isDark = C.background === '#0F1117';

  // Undertime (negative) palette
  const negColor  = isDark ? '#F87171' : '#E05252'; // Softer, natural red
  const negBg     = isDark ? 'rgba(248,113,113,0.12)' : C.surface;
  const negBorder = isDark ? 'rgba(248,113,113,0.30)' : '#FECACA'; // Very soft red border
  const negIconBg = isDark ? 'rgba(248,113,113,0.18)' : '#FEE2E2';

  // Overtime (positive) palette
  const posColor  = isDark ? '#34D399' : '#059669'; // Slightly deeper, more readable green
  const posBg     = isDark ? 'rgba(52,211,153,0.12)' : C.surface;
  const posBorder = isDark ? 'rgba(52,211,153,0.30)' : '#A7F3D0'; // Very soft green border
  const posIconBg = isDark ? 'rgba(52,211,153,0.18)' : '#D1FAE5';

  const otColor   = isPositive ? posColor  : negColor;
  const otBg      = isPositive ? posBg     : negBg;
  const otBorder  = isPositive ? posBorder : negBorder;
  const otIconBg  = isPositive ? posIconBg : negIconBg;
  const otIconName: keyof typeof Ionicons.glyphMap = isPositive ? 'trending-up-outline' : 'trending-down-outline';

  const cycleMode = () => {
    setOvertimeMode(m => m === 'week' ? 'month' : m === 'month' ? 'year' : 'week');
  };

  // ArbZG checks
  const todayEntries = entries.filter(e => {
    const d = new Date(e.startTime);
    const n = new Date();
    return d.toDateString() === n.toDateString();
  });
  const warnings = runAllChecks(todayHours, todayHours, 30, todayEntries);

  // Recent 3 entries
  const recentEntries = [...entries]
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 3);

  // Week Strip data
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayEntries = entries.filter(e => format(new Date(e.startTime), 'yyyy-MM-dd') === dateStr);
      const hours = dayEntries.reduce((acc, e) => acc + getDurationHours(e), 0);
      const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');
      const dayLabel = format(date, 'EEEEE', { locale }); // 1-letter day abbrev
      const dow = date.getDay();
      const isWeekend = dow === 0 || dow === 6;
      const nonWorkEntry = dayEntries.find(e => e.type && e.type !== 'work');
      return { date, dateStr, hours, isToday, dayLabel, isWeekend, dayEntries, nonWorkEntry };
    });
  }, [entries, language]);

  const maxHours = Math.max(...weekDays.map(d => d.hours), weeklyTargetHours / 5, 1);
  const dailyTarget = weeklyTargetHours / 5;

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

        {/* Timer — only shown when enabled in settings */}
        {enableTimer && <TimerDisplay />}

        {/* Week Strip */}
        <View style={[styles.weekStrip, { backgroundColor: C.surface, borderColor: C.cardBorder }]}>
          <Text style={[styles.weekStripTitle, { color: C.onSurface }]}>{t.this_week_strip}</Text>
          <View style={styles.weekStripRow}>
            {weekDays.map(day => {
              const barPct = day.hours > 0 ? Math.min(day.hours / maxHours, 1) : 0;
              const atTarget = day.hours >= dailyTarget - 0.05;
              const barColor = day.isToday
                ? C.actionBlue
                : atTarget && day.hours > 0
                  ? '#10B981'
                  : day.hours > 0
                    ? C.actionBlue + 'BB'
                    : C.surfaceContainerHighest;
              return (
                <TouchableOpacity
                  key={day.dateStr}
                  style={styles.weekDayCol}
                  onPress={() => { 
                    if (day.dayEntries.length > 0) {
                      setEditEntry(day.dayEntries[0]);
                      setDefaultDate(undefined);
                    } else {
                      setEditEntry(null); 
                      setDefaultDate(day.date);
                    }
                    setEditModalVisible(true); 
                  }}
                  activeOpacity={0.7}
                >
                  {/* Bar */}
                  <View style={[
                    styles.barTrack, 
                    { backgroundColor: day.nonWorkEntry ? '#F59E0B22' : C.surfaceContainerHighest }
                  ]}>
                    {day.nonWorkEntry ? (
                      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Ionicons 
                          name={
                            day.nonWorkEntry.type === 'vacation' ? 'umbrella-outline' :
                            day.nonWorkEntry.type === 'sick' ? 'thermometer-outline' :
                            day.nonWorkEntry.type === 'holiday' ? 'sparkles-outline' :
                            'school-outline'
                          } 
                          size={18} 
                          color={
                            day.nonWorkEntry.type === 'vacation' ? '#F59E0B' :
                            day.nonWorkEntry.type === 'sick' ? '#EF4444' :
                            day.nonWorkEntry.type === 'holiday' ? '#8B5CF6' :
                            '#3B82F6'
                          } 
                        />
                      </View>
                    ) : (
                      <View style={[
                        styles.barFill,
                        {
                          height: `${Math.max(barPct * 100, day.hours > 0 ? 4 : 0)}%`,
                          backgroundColor: barColor,
                          borderRadius: barPct > 0.95 ? Radius.sm : Radius.sm,
                        },
                      ]} />
                    )}
                  </View>
                  {/* Hours label */}
                  <Text style={[
                    styles.barHours,
                    { color: day.hours > 0 || day.nonWorkEntry ? C.onSurface : C.onSurfaceVariant },
                  ]}>
                    {day.nonWorkEntry 
                      ? t[`type_${day.nonWorkEntry.type}` as keyof typeof t]?.toString().substring(0, 3) 
                      : day.hours > 0 ? `${Math.floor(day.hours)}h` : ''}
                  </Text>
                  {/* Day label */}
                  <Text style={[
                    styles.barDay,
                    {
                      color: day.isToday ? C.actionBlue : day.isWeekend ? '#EF4444' : C.onSurfaceVariant,
                      fontFamily: day.isToday ? 'Outfit_700Bold' : 'Outfit_500Medium',
                    },
                  ]}>{day.dayLabel}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Quick stat row */}
        <View style={styles.statRow}>
          {showEarnings && (
            <View style={[styles.statCard, { backgroundColor: C.surface, borderColor: C.cardBorder }]}>
              <Ionicons name="cash-outline" size={18} color={C.onSurfaceVariant} />
              <Text style={[styles.statLabel, { color: C.onSurfaceVariant }]}>{t.todays_earnings}</Text>
              <Text style={[styles.statValue, { color: C.onSurface }]}>{todayEarnings}</Text>
            </View>
          )}
          <View style={[styles.statCard, { backgroundColor: C.surface, borderColor: C.cardBorder }]}>
            <Ionicons name="calendar-outline" size={18} color={C.onSurfaceVariant} />
            <Text style={[styles.statLabel, { color: C.onSurfaceVariant }]}>{t.monthly_hours}</Text>
            <Text style={[styles.statValue, { color: C.onSurface }]}>{formatDuration(monthlyHours, timeFormat)}</Text>
          </View>
        </View>

        {/* Überstunden Tile */}
        <TouchableOpacity
          activeOpacity={0.82}
          onPress={cycleMode}
          style={[styles.overtimeTile, { backgroundColor: otBg, borderColor: otBorder }]}
        >
          {/* Left: icon + labels */}
          <View style={styles.overtimeLeft}>
            <View style={[styles.overtimeIconBg, { backgroundColor: otIconBg }]}>
              <Ionicons name={otIconName} size={22} color={otColor} />
            </View>
            <View style={styles.overtimeLabelCol}>
              <Text style={[styles.overtimeTitle, { color: otColor }]}>{t.overtime}</Text>
              <View style={styles.overtimePeriodRow}>
                <Text style={[styles.overtimePeriod, { color: otColor + 'BB' }]}>{otLabel}</Text>
                <Ionicons name="chevron-forward" size={12} color={otColor + '99'} />
              </View>
            </View>
          </View>

          {/* Right: value */}
          <View style={styles.overtimeRight}>
            <Text style={[styles.overtimeValue, { color: otColor }]}>
              {formatOvertimeDelta(activeOT)}
            </Text>
            {!isPositive && (
              <Text style={[styles.overtimeHint, { color: otColor + 'BB' }]}>{t.overtime_undertime_hint}</Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Recent Entries */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: C.onSurface }]}>{t.recent_entries}</Text>
          <View style={styles.sectionHeaderActions}>
            <TouchableOpacity onPress={() => router.push('/aktivitat')}>
              <Text style={[styles.sectionLink, { color: C.actionBlue }]}>{t.view_all}</Text>
            </TouchableOpacity>
          </View>
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
              compact={true}
              showDate={true}
              onPress={() => { setEditEntry(entry); setEditModalVisible(true); }}
            />
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <FAB onPress={() => { setEditEntry(null); setDefaultDate(undefined); setEditModalVisible(true); }} />
      <EntryEditModal visible={editModalVisible} entry={editEntry} defaultDate={defaultDate} onClose={() => setEditModalVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.containerPadding, paddingVertical: Spacing.sm },
  greeting: { fontFamily: 'Outfit_400Regular', fontSize: 13 },
  headerTitle: { fontFamily: 'Outfit_700Bold', fontSize: 20 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'Outfit_600SemiBold', fontSize: 14 },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.containerPadding, gap: Spacing.sm },
  warningBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.xs, borderRadius: Radius.lg, padding: Spacing.sm, borderWidth: 1 },
  warningText: { fontFamily: 'Outfit_500Medium', fontSize: 13, flex: 1, lineHeight: 18 },
  statRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: { flex: 1, borderRadius: Radius.xl, padding: Spacing.md, borderWidth: 1, ...Shadow.level1, gap: 4 },
  statLabel: { fontFamily: 'Outfit_400Regular', fontSize: 12 },
  statValue: { fontFamily: 'Outfit_700Bold', fontSize: 18 },

  // Überstunden tile
  overtimeTile: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: Radius.xl, borderWidth: 1.5, padding: Spacing.md, ...Shadow.level1 },
  overtimeLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  overtimeIconBg: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  overtimeLabelCol: { gap: 2 },
  overtimeTitle: { fontFamily: 'Outfit_700Bold', fontSize: 15 },
  overtimePeriodRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  overtimePeriod: { fontFamily: 'Outfit_400Regular', fontSize: 12 },
  overtimeRight: { alignItems: 'flex-end', gap: 2 },
  overtimeValue: { fontFamily: 'Outfit_700Bold', fontSize: 26 },
  overtimeHint: { fontFamily: 'Outfit_400Regular', fontSize: 11 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.xs },
  sectionHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  sectionTitle: { fontFamily: 'Outfit_700Bold', fontSize: 18 },
  sectionLink: { fontFamily: 'Outfit_500Medium', fontSize: 14 },
  addEntryBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },

  // Week Strip
  weekStrip: { borderRadius: Radius.xl, borderWidth: 1, padding: Spacing.md, ...Shadow.level1 },
  weekStripTitle: { fontFamily: 'Outfit_700Bold', fontSize: 16, marginBottom: Spacing.sm },
  weekStripRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  weekDayCol: { flex: 1, alignItems: 'center', gap: 4 },
  barTrack: { width: '100%', height: 72, borderRadius: Radius.sm, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: Radius.sm },
  barHours: { fontFamily: 'Outfit_500Medium', fontSize: 10, minHeight: 14 },
  barDay: { fontSize: 12 },
});
