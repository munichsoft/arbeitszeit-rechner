import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ScrollView, Switch, Platform, KeyboardAvoidingView, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Spacing, Radius } from '../constants/spacing';
import { useTimeStore, type TimeEntry } from '../store/useTimeStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTranslation } from '../hooks/useTranslation';
import { useThemeColors } from '../hooks/useThemeColors';

interface EntryEditModalProps {
  visible: boolean;
  entry?: TimeEntry | null;
  onClose: () => void;
}

type PickerMode = null | 'date' | 'start' | 'end';

export default function EntryEditModal({ visible, entry, onClose }: EntryEditModalProps) {
  const t = useTranslation();
  const C = useThemeColors();
  const { projects, addEntry, updateEntry, deleteEntry } = useTimeStore();
  const { language } = useSettingsStore();

  const buildDate = (e?: TimeEntry | null) => {
    if (e?.startTime) return new Date(e.startTime);
    const d = new Date(); d.setHours(9, 0, 0, 0); return d;
  };
  const buildEnd = (e?: TimeEntry | null) => {
    if (e?.endTime) return new Date(e.endTime);
    const d = new Date(); d.setHours(17, 0, 0, 0); return d;
  };

  const [startDt, setStartDt] = useState<Date>(buildDate(entry));
  const [endDt, setEndDt] = useState<Date>(buildEnd(entry));
  const [pauseMinutes, setPauseMinutes] = useState(String(entry?.pauseMinutes ?? 30));
  const [selectedProjectId, setSelectedProjectId] = useState(entry?.projectId ?? projects[0]?.id ?? '');
  const [notes, setNotes] = useState(entry?.notes ?? '');
  const [billable, setBillable] = useState(entry?.billable ?? true);
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);

  // Picker state
  const [pickerMode, setPickerMode] = useState<PickerMode>(null);
  // iOS inline picker: track a temp value while user spins the wheel
  const [tempDate, setTempDate] = useState<Date>(new Date());

  React.useEffect(() => {
    if (visible) {
      setStartDt(buildDate(entry));
      setEndDt(buildEnd(entry));
      setPauseMinutes(String(entry?.pauseMinutes ?? 30));
      setSelectedProjectId(entry?.projectId ?? projects[0]?.id ?? '');
      setNotes(entry?.notes ?? '');
      setBillable(entry?.billable ?? true);
      setProjectPickerOpen(false);
      setPickerMode(null);
    }
  }, [entry, visible]);

  const openPicker = (mode: PickerMode) => {
    const initial = mode === 'start' ? startDt : mode === 'end' ? endDt : startDt;
    setTempDate(initial);
    setPickerMode(mode);
  };

  const confirmPicker = () => {
    if (pickerMode === 'date') {
      // Apply date part only, keep time
      const applyDate = (dt: Date) => {
        const out = new Date(dt);
        out.setFullYear(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate());
        return out;
      };
      setStartDt(applyDate(startDt));
      setEndDt(applyDate(endDt));
    } else if (pickerMode === 'start') {
      setStartDt(tempDate);
    } else if (pickerMode === 'end') {
      setEndDt(tempDate);
    }
    setPickerMode(null);
  };

  const handleSave = () => {
    const entryData: Omit<TimeEntry, 'id'> = {
      projectId: selectedProjectId,
      startTime: startDt.toISOString(),
      endTime: endDt.toISOString(),
      pauseMinutes: Number(pauseMinutes) || 0,
      notes, billable,
    };
    if (entry) updateEntry(entry.id, entryData);
    else addEntry(entryData);
    onClose();
  };

  const handleDelete = () => {
    if (!entry) return;
    Alert.alert(
      language === 'en' ? 'Delete Entry' : 'Eintrag löschen',
      language === 'en' ? 'This entry will be permanently deleted.' : 'Dieser Eintrag wird unwiderruflich gelöscht.',
      [
        { text: t.cancel, style: 'cancel' },
        { text: language === 'en' ? 'Delete' : 'Löschen', style: 'destructive', onPress: () => { deleteEntry(entry.id); onClose(); } },
      ]
    );
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Display helpers
  const dateLabel = format(startDt, 'dd.MM.yyyy');
  const startLabel = format(startDt, 'HH:mm');
  const endLabel = format(endDt, 'HH:mm');

  // Android: picker shows natively and calls onChange once
  const onAndroidChange = (_: any, selected?: Date) => {
    if (!selected) { setPickerMode(null); return; }
    if (pickerMode === 'date') {
      const applyDate = (dt: Date) => {
        const out = new Date(dt);
        out.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
        return out;
      };
      setStartDt(applyDate(startDt));
      setEndDt(applyDate(endDt));
    } else if (pickerMode === 'start') {
      setStartDt(selected);
    } else if (pickerMode === 'end') {
      setEndDt(selected);
    }
    setPickerMode(null);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: C.background }]}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.header}>
          <Text style={[styles.title, { color: C.onSurface }]}>{entry ? t.edit_entry : t.new_entry}</Text>
          <View style={styles.headerActions}>
            {entry && (
              <TouchableOpacity onPress={handleDelete} hitSlop={16} style={styles.deleteIconBtn}>
                <Ionicons name="trash-outline" size={22} color={C.error} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} hitSlop={16}>
              <Ionicons name="close" size={26} color={C.actionBlue} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.formCard, { backgroundColor: C.surface, borderColor: C.cardBorder }]}>

            {/* Date */}
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: C.onSurface }]}>{t.date}</Text>
              <TouchableOpacity
                style={[styles.inputRow, { borderColor: C.cardBorder, backgroundColor: C.surfaceContainerLow }]}
                onPress={() => openPicker('date')}
              >
                <Ionicons name="calendar-outline" size={18} color={C.outline} style={styles.inputIcon} />
                <Text style={[styles.inputText, { color: C.onSurface }]}>{dateLabel}</Text>
                <Ionicons name="chevron-down" size={16} color={C.outline} />
              </TouchableOpacity>
            </View>

            {/* Start / End */}
            <View style={styles.timeRow}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.fieldLabel, { color: C.onSurface }]}>{t.start_time}</Text>
                <TouchableOpacity
                  style={[styles.inputRow, { borderColor: C.cardBorder, backgroundColor: C.surfaceContainerLow }]}
                  onPress={() => openPicker('start')}
                >
                  <Ionicons name="time-outline" size={16} color={C.outline} style={styles.inputIcon} />
                  <Text style={[styles.inputText, { color: C.onSurface }]}>{startLabel}</Text>
                </TouchableOpacity>
              </View>
              <View style={{ width: Spacing.sm }} />
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.fieldLabel, { color: C.onSurface }]}>{t.end_time}</Text>
                <TouchableOpacity
                  style={[styles.inputRow, { borderColor: C.cardBorder, backgroundColor: C.surfaceContainerLow }]}
                  onPress={() => openPicker('end')}
                >
                  <Ionicons name="time-outline" size={16} color={C.outline} style={styles.inputIcon} />
                  <Text style={[styles.inputText, { color: C.onSurface }]}>{endLabel}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Break */}
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: C.onSurface }]}>{t.break_minutes}</Text>
              <View style={[styles.inputRow, { borderColor: C.cardBorder, backgroundColor: C.surfaceContainerLow }]}>
                <Ionicons name="cafe-outline" size={18} color={C.outline} style={styles.inputIcon} />
                <TextInput style={[styles.inputText, { flex: 1, color: C.onSurface }]} value={pauseMinutes} onChangeText={setPauseMinutes}
                  placeholder="30" placeholderTextColor={C.outline} keyboardType="number-pad" />
              </View>
            </View>

            {/* Job picker */}
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: C.onSurface }]}>{t.assignment_employer}</Text>
              <TouchableOpacity style={[styles.inputRow, { borderColor: C.cardBorder, backgroundColor: C.surfaceContainerLow }]} onPress={() => setProjectPickerOpen(v => !v)}>
                <Ionicons name="briefcase-outline" size={18} color={C.outline} style={styles.inputIcon} />
                <Text style={[styles.inputText, { flex: 1, color: selectedProject ? C.onSurface : C.outline }]}>
                  {selectedProject ? `${selectedProject.name} — ${selectedProject.client}` : t.select_job}
                </Text>
                <Ionicons name={projectPickerOpen ? 'chevron-up' : 'chevron-down'} size={18} color={C.outline} />
              </TouchableOpacity>
              {projectPickerOpen && (
                <View style={[styles.pickerDropdown, { borderColor: C.cardBorder, backgroundColor: C.surface }]}>
                  {projects.map(p => (
                    <TouchableOpacity key={p.id}
                      style={[styles.pickerItem, { borderBottomColor: C.cardBorder }, p.id === selectedProjectId && { backgroundColor: C.secondaryFixed }]}
                      onPress={() => { setSelectedProjectId(p.id); setProjectPickerOpen(false); }}>
                      <Text style={[styles.pickerItemText, { color: p.id === selectedProjectId ? C.actionBlue : C.onSurface }]}>
                        {p.name} — {p.client}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Notes */}
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: C.onSurface }]}>{t.notes}</Text>
              <TextInput style={[styles.inputRow, styles.textarea, { borderColor: C.cardBorder, backgroundColor: C.surfaceContainerLow, color: C.onSurface }]}
                value={notes} onChangeText={setNotes}
                placeholder={t.notes_placeholder} placeholderTextColor={C.outline}
                multiline numberOfLines={3} textAlignVertical="top" />
            </View>

            {/* Billable */}
            <View style={[styles.toggleRow, { borderColor: C.cardBorder, backgroundColor: C.surfaceContainerLow }]}>
              <View>
                <Text style={[styles.toggleLabel, { color: C.onSurface }]}>{t.billable}</Text>
                <Text style={[styles.toggleSub, { color: C.onSurfaceVariant }]}>{t.billable_hint}</Text>
              </View>
              <Switch value={billable} onValueChange={setBillable}
                trackColor={{ false: C.surfaceContainerHighest, true: C.actionBlue }}
                thumbColor={C.surface} />
            </View>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* iOS inline picker sheet */}
        {Platform.OS === 'ios' && pickerMode !== null && (
          <View style={[styles.iosPickerSheet, { backgroundColor: C.surface, borderTopColor: C.cardBorder }]}>
            <View style={styles.iosPickerHeader}>
              <TouchableOpacity onPress={() => setPickerMode(null)}>
                <Text style={[styles.iosPickerBtn, { color: C.outline }]}>{t.cancel}</Text>
              </TouchableOpacity>
              <Text style={[styles.iosPickerTitle, { color: C.onSurface }]}>
                {pickerMode === 'date' ? t.date : pickerMode === 'start' ? t.start_time : t.end_time}
              </Text>
              <TouchableOpacity onPress={confirmPicker}>
                <Text style={[styles.iosPickerBtn, { color: C.actionBlue, fontFamily: 'Inter_600SemiBold' }]}>OK</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={tempDate}
              mode={pickerMode === 'date' ? 'date' : 'time'}
              display="spinner"
              is24Hour
              locale={language === 'de' ? 'de-DE' : 'en-GB'}
              onChange={(_, d) => d && setTempDate(d)}
              style={styles.iosPickerControl}
              themeVariant={C.background === '#0F1117' ? 'dark' : 'light'}
            />
          </View>
        )}

        {/* Android: native modal picker */}
        {Platform.OS === 'android' && pickerMode !== null && (
          <DateTimePicker
            value={pickerMode === 'start' ? startDt : pickerMode === 'end' ? endDt : startDt}
            mode={pickerMode === 'date' ? 'date' : 'time'}
            is24Hour
            display="default"
            onChange={onAndroidChange}
          />
        )}

          <View style={[styles.actions, { backgroundColor: C.background, borderTopColor: C.cardBorder }]}>
          <TouchableOpacity style={[styles.cancelBtn, { borderColor: C.cardBorder }]} onPress={onClose}>
            <Text style={[styles.cancelText, { color: C.onSurface }]}>{t.cancel}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: C.actionBlue }]} onPress={handleSave}>
            <Text style={styles.saveText}>{t.save_entry}</Text>
          </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  deleteIconBtn: { padding: 4 },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 22 },
  scroll: { flex: 1, padding: Spacing.md },
  formCard: { borderRadius: Radius.xl, padding: Spacing.md, gap: Spacing.md, borderWidth: 1 },
  field: { gap: 4 },
  fieldLabel: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  timeRow: { flexDirection: 'row' },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: Radius.lg, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, minHeight: 52 },
  inputIcon: { marginRight: Spacing.xs },
  inputText: { fontFamily: 'Inter_400Regular', fontSize: 15 },
  textarea: { minHeight: 88, alignItems: 'flex-start', paddingTop: Spacing.sm },
  pickerDropdown: { borderWidth: 1, borderRadius: Radius.lg, overflow: 'hidden', marginTop: -Spacing.xs },
  pickerItem: { padding: Spacing.sm, borderBottomWidth: 1 },
  pickerItemText: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.sm, minHeight: 64 },
  toggleLabel: { fontFamily: 'Inter_500Medium', fontSize: 15 },
  toggleSub: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 2 },
  actions: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
  cancelBtn: { flex: 1, borderWidth: 1, borderRadius: Radius.lg, paddingVertical: Spacing.sm + 2, alignItems: 'center', justifyContent: 'center', minHeight: 52 },
  cancelText: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  saveBtn: { flex: 1, borderRadius: Radius.lg, paddingVertical: Spacing.sm + 2, alignItems: 'center', justifyContent: 'center', minHeight: 52 },
  saveText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#fff' },
  // iOS picker sheet
  iosPickerSheet: { borderTopWidth: 1, paddingBottom: 24 },
  iosPickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  iosPickerTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  iosPickerBtn: { fontFamily: 'Inter_500Medium', fontSize: 15, paddingHorizontal: 4, paddingVertical: 4 },
  iosPickerControl: { width: '100%' },
});
