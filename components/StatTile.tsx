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

  const color = accentColor ?? Colors.rose;

  return (
    <TouchableOpacity
      style={[styles.tile, { borderTopColor: color }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.8 : 1}
    >
      <Text style={[styles.value, { color }]}>
        {prefix}{value.toFixed(value % 1 === 0 ? 0 : 2)}{suffix}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: Colors.warmWhite,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'flex-start',
    borderTopWidth: 3,
    marginHorizontal: 3,
    shadowColor: Colors.bark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  value: {
    fontSize: 22,
    fontFamily: 'DMMono',
    fontWeight: '600',
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    fontFamily: 'DMSans',
    color: Colors.muted,
    letterSpacing: 0.3,
  },
});
