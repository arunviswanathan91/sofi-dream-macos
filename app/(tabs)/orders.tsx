import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useOrders } from '../../hooks/useOrders';
import { useTheme } from '../../context/ThemeContext';
import { OrderCard } from '../../components/OrderCard';
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
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;
  const numColumns = isTablet ? 2 : 1;

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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Search — fixed above list */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]}
          placeholder="Search orders, customers, tags..."
          placeholderTextColor={colors.subText}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Status Filters — fixed, outside scroll */}
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
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
              statusFilter === f.value && styles.filterChipActive,
            ]}
            onPress={() => setStatusFilter(f.value)}
          >
            <Text
              style={[
                styles.filterLabel,
                { color: colors.subText },
                statusFilter === f.value && styles.filterLabelActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sort Row — fixed, outside scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.sortRow}
        contentContainerStyle={styles.filtersContent}
      >
        <Text style={[styles.sortLabel, { color: colors.subText }]}>Sort:</Text>
        {SORT_OPTIONS.map((s) => (
          <TouchableOpacity
            key={s.value}
            onPress={() => setSortBy(s.value)}
          >
            <Text
              style={[
                styles.sortOption,
                { color: colors.subText },
                sortBy === s.value && styles.sortOptionActive,
              ]}
            >
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Orders List — takes all remaining flex space */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.subText }]}>Loading orders...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>✦</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
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
          key={`orders-${numColumns}`}
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInDown.delay(index * 40).duration(300)}
              style={isTablet ? styles.tabletItem : undefined}
            >
              <OrderCard order={item} />
            </Animated.View>
          )}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={isTablet ? styles.columnWrapper : undefined}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          style={styles.list}
        />
      )}

      <FAB onPress={() => router.push('/order/new')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchInput: {
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontFamily: 'DMSans',
    fontSize: 14,
    borderWidth: 1,
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
    borderWidth: 1,
  },
  filterChipActive: {
    backgroundColor: Colors.rose,
    borderColor: Colors.rose,
  },
  filterLabel: {
    fontSize: 12,
    fontFamily: 'DMSans',
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
    marginRight: 4,
  },
  sortOption: {
    fontSize: 12,
    fontFamily: 'DMSans',
    marginRight: 12,
  },
  sortOptionActive: {
    color: Colors.rose,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 120,
  },
  columnWrapper: {
    gap: Spacing.sm,
  },
  tabletItem: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'DMSans',
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
