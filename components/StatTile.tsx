import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius } from '../lib/theme';

interface Props {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  onPress?: () => void;
  accentColor?: string;
}

export function StatTile({ label, value, prefix = '', suffix = '', onPress, accentColor }: Props) {
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [value]);

  const color = accentColor ?? Colors.primary;

  return (
    <TouchableOpacity
      style={styles.tile}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.8 : 1}
    >
      {/* Accent indicator dot */}
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.value}>
        {prefix}{value.toFixed(value % 1 === 0 ? 0 : 2)}{suffix}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: Colors.surfaceLow,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    alignItems: 'flex-start',
    marginHorizontal: 3,
    shadowColor: 'rgba(0,0,0,0.03)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  value: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    fontFamily: 'DMSans',
    color: Colors.subText,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
