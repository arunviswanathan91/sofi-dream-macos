import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCustomers } from '../../hooks/useCustomers';
import { useOrders } from '../../hooks/useOrders';
import { OrderCard } from '../../components/OrderCard';
import { Colors, Spacing, BorderRadius } from '../../lib/theme';

export default function CustomerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { customers } = useCustomers();
  const { orders } = useOrders();

  const customer = useMemo(() => customers.find((c) => c.id === id), [customers, id]);
  const customerOrders = useMemo(
    () => orders.filter((o) => o.customerName === customer?.name),
    [orders, customer]
  );

  if (!customer) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Customer not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with pill back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backPill}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={{ width: 72 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero profile block — tonal surfaceLow, no border */}
        <View style={styles.heroCard}>
          {/* Avatar */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{customer.name[0].toUpperCase()}</Text>
          </View>

          {/* Customer name — PlayfairDisplay 28px hero */}
          <Text style={styles.customerName}>{customer.name}</Text>
          {customer.instagram && (
            <Text style={styles.instagram}>{customer.instagram}</Text>
          )}

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{customer.totalOrders}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.primary }]}>
                €{customer.totalSpent.toFixed(2)}
              </Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </View>
          </View>
        </View>

        {/* Contact Info — surfaceLowest card, no border */}
        {(customer.address || customer.phone || customer.instagram) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>
            <View style={styles.contactCard}>
              {customer.address ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Address</Text>
                  <Text style={styles.infoValue}>{customer.address}</Text>
                </View>
              ) : null}
              {customer.phone ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{customer.phone}</Text>
                </View>
              ) : null}
              {customer.instagram ? (
                <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.infoLabel}>Instagram</Text>
                  <Text style={styles.infoValue}>{customer.instagram}</Text>
                </View>
              ) : null}
            </View>
          </View>
        )}

        {/* Order history — 4px ribbon cards from OrderCard */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            All Orders ({customerOrders.length})
          </Text>
          {customerOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
          {customerOrders.length === 0 && (
            <View style={styles.emptyOrders}>
              <Text style={styles.emptyText}>No orders yet</Text>
            </View>
          )}
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  notFound: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFoundText: { fontFamily: 'DMSans', color: Colors.subText, fontSize: 15 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backPill: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backText: {
    fontSize: 13,
    fontFamily: 'DMSans',
    color: Colors.primary,
    fontWeight: '600',
  },

  heroCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surfaceLow,
    borderRadius: BorderRadius.cardLarge,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: 30,
    color: Colors.onPrimary,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '600',
  },
  customerName: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  instagram: {
    fontSize: 13,
    fontFamily: 'DMSans',
    color: Colors.subText,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
    marginTop: Spacing.md,
  },
  statItem: { alignItems: 'center' },
  statValue: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'DMSans',
    color: Colors.subText,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.outlineVariant,
  },

  section: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },

  contactCard: {
    backgroundColor: Colors.surfaceLowest,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    shadowColor: 'rgba(0,0,0,0.03)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.outlineVariant,
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: 'DMSans',
    color: Colors.subText,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'DMSans',
    color: Colors.text,
    flex: 2,
    textAlign: 'right',
  },

  emptyOrders: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    backgroundColor: Colors.surfaceLow,
    borderRadius: BorderRadius.card,
  },
  emptyText: {
    fontFamily: 'DMSans',
    color: Colors.subText,
    fontSize: 14,
  },
});
