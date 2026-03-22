import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { CountdownTimer } from './CountdownTimer';
import { StatusBadge } from './StatusBadge';
import { TagChip } from './TagChip';
import { useTheme } from '../context/ThemeContext';
import { Colors, StatusTokens, Spacing, BorderRadius, getCurrencySymbol } from '../lib/theme';
import type { Order } from '../types';

interface Props {
  order: Order;
  compact?: boolean;
}

// 4px left status ribbon color per status
const RIBBON_COLOR: Record<Order['status'], string> = {
  request:   Colors.secondary,
  accepted:  Colors.primaryContainer,
  shipped:   Colors.primary,
  delivered: Colors.tertiary,
  cancelled: Colors.outline,
};

export function OrderCard({ order, compact = false }: Props) {
  const router = useRouter();
  const { colors } = useTheme();

  const handlePress = () => {
    router.push(`/order/${order.id}`);
  };

  const symbol = getCurrencySymbol(order.currency);
  const isActive = ['accepted', 'request'].includes(order.status);
  const ribbonColor = RIBBON_COLOR[order.status];

  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.cardCompact]}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      {/* 4px absolute-left status ribbon */}
      <View style={[styles.ribbon, { backgroundColor: ribbonColor }]} />

      {/* Top row */}
      <View style={styles.topRow}>
        <View style={styles.titleGroup}>
          <Text style={styles.orderName} numberOfLines={1}>
            {order.orderName}
          </Text>
          <Text style={styles.customerName} numberOfLines={1}>
            {order.customerName}
          </Text>
        </View>
        <View style={styles.priceGroup}>
          <Text style={styles.price}>
            {symbol}{order.askingPrice.toFixed(0)}
          </Text>
          {order.isPaid ? (
            <Text style={styles.paidLabel}>paid</Text>
          ) : (
            <Text style={styles.unpaidLabel}>unpaid</Text>
          )}
        </View>
      </View>

      {/* Category + Tags */}
      {!compact && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tagsRow}
          keyboardShouldPersistTaps="always"
        >
          {order.craftCategory ? (
            <TagChip label={order.craftCategory} color={Colors.primaryContainer} />
          ) : null}
          {order.tags.slice(0, 3).map((tag) => (
            <TagChip key={tag} label={tag} />
          ))}
        </ScrollView>
      )}

      {/* Bottom row */}
      <View style={styles.bottomRow}>
        <StatusBadge status={order.status} size="sm" />
        <View style={styles.dateGroup}>
          <Text style={styles.dueLabel}>
            Due {format(new Date(order.dueDate), 'MMM d')}
          </Text>
          {isActive && (
            <CountdownTimer dueDate={order.dueDate} style={styles.countdown} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    paddingLeft: Spacing.md + 4 + 8, // leave room for ribbon
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surfaceLowest,
    overflow: 'hidden',
    shadowColor: 'rgba(0,0,0,0.03)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardCompact: {
    padding: Spacing.sm,
    paddingLeft: Spacing.sm + 4 + 8,
    marginBottom: Spacing.xs,
  },
  ribbon: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  titleGroup: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  orderName: {
    fontSize: 16,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  customerName: {
    fontSize: 12,
    fontFamily: 'DMSans',
    color: Colors.subText,
  },
  priceGroup: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 15,
    fontFamily: 'DMSans',
    color: Colors.primary,
    fontWeight: '700',
  },
  paidLabel: {
    fontSize: 9,
    fontFamily: 'DMSans',
    color: Colors.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  unpaidLabel: {
    fontSize: 9,
    fontFamily: 'DMSans',
    color: Colors.outline,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  tagsRow: {
    marginBottom: Spacing.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateGroup: {
    alignItems: 'flex-end',
    gap: 2,
  },
  dueLabel: {
    fontSize: 11,
    fontFamily: 'DMSans',
    color: Colors.subText,
  },
  countdown: {
    fontSize: 11,
  },
});
