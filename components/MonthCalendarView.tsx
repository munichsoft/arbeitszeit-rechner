import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, getDaysInMonth } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { Spacing, Radius, Shadow } from '../constants/spacing';
import { getDurationHours } from '../store/useTimeStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTranslation } from '../hooks/useTranslation';
import { useThemeColors } from '../hooks/useThemeColors';
import TimeEntryCard from './TimeEntryCard';
import type { TimeEntry, EntryType } from '../store/useTimeStore';

// ─── Type Config ────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<EntryType, { icon: string; color: string }> = {
  work:     { icon: 'briefcase-outline',   color: '' },
  vacation: { icon: 'umbrella-outline',    color: '#F59E0B' },
  sick:     { icon: 'thermometer-outline', color: '#EF4444' },
  holiday:  { icon: 'sparkles-outline',    color: '#8B5CF6' },
  school:   { icon: 'school-outline',      color: '#3B82F6' },
};

// ─── Component ──────────────────────────────────────────────────────────────

interface MonthCalendarViewProps {
  year: number;
  month: number; // 0-indexed (0 = January)
  entries: TimeEntry[];
  onDayPress: (dateStr: string, entry?: TimeEntry) => void;
}

interface DayData {
  dateStr: string;
  date: Date;
  dayName: string;
  isWeekend: boolean;
  isToday: boolean;
  isFuture: boolean;
  workEntries: TimeEntry[];
  nonWorkEntry: TimeEntry | undefined;
  totalHours: number;
  totalPauseMinutes: number;
  dominantType: EntryType;
}

export default function MonthCalendarView({ year, month, entries, onDayPress }: MonthCalendarViewProps) {
  const t = useTranslation();
  const C = useThemeColors();
  const { language, hourlyRate, currencySymbol, showEarnings } = useSettingsStore();
  const locale = language === 'de' ? de : enUS;

  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const today = new Date();

  const days: DayData[] = useMemo(() => {
    const count = getDaysInMonth(new Date(year, month));
    return Array.from({ length: count }, (_, i) => {
      const date = new Date(year, month, i + 1);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayEntries = entries.filter(e => format(new Date(e.startTime), 'yyyy-MM-dd') === dateStr);
      const workEntries = dayEntries.filter(e => (e.type ?? 'work') === 'work');
      const nonWorkEntry = dayEntries.find(e => e.type && e.type !== 'work');
      const dow = date.getDay(); // 0=Sun, 6=Sat

      return {
        dateStr,
        date,
        dayName: format(date, 'EEEE', { locale }),
        isWeekend: dow === 0 || dow === 6,
        isToday: dateStr === todayStr,
        isFuture: date > today && dateStr !== todayStr,
        workEntries,
        nonWorkEntry,
        totalHours: workEntries.reduce((acc, e) => acc + getDurationHours(e), 0),
        totalPauseMinutes: workEntries.reduce((acc, e) => acc + (e.pauseMinutes || 0), 0),
        dominantType: (nonWorkEntry?.type ?? 'work') as EntryType,
      };
    });
  }, [year, month, entries, language]);

  // ── Totals ──────────────────────────────────────────────────────────────
  const monthHours = days.reduce((a, d) => a + d.totalHours, 0);
  const monthPause = days.reduce((a, d) => a + d.totalPauseMinutes, 0);
  const monthEarnings = monthHours * hourlyRate;

  const fmtHours = (h: number) => {
    if (h === 0) return '--';
    const hh = Math.floor(h);
    const mm = String(Math.round((h - hh) * 60)).padStart(2, '0');
    return `${hh}:${mm}`;
  };
  const fmtPause = (m: number) => {
    const rounded = Math.round(m);
    if (rounded === 0) return '--';
    const h = Math.floor(rounded / 60);
    const rem = rounded % 60;
    return h > 0 ? `${h}h ${rem}'` : `${rounded}'`;
  };

  return (
    <View style={styles.container}>
      {/* Day rows */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {days.map(day => {
          const typeConf = TYPE_CONFIG[day.dominantType];
          // Date text color: today=blue, weekend=red, future=muted, normal=onSurface
          const dateColor = day.isToday
            ? C.actionBlue
            : day.isWeekend
              ? '#EF4444'
              : day.isFuture
                ? C.onSurfaceVariant
                : C.onSurface;

          const hasEntry = day.workEntries.length > 0 || !!day.nonWorkEntry;

          const isExpanded = expandedDate === day.dateStr;

          return (
            <View
              key={day.dateStr}
              style={[
                styles.dayContainer,
                {
                  backgroundColor: day.isToday ? C.actionBlue + '14' : C.surface,
                  borderColor: day.isToday ? C.actionBlue + '55' : C.cardBorder,
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => {
                  if (hasEntry) {
                    setExpandedDate(isExpanded ? null : day.dateStr);
                  } else {
                    onDayPress(day.dateStr);
                  }
                }}
                activeOpacity={0.72}
                style={styles.dayRow}
              >
                {/* Today accent stripe */}
              {day.isToday && <View style={[styles.todayStripe, { backgroundColor: C.actionBlue }]} />}

              {/* Left: date + weekday */}
              <View style={styles.dayLeft}>
                <Text style={[
                  styles.dayDate,
                  { color: dateColor },
                  day.isToday && styles.dayDateBold,
                ]}>
                  {format(day.date, 'dd.MM.yyyy')}
                </Text>
                <Text style={[
                  styles.dayName,
                  { color: day.isWeekend ? '#EF444488' : day.isFuture ? C.onSurfaceVariant + '88' : C.onSurfaceVariant },
                ]}>
                  {day.dayName}
                </Text>
              </View>

              {/* Right: type badge OR pause/hours columns */}
              {day.nonWorkEntry ? (
                <View style={[
                  styles.typeBadge,
                  { backgroundColor: typeConf.color + '20', borderColor: typeConf.color + '55' },
                ]}>
                  <Ionicons name={typeConf.icon as any} size={13} color={typeConf.color} />
                  <Text style={[styles.typeBadgeText, { color: typeConf.color }]}>
                    {t[`type_${day.dominantType}` as keyof typeof t] as string}
                  </Text>
                </View>
              ) : (
                <View style={styles.dayRight}>
                  <View style={styles.dayCol}>
                    <Text style={[styles.colHeader, { color: C.onSurfaceVariant }]}>{t.pause_col}</Text>
                    <Text style={[
                      styles.colValue,
                      { color: hasEntry ? C.onSurface : C.onSurfaceVariant },
                    ]}>
                      {hasEntry ? fmtPause(day.totalPauseMinutes) : '--'}
                    </Text>
                  </View>
                  <View style={styles.dayCol}>
                    <Text style={[styles.colHeader, { color: C.onSurfaceVariant }]}>{t.hours_col}</Text>
                    <Text style={[
                      styles.colValue,
                      { color: hasEntry ? C.onSurface : C.onSurfaceVariant },
                      hasEntry && styles.colValueBold,
                    ]}>
                      {fmtHours(day.totalHours)}
                    </Text>
                  </View>
                </View>
              )}
                {hasEntry && (
                  <Ionicons 
                    name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color={C.outline} 
                    style={{ marginLeft: 8 }} 
                  />
                )}
              </TouchableOpacity>

              {/* Expanded Accordion Area */}
              {isExpanded && (
                <View style={[styles.expandedArea, { borderTopColor: C.outlineVariant, backgroundColor: C.background }]}>
                  {day.workEntries.map(entry => (
                    <TimeEntryCard
                      key={entry.id}
                      entry={entry}
                      compact={true}
                      onPress={() => onDayPress(day.dateStr, entry)}
                    />
                  ))}
                  {day.nonWorkEntry && (
                    <TimeEntryCard
                      key={day.nonWorkEntry.id}
                      entry={day.nonWorkEntry}
                      compact={true}
                      onPress={() => onDayPress(day.dateStr, day.nonWorkEntry)}
                    />
                  )}
                  <TouchableOpacity
                    style={[styles.inlineAddBtn, { borderColor: C.outlineVariant }]}
                    onPress={() => onDayPress(day.dateStr)}
                  >
                    <Ionicons name="add" size={16} color={C.actionBlue} />
                    <Text style={[styles.inlineAddText, { color: C.actionBlue }]}>{t.new_entry}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Sticky footer: month totals */}
      <View style={[styles.footer, { backgroundColor: C.surface, borderTopColor: C.cardBorder }]}>
        {showEarnings && (
          <>
            <View style={styles.footerItem}>
              <Text style={[styles.footerLabel, { color: C.onSurfaceVariant }]}>{t.earnings_col}</Text>
              <Text style={[styles.footerValue, { color: C.actionBlue }]}>
                {currencySymbol}{monthEarnings.toFixed(0)}
              </Text>
            </View>
            <View style={[styles.footerDivider, { backgroundColor: C.cardBorder }]} />
          </>
        )}
        <View style={styles.footerItem}>
          <Text style={[styles.footerLabel, { color: C.onSurfaceVariant }]}>{t.pause_col}</Text>
          <Text style={[styles.footerValue, { color: C.onSurface }]}>{fmtPause(monthPause)}</Text>
        </View>
        <View style={[styles.footerDivider, { backgroundColor: C.cardBorder }]} />
        <View style={styles.footerItem}>
          <Text style={[styles.footerLabel, { color: C.onSurfaceVariant }]}>{t.hours_col}</Text>
          <Text style={[styles.footerValue, { color: C.onSurface }]}>{fmtHours(monthHours)}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.containerPadding, paddingTop: Spacing.xs, gap: Spacing.xs },

  // Day container (border)
  dayContainer: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  // Day row (clickable header)
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 64,
  },
  expandedArea: {
    padding: Spacing.sm,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  inlineAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.lg,
    borderStyle: 'dashed',
    gap: 4,
  },
  inlineAddText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
  },
  todayStripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },

  // Left column
  dayLeft: { flex: 1, gap: 2 },
  dayDate: { fontFamily: 'Outfit_500Medium', fontSize: 14 },
  dayDateBold: { fontFamily: 'Outfit_700Bold' },
  dayName: { fontFamily: 'Outfit_400Regular', fontSize: 12 },

  // Right: Pause + Stunden
  dayRight: { flexDirection: 'row', gap: Spacing.lg },
  dayCol: { alignItems: 'center', minWidth: 44 },
  colHeader: { fontFamily: 'Outfit_400Regular', fontSize: 10, marginBottom: 2 },
  colValue: { fontFamily: 'Outfit_500Medium', fontSize: 14 },
  colValueBold: { fontFamily: 'Outfit_600SemiBold' },

  // Non-work type badge
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
  },
  typeBadgeText: { fontFamily: 'Outfit_600SemiBold', fontSize: 12 },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    paddingHorizontal: Spacing.containerPadding,
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  footerItem: { alignItems: 'center', gap: 2 },
  footerLabel: { fontFamily: 'Outfit_400Regular', fontSize: 11 },
  footerValue: { fontFamily: 'Outfit_700Bold', fontSize: 16 },
  footerDivider: { width: 1, height: 28 },
});
