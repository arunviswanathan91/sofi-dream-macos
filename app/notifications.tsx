import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Switch, TextInput, KeyboardAvoidingView,
  Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotifications } from '../hooks/useNotifications';
import { useTheme } from '../context/ThemeContext';
import { DEFAULT_NOTIFICATION_PREFS } from '../types';
import { Colors, Spacing, BorderRadius } from '../lib/theme';

const DAY_OPTIONS = [
  { label: 'Sun', value: 0 }, { label: 'Mon', value: 1 }, { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 }, { label: 'Thu', value: 4 }, { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { prefs, updatePrefs, testNotification } = useNotifications();
  const { colors } = useTheme();

  // ── Local draft state ── only committed on Save ──────────────
  const [draft, setDraft] = useState({ ...prefs });

  // Local text fields (avoids appending bug and prevents save-on-every-keystroke)
  const [dueAlertTime, setDueAlertTime] = useState(prefs.dueSoonAlerts.time);
  const [digestTime, setDigestTime] = useState(prefs.dailyDigest.time);
  const [weeklyTime, setWeeklyTime] = useState(prefs.weeklySummary.time);
  const [shipDays, setShipDays] = useState(String(prefs.shippingReminder.daysAfterAccepted));
  const [payDays, setPayDays] = useState(String(prefs.paymentReminder.daysAfterDelivery));

  // Sync from prefs if they change from outside (e.g. Firebase listener)
  useEffect(() => {
    setDraft({ ...prefs });
    setDueAlertTime(prefs.dueSoonAlerts.time);
    setDigestTime(prefs.dailyDigest.time);
    setWeeklyTime(prefs.weeklySummary.time);
    setShipDays(String(prefs.shippingReminder.daysAfterAccepted));
    setPayDays(String(prefs.paymentReminder.daysAfterDelivery));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);   // only on mount — don't re-sync on every remote update while editing

  const set = useCallback(<K extends keyof typeof draft>(key: K, val: (typeof draft)[K]) => {
    setDraft((d) => ({ ...d, [key]: val }));
  }, []);

  const toggleDayInterval = (day: number) => {
    const curr = draft.dueSoonAlerts.intervals;
    const next = curr.includes(day)
      ? curr.filter((d) => d !== day)
      : [...curr, day].sort((a, b) => a - b);
    set('dueSoonAlerts', { ...draft.dueSoonAlerts, intervals: next });
  };

  const handleSave = async () => {
    const shipN = Math.max(1, parseInt(shipDays) || 3);
    const payN = Math.max(1, parseInt(payDays) || 2);
    const finalPrefs = {
      ...draft,
      dueSoonAlerts: { ...draft.dueSoonAlerts, time: dueAlertTime.trim() || '09:00' },
      dailyDigest: { ...draft.dailyDigest, time: digestTime.trim() || '08:00' },
      weeklySummary: { ...draft.weeklySummary, time: weeklyTime.trim() || '09:00' },
      shippingReminder: { ...draft.shippingReminder, daysAfterAccepted: shipN },
      paymentReminder: { ...draft.paymentReminder, daysAfterDelivery: payN },
    };
    await updatePrefs(finalPrefs);
    Alert.alert('Saved', 'Notification preferences saved.');
  };

  const handleResetDefaults = () => {
    Alert.alert(
      'Reset to Defaults',
      'This will restore all notification settings to their defaults.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const d = DEFAULT_NOTIFICATION_PREFS;
            setDraft({ ...d });
            setDueAlertTime(d.dueSoonAlerts.time);
            setDigestTime(d.dailyDigest.time);
            setWeeklyTime(d.weeklySummary.time);
            setShipDays(String(d.shippingReminder.daysAfterAccepted));
            setPayDays(String(d.paymentReminder.daysAfterDelivery));
            await updatePrefs(d);
            Alert.alert('Done', 'Settings reset to defaults.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backPill} hitSlop={12}>
          <Text style={s.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={handleSave} style={s.saveHeaderBtn} hitSlop={8}>
          <Text style={s.saveHeaderTxt}>Save</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        >
          {/* Master */}
          <Sec title="Master">
            <Row
              label="Enable all notifications"
              value={draft.enabled}
              onChange={(v) => set('enabled', v)}
            />
          </Sec>

          {/* Due alerts */}
          <Sec title="Due-Date Alerts">
            <Row
              label="Remind me before due dates"
              value={draft.dueSoonAlerts.enabled}
              onChange={(v) => set('dueSoonAlerts', { ...draft.dueSoonAlerts, enabled: v })}
            />
            {draft.dueSoonAlerts.enabled && (
              <>
                <Lbl>Days before due (tap to toggle)</Lbl>
                <View style={s.chips}>
                  {[1, 2, 3, 5, 7, 14].map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[s.chip, draft.dueSoonAlerts.intervals.includes(d) && s.chipOn]}
                      onPress={() => toggleDayInterval(d)}
                    >
                      <Text style={[s.chipTxt, draft.dueSoonAlerts.intervals.includes(d) && s.chipTxtOn]}>{d}d</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Lbl>Alert time (HH:MM)</Lbl>
                <TextInput
                  style={s.input}
                  value={dueAlertTime}
                  onChangeText={setDueAlertTime}
                  placeholder="09:00"
                  placeholderTextColor={Colors.outline}
                  keyboardType="numbers-and-punctuation"
                />
              </>
            )}
          </Sec>

          {/* Daily digest */}
          <Sec title="Daily Digest">
            <Row
              label="Morning summary"
              sublabel="Active orders, what's due, revenue"
              value={draft.dailyDigest.enabled}
              onChange={(v) => set('dailyDigest', { ...draft.dailyDigest, enabled: v })}
            />
            {draft.dailyDigest.enabled && (
              <>
                <Lbl>Send at (HH:MM)</Lbl>
                <TextInput
                  style={s.input}
                  value={digestTime}
                  onChangeText={setDigestTime}
                  placeholder="08:00"
                  placeholderTextColor={Colors.outline}
                  keyboardType="numbers-and-punctuation"
                />
              </>
            )}
          </Sec>

          {/* Weekly summary */}
          <Sec title="Weekly Summary">
            <Row
              label="Weekly recap"
              sublabel="Revenue, completed orders, upcoming"
              value={draft.weeklySummary.enabled}
              onChange={(v) => set('weeklySummary', { ...draft.weeklySummary, enabled: v })}
            />
            {draft.weeklySummary.enabled && (
              <>
                <Lbl>Day of week</Lbl>
                <View style={s.chips}>
                  {DAY_OPTIONS.map((d) => (
                    <TouchableOpacity
                      key={d.value}
                      style={[s.chip, draft.weeklySummary.dayOfWeek === d.value && s.chipOn]}
                      onPress={() => set('weeklySummary', { ...draft.weeklySummary, dayOfWeek: d.value })}
                    >
                      <Text style={[s.chipTxt, draft.weeklySummary.dayOfWeek === d.value && s.chipTxtOn]}>{d.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Lbl>Send at (HH:MM)</Lbl>
                <TextInput
                  style={s.input}
                  value={weeklyTime}
                  onChangeText={setWeeklyTime}
                  placeholder="09:00"
                  placeholderTextColor={Colors.outline}
                  keyboardType="numbers-and-punctuation"
                />
              </>
            )}
          </Sec>

          {/* Shipping */}
          <Sec title="Shipping Reminders">
            <Row
              label="Remind me to ship accepted orders"
              value={draft.shippingReminder.enabled}
              onChange={(v) => set('shippingReminder', { ...draft.shippingReminder, enabled: v })}
            />
            {draft.shippingReminder.enabled && (
              <>
                <Lbl>Days after accepting order</Lbl>
                <TextInput
                  style={s.input}
                  value={shipDays}
                  onChangeText={setShipDays}
                  keyboardType="number-pad"
                  placeholder="3"
                  placeholderTextColor={Colors.outline}
                />
              </>
            )}
          </Sec>

          {/* Payment */}
          <Sec title="Payment Reminders">
            <Row
              label="Remind me about unpaid orders"
              value={draft.paymentReminder.enabled}
              onChange={(v) => set('paymentReminder', { ...draft.paymentReminder, enabled: v })}
            />
            {draft.paymentReminder.enabled && (
              <>
                <Lbl>Days after delivery if unpaid</Lbl>
                <TextInput
                  style={s.input}
                  value={payDays}
                  onChangeText={setPayDays}
                  keyboardType="number-pad"
                  placeholder="2"
                  placeholderTextColor={Colors.outline}
                />
              </>
            )}
          </Sec>

          {/* Test + Reset */}
          <View style={s.actions}>
            <TouchableOpacity style={s.testBtn} onPress={testNotification}>
              <Text style={s.testTxt}>Send Test Notification</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.resetBtn} onPress={handleResetDefaults}>
              <Text style={s.resetTxt}>Reset to Defaults</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky save bar */}
      <View style={[s.stickyBar, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity style={s.stickySave} onPress={handleSave}>
          <Text style={s.stickySaveTxt}>Save Preferences</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {/* surfaceLowest card, no border */}
      <View style={s.card}>{children}</View>
    </View>
  );
}

function Row({ label, sublabel, value, onChange }: {
  label: string; sublabel?: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <View style={s.row}>
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={s.rowLabel}>{label}</Text>
        {sublabel && <Text style={s.rowSub}>{sublabel}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: Colors.outlineVariant, true: Colors.primaryContainer }}
        thumbColor={Colors.surfaceLowest}
      />
    </View>
  );
}

function Lbl({ children }: { children: string }) {
  return <Text style={s.fieldLbl}>{children}</Text>;
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  backPill: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  back: { fontSize: 13, fontFamily: 'DMSans', color: Colors.primary, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay', fontWeight: '700', color: Colors.text },
  saveHeaderBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: Colors.primaryContainer,
    borderRadius: BorderRadius.pill,
  },
  saveHeaderTxt: { color: Colors.onPrimary, fontFamily: 'DMSans', fontSize: 13, fontWeight: '700' },

  section: { paddingHorizontal: Spacing.md, marginTop: Spacing.lg },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  card: {
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceLowest,
    gap: 8,
    shadowColor: 'rgba(0,0,0,0.03)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  rowLabel: { fontSize: 14, fontFamily: 'DMSans', color: Colors.text },
  rowSub: { fontSize: 12, fontFamily: 'DMSans', marginTop: 2, color: Colors.subText },

  fieldLbl: {
    fontSize: 11,
    fontFamily: 'DMSans',
    color: Colors.subText,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 4,
  },

  // pill-shaped time input
  input: {
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: 'DMMono',
    fontSize: 15,
    backgroundColor: Colors.surfaceContainer,
    color: Colors.text,
  },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.surfaceContainer,
  },
  chipOn: { backgroundColor: Colors.primaryContainer },
  chipTxt: { fontSize: 12, fontFamily: 'DMMono', color: Colors.subText },
  chipTxtOn: { color: Colors.onPrimary, fontWeight: '600' },

  actions: { paddingHorizontal: Spacing.md, marginTop: Spacing.lg, gap: 10 },
  testBtn: {
    borderRadius: BorderRadius.pill,
    padding: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainer,
  },
  testTxt: { color: Colors.primary, fontFamily: 'DMSans', fontSize: 14, fontWeight: '600' },
  resetBtn: {
    borderRadius: BorderRadius.pill,
    padding: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.surfaceHigh,
  },
  resetTxt: { color: Colors.subText, fontFamily: 'DMSans', fontSize: 14, fontWeight: '600' },

  stickyBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.outlineVariant,
    paddingHorizontal: Spacing.md,
    paddingTop: 10,
    backgroundColor: Colors.background,
  },
  stickySave: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: BorderRadius.pill,
    paddingVertical: 15,
    alignItems: 'center',
  },
  stickySaveTxt: { color: Colors.onPrimary, fontFamily: 'DMSans', fontSize: 15, fontWeight: '700' },
});
