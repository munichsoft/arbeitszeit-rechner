import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { useTimeStore, getDurationHours } from '../../store/useTimeStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useTranslation } from '../../hooks/useTranslation';
import { useThemeColors } from '../../hooks/useThemeColors';
import TimeEntryCard from '../../components/TimeEntryCard';
import EntryEditModal from '../../components/EntryEditModal';
import AddProjectModal from '../../components/AddProjectModal';
import ProjectCard from '../../components/ProjectCard';
import FAB from '../../components/FAB';
import EmptyState from '../../components/EmptyState';
import { formatSectionHeader, formatDuration } from '../../utils/formatTime';
import type { TimeEntry, Project } from '../../store/useTimeStore';

type ActiveView = 'entries' | 'projects';

export default function AktivitaetScreen() {
  const t = useTranslation();
  const C = useThemeColors();
  const { entries, projects, getWeeklyHours, getTotalHoursForProject } = useTimeStore();
  const { hourlyRate, currencySymbol, timeFormat, weeklyTargetHours, userName, showEarnings } = useSettingsStore();
  const initials = userName ? userName.slice(0, 2).toUpperCase() : '?';

  const [activeView, setActiveView] = useState<ActiveView>('entries');
  const [editEntry, setEditEntry] = useState<TimeEntry | null>(null);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [entryModalVisible, setEntryModalVisible] = useState(false);
  const [projectModalVisible, setProjectModalVisible] = useState(false);
  const [search, setSearch] = useState('');

  const weeklyHours = getWeeklyHours();
  const weeklyEarnings = (weeklyHours * hourlyRate).toFixed(0);

  const sections = useMemo(() => {
    const sorted = [...entries].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    const map = new Map<string, TimeEntry[]>();
    sorted.forEach(e => {
      const key = format(new Date(e.startTime), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return Array.from(map.entries()).map(([key, data]) => ({
      title: formatSectionHeader(data[0].startTime),
      data, key,
    }));
  }, [entries]);

  const filteredProjects = useMemo(() =>
    projects.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.client.toLowerCase().includes(search.toLowerCase())
    ), [projects, search]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: C.background }]} edges={['top']}>
      {/* Header */}
            <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: C.onSurface }]}>Arbeitszeit Rechner</Text>
        <View style={[styles.avatar, { backgroundColor: C.primaryContainer }]}><Text style={[styles.avatarText, { color: C.onPrimaryContainer }]}>{initials}</Text></View>
      </View>

      {/* Toggle: Shifts / Jobs */}
      <View style={[styles.toggleRow, { borderColor: C.actionBlue }]}>
        <TouchableOpacity
          style={[styles.toggleBtn, { backgroundColor: activeView === 'entries' ? C.actionBlue : 'transparent' }]}
          onPress={() => setActiveView('entries')}
        >
          <Ionicons name="time-outline" size={15} color={activeView === 'entries' ? '#fff' : C.actionBlue} />
          <Text style={[styles.toggleText, { color: activeView === 'entries' ? '#fff' : C.actionBlue }, activeView === 'entries' && styles.toggleTextBold]}>{t.my_shifts}</Text>
        </TouchableOpacity>
        <View style={{ width: 1.5, backgroundColor: C.actionBlue }} />
        <TouchableOpacity
          style={[styles.toggleBtn, { backgroundColor: activeView === 'projects' ? C.actionBlue : 'transparent' }]}
          onPress={() => setActiveView('projects')}
        >
          <Ionicons name="briefcase-outline" size={15} color={activeView === 'projects' ? '#fff' : C.actionBlue} />
          <Text style={[styles.toggleText, { color: activeView === 'projects' ? '#fff' : C.actionBlue }, activeView === 'projects' && styles.toggleTextBold]}>{t.jobs_employers}</Text>
        </TouchableOpacity>
      </View>

      {activeView === 'entries' ? (
        <>
                    {/* Summary bar */}
          <View style={[styles.summaryBar, { backgroundColor: C.surface, borderColor: C.cardBorder }]}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: C.onSurfaceVariant }]}>{t.this_week}</Text>
              <Text style={[styles.summaryValue, { color: C.onSurface }]}>{formatDuration(weeklyHours, timeFormat)}</Text>
            </View>
            {showEarnings && (
              <>
                <View style={[styles.summaryDivider, { backgroundColor: C.cardBorder }]} />
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: C.onSurfaceVariant }]}>{t.earnings}</Text>
                  <Text style={[styles.summaryValue, { color: C.onSurface }]}>{weeklyEarnings} {currencySymbol}</Text>
                </View>
              </>
            )}
          </View>

          {entries.length === 0 ? (
            <EmptyState
              iconName="time-outline"
              title={t.empty_entries_title}
              hint={t.empty_entries_hint}
              ctaLabel={t.add_entry}
              onCta={() => { setEditEntry(null); setEntryModalVisible(true); }}
            />
          ) : (
            <SectionList
              sections={sections}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
                            renderSectionHeader={({ section }) => (
                <Text style={[styles.sectionHeader, { color: C.onSurface }]}>{section.title}</Text>
              )}
              renderItem={({ item }) => (
                <TimeEntryCard
                  entry={item}
                  onPress={() => { setEditEntry(item); setEntryModalVisible(true); }}
                />
              )}
              ListFooterComponent={<View style={{ height: 120 }} />}
            />
          )}
        </>
      ) : (
        <>
                    {/* Search */}
          <View style={[styles.searchBar, { backgroundColor: C.surface, borderColor: C.cardBorder }]}>
            <Ionicons name="search" size={18} color={C.outline} />
            <TextInput style={[styles.searchInput, { color: C.onSurface }]}
              placeholder={t.search_placeholder}
              placeholderTextColor={C.outline}
              value={search} onChangeText={setSearch} />
          </View>

          {filteredProjects.length === 0 ? (
            <EmptyState
              iconName="briefcase-outline"
              title={t.empty_projects_title}
              hint={t.empty_projects_hint}
              ctaLabel={t.add_job}
              onCta={() => { setEditProject(null); setProjectModalVisible(true); }}
            />
          ) : (
            <SectionList
              sections={[{ title: '', data: filteredProjects }]}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <ProjectCard
                  project={item} totalHours={getTotalHoursForProject(item.id)}
                  isActive={index === 0}
                  onEdit={() => { setEditProject(item); setProjectModalVisible(true); }}
                />
              )}
              renderSectionHeader={() => null}
              ListFooterComponent={<View style={{ height: 120 }} />}
            />
          )}
        </>
      )}

      <FAB onPress={() => {
        if (activeView === 'entries') { setEditEntry(null); setEntryModalVisible(true); }
        else { setEditProject(null); setProjectModalVisible(true); }
      }} />

      <EntryEditModal visible={entryModalVisible} entry={editEntry} onClose={() => setEntryModalVisible(false)} />
      <AddProjectModal visible={projectModalVisible} project={editProject} onClose={() => setProjectModalVisible(false)} />
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
  summaryBar: { flexDirection: 'row', marginHorizontal: Spacing.containerPadding, marginBottom: Spacing.sm, borderRadius: Radius.xl, borderWidth: 1, ...Shadow.level1, overflow: 'hidden' },
  summaryItem: { flex: 1, padding: Spacing.md, alignItems: 'center' },
  summaryDivider: { width: 1, marginVertical: Spacing.sm },
  summaryLabel: { fontFamily: 'Outfit_400Regular', fontSize: 12, marginBottom: 4 },
  summaryValue: { fontFamily: 'Outfit_700Bold', fontSize: 18 },
  sectionHeader: { fontFamily: 'Outfit_600SemiBold', fontSize: 15, marginTop: Spacing.sm, marginBottom: Spacing.xs },
  listContent: { paddingHorizontal: Spacing.containerPadding },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginHorizontal: Spacing.containerPadding, marginBottom: Spacing.sm, borderRadius: Radius.lg, borderWidth: 1, paddingHorizontal: Spacing.sm, paddingVertical: 7 },
  searchInput: { flex: 1, fontFamily: 'Outfit_400Regular', fontSize: 14 },
});
