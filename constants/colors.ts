// ── Light palette (Natural & Engaging) ─────────────────────────────────────────
export const LightColors = {
  background: '#FFFFFF', // Pure white
  surface: '#FFFFFF',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#FFFFFF', // Pure white
  surfaceContainer: '#E5E7EB',
  surfaceContainerHigh: '#D1D5DB',
  surfaceContainerHighest: '#9CA3AF',
  surfaceDim: '#D1D5DB',

  primary: '#10B981', // Emerald Green
  primaryContainer: '#D1FAE5',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#065F46',

  secondary: '#0F766E', // Teal
  secondaryContainer: '#CCFBF1',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: '#115E59',

  actionBlue: '#10B981', // Keeping key name for compatibility, but color is Emerald
  activeBlue: '#059669',
  actionBlueGlow: 'rgba(16, 185, 129, 0.25)',

  onSurface: '#111827', // Darker, readable gray instead of harsh black
  onSurfaceVariant: '#4B5563',
  inverseSurface: '#1F2937',
  inverseOnSurface: '#F3F4F6',

  outline: '#9CA3AF',
  outlineVariant: '#E5E7EB',
  cardBorder: '#E5E7EB',

  error: '#EF4444', // Red variant
  onError: '#FFFFFF',
  errorContainer: '#FEE2E2',
  onErrorContainer: '#991B1B',

  primaryFixed: '#A7F3D0',
  primaryFixedDim: '#6EE7B7',
  secondaryFixed: '#99F6E4',
  secondaryFixedDim: '#5EEAD4',

  successGreen: '#10B981', // Green variant
  warningAmber: '#F59E0B', // Yellow variant

  overlay: 'rgba(0,0,0,0.4)',
  glassBackground: 'rgba(249,250,251,0.85)',
  shadowColor: '#000000',
  tabBarBg: '#FFFFFF',
} as const;

// ── Dark palette ──────────────────────────────────────────────────────────────
export const DarkColors = {
  background: '#111827', // Deep slate
  surface: '#1F2937',
  surfaceContainerLowest: '#030712',
  surfaceContainerLow: '#1F2937',
  surfaceContainer: '#374151',
  surfaceContainerHigh: '#4B5563',
  surfaceContainerHighest: '#6B7280',
  surfaceDim: '#111827',

  primary: '#34D399', // Bright emerald for dark mode
  primaryContainer: '#065F46',
  onPrimary: '#022C22',
  onPrimaryContainer: '#A7F3D0',

  secondary: '#2DD4BF', // Bright teal
  secondaryContainer: '#115E59',
  onSecondary: '#042F2E',
  onSecondaryContainer: '#99F6E4',

  actionBlue: '#34D399',
  activeBlue: '#6EE7B7',
  actionBlueGlow: 'rgba(52, 211, 153, 0.30)',

  onSurface: '#F9FAFB',
  onSurfaceVariant: '#9CA3AF',
  inverseSurface: '#F3F4F6',
  inverseOnSurface: '#1F2937',

  outline: '#6B7280',
  outlineVariant: '#374151',
  cardBorder: '#374151',

  error: '#F87171',
  onError: '#450A0A',
  errorContainer: 'rgba(248,113,113,0.18)',
  onErrorContainer: '#FECACA',

  primaryFixed: '#065F46',
  primaryFixedDim: '#064E3B',
  secondaryFixed: '#115E59',
  secondaryFixedDim: '#134E4A',

  successGreen: '#34D399',
  warningAmber: '#FBBF24',

  overlay: 'rgba(0,0,0,0.6)',
  glassBackground: 'rgba(17,24,39,0.85)',
  shadowColor: '#000000',
  tabBarBg: '#1F2937',
} as const;

export type ColorPalette = typeof LightColors;
export type ColorKey = keyof ColorPalette;

export const Colors = LightColors;
