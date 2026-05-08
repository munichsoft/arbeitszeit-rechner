// ── Light palette (default) ───────────────────────────────────────────────────
export const LightColors = {
  background: '#F7F9FB',
  surface: '#FFFFFF',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F2F4F6',
  surfaceContainer: '#ECEEF0',
  surfaceContainerHigh: '#E6E8EA',
  surfaceContainerHighest: '#E0E3E5',
  surfaceDim: '#D8DADC',

  primary: '#091426',
  primaryContainer: '#1E293B',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#8590A6',

  secondary: '#0058BE',
  secondaryContainer: '#2170E4',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: '#FEFCFF',

  actionBlue: '#0058BE',
  activeBlue: '#2170E4',
  actionBlueGlow: 'rgba(0,88,190,0.25)',

  onSurface: '#191C1E',
  onSurfaceVariant: '#45474C',
  inverseSurface: '#2D3133',
  inverseOnSurface: '#EFF1F3',

  outline: '#75777D',
  outlineVariant: '#C5C6CD',
  cardBorder: '#E0E3E5',

  error: '#BA1A1A',
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#93000A',

  primaryFixed: '#D8E3FB',
  primaryFixedDim: '#BCC7DE',
  secondaryFixed: '#D8E2FF',
  secondaryFixedDim: '#ADC6FF',

  successGreen: '#1A7A4A',
  warningAmber: '#B45309',

  overlay: 'rgba(0,0,0,0.4)',
  glassBackground: 'rgba(247,249,251,0.85)',
  shadowColor: '#000000',
  tabBarBg: '#FFFFFF',
} as const;

// ── Dark palette ──────────────────────────────────────────────────────────────
export const DarkColors = {
  background: '#0F1117',
  surface: '#161B24',
  surfaceContainerLowest: '#0C1019',
  surfaceContainerLow: '#1A2030',
  surfaceContainer: '#1E2638',
  surfaceContainerHigh: '#222C3C',
  surfaceContainerHighest: '#283244',
  surfaceDim: '#0A0E16',

  primary: '#E2E8F4',
  primaryContainer: '#1A2D52',
  onPrimary: '#0F1117',
  onPrimaryContainer: '#8BAAD8',

  secondary: '#5BA3FF',
  secondaryContainer: '#79B8FF',
  onSecondary: '#0F1117',
  onSecondaryContainer: '#0F1117',

  actionBlue: '#5BA3FF',
  activeBlue: '#79B8FF',
  actionBlueGlow: 'rgba(91,163,255,0.30)',

  onSurface: '#E2E8F4',
  onSurfaceVariant: '#8892A4',
  inverseSurface: '#E2E8F4',
  inverseOnSurface: '#2D3448',

  outline: '#56637A',
  outlineVariant: '#2A3448',
  cardBorder: '#2A3448',

  error: '#FF6B6B',
  onError: '#0F1117',
  errorContainer: 'rgba(255,107,107,0.18)',
  onErrorContainer: '#FFAAAA',

  primaryFixed: '#1A2D52',
  primaryFixedDim: '#1A2D52',
  secondaryFixed: '#1A2D52',
  secondaryFixedDim: '#152040',

  successGreen: '#34C77A',
  warningAmber: '#F59E0B',

  overlay: 'rgba(0,0,0,0.6)',
  glassBackground: 'rgba(15,17,23,0.85)',
  shadowColor: '#000000',
  tabBarBg: '#161B24',
} as const;

export type ColorPalette = typeof LightColors;
export type ColorKey = keyof ColorPalette;

// Legacy default export so existing non-themed imports still compile
export const Colors = LightColors;
