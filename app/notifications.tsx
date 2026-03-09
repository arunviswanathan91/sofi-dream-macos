import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useNotifications } from '../hooks/useNotifications';
import { Colors, Spacing, BorderRadius } from '../lib/theme';

const DAY_OPTIONS = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const { prefs, updatePrefs, testNotification } = useNotifications();

  const toggleDayInterval = (day: number) => {
    const current = prefs.dueSoonAlerts.intervals;
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day].sort((a, b) => a - b);
    updatePrefs({ dueSoonAlerts: { ...prefs.dueSoonAlerts, intervals: next } });
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );

  const ToggleRow = ({
    label,
    value,
    onValueChange,
    sublabel,
  }: {
    label: string;
    value: boolean;
    onValueChange: (v: boolean) => void;
    sublabel?: string;
  }) => (
    <View style={styles.toggleRow}>
      <View style={styles.toggleText}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {sublabel && <Text style={styles.toggleSublabel}>{sublabel}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.border, true: Colors.rose }}
        thumbColor={Colors.white}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Master Toggle */}
        <Section title="Master">
          <ToggleRow
            label="Enable All Notifications"
            value={prefs.enabled}
            onValueChange={(v) => updatePrefs({ enabled: v })}
          />
        </Section>

        {/* Due Soon Alerts */}
        <Section title="Due-Date Alerts">
          <ToggleRow
            label="Remind me before due dates"
            value={prefs.dueSoonAlerts.enabled}
            onValueChange={(v) =>
              updatePrefs({ dueSoonAlerts: { ...prefs.dueSoonAlerts, enabled: v } })
            }
          />
          {prefs.dueSoonAlerts.enabled && (
            <>
              <Text style={styles.fieldLabel}>Days before due</Text>
              <View style={styles.daysRow}>
                {[1, 2, 3, 5, 7, 14].map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.dayChip,
                      prefs.dueSoonAlerts.intervals.includes(d) && styles.dayChipActive,
                    ]}
                    onPress={() => toggleDayInterval(d)}
                  >
                    <Text
                      style={[
                        styles.dayChipText,
                        prefs.dueSoonAlerts.intervals.includes(d) && styles.dayChipTextActive,
                      ]}
                    >
                      {d}d
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.fieldLabel}>Alert time</Text>
              <TextInput
                style={styles.input}
                value={prefs.dueSoonAlerts.time}
                onChangeText={(v) =>
                  updatePrefs({ dueSoonAlerts: { ...prefs.dueSoonAlerts, time: v } })
                }
                placeholder="09:00"
                placeholderTextColor={Colors.muted}
              />
            </>
          )}
        </Section>

        {/* Daily Digest */}
        <Section title="Daily Digest">
          <ToggleRow
            label="Daily morning summary"
            sublabel="Shows active orders, what's due, revenue"
            value={prefs.dailyDigest.enabled}
            onValueChange={(v) =>
              updatePrefs({ dailyDigest: { ...prefs.dailyDigest, enabled: v } })
            }
          />
          {prefs.dailyDigest.enabled && (
            <>
              <Text style={styles.fieldLabel}>Send at</Text>
              <TextInput
                style={styles.input}
                value={prefs.dailyDigest.time}
                onChangeText={(v) =>
                  updatePrefs({ dailyDigest: { ...prefs.dailyDigest, time: v } })
                }
                placeholder="08:00"
                placeholderTextColor={Colors.muted}
              />
            </>
          )}
        </Section>

        {/* Weekly Summary */}
        <Section title="Weekly Summary">
          <ToggleRow
            label="Weekly recap notification"
            sublabel="Revenue, completed orders, upcoming"
            value={prefs.weeklySummary.enabled}
            onValueChange={(v) =>
              updatePrefs({ weeklySummary: { ...prefs.weeklySummary, enabled: v } })
            }
          />
          {prefs.weeklySummary.enabled && (
            <>
              <Text style={styles.fieldLabel}>Day of week</Text>
              <View style={styles.daysRow}>
                {DAY_OPTIONS.map((d) => (
                  <TouchableOpacity
                    key={d.value}
                    style={[
                      styles.dayChip,
                      prefs.weeklySummary.dayOfWeek === d.value && styles.dayChipActive,
                    ]}
                    onPress={() =>
                      updatePrefs({
                        weeklySummary: { ...prefs.weeklySummary, dayOfWeek: d.value },
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.dayChipText,
                        prefs.weeklySummary.dayOfWeek === d.value && styles.dayChipTextActive,
                      ]}
                    >
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.fieldLabel}>Send at</Text>
              <TextInput
                style={styles.input}
                value={prefs.weeklySummary.time}
                onChangeText={(v) =>
                  updatePrefs({ weeklySummary: { ...prefs.weeklySummary, time: v } })
                }
                placeholder="09:00"
                placeholderTextColor={Colors.muted}
              />
            </>
          )}
        </Section>

        {/* Shipping Reminders */}
        <Section title="Shipping Reminders">
          <ToggleRow
            label="Remind me to ship accepted orders"
            value={prefs.shippingReminder.enabled}
            onValueChange={(v) =>
              updatePrefs({ shippingReminder: { ...prefs.shippingReminder, enabled: v } })
            }
          />
          {prefs.shippingReminder.enabled && (
            <>
              <Text style={styles.fieldLabel}>Days after accepting</Text>
              <TextInput
                style={styles.input}
                value={prefs.shippingReminder.daysAfterAccepted.toString()}
                onChangeText={(v) =>
                  updatePrefs({
                    shippingReminder: {
                      ...prefs.shippingReminder,
                      daysAfterAccepted: parseInt(v) || 3,
                    },
                  })
                }
                keyboardType="number-pad"
                placeholder="3"
                placeholderTextColor={Colors.muted}
              />
            </>
          )}
        </Section>

        {/* Payment Reminders */}
        <Section title="Payment Reminders">
          <ToggleRow
            label="Remind me about unpaid orders"
            value={prefs.paymentReminder.enabled}
            onValueChange={(v) =>
              updatePrefs({ paymentReminder: { ...prefs.paymentReminder, enabled: v } })
            }
          />
          {prefs.paymentReminder.enabled && (
            <>
              <Text style={styles.fieldLabel}>Days after delivery if unpaid</Text>
              <TextInput
                style={styles.input}
                value={prefs.paymentReminder.daysAfterDelivery.toString()}
                onChangeText={(v) =>
                  updatePrefs({
                    paymentReminder: {
                      ...prefs.paymentReminder,
                      daysAfterDelivery: parseInt(v) || 2,
                    },
                  })
                }
                keyboardType="number-pad"
                placeholder="2"
                placeholderTextColor={Colors.muted}
              />
            </>
          )}
        </Section>

        {/* Test */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.testButton} onPress={testNotification}>
            <Text style={styles.testButtonText}>Send Test Notification</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
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
  content: { paddingBottom: 24 },
  section: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.lg,
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
    gap: Spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  toggleText: { flex: 1, marginRight: Spacing.sm },
  toggleLabel: { fontSize: 14, fontFamily: 'DMSans', color: Colors.bark },
  toggleSublabel: { fontSize: 12, fontFamily: 'DMSans', color: Colors.muted, marginTop: 2 },
  fieldLabel: {
    fontSize: 11,
    fontFamily: 'DMSans',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  input: {
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontFamily: 'DMMono',
    fontSize: 15,
    color: Colors.bark,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayChipActive: {
    backgroundColor: Colors.rose,
    borderColor: Colors.rose,
  },
  dayChipText: {
    fontSize: 12,
    fontFamily: 'DMMono',
    color: Colors.muted,
  },
  dayChipTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  testButton: {
    borderWidth: 1,
    borderColor: Colors.rose,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    backgroundColor: `${Colors.rose}11`,
  },
  testButtonText: {
    color: Colors.rose,
    fontFamily: 'DMSans',
    fontSize: 14,
    fontWeight: '600',
  },
});
