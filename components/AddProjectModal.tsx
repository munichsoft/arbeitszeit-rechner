import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, ScrollView, Switch, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, Radius } from '../constants/spacing';
import { useTimeStore, type Project } from '../store/useTimeStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTranslation } from '../hooks/useTranslation';
import { useThemeColors } from '../hooks/useThemeColors';

const PROJECT_COLORS = ['#2170E4', '#0058BE', '#1A7A4A', '#B45309', '#BA1A1A', '#75777D'];

const JOB_TYPES = [
  { emoji: '🏥', label: 'Klinik / Clinic' },
  { emoji: '💆', label: 'Physio / Therapy' },
  { emoji: '🏠', label: 'Pflege / Home Care' },
  { emoji: '🧹', label: 'Reinigung / Cleaning' },
  { emoji: '👶', label: 'Kinderbetreuung / Childcare' },
  { emoji: '📋', label: 'Büro / Office' },
];

interface AddProjectModalProps {
  visible: boolean;
  project?: Project | null;
  onClose: () => void;
}

export default function AddProjectModal({ visible, project, onClose }: AddProjectModalProps) {
  const t = useTranslation();
  const C = useThemeColors();
  const { addProject, updateProject, deleteProject } = useTimeStore();
  const { language } = useSettingsStore();

  const [name, setName] = useState(project?.name ?? '');
  const [client, setClient] = useState(project?.client ?? '');
  const [rate, setRate] = useState(String(project?.hourlyRate ?? ''));
  const [billable, setBillable] = useState(project?.billable ?? true);
  const [selectedColor, setSelectedColor] = useState(project?.color ?? PROJECT_COLORS[0]);
  const [selectedType, setSelectedType] = useState(0);

  React.useEffect(() => {
    if (project) {
      setName(project.name); setClient(project.client);
      setRate(String(project.hourlyRate)); setBillable(project.billable);
      setSelectedColor(project.color);
    } else {
      setName(''); setClient(''); setRate(''); setBillable(true); setSelectedColor(PROJECT_COLORS[0]);
    }
  }, [project, visible]);

  const handleSave = () => {
    const data = {
      name: name.trim(),
      client: client.trim().toUpperCase(),
      hourlyRate: Number(rate) || 0,
      billable, color: selectedColor,
    };
    if (project) updateProject(project.id, data);
    else addProject(data);
    onClose();
  };

  const handleDelete = () => {
    if (!project) return;
    Alert.alert(
      language === 'en' ? 'Delete Job' : 'Auftrag löschen',
      language === 'en' ? `"${project.name}" will be permanently deleted.` : `"${project.name}" wird unwiderruflich gelöscht.`,
      [
        { text: t.cancel, style: 'cancel' },
        { text: language === 'en' ? 'Delete' : 'Löschen', style: 'destructive', onPress: () => { deleteProject(project.id); onClose(); } },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: C.background }]}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.header}>
          <Text style={[styles.title, { color: C.onSurface }]}>{project ? t.edit_job : t.new_job}</Text>
          <View style={styles.headerActions}>
            {project && (
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

            {/* Job type */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: C.onSurface }]}>Art der Tätigkeit / Job Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
                {JOB_TYPES.map((jt, idx) => (
                  <TouchableOpacity key={idx}
                    style={[styles.typeChip, { borderColor: C.cardBorder, backgroundColor: C.surfaceContainerLow }, idx === selectedType && { borderColor: C.actionBlue, backgroundColor: C.secondaryFixed }]}
                    onPress={() => setSelectedType(idx)}>
                    <Text style={styles.typeEmoji}>{jt.emoji}</Text>
                    <Text style={[styles.typeLabel, { color: idx === selectedType ? C.actionBlue : C.onSurfaceVariant }, idx === selectedType && styles.typeLabelActive]} numberOfLines={1}>
                      {jt.label.split(' / ')[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Job name */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: C.onSurface }]}>{t.job_name}</Text>
              <TextInput style={[styles.input, { color: C.onSurface, borderColor: C.cardBorder, backgroundColor: C.surfaceContainerLow }]}
                value={name} onChangeText={setName} placeholder={t.job_name_placeholder} placeholderTextColor={C.outline} />
            </View>

            {/* Employer */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: C.onSurface }]}>{t.employer_name}</Text>
              <TextInput style={[styles.input, { color: C.onSurface, borderColor: C.cardBorder, backgroundColor: C.surfaceContainerLow }]}
                value={client} onChangeText={setClient} placeholder={t.employer_placeholder} placeholderTextColor={C.outline} autoCapitalize="words" />
            </View>

            {/* Rate */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: C.onSurface }]}>{t.hourly_rate_label}</Text>
              <TextInput style={[styles.input, { color: C.onSurface, borderColor: C.cardBorder, backgroundColor: C.surfaceContainerLow }]}
                value={rate} onChangeText={setRate} placeholder="z. B. 18,00" placeholderTextColor={C.outline} keyboardType="decimal-pad" />
            </View>

            {/* Color */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: C.onSurface }]}>{t.color}</Text>
              <View style={styles.colorRow}>
                {PROJECT_COLORS.map(c => (
                  <TouchableOpacity key={c}
                    style={[styles.colorSwatch, { backgroundColor: c }, c === selectedColor && { borderWidth: 3, borderColor: C.onSurface }]}
                    onPress={() => setSelectedColor(c)}>
                    {c === selectedColor && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </TouchableOpacity>
                ))}
              </View>
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
        </ScrollView>

          <View style={[styles.actions, { backgroundColor: C.background, borderTopColor: C.cardBorder }]}>
          <TouchableOpacity style={[styles.cancelBtn, { borderColor: C.cardBorder }]} onPress={onClose}>
            <Text style={[styles.cancelText, { color: C.onSurface }]}>{t.cancel}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: C.actionBlue }]} onPress={handleSave}>
            <Text style={styles.saveText}>{project ? t.save_entry : t.add_job}</Text>
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
  label: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  input: { borderWidth: 1, borderRadius: Radius.lg, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm + 4, fontFamily: 'Inter_400Regular', fontSize: 15, minHeight: 52 },
  typeRow: { gap: Spacing.xs, paddingVertical: 4 },
  typeChip: { alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: Radius.lg, borderWidth: 1.5, minWidth: 72 },
  typeEmoji: { fontSize: 22, marginBottom: 2 },
  typeLabel: { fontFamily: 'Inter_400Regular', fontSize: 11, textAlign: 'center' },
  typeLabelActive: { fontFamily: 'Inter_500Medium' },
  colorRow: { flexDirection: 'row', gap: Spacing.sm },
  colorSwatch: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.sm, minHeight: 64 },
  toggleLabel: { fontFamily: 'Inter_500Medium', fontSize: 15 },
  toggleSub: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 2 },
  actions: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
  cancelBtn: { flex: 1, borderWidth: 1, borderRadius: Radius.lg, paddingVertical: Spacing.sm + 2, alignItems: 'center', justifyContent: 'center', minHeight: 52 },
  cancelText: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  saveBtn: { flex: 1, borderRadius: Radius.lg, paddingVertical: Spacing.sm + 2, alignItems: 'center', justifyContent: 'center', minHeight: 52 },
  saveText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#fff' },
});
