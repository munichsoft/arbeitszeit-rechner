import { StyleSheet } from 'react-native';

export const Typography = StyleSheet.create({
  timerDisplay: {
    fontFamily: 'Inter_700Bold',
    fontSize: 48,
    lineHeight: 56,
    letterSpacing: -0.96, // -0.02em at 48px
    color: '#191C1E',
  },
  headlineLg: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.24, // -0.01em at 24px
    color: '#191C1E',
  },
  headlineMd: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    lineHeight: 28,
    color: '#191C1E',
  },
  headlineSm: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    lineHeight: 24,
    color: '#191C1E',
  },
  bodyLg: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: '#191C1E',
  },
  bodyMd: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#191C1E',
  },
  bodySm: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: '#45474C',
  },
  labelCaps: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6, // 0.05em at 12px
    textTransform: 'uppercase' as const,
    color: '#45474C',
  },
  numericData: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 20,
    color: '#191C1E',
  },
  numericDataLg: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    lineHeight: 34,
    color: '#191C1E',
  },
  labelMd: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    lineHeight: 20,
    color: '#45474C',
  },
  labelSm: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 16,
    color: '#45474C',
  },
});
