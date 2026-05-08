import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Polyline } from 'react-native-svg';
import { Colors } from '../constants/colors';
import { Spacing, Radius, Shadow } from '../constants/spacing';
import { Typography } from '../constants/typography';

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  subtitlePositive?: boolean;
  iconName?: keyof typeof Ionicons.glyphMap;
  sparkData?: number[]; // 0-1 normalized values for sparkline
}

export default function StatCard({ label, value, subtitle, subtitlePositive = true, iconName, sparkData }: StatCardProps) {
  const maxVal = sparkData ? Math.max(...sparkData, 1) : 1;

  const buildSparkPath = (data: number[]): string => {
    const w = 80;
    const h = 36;
    const step = w / (data.length - 1);
    return data
      .map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(h - (v / maxVal) * h).toFixed(1)}`)
      .join(' ');
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {iconName && <Ionicons name={iconName} size={16} color={Colors.onSurfaceVariant} style={styles.icon} />}
        <Text style={styles.label}>{label}</Text>
      </View>

      <Text style={styles.value}>{value}</Text>

      {subtitle && (
        <Text style={[styles.subtitle, subtitlePositive ? styles.positive : styles.negative]}>
          {subtitle}
        </Text>
      )}

      {sparkData && sparkData.length > 1 && (
        <View style={styles.sparkContainer}>
          <Svg width={80} height={36}>
            {/* Fill area */}
            <Path
              d={`${buildSparkPath(sparkData)} L${((sparkData.length - 1) * 80 / (sparkData.length - 1)).toFixed(1)},36 L0,36 Z`}
              fill={Colors.activeBlue + '20'}
            />
            {/* Line */}
            <Path
              d={buildSparkPath(sparkData)}
              stroke={Colors.activeBlue}
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadow.level1,
    minHeight: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: 4,
  },
  icon: {
    marginRight: 2,
  },
  label: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  value: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    lineHeight: 28,
    color: Colors.onSurface,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    marginTop: 2,
  },
  positive: {
    color: Colors.successGreen,
  },
  negative: {
    color: Colors.error,
  },
  sparkContainer: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
  },
});
