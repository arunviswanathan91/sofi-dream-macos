import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
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
          <Text>Customer not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{customer.name}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{customer.name[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.customerName}>{customer.name}</Text>
          {customer.instagram && (
            <Text style={styles.instagram}>{customer.instagram}</Text>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{customer.totalOrders}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.rose }]}>
                €{customer.totalSpent.toFixed(2)}
              </Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </View>
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <View style={styles.card}>
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
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Instagram</Text>
                <Text style={styles.infoValue}>{customer.instagram}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Orders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            All Orders ({customerOrders.length})
          </Text>
          {customerOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  notFound: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backText: { fontSize: 20, color: Colors.muted },
  headerTitle: { fontSize: 18, fontFamily: 'PlayfairDisplay', color: Colors.bark },
  profileCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.warmWhite,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.rose,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: 30,
    color: Colors.white,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '600',
  },
  customerName: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay',
    color: Colors.bark,
    marginBottom: 4,
  },
  instagram: {
    fontSize: 13,
    fontFamily: 'DMSans',
    color: Colors.muted,
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
    fontFamily: 'DMMono',
    color: Colors.bark,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'DMSans',
    color: Colors.muted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  section: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'DMSans',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.warmWhite,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: { fontSize: 11, fontFamily: 'DMSans', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
  infoValue: { fontSize: 14, fontFamily: 'DMSans', color: Colors.bark, flex: 2, textAlign: 'right' },
});
