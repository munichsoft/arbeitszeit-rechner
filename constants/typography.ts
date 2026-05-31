import { StyleSheet } from 'react-native';

export const Typography = StyleSheet.create({
  timerDisplay: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 56, // Increased
    lineHeight: 64,
    letterSpacing: -1.0,
    color: '#191C1E',
  },
  headlineLg: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 26,
    lineHeight: 34,
    letterSpacing: -0.3,
    color: '#191C1E',
  },
  headlineMd: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 22,
    lineHeight: 30,
    color: '#191C1E',
  },
  headlineSm: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 18,
    lineHeight: 26,
    color: '#191C1E',
  },
  bodyLg: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: '#191C1E',
  },
  bodyMd: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: '#191C1E',
  },
  bodySm: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#45474C',
  },
  labelCaps: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
    color: '#45474C',
  },
  numericData: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 16,
    lineHeight: 20,
    color: '#191C1E',
  },
  numericDataLg: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 28,
    lineHeight: 34,
    color: '#191C1E',
  },
  labelMd: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    lineHeight: 20,
    color: '#45474C',
  },
  labelSm: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    lineHeight: 16,
    color: '#45474C',
  },
});
