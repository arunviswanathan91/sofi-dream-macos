import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOrders } from '../../hooks/useOrders';
import { useReports } from '../../hooks/useReports';
import { useProfile } from '../../hooks/useProfile';
import { useTheme } from '../../context/ThemeContext';
import { OrderCard } from '../../components/OrderCard';
import { CountdownTimer } from '../../components/CountdownTimer';
import { StatTile } from '../../components/StatTile';
import { SectionHeader } from '../../components/SectionHeader';
import { FAB } from '../../components/FAB';
import { Colors, Spacing, BorderRadius, getCurrencySymbol } from '../../lib/theme';

// Design tokens — Stitch "Warm Artisan Editorial"
const T = {
  bg: '#FFF8F5',
  surfaceLow: '#F9F2EF',
  surfaceContainer: '#F3ECEA',
  surfaceHigh: '#EDE7E4',
  surfaceHighest: '#E8E1DE',
  surfaceLowest: '#FFFFFF',
  primary: '#864D5F',
  primaryContainer: '#C9879A',
  onPrimary: '#FFFFFF',
  tertiary: '#994530',
  secondary: '#625E5A',
  secondaryContainer: '#E8E1DC',
  text: '#1D1B1A',
  subText: '#514346',
  outline: '#837376',
  outlineVariant: '#D5C2C5',
};

const QUOTES = [
  { text: 'Build something people want.', author: 'Paul Graham' },
  { text: 'Done is better than perfect.', author: 'Sheryl Sandberg' },
  { text: 'Make something wonderful and put it in the world.', author: 'Steve Jobs' },
  { text: 'Chase the vision, not the money; the money will end up following you.', author: 'Tony Hsieh' },
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'Create with the heart; build with the mind.', author: 'Criss Jami' },
  { text: 'Every master was once a beginner. Every pro was once an amateur.', author: 'Robin Sharma' },
  { text: 'Quality is not an act, it is a habit.', author: 'Aristotle' },
  { text: 'Make each day your masterpiece.', author: 'John Wooden' },
  { text: 'Your craft is your fingerprint — no one else can make what you make.', author: '' },
  { text: 'The best way to predict the future is to create it.', author: 'Peter Drucker' },
  { text: 'Small businesses are the backbone of our economy.', author: 'Barack Obama' },
  { text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill' },
  { text: 'The craft of making is where soul meets skill.', author: '' },
  { text: 'Start where you are. Use what you have. Do what you can.', author: 'Arthur Ashe' },
];

function getDailyQuote() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return QUOTES[dayOfYear % QUOTES.length];
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

/** Extract a first name from a business name, falling back to the full name */
function firstName(name: string): string {
  const words = name.trim().split(/\s+/);
  return words[0] ?? name;
}

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orders, loading } = useOrders();
  const { profile } = useProfile();
  const { colors } = useTheme();
  const { dashboardStats } = useReports(orders, 'month');
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

  const { activeOrders, dueThisWeek, shippedCount, monthRevenue, urgentOrders } = dashboardStats;

  const activeAccepted = useMemo(
    () => orders.filter((o) => o.status === 'accepted').slice(0, 8),
    [orders]
  );

  const dailyQuote = getDailyQuote();

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
      {/* Glassmorphism-style header bar */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Artisan Studio</Text>
        <View style={styles.topBarBell}>
          <Text style={styles.topBarBellIcon}>🔔</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Greeting */}
        <Animated.View entering={FadeInDown.delay(0).duration(400)} style={styles.greetingSection}>
          <Text style={styles.greeting}>
            {getGreeting()}, {firstName(profile.name)} ☀️
          </Text>
          <Text style={styles.greetingSubtitle}>Your atelier is ready for today's creations.</Text>
        </Animated.View>

        {/* Daily Quote Card */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)}>
          <View style={styles.quoteCard}>
            <Text style={styles.quoteText}>"{dailyQuote.text}"</Text>
            {dailyQuote.author ? (
              <Text style={styles.quoteAuthor}>— {dailyQuote.author}</Text>
            ) : null}
          </View>
        </Animated.View>

        {/* Stats Grid 2x2 */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={[styles.statsGrid, isTablet && styles.statsGridTablet]}
        >
          <TouchableOpacity
            style={[styles.statCard, styles.statCardTertiary]}
            onPress={() => router.push('/(tabs)/orders')}
            activeOpacity={0.85}
          >
            <View style={styles.statCardTop}>
              <Text style={styles.statIconTertiary}>◈</Text>
              <View style={styles.statBadgeTertiary}><Text style={styles.statBadgeText}>ACTIVE</Text></View>
            </View>
            <Text style={styles.statValue}>{activeOrders}</Text>
            <Text style={styles.statLabel}>ACTIVE ORDERS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, styles.statCardPrimary]}
            onPress={() => router.push('/(tabs)/orders')}
            activeOpacity={0.85}
          >
            <Text style={styles.statIconPrimary}>₿</Text>
            <Text style={styles.statValue}>{getCurrencySymbol(profile.currency)}{monthRevenue.toFixed(0)}</Text>
            <Text style={styles.statLabel}>REVENUE THIS MONTH</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push('/(tabs)/orders')}
            activeOpacity={0.85}
          >
            <Text style={styles.statIconSecondary}>✓</Text>
            <Text style={styles.statValue}>{String(shippedCount).padStart(2, '0')}</Text>
            <Text style={styles.statLabel}>COMPLETED THIS WEEK</Text>
          </TouchableOpacity>

          <View style={styles.statCard}>
            <Text style={styles.statIconSecondary}>⬡</Text>
            <Text style={styles.statValue}>{String(dueThisWeek).padStart(2, '0')}</Text>
            <Text style={styles.statLabel}>DUE THIS WEEK</Text>
          </View>
        </Animated.View>

        {/* Quick Actions Pill Row */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsContent}
            style={styles.quickActionsScroll}
          >
            <TouchableOpacity
              style={styles.quickActionPrimary}
              onPress={() => router.push('/order/new')}
              activeOpacity={0.85}
            >
              <Text style={styles.quickActionPrimaryText}>+ New Order</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionSecondary} activeOpacity={0.85}>
              <Text style={styles.quickActionSecondaryText}>Add Customer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionSecondary}
              onPress={() => router.push('/(tabs)/orders')}
              activeOpacity={0.85}
            >
              <Text style={styles.quickActionSecondaryText}>View Reports</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionSecondary} activeOpacity={0.85}>
              <Text style={styles.quickActionSecondaryText}>Export PDF</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>

        {/* Urgent / Needs Attention */}
        {urgentOrders.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Needs Attention</Text>
            </View>
            <View style={[styles.section, isTablet && styles.sectionTablet]}>
              {urgentOrders.map((order, i) => (
                <Animated.View
                  key={order.id}
                  entering={FadeInDown.delay(250 + i * 60).duration(350)}
                  style={isTablet ? styles.tabletCard : undefined}
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
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>In Progress</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/orders')}>
                <Text style={styles.sectionAction}>See all</Text>
              </TouchableOpacity>
            </View>
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
                  {/* Left status ribbon */}
                  <View style={styles.miniCardRibbon} />
                  <View style={styles.miniCardContent}>
                    <Text style={styles.miniCategory}>{order.craftCategory ?? '✦'}</Text>
                    <Text style={styles.miniName} numberOfLines={2}>
                      {order.orderName}
                    </Text>
                    <Text style={styles.miniCustomer}>{order.customerName}</Text>
                    <CountdownTimer dueDate={order.dueDate} style={styles.miniCountdown} />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Recent Orders section header + recent list */}
        {orders.length > 0 && (
          <Animated.View entering={FadeInDown.delay(350).duration(400)}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent Orders</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/orders')}>
                <Text style={styles.sectionAction}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.recentOrdersList}>
              {orders.slice(0, 3).map((order) => {
                const isUrgent = order.status === 'accepted' || order.status === 'request';
                const ribbonColor = isUrgent ? T.tertiary : (order.status === 'shipped' ? T.primary : T.outlineVariant);
                return (
                  <TouchableOpacity
                    key={order.id}
                    style={styles.recentOrderCard}
                    onPress={() => router.push(`/order/${order.id}`)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.recentRibbon, { backgroundColor: ribbonColor }]} />
                    <View style={styles.recentCardBody}>
                      <View style={styles.recentCardLeft}>
                        <Text style={styles.recentOrderName} numberOfLines={1}>{order.orderName}</Text>
                        <Text style={styles.recentOrderSub}>#{order.id.slice(-6)} • {order.customerName}</Text>
                      </View>
                      <View style={styles.recentCardRight}>
                        <Text style={styles.recentPrice}>{getCurrencySymbol(order.currency)}{order.askingPrice.toFixed(2)}</Text>
                        <Text style={[styles.recentStatus, { color: ribbonColor }]}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
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

        <View style={{ height: insets.bottom + 100 }} />
      </ScrollView>

      <FAB onPress={() => router.push('/order/new')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: T.bg,
  },
  topBarTitle: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
    color: T.primary,
    letterSpacing: 0.5,
  },
  topBarBell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.surfaceLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarBellIcon: {
    fontSize: 16,
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
    fontSize: 16,
    color: T.subText,
  },
  // Greeting
  greetingSection: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 32,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
    color: T.text,
    marginBottom: 4,
    lineHeight: 40,
  },
  greetingSubtitle: {
    fontSize: 14,
    fontFamily: 'DMSans',
    color: T.subText,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  // Quote card
  quoteCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    padding: 16,
    backgroundColor: T.surfaceLow,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  quoteText: {
    fontSize: 13,
    fontFamily: 'PlayfairDisplay',
    lineHeight: 20,
    fontStyle: 'italic',
    color: T.text,
  },
  quoteAuthor: {
    fontSize: 11,
    fontFamily: 'DMSans',
    letterSpacing: 0.5,
    color: T.subText,
  },
  // Stats 2x2 grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 12,
  },
  statsGridTablet: {
    flexWrap: 'nowrap',
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: T.surfaceLow,
    borderRadius: 16,
    padding: 16,
    gap: 4,
    shadowColor: '#2C2C2C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  statCardTertiary: {
    backgroundColor: T.surfaceLow,
  },
  statCardPrimary: {
    backgroundColor: T.surfaceLowest,
    shadowColor: T.primary,
    shadowOpacity: 0.08,
  },
  statCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIconTertiary: {
    fontSize: 22,
    color: T.tertiary,
  },
  statIconPrimary: {
    fontSize: 22,
    color: T.primary,
    marginBottom: 8,
  },
  statIconSecondary: {
    fontSize: 22,
    color: T.subText,
    marginBottom: 8,
  },
  statBadgeTertiary: {
    backgroundColor: T.tertiary,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statBadgeText: {
    fontSize: 9,
    fontFamily: 'DMSans',
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
    color: T.text,
    lineHeight: 34,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'DMSans',
    fontWeight: '600',
    color: T.subText,
    textTransform: 'uppercase',
    letterSpacing: -0.3,
  },
  // Quick actions
  quickActionsScroll: {
    marginBottom: 20,
  },
  quickActionsContent: {
    paddingHorizontal: 16,
    gap: 10,
    alignItems: 'center',
  },
  quickActionPrimary: {
    backgroundColor: T.primary,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12,
    shadowColor: T.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  quickActionPrimaryText: {
    color: '#FFFFFF',
    fontFamily: 'DMSans',
    fontSize: 14,
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  quickActionSecondary: {
    backgroundColor: T.surfaceHighest,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  quickActionSecondaryText: {
    color: T.text,
    fontFamily: 'DMSans',
    fontSize: 14,
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  // Section headers
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
    color: T.text,
  },
  sectionAction: {
    fontSize: 13,
    fontFamily: 'DMSans',
    fontWeight: '700',
    color: T.primary,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tabletCard: {
    flex: 1,
    minWidth: 280,
  },
  // Horizontal mini cards
  horizontalScroll: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
    marginBottom: 20,
  },
  miniCard: {
    width: 148,
    borderRadius: 16,
    backgroundColor: T.surfaceLowest,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  miniCardRibbon: {
    width: 4,
    backgroundColor: T.primary,
  },
  miniCardContent: {
    flex: 1,
    padding: 12,
  },
  miniCategory: {
    fontSize: 20,
    marginBottom: 6,
  },
  miniName: {
    fontSize: 13,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
    color: T.text,
    marginBottom: 4,
    lineHeight: 18,
  },
  miniCustomer: {
    fontSize: 11,
    fontFamily: 'DMSans',
    color: T.subText,
    marginBottom: 6,
  },
  miniCountdown: {
    fontSize: 11,
  },
  // Recent orders list
  recentOrdersList: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  recentOrderCard: {
    backgroundColor: T.surfaceLowest,
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 2,
  },
  recentRibbon: {
    width: 4,
    alignSelf: 'stretch',
  },
  recentCardBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  recentCardLeft: {
    flex: 1,
  },
  recentOrderName: {
    fontSize: 16,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
    color: T.text,
    marginBottom: 4,
  },
  recentOrderSub: {
    fontSize: 12,
    fontFamily: 'DMSans',
    color: T.subText,
  },
  recentCardRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  recentPrice: {
    fontSize: 15,
    fontFamily: 'DMSans',
    fontWeight: '700',
    color: T.text,
    marginBottom: 2,
  },
  recentStatus: {
    fontSize: 10,
    fontFamily: 'DMSans',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 40,
    gap: 16,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
    color: T.text,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 14,
    fontFamily: 'DMSans',
    color: T.subText,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyButton: {
    backgroundColor: T.primary,
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginTop: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontFamily: 'DMSans',
    fontSize: 15,
    fontWeight: '600',
  },
});
