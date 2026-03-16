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
import { Colors, Spacing, BorderRadius, getCurrencySymbol } from '../lib/theme';
import type { Order } from '../types';

interface Props {
  order: Order;
  compact?: boolean;
}

export function OrderCard({ order, compact = false }: Props) {
  const router = useRouter();
  const { colors } = useTheme();

  const handlePress = () => {
    router.push(`/order/${order.id}`);
  };

  const symbol = getCurrencySymbol(order.currency);
  const isActive = ['accepted', 'request'].includes(order.status);

  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.cardCompact, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      {/* Top row */}
      <View style={styles.topRow}>
        <View style={styles.titleGroup}>
          <Text style={[styles.orderName, { color: colors.text }]} numberOfLines={1}>
            {order.orderName}
          </Text>
          <Text style={[styles.customerName, { color: colors.subText }]} numberOfLines={1}>
            {order.customerName}
          </Text>
        </View>
        <View style={styles.priceGroup}>
          <Text style={[styles.price, { color: colors.text }]}>
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
            <TagChip label={order.craftCategory} color={Colors.lilac} />
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
          <Text style={[styles.dueLabel, { color: colors.subText }]}>
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
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    shadowColor: Colors.bark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardCompact: {
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
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
    fontSize: 15,
    fontFamily: 'PlayfairDisplay',
    color: Colors.bark,
    marginBottom: 2,
  },
  customerName: {
    fontSize: 12,
    fontFamily: 'DMSans',
    color: Colors.muted,
  },
  priceGroup: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 16,
    fontFamily: 'DMMono',
    color: Colors.bark,
    fontWeight: '600',
  },
  paidLabel: {
    fontSize: 9,
    fontFamily: 'DMSans',
    color: Colors.sage,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  unpaidLabel: {
    fontSize: 9,
    fontFamily: 'DMSans',
    color: Colors.coral,
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
    color: Colors.muted,
  },
  countdown: {
    fontSize: 11,
  },
});
