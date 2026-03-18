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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.subText }]}>Loading your studio...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(0).duration(400)} style={styles.header}>
          <Text style={[styles.greeting, { color: colors.text }]}>{getGreeting()}, {firstName(profile.name)} ✦</Text>
          <Text style={[styles.date, { color: colors.subText }]}>{format(new Date(), 'EEEE, MMMM d')}</Text>
        </Animated.View>

        {/* Daily Quote Card */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)}>
          <View style={[styles.quoteCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.quoteText, { color: colors.text }]}>"{dailyQuote.text}"</Text>
            {dailyQuote.author ? (
              <Text style={[styles.quoteAuthor, { color: colors.subText }]}>— {dailyQuote.author}</Text>
            ) : null}
          </View>
        </Animated.View>

        {/* Stats Row — 4 tiles, wraps on small screens */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={[styles.statsRow, isTablet && styles.statsRowTablet]}
        >
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
            prefix={getCurrencySymbol(profile.currency)}
            accentColor={Colors.sage}
          />
        </Animated.View>

        {/* Urgent / Needs Attention */}
        {urgentOrders.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <SectionHeader title="Needs Attention" />
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
                  style={[styles.miniCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                  onPress={() => router.push(`/order/${order.id}`)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.miniCategory}>{order.craftCategory ?? '✦'}</Text>
                  <Text style={[styles.miniName, { color: colors.text }]} numberOfLines={2}>
                    {order.orderName}
                  </Text>
                  <Text style={[styles.miniCustomer, { color: colors.subText }]}>{order.customerName}</Text>
                  <CountdownTimer dueDate={order.dueDate} style={styles.miniCountdown} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {orders.length === 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>✦</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Your studio is ready</Text>
            <Text style={[styles.emptyBody, { color: colors.subText }]}>
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
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  greeting: {
    fontSize: 26,
    fontFamily: 'PlayfairDisplay',
    marginBottom: 4,
  },
  date: {
    fontSize: 13,
    fontFamily: 'DMSans',
  },
  quoteCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    gap: 6,
  },
  quoteText: {
    fontSize: 13,
    fontFamily: 'PlayfairDisplay',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  quoteAuthor: {
    fontSize: 11,
    fontFamily: 'DMSans',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.lg,
    gap: 6,
    flexWrap: 'wrap',
  },
  statsRowTablet: {
    flexWrap: 'nowrap',
  },
  section: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tabletCard: {
    flex: 1,
    minWidth: 280,
  },
  horizontalScroll: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  miniCard: {
    width: 140,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
  },
  miniCategory: {
    fontSize: 22,
    marginBottom: Spacing.sm,
  },
  miniName: {
    fontSize: 13,
    fontFamily: 'PlayfairDisplay',
    marginBottom: 4,
    lineHeight: 18,
  },
  miniCustomer: {
    fontSize: 11,
    fontFamily: 'DMSans',
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
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 14,
    fontFamily: 'DMSans',
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
