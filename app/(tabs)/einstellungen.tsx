import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, Alert, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useTimeStore } from '../../store/useTimeStore';
import { useTranslation } from '../../hooks/useTranslation';
import { useThemeColors } from '../../hooks/useThemeColors';
import { exportCSV } from '../../utils/exportHelpers';
import type { Language, } from '../../utils/i18n';
import type { Theme } from '../../store/useSettingsStore';

// ── Reusable settings row ──────────────────────────────────────────────────────
// ── SettingsRow with dynamic colors ──────────────────────────────────────────
function SettingsRow({
  icon, label, sublabel, value, toggle, toggleValue, onToggle, onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sublabel?: string;
  value?: string;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
  onPress?: () => void;
}) {
  const C = useThemeColors();
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={onPress ? 0.7 : 1} disabled={!onPress && !toggle}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={20} color={C.onSurfaceVariant} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: C.onSurface }]}>{label}</Text>
        {sublabel && <Text style={[styles.rowSublabel, { color: C.onSurfaceVariant }]}>{sublabel}</Text>}
      </View>
      {toggle && (
        <Switch value={toggleValue} onValueChange={onToggle}
          trackColor={{ false: C.surfaceContainerHighest, true: C.actionBlue }}
          thumbColor={C.surface} />
      )}
      {value && <Text style={[styles.rowValue, { color: C.onSurfaceVariant }]}>{value}</Text>}
      {!toggle && !value && onPress && <Ionicons name="chevron-forward" size={18} color={C.outline} />}
    </TouchableOpacity>
  );
}

// ── Section wrapper with dark-aware background ────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const C = useThemeColors();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: C.onSurfaceVariant }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: C.surface, borderColor: C.cardBorder }]}>{children}</View>
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function EinstellungenScreen() {
  const t = useTranslation();
  const C = useThemeColors();
  const {
    language, setLanguage,
    theme, setTheme,
    userName, userEmail, hourlyRate, currencySymbol, weeklyTargetHours,
    timeFormat, pushNotifications, showEarnings, jobStartDate,
    setUserName, setUserEmail,
    setHourlyRate, setCurrencySymbol, setWeeklyTargetHours, setTimeFormat, setPushNotifications, setShowEarnings, setJobStartDate,
  } = useSettingsStore();

  const { entries, projects } = useTimeStore();

  // Profile editing state
  const [editingProfile, setEditingProfile] = useState(false);
  const [nameInput, setNameInput] = useState(userName);
  const [emailInput, setEmailInput] = useState(userEmail);

  const saveProfile = () => {
    setUserName(nameInput.trim());
    setUserEmail(emailInput.trim());
    setEditingProfile(false);
  };

  const cancelProfile = () => {
    setNameInput(userName);
    setEmailInput(userEmail);
    setEditingProfile(false);
  };

  // Pay settings inline editing
  const [editingRate, setEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState(String(hourlyRate));
  const [editingHours, setEditingHours] = useState(false);
  const [hoursInput, setHoursInput] = useState(String(weeklyTargetHours));

  const saveRate = () => { const v = parseFloat(rateInput.replace(',', '.')); if (!isNaN(v) && v >= 0) setHourlyRate(v); setEditingRate(false); };
  const saveHours = () => { const v = parseFloat(hoursInput); if (!isNaN(v) && v > 0) setWeeklyTargetHours(v); setEditingHours(false); };

  // Job start date picker state
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(jobStartDate ? new Date(jobStartDate) : new Date());
  const jobStartDateObj = jobStartDate ? new Date(jobStartDate) : null;
  const jobStartDateLabel = jobStartDateObj
    ? jobStartDateObj.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : t.job_start_date_none;

  const handleExportCSV = async () => {
    try { await exportCSV(entries, projects, currencySymbol, hourlyRate); }
    catch { Alert.alert('Fehler / Error', 'Export fehlgeschlagen / Export failed.'); }
  };

  const cycleCurrency = () => {
    const opts = ['€', '$', '£', 'CHF'] as const;
    setCurrencySymbol(opts[(opts.indexOf(currencySymbol) + 1) % opts.length]);
  };

  const displayInitials = userName ? userName.slice(0, 2).toUpperCase() : '?';
  const displayName = userName || (language === 'de' ? 'Kein Name' : 'No name');
  const displayEmail = userEmail || (language === 'de' ? 'Keine E-Mail' : 'No email');

  const THEME_OPTIONS: { key: Theme; icon: string; label: string }[] = [
    { key: 'light', icon: '☀️', label: language === 'de' ? 'Hell' : 'Light' },
    { key: 'dark', icon: '🌙', label: language === 'de' ? 'Dunkel' : 'Dark' },
    { key: 'system', icon: '📱', label: language === 'de' ? 'Auto' : 'Auto' },
  ];

  const [langOpen, setLangOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);

  const LANG_OPTIONS = [
    { key: 'de' as Language, flag: '🇩🇪', label: 'Deutsch' },
    { key: 'en' as Language, flag: '🇬🇧', label: 'English' },
  ];
  const currentLang = LANG_OPTIONS.find(o => o.key === language)!;
  const currentTheme = THEME_OPTIONS.find(o => o.key === theme)!;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: C.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: C.onSurface }]}>Arbeitszeit Rechner</Text>
        <View style={[styles.avatar, { backgroundColor: C.primaryContainer }]}>
          <Text style={[styles.avatarText, { color: C.onPrimaryContainer }]}>{displayInitials}</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* ── Profile Card ──────────────────────────── */}
        <View style={[styles.profileCard, { backgroundColor: C.surface, borderColor: C.cardBorder }]}>
          <View style={[styles.profileAvatar, { backgroundColor: C.primaryContainer }]}>
            <Text style={[styles.profileAvatarText, { color: C.onPrimaryContainer }]}>{displayInitials}</Text>
          </View>

          {editingProfile ? (
                        /* Edit mode */
            <View style={styles.profileEditContainer}>
              <View style={[styles.profileInputRow, { borderColor: C.cardBorder, backgroundColor: C.surfaceContainerLow }]}>
                <Ionicons name="person-outline" size={16} color={C.outline} />
                <TextInput
                  style={[styles.profileInput, { color: C.onSurface }]}
                  value={nameInput}
                  onChangeText={setNameInput}
                  placeholder={language === 'de' ? 'Vor- und Nachname' : 'Full name'}
                  placeholderTextColor={Colors.outline}
                  autoFocus
                  returnKeyType="next"
                />
              </View>
                            <View style={[styles.profileInputRow, { borderColor: C.cardBorder, backgroundColor: C.surfaceContainerLow }]}>
                <Ionicons name="mail-outline" size={16} color={C.outline} />
                <TextInput
                  style={[styles.profileInput, { color: C.onSurface }]}
                  value={emailInput}
                  onChangeText={setEmailInput}
                  placeholder={language === 'de' ? 'E-Mail-Adresse' : 'Email address'}
                  placeholderTextColor={Colors.outline}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={saveProfile}
                />
              </View>
                            <View style={styles.profileEditActions}>
                <TouchableOpacity style={[styles.profileCancelBtn, { borderColor: C.cardBorder }]} onPress={cancelProfile}>
                  <Text style={[styles.profileCancelText, { color: C.onSurface }]}>{t.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.profileSaveBtn, { backgroundColor: C.actionBlue }]} onPress={saveProfile}>
                  <Text style={styles.profileSaveText}>{language === 'de' ? 'Speichern' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* View mode */
            <>
                            <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: C.onSurface }]} numberOfLines={1}>{displayName}</Text>
                <Text style={[styles.profileEmail, { color: C.onSurfaceVariant }]} numberOfLines={1}>{displayEmail}</Text>
              </View>
              <TouchableOpacity
                style={styles.editIconBtn}
                onPress={() => { setNameInput(userName); setEmailInput(userEmail); setEditingProfile(true); }}
                hitSlop={16}
              >
                <Ionicons name="pencil-outline" size={18} color={Colors.actionBlue} />
              </TouchableOpacity>
            </>
          )}
        </View>

                                        {/* ── Language ──────────────────────────────── */}
        <Section title={t.language}>
          <TouchableOpacity style={styles.row} onPress={() => { setLangOpen(v => !v); setThemeOpen(false); }} activeOpacity={0.7}>
            <View style={styles.rowIcon}><Text style={{ fontSize: 20 }}>{currentLang.flag}</Text></View>
            <View style={styles.rowContent}><Text style={[styles.rowLabel, { color: C.onSurface }]}>{currentLang.label}</Text></View>
            <Ionicons name={langOpen ? 'chevron-up' : 'chevron-down'} size={18} color={C.outline} />
          </TouchableOpacity>
          {langOpen && LANG_OPTIONS.filter(o => o.key !== language).map(opt => (
            <TouchableOpacity key={opt.key}
              style={[styles.row, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.cardBorder }]}
              onPress={() => { setLanguage(opt.key); setLangOpen(false); }}
            >
              <View style={styles.rowIcon}><Text style={{ fontSize: 20 }}>{opt.flag}</Text></View>
              <Text style={[styles.rowLabel, { color: C.onSurfaceVariant }]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </Section>

                        {/* ── Appearance ───────────────────────────── */}
        <Section title={language === 'de' ? 'Erscheinungsbild' : 'Appearance'}>
          <TouchableOpacity style={styles.row} onPress={() => { setThemeOpen(v => !v); setLangOpen(false); }} activeOpacity={0.7}>
            <View style={styles.rowIcon}><Text style={{ fontSize: 20 }}>{currentTheme.icon}</Text></View>
            <View style={styles.rowContent}><Text style={[styles.rowLabel, { color: C.onSurface }]}>{currentTheme.label}</Text></View>
            <Ionicons name={themeOpen ? 'chevron-up' : 'chevron-down'} size={18} color={C.outline} />
          </TouchableOpacity>
          {themeOpen && THEME_OPTIONS.filter(o => o.key !== theme).map(opt => (
            <TouchableOpacity key={opt.key}
              style={[styles.row, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.cardBorder }]}
              onPress={() => { setTheme(opt.key); setThemeOpen(false); }}
            >
              <View style={styles.rowIcon}><Text style={{ fontSize: 20 }}>{opt.icon}</Text></View>
              <Text style={[styles.rowLabel, { color: C.onSurfaceVariant }]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </Section>

                {/* ── Pay & Units ───────────────────────────── */}
        <Section title={t.currency_units}>
          {editingRate ? (
            <View style={[styles.inlineEdit, { backgroundColor: C.surface }]}>
              <Ionicons name="cash-outline" size={20} color={C.onSurfaceVariant} />
              <TextInput style={[styles.inlineInput, { color: C.onSurface, borderBottomColor: C.actionBlue }]} value={rateInput} onChangeText={setRateInput}
                keyboardType="decimal-pad" autoFocus onBlur={saveRate} onSubmitEditing={saveRate} />
              <Text style={[styles.rowValue, { color: C.onSurfaceVariant }]}>{currencySymbol}/h</Text>
            </View>
          ) : (
            <SettingsRow icon="cash-outline" label={t.my_hourly_rate}
              value={hourlyRate > 0 ? `${currencySymbol}${hourlyRate.toFixed(2)}/h` : '—'} onPress={() => { setRateInput(String(hourlyRate)); setEditingRate(true); }} />
          )}
          <View style={[styles.divider, { backgroundColor: C.cardBorder }]} />
          {editingHours ? (
            <View style={[styles.inlineEdit, { backgroundColor: C.surface }]}>
              <Ionicons name="time-outline" size={20} color={C.onSurfaceVariant} />
              <TextInput style={[styles.inlineInput, { color: C.onSurface, borderBottomColor: C.actionBlue }]} value={hoursInput} onChangeText={setHoursInput}
                keyboardType="decimal-pad" autoFocus onBlur={saveHours} onSubmitEditing={saveHours} />
              <Text style={[styles.rowValue, { color: C.onSurfaceVariant }]}>h / {language === 'de' ? 'Woche' : 'week'}</Text>
            </View>
          ) : (
            <SettingsRow icon="timer-outline" label={t.weekly_target}
              value={`${weeklyTargetHours}h`} onPress={() => { setHoursInput(String(weeklyTargetHours)); setEditingHours(true); }} />
          )}
          <View style={[styles.divider, { backgroundColor: C.cardBorder }]} />
          <SettingsRow icon="swap-horizontal-outline" label={t.currency_symbol}
            value={currencySymbol} onPress={cycleCurrency} />
          <View style={[styles.divider, { backgroundColor: C.cardBorder }]} />
          <SettingsRow icon="time-outline" label={t.time_format}
            value={timeFormat === 'HH:MM' ? '8:30h' : '8.5h'} onPress={() => setTimeFormat(timeFormat === 'HH:MM' ? 'decimal' : 'HH:MM')} />
          <View style={[styles.divider, { backgroundColor: C.cardBorder }]} />
          <SettingsRow icon="cash-outline" label={t.show_earnings}
            sublabel={t.show_earnings_hint} toggle toggleValue={showEarnings} onToggle={setShowEarnings} />
          <View style={[styles.divider, { backgroundColor: C.cardBorder }]} />
          <SettingsRow
            icon="calendar-outline"
            label={t.job_start_date}
            sublabel={t.job_start_date_hint}
            value={jobStartDateLabel}
            onPress={() => { setTempStartDate(jobStartDateObj ?? new Date()); setShowStartDatePicker(true); }}
          />
          {showStartDatePicker && Platform.OS === 'ios' && (
            <View style={[styles.iosPickerWrapper, { borderTopColor: C.cardBorder }]}>
              <View style={styles.iosPickerHeader}>
                <TouchableOpacity onPress={() => setShowStartDatePicker(false)}>
                  <Text style={[styles.iosPickerBtn, { color: C.outline }]}>{t.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setJobStartDate(tempStartDate.toISOString()); setShowStartDatePicker(false); }}>
                  <Text style={[styles.iosPickerBtn, { color: C.actionBlue, fontFamily: 'Inter_600SemiBold' }]}>OK</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempStartDate}
                mode="date"
                display="spinner"
                onChange={(_, d) => d && setTempStartDate(d)}
                style={{ width: '100%' }}
                themeVariant={C.background === '#0F1117' ? 'dark' : 'light'}
                maximumDate={new Date()}
              />
            </View>
          )}
          {showStartDatePicker && Platform.OS === 'android' && (
            <DateTimePicker
              value={tempStartDate}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={(_, d) => { setShowStartDatePicker(false); if (d) setJobStartDate(d.toISOString()); }}
            />
          )}
        </Section>

        {/* ── Data & Backup ─────────────────────────── */}
        <Section title={t.data_backup}>
          <SettingsRow icon="download-outline" label={t.export_csv} onPress={handleExportCSV} />
        </Section>

                {/* ── ArbZG Info ────────────────────────────── */}
        <Section title={t.arbzg_title}>
          <View style={[styles.arbzgInfo, { backgroundColor: C.surface }]}>
            <Ionicons name="shield-checkmark-outline" size={20} color={C.actionBlue} />
            <Text style={[styles.arbzgText, { color: C.onSurfaceVariant }]}>{t.arbzg_hint}</Text>
          </View>
        </Section>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.containerPadding, paddingVertical: Spacing.sm },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 20, color: Colors.onSurface },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.containerPadding, gap: Spacing.md },

    // Profile card
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: Radius.xl, padding: Spacing.md, borderWidth: 1, ...Shadow.level1 },
  profileAvatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  profileAvatarText: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  profileInfo: { flex: 1 },
  profileName: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  profileEmail: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 2 },
  editIconBtn: { padding: 4 },

  // Profile edit mode
  profileEditContainer: { flex: 1, gap: Spacing.xs },
  profileInputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, borderWidth: 1, borderRadius: Radius.lg, paddingHorizontal: Spacing.sm, paddingVertical: 10 },
  profileInput: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 15 },
  profileEditActions: { flexDirection: 'row', gap: Spacing.xs, marginTop: 4 },
  profileCancelBtn: { flex: 1, borderWidth: 1, borderRadius: Radius.md, padding: Spacing.xs + 2, alignItems: 'center' },
  profileCancelText: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  profileSaveBtn: { flex: 2, borderRadius: Radius.md, padding: Spacing.xs + 2, alignItems: 'center' },
  profileSaveText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#fff' },

    // Section
  section: { gap: 6 },
  sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13, paddingHorizontal: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionCard: { borderRadius: Radius.xl, borderWidth: 1, ...Shadow.level1, overflow: 'hidden' },

  // Language
  langRow: { padding: Spacing.sm, gap: Spacing.xs },
  langBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.sm, borderRadius: Radius.lg, borderWidth: 1.5, minHeight: 56 },
  langFlag: { fontSize: 24 },
  langLabel: { fontFamily: 'Inter_500Medium', fontSize: 16, flex: 1 },
  langLabelActive: { fontFamily: 'Inter_700Bold' },

  // Theme picker
  themeRow: { flexDirection: 'row', padding: Spacing.sm, gap: Spacing.xs },
  themeBtn: { flex: 1, alignItems: 'center', gap: 4, padding: Spacing.sm, borderRadius: Radius.lg, borderWidth: 1.5, minHeight: 76, justifyContent: 'center' },
  themeEmoji: { fontSize: 22 },
  themeLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, textAlign: 'center' },

  // Settings rows
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 4, gap: Spacing.sm, minHeight: 56 },
  rowIcon: { width: 28, alignItems: 'center' },
  rowContent: { flex: 1 },
  rowLabel: { fontFamily: 'Inter_500Medium', fontSize: 15 },
  rowSublabel: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 1 },
  rowValue: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  dropdownContainer: { position: 'relative' },
  dropdownFloat: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    zIndex: 99,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  dropdownItem: { borderTopWidth: StyleSheet.hairlineWidth },
  divider: { height: 1, marginLeft: Spacing.md + 28 + Spacing.sm },
  inlineEdit: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm, minHeight: 56 },
  inlineInput: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 15, borderBottomWidth: 1.5, paddingVertical: 2 },
  iosPickerWrapper: { borderTopWidth: 1 },
  iosPickerHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
  iosPickerBtn: { fontFamily: 'Inter_500Medium', fontSize: 15, paddingHorizontal: 4, paddingVertical: 4 },

  // ArbZG
  arbzgInfo: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start', padding: Spacing.md },
  arbzgText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 },
});
