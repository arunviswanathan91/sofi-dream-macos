import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import Animated, {
  FadeInDown,
} from 'react-native-reanimated';
import { useOrders } from '../../hooks/useOrders';
import { useReports } from '../../hooks/useReports';
import { OrderCard } from '../../components/OrderCard';
import { CountdownTimer } from '../../components/CountdownTimer';
import { StatTile } from '../../components/StatTile';
import { SectionHeader } from '../../components/SectionHeader';
import { FAB } from '../../components/FAB';
import { Colors, Spacing, BorderRadius } from '../../lib/theme';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardScreen() {
  const router = useRouter();
  const { orders, loading } = useOrders();
  const { dashboardStats } = useReports(orders, 'month');

  const { activeOrders, dueThisWeek, shippedCount, monthRevenue, urgentOrders } = dashboardStats;

  const activeAccepted = useMemo(
    () => orders.filter((o) => o.status === 'accepted').slice(0, 8),
    [orders]
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your studio...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(0).duration(400)} style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()}, Sofie ✦</Text>
          <Text style={styles.date}>{format(new Date(), 'EEEE, MMMM d')}</Text>
        </Animated.View>

        {/* Stats Row */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.statsRow}>
          <StatTile
            label="Active Orders"
            value={activeOrders}
            accentColor={Colors.rose}
            onPress={() => router.push('/(tabs)/orders')}
          />
          <StatTile
            label="Due This Week"
            value={dueThisWeek}
            accentColor={Colors.gold}
            onPress={() => router.push('/(tabs)/orders')}
          />
          <StatTile
            label="Shipped"
            value={shippedCount}
            accentColor={Colors.sky}
          />
          <StatTile
            label="This Month"
            value={monthRevenue}
            prefix="€"
            accentColor={Colors.sage}
          />
        </Animated.View>

        {/* Urgent / Needs Attention */}
        {urgentOrders.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <SectionHeader title="Needs Attention" />
            <View style={styles.section}>
              {urgentOrders.map((order, i) => (
                <Animated.View
                  key={order.id}
                  entering={FadeInDown.delay(250 + i * 60).duration(350)}
                >
                  <OrderCard order={order} />
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Active Orders Horizontal Scroll */}
        {activeAccepted.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <SectionHeader
              title="In Progress"
              action="See all"
              onAction={() => router.push('/(tabs)/orders')}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {activeAccepted.map((order) => (
                <TouchableOpacity
                  key={order.id}
                  style={styles.miniCard}
                  onPress={() => router.push(`/order/${order.id}`)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.miniCategory}>{order.craftCategory ?? '✦'}</Text>
                  <Text style={styles.miniName} numberOfLines={2}>
                    {order.orderName}
                  </Text>
                  <Text style={styles.miniCustomer}>{order.customerName}</Text>
                  <CountdownTimer dueDate={order.dueDate} style={styles.miniCountdown} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {orders.length === 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>✦</Text>
            <Text style={styles.emptyTitle}>Your studio is ready</Text>
            <Text style={styles.emptyBody}>
              Add your first order to start tracking your craft business
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/order/new')}
            >
              <Text style={styles.emptyButtonText}>Add first order →</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <FAB onPress={() => router.push('/order/new')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'PlayfairDisplay',
    color: Colors.muted,
    fontSize: 16,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  greeting: {
    fontSize: 26,
    fontFamily: 'PlayfairDisplay',
    color: Colors.bark,
    marginBottom: 4,
  },
  date: {
    fontSize: 13,
    fontFamily: 'DMSans',
    color: Colors.muted,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.lg,
    gap: 6,
  },
  section: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  horizontalScroll: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  miniCard: {
    width: 140,
    backgroundColor: Colors.warmWhite,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  miniCategory: {
    fontSize: 22,
    marginBottom: Spacing.sm,
  },
  miniName: {
    fontSize: 13,
    fontFamily: 'PlayfairDisplay',
    color: Colors.bark,
    marginBottom: 4,
    lineHeight: 18,
  },
  miniCustomer: {
    fontSize: 11,
    fontFamily: 'DMSans',
    color: Colors.muted,
    marginBottom: Spacing.sm,
  },
  miniCountdown: {
    fontSize: 11,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay',
    color: Colors.bark,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 14,
    fontFamily: 'DMSans',
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyButton: {
    backgroundColor: Colors.rose,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 4,
    marginTop: Spacing.sm,
  },
  emptyButtonText: {
    color: Colors.white,
    fontFamily: 'DMSans',
    fontSize: 15,
    fontWeight: '600',
  },
});
