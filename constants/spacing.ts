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
  sm: 2,
  md: 4,
  lg: 8,    // inputs, buttons (sharp, technical look)
  xl: 12,   // cards, modals (structured look)
  xxl: 16,
  full: 9999,
} as const;

export const Shadow = {
  level1: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  level2: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  actionBlueGlow: {
    shadowColor: '#10B981', // Updated to Emerald Green
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
} as const;
