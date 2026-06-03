import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { subMonths, startOfMonth, endOfMonth, startOfYear, format as dateFnsFormat } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { useTimeStore, getDurationHours } from '../../store/useTimeStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useTranslation } from '../../hooks/useTranslation';
import { useThemeColors } from '../../hooks/useThemeColors';
import { exportCSV, exportPDF } from '../../utils/exportHelpers';
import { formatGermanDate, formatDuration } from '../../utils/formatTime';
import EmptyState from '../../components/EmptyState';
import Svg, { Rect, G, Text as SvgText } from 'react-native-svg';

type ExportFormat = 'pdf' | 'csv' | 'excel';
type QuickRange = 'this_month' | 'last_month' | 'ytd';

export default function BerichteScreen() {
  const t = useTranslation();
  const C = useThemeColors();
  const { entries, projects, getHoursForMonth } = useTimeStore();
  const { hourlyRate, currencySymbol, userName, showEarnings, language } = useSettingsStore();
  const initials = userName ? userName.slice(0, 2).toUpperCase() : '?';
  const locale = language === 'de' ? de : enUS;

  const now = new Date();
  const [startDate, setStartDate] = useState(startOfMonth(now));
  const [endDate, setEndDate] = useState(endOfMonth(now));
  const [quickRange, setQuickRange] = useState<QuickRange>('this_month');
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set(projects.map(p => p.id)));
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'woche' | 'verlauf'>('woche');
  const [datePickerTarget, setDatePickerTarget] = useState<'start' | 'end' | null>(null);
  const [tempPickerDate, setTempPickerDate] = useState(new Date());

  const applyRange = (range: QuickRange) => {
    setQuickRange(range);
    const n = new Date();
    if (range === 'this_month') { setStartDate(startOfMonth(n)); setEndDate(endOfMonth(n)); }
    else if (range === 'last_month') { const lm = subMonths(n, 1); setStartDate(startOfMonth(lm)); setEndDate(endOfMonth(lm)); }
    else { setStartDate(startOfYear(n)); setEndDate(n); }
  };

  const toggleProject = (id: string) => {
    setSelectedProjects(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const openDatePicker = (target: 'start' | 'end') => {
    setTempPickerDate(target === 'start' ? startDate : endDate);
    setDatePickerTarget(target);
  };

  const onAndroidDateChange = (_: any, selected?: Date) => {
    if (!selected) { setDatePickerTarget(null); return; }
    if (datePickerTarget === 'start') setStartDate(selected);
    else setEndDate(selected);
    setQuickRange(null as any);
    setDatePickerTarget(null);
  };

  const confirmIosDate = () => {
    if (datePickerTarget === 'start') setStartDate(tempPickerDate);
    else setEndDate(tempPickerDate);
    setQuickRange(null as any);
    setDatePickerTarget(null);
  };

  // Entries in the selected date range, filtered by project selection (for Create Report tab)
  const filteredEntries = useMemo(() =>
    entries.filter(e => {
      const d = new Date(e.startTime);
      const inRange = d >= startDate && d <= endDate;
      // If no projects exist yet, include all entries in range
      if (projects.length === 0) return inRange;
      return inRange && selectedProjects.has(e.projectId);
    }), [entries, startDate, endDate, selectedProjects, projects.length]);

  // All entries in the date range regardless of project filter — used for Performance tab
  const rangeEntries = useMemo(() =>
    entries.filter(e => {
      const d = new Date(e.startTime);
      return d >= startDate && d <= endDate;
    }), [entries, startDate, endDate]);

  const totalHours = rangeEntries.reduce((acc, e) => acc + getDurationHours(e), 0);
  const filteredTotalHours = filteredEntries.reduce((acc, e) => acc + getDurationHours(e), 0);
  const uniqueProjects = new Set(filteredEntries.map(e => e.projectId)).size;
  const dateRangeLabel = `${formatGermanDate(startDate)} – ${formatGermanDate(endDate)}`;

  // Bar data (last 7 days)
  const barData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now); d.setDate(now.getDate() - (6 - i));
      const h = entries.filter(e => new Date(e.startTime).toDateString() === d.toDateString()).reduce((acc, e) => acc + getDurationHours(e), 0);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      return { 
        label: dateFnsFormat(d, 'eeeee', { locale }), 
        hours: h,
        isWeekend,
        isToday: i === 6
      };
    });
  }, [entries, locale]);
  const maxBar = Math.max(...barData.map(b => b.hours), 1);

  // Monthly breakdown data (last 12 months)
  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = subMonths(now, 11 - i);
      const year = d.getFullYear();
      const month = d.getMonth();
      const hours = getHoursForMonth(year, month);
      const earnings = hours * hourlyRate;
      const label = dateFnsFormat(d, 'MMM yyyy');
      return { year, month, hours, earnings, label };
    });
    return months;
  }, [entries, hourlyRate]);
  const maxMonthHours = Math.max(...monthlyData.map(m => m.hours), 1);

  const handleExport = async () => {
    if (filteredEntries.length === 0) return;
    setLoading(true);
    try {
      if (exportFormat === 'csv') await exportCSV(filteredEntries, projects, currencySymbol, hourlyRate);
      else await exportPDF(filteredEntries, projects, currencySymbol, hourlyRate, dateRangeLabel);
    } catch (e) { console.error('Export error', e); }
    finally { setLoading(false); }
  };

  const RANGES: { key: QuickRange; label: string }[] = [
    { key: 'this_month', label: t.this_month },
    { key: 'last_month', label: t.last_month },
    { key: 'ytd', label: t.this_year },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: C.background }]} edges={['top']}>
            <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: C.onSurface }]}>Arbeitszeit Rechner</Text>
        <View style={[styles.avatar, { backgroundColor: C.primaryContainer }]}><Text style={[styles.avatarText, { color: C.onPrimaryContainer }]}>{initials}</Text></View>
      </View>

      {/* Tab: Übersicht | Bericht — 2 tabs */}
      <View style={[styles.toggleRow, { borderColor: C.actionBlue }]}>
        <TouchableOpacity style={[styles.toggleBtn, { backgroundColor: activeTab === 'woche' ? C.actionBlue : 'transparent' }]} onPress={() => setActiveTab('woche')}>
          <Ionicons name="bar-chart-outline" size={15} color={activeTab === 'woche' ? '#fff' : C.actionBlue} />
          <Text style={[styles.toggleText, { color: activeTab === 'woche' ? '#fff' : C.actionBlue }, activeTab === 'woche' && styles.toggleTextBold]}>Übersicht</Text>
        </TouchableOpacity>
        <View style={{ width: 1.5, backgroundColor: C.actionBlue }} />
        <TouchableOpacity style={[styles.toggleBtn, { backgroundColor: activeTab === 'verlauf' ? C.actionBlue : 'transparent' }]} onPress={() => setActiveTab('verlauf')}>
          <Ionicons name="document-text-outline" size={15} color={activeTab === 'verlauf' ? '#fff' : C.actionBlue} />
          <Text style={[styles.toggleText, { color: activeTab === 'verlauf' ? '#fff' : C.actionBlue }, activeTab === 'verlauf' && styles.toggleTextBold]}>{t.create_report}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {activeTab === 'woche' ? (
          <>
            {/* Stat cards */}
            <View style={styles.statRow}>
              <View style={[styles.statCard, { backgroundColor: C.surface, borderColor: C.cardBorder }]}>
                <Text style={[styles.cardLabel, { color: C.onSurface }]}>{t.total_hours_stat}</Text>
                <Text style={[styles.statBig, { color: C.onSurface }]}>{Math.floor(totalHours)}h {String(Math.round((totalHours % 1) * 60)).padStart(2,'0')}m</Text>
              </View>
              {showEarnings && (
                <View style={[styles.statCard, { backgroundColor: C.surface, borderColor: C.cardBorder }]}>
                  <Text style={[styles.cardLabel, { color: C.onSurface }]}>{t.estimated_revenue}</Text>
                  <Text style={[styles.statBig, { color: C.actionBlue }]}>{currencySymbol}{(totalHours * hourlyRate).toFixed(0)}</Text>
                </View>
              )}
            </View>

            {/* 7-day bar chart */}
            <View style={[styles.card, { backgroundColor: C.surface, borderColor: 'transparent', paddingBottom: 24 }]}>
              <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 18, color: C.onSurface, marginBottom: 20 }}>{t.hours_last_7}</Text>
              <Svg width="100%" height={160} viewBox="0 0 280 160">
                {barData.map((b, i) => {
                  const maxH = 100;
                  const displayMax = Math.max(maxBar, 8); // At least scale to 8h
                  const barH = (b.hours / displayMax) * maxH;
                  const barWidth = 32;
                  const gap = 6;
                  // Center the 7 bars within the 280 width viewBox: (280 - (7 * 32 + 6 * 6)) / 2 = (280 - 260) / 2 = 10
                  const x = 10 + i * (barWidth + gap);
                  
                  return (
                    <G key={i}>
                      {/* Background Bar */}
                      <Rect x={x} y={10} width={barWidth} height={maxH} rx={4} fill="#9CA3AF" opacity={C.background === '#0F1117' ? 0.4 : 0.7} />
                      
                      {/* Foreground Bar */}
                      {barH > 0 && (
                        <Rect x={x} y={10 + maxH - barH} width={barWidth} height={barH} rx={4} fill="#10B981" />
                      )}
                      
                      {/* Hours Label */}
                      {b.hours > 0 && (
                        <SvgText x={x + barWidth / 2} y={10 + maxH + 18} textAnchor="middle" fontSize={10} fontFamily="Outfit_500Medium" fill={C.onSurface}>
                          {b.hours >= 1 ? b.hours.toFixed(0) : b.hours.toFixed(1)}h
                        </SvgText>
                      )}
                      
                      {/* Day Letter */}
                      <SvgText 
                        x={x + barWidth / 2} 
                        y={10 + maxH + 36} 
                        textAnchor="middle" 
                        fontSize={13} 
                        fontFamily={b.isToday ? 'Outfit_700Bold' : 'Outfit_500Medium'} 
                        fill={b.isToday ? '#10B981' : (b.isWeekend ? '#EF4444' : C.onSurfaceVariant)}
                      >
                        {b.label}
                      </SvgText>
                    </G>
                  );
                })}
              </Svg>
            </View>

            {/* By job breakdown */}
            <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.cardBorder }]}>
              <Text style={[styles.cardLabel, { color: C.onSurface }]}>{t.by_job}</Text>
              {projects.length === 0 ? (
                rangeEntries.length === 0 ? (
                  <EmptyState iconName="bar-chart-outline" title={t.empty_reports_title} hint={t.empty_reports_hint} />
                ) : (
                  <View style={styles.projectRow}>
                    <View style={styles.projectRowTop}>
                      <Text style={[styles.projectRowName, { color: C.onSurface }]}>{t.no_assignment}</Text>
                      <Text style={[styles.projectRowHours, { color: C.onSurfaceVariant }]}>{totalHours.toFixed(1)}h</Text>
                    </View>
                    <View style={[styles.progressTrack, { backgroundColor: C.surfaceContainerHighest }]}>
                      <View style={[styles.progressFill, { width: '100%', backgroundColor: C.actionBlue }]} />
                    </View>
                  </View>
                )
              ) : (
                projects.map(p => {
                  const ph = rangeEntries.filter(e => e.projectId === p.id).reduce((acc, e) => acc + getDurationHours(e), 0);
                  const pct = totalHours > 0 ? ph / totalHours : 0;
                  return (
                    <View key={p.id} style={styles.projectRow}>
                      <View style={styles.projectRowTop}>
                        <Text style={[styles.projectRowName, { color: C.onSurface }]}>{p.name}</Text>
                        <Text style={[styles.projectRowHours, { color: C.onSurfaceVariant }]}>{ph.toFixed(1)}h</Text>
                      </View>
                      <View style={[styles.progressTrack, { backgroundColor: C.surfaceContainerHighest }]}>
                        <View style={[styles.progressFill, { width: `${pct * 100}%`, backgroundColor: p.color }]} />
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* 12-month history */}
            <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.cardBorder }]}>
              <Text style={[styles.cardLabel, { color: C.onSurface }]}>{t.monthly_breakdown}</Text>
              {monthlyData.every(m => m.hours === 0) ? (
                <EmptyState iconName="calendar-outline" title={t.empty_reports_title} hint={t.empty_reports_hint} />
              ) : (
                monthlyData.slice().reverse().map((m) => {
                  const pct = maxMonthHours > 0 ? m.hours / maxMonthHours : 0;
                  const isCurrentMonth = m.year === now.getFullYear() && m.month === now.getMonth();
                  const h = Math.floor(m.hours);
                  const min = Math.round((m.hours - h) * 60);
                  const hoursLabel = m.hours === 0 ? t.no_hours_this_month : `${h}h ${String(min).padStart(2, '0')}m`;
                  return (
                    <View key={`${m.year}-${m.month}`} style={styles.monthRow}>
                      <View style={styles.monthRowTop}>
                        <Text style={[styles.monthName, { color: isCurrentMonth ? C.actionBlue : C.onSurface }, isCurrentMonth && styles.monthNameCurrent]}>
                          {m.label}{isCurrentMonth ? ' ●' : ''}
                        </Text>
                        <View style={styles.monthStatsCol}>
                          <Text style={[styles.monthHours, { color: m.hours > 0 ? C.onSurface : C.onSurfaceVariant }]}>{hoursLabel}</Text>
                          {showEarnings && m.hours > 0 && (
                            <Text style={[styles.monthEarnings, { color: C.actionBlue }]}>{currencySymbol}{m.earnings.toFixed(0)}</Text>
                          )}
                        </View>
                      </View>
                      {m.hours > 0 && (
                        <View style={[styles.monthProgressTrack, { backgroundColor: C.surfaceContainerHighest }]}>
                          <View style={[styles.monthProgressFill, { width: `${pct * 100}%`, backgroundColor: isCurrentMonth ? C.actionBlue : C.secondaryFixed }]} />
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          </>
        ) : (
          <>
            {/* Quick Range */}
            <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.cardBorder }]}>
              <Text style={[styles.cardLabel, { color: C.onSurface }]}>{t.period}</Text>
              <View style={styles.chipRow}>
                {RANGES.map(r => (
                  <TouchableOpacity key={r.key} style={[styles.chip, { backgroundColor: C.surfaceContainerLow, borderColor: C.cardBorder }, quickRange === r.key && { backgroundColor: C.surface, borderColor: C.actionBlue }]} onPress={() => applyRange(r.key)}>
                    <Text style={[styles.chipText, { color: quickRange === r.key ? C.actionBlue : C.onSurfaceVariant }]}>{r.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {/* Tappable date range row */}
              <View style={styles.datePickerRow}>
                <TouchableOpacity style={[styles.datePickerBtn, { backgroundColor: C.surfaceContainerLow, borderColor: C.cardBorder }]} onPress={() => openDatePicker('start')}>
                  <Ionicons name="calendar-outline" size={15} color={C.outline} />
                  <Text style={[styles.datePickerText, { color: C.onSurface }]}>{formatGermanDate(startDate)}</Text>
                </TouchableOpacity>
                <Text style={[styles.datePickerSep, { color: C.outline }]}>→</Text>
                <TouchableOpacity style={[styles.datePickerBtn, { backgroundColor: C.surfaceContainerLow, borderColor: C.cardBorder }]} onPress={() => openDatePicker('end')}>
                  <Ionicons name="calendar-outline" size={15} color={C.outline} />
                  <Text style={[styles.datePickerText, { color: C.onSurface }]}>{formatGermanDate(endDate)}</Text>
                </TouchableOpacity>
              </View>
              {Platform.OS === 'android' && datePickerTarget !== null && (
                <DateTimePicker value={tempPickerDate} mode="date" display="default" onChange={onAndroidDateChange} />
              )}
              {Platform.OS === 'ios' && datePickerTarget !== null && (
                <View style={[styles.iosPickerInner, { borderTopColor: C.cardBorder }]}>
                  <View style={styles.iosPickerHeader}>
                    <TouchableOpacity onPress={() => setDatePickerTarget(null)}>
                      <Text style={[styles.iosPickerBtn, { color: C.outline }]}>{t.cancel}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={confirmIosDate}>
                      <Text style={[styles.iosPickerBtn, { color: C.actionBlue, fontFamily: 'Outfit_600SemiBold' }]}>OK</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker value={tempPickerDate} mode="date" display="spinner" onChange={(_, d) => d && setTempPickerDate(d)} style={{ width: '100%' }} themeVariant={C.background === '#0F1117' ? 'dark' : 'light'} />
                </View>
              )}
            </View>

            {/* Projects filter */}
            <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.cardBorder }]}>
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.cardLabel, { color: C.onSurface }]}>{t.include_jobs}</Text>
                <TouchableOpacity onPress={() => setSelectedProjects(new Set(projects.map(p => p.id)))}>
                  <Text style={[styles.selectAll, { color: C.actionBlue }]}>{t.select_all}</Text>
                </TouchableOpacity>
              </View>
              {projects.length === 0
                ? <Text style={[styles.noProjects, { color: C.onSurfaceVariant }]}>Noch keine Aufträge / No jobs yet</Text>
                : projects.map(p => (
                  <TouchableOpacity key={p.id} style={styles.checkRow} onPress={() => toggleProject(p.id)}>
                    <View style={[styles.checkbox, { borderColor: C.outline }, selectedProjects.has(p.id) && { backgroundColor: C.actionBlue, borderColor: C.actionBlue }]}>
                      {selectedProjects.has(p.id) && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                    <Text style={[styles.checkLabel, { color: C.onSurface }]}>{p.name}</Text>
                    <Text style={[styles.checkSub, { color: C.onSurfaceVariant }]}>{p.client}</Text>
                  </TouchableOpacity>
                ))
              }
            </View>

            {/* Format */}
            <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.cardBorder }]}>
              <Text style={[styles.cardLabel, { color: C.onSurface }]}>{t.export_format}</Text>
              <View style={styles.formatRow}>
                {([
                  { key: 'pdf', label: t.pdf_report, icon: 'document-text-outline' },
                  { key: 'csv', label: t.csv_data, icon: 'document-outline' },
                  { key: 'excel', label: t.excel_table, icon: 'grid-outline' },
                ] as const).map(f => (
                  <TouchableOpacity key={f.key}
                    style={[styles.formatCard, { borderColor: C.cardBorder, backgroundColor: C.surfaceContainerLow }, exportFormat === f.key && { borderColor: C.actionBlue, backgroundColor: C.surface }]}
                    onPress={() => setExportFormat(f.key)}>
                    <Ionicons name={f.icon} size={24} color={exportFormat === f.key ? C.actionBlue : C.outline} />
                    <Text style={[styles.formatLabel, { color: exportFormat === f.key ? C.actionBlue : C.outline }, exportFormat === f.key && styles.formatLabelActive]}>{f.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Summary + Export button */}
            <View style={styles.summaryFooter}>
              <View style={styles.summaryItem}><Text style={[styles.summaryNum, { color: C.onSurface }]}>{uniqueProjects}</Text><Text style={[styles.summaryLbl, { color: C.onSurfaceVariant }]}>{t.projects_count}</Text></View>
              <View style={styles.summaryItem}><Text style={[styles.summaryNum, { color: C.onSurface }]}>{filteredEntries.length}</Text><Text style={[styles.summaryLbl, { color: C.onSurfaceVariant }]}>{t.entries_count}</Text></View>
              <View style={styles.summaryItem}><Text style={[styles.summaryNum, { color: C.actionBlue }]}>{filteredTotalHours.toFixed(1)}</Text><Text style={[styles.summaryLbl, { color: C.onSurfaceVariant }]}>{t.hours_count}</Text></View>
            </View>

            <TouchableOpacity style={[styles.exportBtn, filteredEntries.length === 0 && styles.exportBtnDisabled]} onPress={handleExport} disabled={loading || filteredEntries.length === 0}>
              {loading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="download-outline" size={22} color="#fff" />
                  <Text style={styles.exportBtnText}>{t.generate_report}</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.containerPadding, paddingVertical: Spacing.sm },
  headerTitle: { fontFamily: 'Outfit_700Bold', fontSize: 20 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'Outfit_600SemiBold', fontSize: 12 },
  toggleRow: { flexDirection: 'row', marginHorizontal: Spacing.containerPadding, marginBottom: Spacing.sm, borderRadius: Radius.md, borderWidth: 1.5, overflow: 'hidden' },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: Spacing.xs + 2 },
  toggleBtnActive: {},
  toggleTextBold: { fontFamily: 'Outfit_600SemiBold' },
  toggleText: { fontFamily: 'Outfit_500Medium', fontSize: 11 },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.containerPadding, gap: Spacing.sm },
  subtitle: { fontFamily: 'Outfit_400Regular', fontSize: 14 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.md, borderWidth: 1, borderColor: Colors.cardBorder, ...Shadow.level1, gap: Spacing.xs },
  cardLabel: { fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: Colors.onSurface, marginBottom: 4 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectAll: { fontFamily: 'Outfit_500Medium', fontSize: 13, color: Colors.actionBlue },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  chip: { borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 6, backgroundColor: Colors.surfaceContainerLow, borderWidth: 1, borderColor: Colors.cardBorder },
  chipActive: { backgroundColor: Colors.surface, borderColor: Colors.actionBlue },
  chipText: { fontFamily: 'Outfit_500Medium', fontSize: 13, color: Colors.onSurfaceVariant },
  chipTextActive: { color: Colors.actionBlue },
  dateRangeText: { fontFamily: 'Outfit_500Medium', fontSize: 13, color: Colors.onSurface, marginTop: 4 },
  noProjects: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: Colors.onSurfaceVariant, paddingVertical: Spacing.sm },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 6, minHeight: 44 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.outline, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: Colors.actionBlue, borderColor: Colors.actionBlue },
  checkLabel: { fontFamily: 'Outfit_500Medium', fontSize: 14, color: Colors.onSurface, flex: 1 },
  checkSub: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: Colors.onSurfaceVariant },
  formatRow: { flexDirection: 'row', gap: Spacing.sm },
  formatCard: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: Colors.cardBorder, borderRadius: Radius.lg, padding: Spacing.sm, backgroundColor: Colors.surfaceContainerLow, minHeight: 88 },
  formatCardActive: { borderColor: Colors.actionBlue, backgroundColor: Colors.surface },
  formatLabel: { fontFamily: 'Outfit_500Medium', fontSize: 13, color: Colors.outline, textAlign: 'center' },
  formatLabelActive: { color: Colors.actionBlue, fontFamily: 'Outfit_600SemiBold' },
  summaryFooter: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: Spacing.sm },
  summaryItem: { alignItems: 'center', gap: 2 },
  summaryNum: { fontFamily: 'Outfit_700Bold', fontSize: 22, color: Colors.onSurface },
  summaryLbl: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: Colors.onSurfaceVariant },
  exportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, backgroundColor: Colors.actionBlue, borderRadius: Radius.lg, padding: Spacing.md + 2, minHeight: 64, ...Shadow.actionBlueGlow },
  exportBtnDisabled: { opacity: 0.4 },
  exportBtnText: { fontFamily: 'Outfit_700Bold', fontSize: 17, color: '#fff' },
  statRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.md, borderWidth: 1, borderColor: Colors.cardBorder, ...Shadow.level1 },
  statBig: { fontFamily: 'Outfit_700Bold', fontSize: 24, color: Colors.onSurface, marginTop: 4 },
  projectRow: { gap: 4, paddingVertical: 4 },
  projectRowTop: { flexDirection: 'row', justifyContent: 'space-between' },
  projectRowName: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: Colors.onSurface },
  projectRowHours: { fontFamily: 'Outfit_500Medium', fontSize: 14, color: Colors.onSurfaceVariant },
  progressTrack: { height: 6, backgroundColor: Colors.surfaceContainerHighest, borderRadius: Radius.full, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: Radius.full },
  // Monthly breakdown
  monthRow: { gap: 6, paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.cardBorder },
  monthRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monthName: { fontFamily: 'Outfit_500Medium', fontSize: 14, flex: 1 },
  monthNameCurrent: { fontFamily: 'Outfit_600SemiBold' },
  monthStatsCol: { alignItems: 'flex-end', gap: 2 },
  monthHours: { fontFamily: 'Outfit_600SemiBold', fontSize: 14 },
  monthEarnings: { fontFamily: 'Outfit_400Regular', fontSize: 12 },
  monthProgressTrack: { height: 5, borderRadius: Radius.full, overflow: 'hidden' },
  monthProgressFill: { height: '100%', borderRadius: Radius.full },
  // Date picker
  datePickerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.xs },
  datePickerBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: Radius.lg, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs + 2, minHeight: 44 },
  datePickerText: { fontFamily: 'Outfit_500Medium', fontSize: 13 },
  datePickerSep: { fontFamily: 'Outfit_400Regular', fontSize: 16 },
  iosPickerInner: { marginTop: Spacing.sm, borderTopWidth: 1 },
  iosPickerHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
  iosPickerBtn: { fontFamily: 'Outfit_500Medium', fontSize: 15, paddingHorizontal: 4, paddingVertical: 4 },
});
