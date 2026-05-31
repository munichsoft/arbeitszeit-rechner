import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, Radius } from '../constants/spacing';
import { useTranslation } from '../hooks/useTranslation';
import { useThemeColors } from '../hooks/useThemeColors';
import type { Project } from '../store/useTimeStore';
import { formatDurationHHMM } from '../utils/formatTime';

interface ProjectCardProps {
  project: Project;
  totalHours: number;
  isActive?: boolean;
  onEdit?: () => void;
}

export default function ProjectCard({ project, totalHours, isActive = false, onEdit }: ProjectCardProps) {
  const t = useTranslation();
  const C = useThemeColors();
  return (
    <View style={[styles.card, { backgroundColor: C.surface, borderColor: isActive ? C.activeBlue : C.cardBorder }]}>
      {isActive && <View style={[styles.leftBorder, { backgroundColor: project.color }]} />}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.clientLabel, { color: C.onSurfaceVariant }]}>{project.client || t.employer.toUpperCase()}</Text>
          <TouchableOpacity onPress={onEdit} hitSlop={16}>
            <Ionicons name="pencil-outline" size={18} color={C.outline} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.projectName, { color: C.onSurface }]}>{project.name}</Text>
        <View style={[styles.divider, { backgroundColor: C.cardBorder }]} />
        <View style={styles.bottomRow}>
          <View>
            <Text style={[styles.hoursLabel, { color: C.onSurfaceVariant }]}>{t.total_hours}</Text>
            <Text style={[styles.hoursValue, { color: C.onSurface }]}>{formatDurationHHMM(totalHours)}</Text>
          </View>
          <View style={[styles.badge, project.billable
            ? { backgroundColor: C.surface, borderColor: C.actionBlue }
            : { backgroundColor: C.surface, borderColor: C.cardBorder }]}>
            <Ionicons name="cash-outline" size={13} color={project.billable ? C.actionBlue : C.outline} />
            <Text style={[styles.badgeText, { color: project.billable ? C.actionBlue : C.outline }]}>
              {project.billable ? t.billable_badge : t.not_billable_badge}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius.xl, borderWidth: 1, overflow: 'hidden', flexDirection: 'row', marginBottom: Spacing.sm, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  leftBorder: { width: 4 },
  content: { flex: 1, padding: Spacing.md },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  clientLabel: { fontFamily: 'Outfit_600SemiBold', fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' },
  projectName: { fontFamily: 'Outfit_700Bold', fontSize: 18, lineHeight: 24, marginBottom: Spacing.sm },
  divider: { height: 1, marginBottom: Spacing.sm },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hoursLabel: { fontFamily: 'Outfit_400Regular', fontSize: 12, marginBottom: 2 },
  hoursValue: { fontFamily: 'Outfit_500Medium', fontSize: 15 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: Radius.lg, borderWidth: 1 },
  badgeText: { fontFamily: 'Outfit_500Medium', fontSize: 12 },
});
