export const Spacing = {
  base: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  containerPadding: 16,
  gutter: 12,
} as const;

export const Radius = {
  sm: 4,
  md: 8,
  lg: 12,   // inputs, buttons
  xl: 16,   // cards, modals
  xxl: 24,
  full: 9999,
} as const;

export const Shadow = {
  level1: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  level2: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  actionBlueGlow: {
    shadowColor: '#0058BE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
} as const;
