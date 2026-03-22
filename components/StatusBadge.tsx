import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusTokens, BorderRadius } from '../lib/theme';
import type { OrderStatus } from '../types';

interface Props {
  status: OrderStatus;
  size?: 'sm' | 'md';
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  request: 'Request',
  accepted: 'Accepted',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function StatusBadge({ status, size = 'md' }: Props) {
  const token = StatusTokens[status];
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: token.bg },
        isSmall && styles.badgeSm,
      ]}
    >
      <Text style={[styles.label, { color: token.text }, isSmall && styles.labelSm]}>
        {STATUS_LABELS[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  label: {
    fontSize: 11,
    fontFamily: 'DMSans',
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  labelSm: {
    fontSize: 9,
  },
});
