import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Colors } from '../lib/theme';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

const SIZES = {
  sm: { mark: 10, name: 11 },
  md: { mark: 14, name: 14 },
  lg: { mark: 18, name: 18 },
};

export function AppLogo({ size = 'md', color }: Props) {
  const sz = SIZES[size];
  const c = color ?? Colors.rose;
  return (
    <Text style={[styles.logo, { fontSize: sz.name, color: c }]}>
      <Text style={{ fontSize: sz.mark }}>◆ </Text>SOFI DREAM
    </Text>
  );
}

const styles = StyleSheet.create({
  logo: {
    fontFamily: 'PlayfairDisplay',
    letterSpacing: 2,
  },
});
