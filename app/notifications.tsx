import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, Switch, TextInput, KeyboardAvoidingView,
  Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotifications } from '../hooks/useNotifications';
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
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}><Text style={s.back}>←</Text></TouchableOpacity>
        <Text style={s.headerTitle}>Notification Settings</Text>
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
                  placeholderTextColor={Colors.muted}
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
                  placeholderTextColor={Colors.muted}
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
                  placeholderTextColor={Colors.muted}
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
                  placeholderTextColor={Colors.muted}
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
                  placeholderTextColor={Colors.muted}
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
      <Switch value={value} onValueChange={onChange} trackColor={{ false: Colors.border, true: Colors.rose }} thumbColor={Colors.white} />
    </View>
  );
}
function Lbl({ children }: { children: string }) {
  return <Text style={s.fieldLbl}>{children}</Text>;
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  back: { fontSize: 22, color: Colors.muted, lineHeight: 28 },
  headerTitle: { fontSize: 17, fontFamily: 'PlayfairDisplay', color: Colors.bark },
  saveHeaderBtn: { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: Colors.rose, borderRadius: BorderRadius.full },
  saveHeaderTxt: { color: Colors.white, fontFamily: 'DMSans', fontSize: 13, fontWeight: '700' },
  section: { paddingHorizontal: Spacing.md, marginTop: Spacing.lg },
  sectionTitle: { fontSize: 11, fontFamily: 'DMSans', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '600', marginBottom: 8 },
  card: { backgroundColor: Colors.warmWhite, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  rowLabel: { fontSize: 14, fontFamily: 'DMSans', color: Colors.bark },
  rowSub: { fontSize: 12, fontFamily: 'DMSans', color: Colors.muted, marginTop: 2 },
  fieldLbl: { fontSize: 11, fontFamily: 'DMSans', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 8, marginBottom: 4 },
  input: { backgroundColor: Colors.cream, borderRadius: BorderRadius.sm, paddingHorizontal: 14, paddingVertical: 11, fontFamily: 'DMMono', fontSize: 15, color: Colors.bark, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full, backgroundColor: Colors.cream, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border },
  chipOn: { backgroundColor: Colors.rose, borderColor: Colors.rose },
  chipTxt: { fontSize: 12, fontFamily: 'DMMono', color: Colors.muted },
  chipTxtOn: { color: Colors.white, fontWeight: '600' },
  actions: { paddingHorizontal: Spacing.md, marginTop: Spacing.lg, gap: 10 },
  testBtn: { borderWidth: 1, borderColor: Colors.rose, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', backgroundColor: `${Colors.rose}11` },
  testTxt: { color: Colors.rose, fontFamily: 'DMSans', fontSize: 14, fontWeight: '600' },
  resetBtn: { borderWidth: 1, borderColor: Colors.coral, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', backgroundColor: `${Colors.coral}11` },
  resetTxt: { color: Colors.coral, fontFamily: 'DMSans', fontSize: 14, fontWeight: '600' },
  stickyBar: { backgroundColor: Colors.cream, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border, paddingHorizontal: Spacing.md, paddingTop: 10 },
  stickySave: { backgroundColor: Colors.rose, borderRadius: BorderRadius.md, paddingVertical: 15, alignItems: 'center' },
  stickySaveTxt: { color: Colors.white, fontFamily: 'DMSans', fontSize: 15, fontWeight: '700' },
});
