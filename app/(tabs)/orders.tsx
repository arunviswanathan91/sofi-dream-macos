import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useOrders } from '../../hooks/useOrders';
import { OrderCard } from '../../components/OrderCard';
import { TagChip } from '../../components/TagChip';
import { FAB } from '../../components/FAB';
import { Colors, Spacing, BorderRadius } from '../../lib/theme';
import type { OrderStatus } from '../../types';

type SortOption = 'dueDate' | 'createdAt' | 'price' | 'customer';

type FilterValue = OrderStatus | 'all' | 'unpaid';

const STATUS_FILTERS: { label: string; value: FilterValue }[] = [
  { label: 'All', value: 'all' },
  { label: 'Unpaid', value: 'unpaid' },
  { label: 'Request', value: 'request' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
];

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'Due Date', value: 'dueDate' },
  { label: 'Created', value: 'createdAt' },
  { label: 'Price', value: 'price' },
  { label: 'Customer', value: 'customer' },
];

export default function OrdersScreen() {
  const router = useRouter();
  const { orders, loading } = useOrders();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterValue>('all');
  const [sortBy, setSortBy] = useState<SortOption>('dueDate');

  const filtered = useMemo(() => {
    let result = [...orders];

    if (statusFilter === 'unpaid') {
      result = result.filter((o) => !o.isPaid && o.status !== 'cancelled');
    } else if (statusFilter !== 'all') {
      result = result.filter((o) => o.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.orderName.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'price':
          return b.askingPrice - a.askingPrice;
        case 'customer':
          return a.customerName.localeCompare(b.customerName);
        default:
          return 0;
      }
    });

    return result;
  }, [orders, search, statusFilter, sortBy]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search orders, customers, tags..."
          placeholderTextColor={Colors.muted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Status Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersRow}
        contentContainerStyle={styles.filtersContent}
      >
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[
              styles.filterChip,
              statusFilter === f.value && styles.filterChipActive,
            ]}
            onPress={() => setStatusFilter(f.value)}
          >
            <Text
              style={[
                styles.filterLabel,
                statusFilter === f.value && styles.filterLabelActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sort Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.sortRow}
        contentContainerStyle={styles.filtersContent}
      >
        <Text style={styles.sortLabel}>Sort:</Text>
        {SORT_OPTIONS.map((s) => (
          <TouchableOpacity
            key={s.value}
            onPress={() => setSortBy(s.value)}
          >
            <Text
              style={[
                styles.sortOption,
                sortBy === s.value && styles.sortOptionActive,
              ]}
            >
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Orders List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>✦</Text>
          <Text style={styles.emptyTitle}>
            {search ? 'No matching orders' : 'No orders yet'}
          </Text>
          {!search && (
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/order/new')}
            >
              <Text style={styles.emptyButtonText}>Add your first order →</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 40).duration(300)}>
              <OrderCard order={item} />
            </Animated.View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
        />
      )}

      <FAB onPress={() => router.push('/order/new')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchInput: {
    backgroundColor: Colors.warmWhite,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontFamily: 'DMSans',
    fontSize: 14,
    color: Colors.bark,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filtersRow: {
    maxHeight: 44,
    marginBottom: 2,
  },
  filtersContent: {
    paddingHorizontal: Spacing.md,
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.warmWhite,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.rose,
    borderColor: Colors.rose,
  },
  filterChipUnpaid: {
    borderColor: Colors.coral,
  },
  filterChipUnpaidActive: {
    backgroundColor: Colors.coral,
    borderColor: Colors.coral,
  },
  filterLabel: {
    fontSize: 12,
    fontFamily: 'DMSans',
    color: Colors.muted,
  },
  filterLabelActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  sortRow: {
    maxHeight: 36,
    marginBottom: Spacing.sm,
  },
  sortLabel: {
    fontSize: 12,
    fontFamily: 'DMSans',
    color: Colors.muted,
    marginRight: 4,
  },
  sortOption: {
    fontSize: 12,
    fontFamily: 'DMSans',
    color: Colors.muted,
    marginRight: 12,
  },
  sortOptionActive: {
    color: Colors.rose,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'DMSans',
    color: Colors.muted,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay',
    color: Colors.bark,
  },
  emptyButton: {
    backgroundColor: Colors.rose,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 4,
  },
  emptyButtonText: {
    color: Colors.white,
    fontFamily: 'DMSans',
    fontSize: 14,
    fontWeight: '600',
  },
});
