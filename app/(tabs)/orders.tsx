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

// Design tokens — Stitch "Warm Artisan Editorial"
const T = {
  bg: '#FFF8F5',
  surfaceLow: '#F9F2EF',
  surfaceContainer: '#F3ECEA',
  surfaceHighest: '#E8E1DE',
  surfaceLowest: '#FFFFFF',
  primary: '#864D5F',
  primaryContainer: '#C9879A',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#522232',
  tertiary: '#994530',
  tertiaryFixed: '#FFDAD2',
  onTertiaryFixed: '#3C0700',
  secondary: '#625E5A',
  secondaryContainer: '#E8E1DC',
  text: '#1D1B1A',
  subText: '#514346',
  outline: '#837376',
  outlineVariant: '#D5C2C5',
};

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
    <SafeAreaView style={styles.container}>
      {/* Search bar — pill shape, bg surfaceLow, no border */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders, customers, tags..."
            placeholderTextColor={T.outline}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Status Filter Chips — pill, active=primary, inactive=surfaceHighest */}
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
              statusFilter === f.value ? styles.filterChipActive : styles.filterChipInactive,
            ]}
            onPress={() => setStatusFilter(f.value)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterLabel,
                statusFilter === f.value ? styles.filterLabelActive : styles.filterLabelInactive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sort row */}
      <View style={styles.sortRow}>
        <Text style={styles.sortRowTitle}>Recent Orders</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sortContent}
        >
          {SORT_OPTIONS.map((s) => (
            <TouchableOpacity
              key={s.value}
              onPress={() => setSortBy(s.value)}
              style={[styles.sortBtn, sortBy === s.value && styles.sortBtnActive]}
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
      </View>

      {/* Orders list */}
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
    backgroundColor: T.bg,
  },
  // Search
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.surfaceLow,
    borderRadius: 999,
    paddingHorizontal: 20,
    height: 52,
    gap: 10,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'DMSans',
    fontSize: 14,
    color: T.text,
  },
  // Filter chips
  filtersRow: {
    maxHeight: 48,
    marginBottom: 4,
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 10,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 999,
  },
  filterChipActive: {
    backgroundColor: T.primary,
    shadowColor: T.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  filterChipInactive: {
    backgroundColor: T.surfaceHighest,
  },
  filterLabel: {
    fontSize: 13,
    fontFamily: 'DMSans',
    fontWeight: '600',
  },
  filterLabelActive: {
    color: '#FFFFFF',
  },
  filterLabelInactive: {
    color: T.subText,
  },
  // Sort row
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sortRowTitle: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
    color: T.primary,
  },
  sortContent: {
    gap: 4,
    alignItems: 'center',
  },
  sortBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  sortBtnActive: {
    backgroundColor: T.secondaryContainer,
  },
  sortOption: {
    fontSize: 11,
    fontFamily: 'DMSans',
    fontWeight: '700',
    color: T.subText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sortOptionActive: {
    color: T.primary,
  },
  // List
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
    gap: 12,
  },
  columnWrapper: {
    gap: 12,
  },
  tabletItem: {
    flex: 1,
  },
  // Loading / empty
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 16,
    color: T.subText,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
    color: T.text,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: T.primary,
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontFamily: 'DMSans',
    fontSize: 14,
    fontWeight: '600',
  },
});
