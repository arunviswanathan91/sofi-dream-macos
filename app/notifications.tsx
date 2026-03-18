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
    <SafeAreaView style={[s.container, { backgroundColor: colors.bg }]}>
      <View style={[s.header, { borderBottomColor: colors.cardBorder }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}><Text style={[s.back, { color: colors.subText }]}>←</Text></TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.text }]}>Notification Settings</Text>
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
          <Sec title="Master" colors={colors}>
            <Row
              label="Enable all notifications"
              value={draft.enabled}
              onChange={(v) => set('enabled', v)}
              colors={colors}
            />
          </Sec>

          {/* Due alerts */}
          <Sec title="Due-Date Alerts" colors={colors}>
            <Row
              label="Remind me before due dates"
              value={draft.dueSoonAlerts.enabled}
              onChange={(v) => set('dueSoonAlerts', { ...draft.dueSoonAlerts, enabled: v })}
              colors={colors}
            />
            {draft.dueSoonAlerts.enabled && (
              <>
                <Lbl colors={colors}>Days before due (tap to toggle)</Lbl>
                <View style={s.chips}>
                  {[1, 2, 3, 5, 7, 14].map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[s.chip, { backgroundColor: colors.bg, borderColor: colors.cardBorder }, draft.dueSoonAlerts.intervals.includes(d) && s.chipOn]}
                      onPress={() => toggleDayInterval(d)}
                    >
                      <Text style={[s.chipTxt, { color: colors.subText }, draft.dueSoonAlerts.intervals.includes(d) && s.chipTxtOn]}>{d}d</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Lbl colors={colors}>Alert time (HH:MM)</Lbl>
                <TextInput
                  style={[s.input, { backgroundColor: colors.bg, borderColor: colors.cardBorder, color: colors.text }]}
                  value={dueAlertTime}
                  onChangeText={setDueAlertTime}
                  placeholder="09:00"
                  placeholderTextColor={colors.subText}
                  keyboardType="numbers-and-punctuation"
                />
              </>
            )}
          </Sec>

          {/* Daily digest */}
          <Sec title="Daily Digest" colors={colors}>
            <Row
              label="Morning summary"
              sublabel="Active orders, what's due, revenue"
              value={draft.dailyDigest.enabled}
              onChange={(v) => set('dailyDigest', { ...draft.dailyDigest, enabled: v })}
              colors={colors}
            />
            {draft.dailyDigest.enabled && (
              <>
                <Lbl colors={colors}>Send at (HH:MM)</Lbl>
                <TextInput
                  style={[s.input, { backgroundColor: colors.bg, borderColor: colors.cardBorder, color: colors.text }]}
                  value={digestTime}
                  onChangeText={setDigestTime}
                  placeholder="08:00"
                  placeholderTextColor={colors.subText}
                  keyboardType="numbers-and-punctuation"
                />
              </>
            )}
          </Sec>

          {/* Weekly summary */}
          <Sec title="Weekly Summary" colors={colors}>
            <Row
              label="Weekly recap"
              sublabel="Revenue, completed orders, upcoming"
              value={draft.weeklySummary.enabled}
              onChange={(v) => set('weeklySummary', { ...draft.weeklySummary, enabled: v })}
              colors={colors}
            />
            {draft.weeklySummary.enabled && (
              <>
                <Lbl colors={colors}>Day of week</Lbl>
                <View style={s.chips}>
                  {DAY_OPTIONS.map((d) => (
                    <TouchableOpacity
                      key={d.value}
                      style={[s.chip, { backgroundColor: colors.bg, borderColor: colors.cardBorder }, draft.weeklySummary.dayOfWeek === d.value && s.chipOn]}
                      onPress={() => set('weeklySummary', { ...draft.weeklySummary, dayOfWeek: d.value })}
                    >
                      <Text style={[s.chipTxt, { color: colors.subText }, draft.weeklySummary.dayOfWeek === d.value && s.chipTxtOn]}>{d.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Lbl colors={colors}>Send at (HH:MM)</Lbl>
                <TextInput
                  style={[s.input, { backgroundColor: colors.bg, borderColor: colors.cardBorder, color: colors.text }]}
                  value={weeklyTime}
                  onChangeText={setWeeklyTime}
                  placeholder="09:00"
                  placeholderTextColor={colors.subText}
                  keyboardType="numbers-and-punctuation"
                />
              </>
            )}
          </Sec>

          {/* Shipping */}
          <Sec title="Shipping Reminders" colors={colors}>
            <Row
              label="Remind me to ship accepted orders"
              value={draft.shippingReminder.enabled}
              onChange={(v) => set('shippingReminder', { ...draft.shippingReminder, enabled: v })}
              colors={colors}
            />
            {draft.shippingReminder.enabled && (
              <>
                <Lbl colors={colors}>Days after accepting order</Lbl>
                <TextInput
                  style={[s.input, { backgroundColor: colors.bg, borderColor: colors.cardBorder, color: colors.text }]}
                  value={shipDays}
                  onChangeText={setShipDays}
                  keyboardType="number-pad"
                  placeholder="3"
                  placeholderTextColor={colors.subText}
                />
              </>
            )}
          </Sec>

          {/* Payment */}
          <Sec title="Payment Reminders" colors={colors}>
            <Row
              label="Remind me about unpaid orders"
              value={draft.paymentReminder.enabled}
              onChange={(v) => set('paymentReminder', { ...draft.paymentReminder, enabled: v })}
              colors={colors}
            />
            {draft.paymentReminder.enabled && (
              <>
                <Lbl colors={colors}>Days after delivery if unpaid</Lbl>
                <TextInput
                  style={[s.input, { backgroundColor: colors.bg, borderColor: colors.cardBorder, color: colors.text }]}
                  value={payDays}
                  onChangeText={setPayDays}
                  keyboardType="number-pad"
                  placeholder="2"
                  placeholderTextColor={colors.subText}
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
      <View style={[s.stickyBar, { backgroundColor: colors.bg, borderTopColor: colors.cardBorder, paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity style={s.stickySave} onPress={handleSave}>
          <Text style={s.stickySaveTxt}>Save Preferences</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Sec({ title, children, colors }: { title: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={s.section}>
      <Text style={[s.sectionTitle, { color: colors.subText }]}>{title}</Text>
      <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>{children}</View>
    </View>
  );
}
function Row({ label, sublabel, value, onChange, colors }: {
  label: string; sublabel?: string; value: boolean; onChange: (v: boolean) => void; colors: any;
}) {
  return (
    <View style={s.row}>
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={[s.rowLabel, { color: colors.text }]}>{label}</Text>
        {sublabel && <Text style={[s.rowSub, { color: colors.subText }]}>{sublabel}</Text>}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: Colors.border, true: Colors.rose }} thumbColor={Colors.white} />
    </View>
  );
}
function Lbl({ children, colors }: { children: string; colors: any }) {
  return <Text style={[s.fieldLbl, { color: colors.subText }]}>{children}</Text>;
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  back: { fontSize: 22, lineHeight: 28 },
  headerTitle: { fontSize: 17, fontFamily: 'PlayfairDisplay' },
  saveHeaderBtn: { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: Colors.rose, borderRadius: BorderRadius.full },
  saveHeaderTxt: { color: Colors.white, fontFamily: 'DMSans', fontSize: 13, fontWeight: '700' },
  section: { paddingHorizontal: Spacing.md, marginTop: Spacing.lg },
  sectionTitle: { fontSize: 11, fontFamily: 'DMSans', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '600', marginBottom: 8 },
  card: { borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: StyleSheet.hairlineWidth, gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  rowLabel: { fontSize: 14, fontFamily: 'DMSans' },
  rowSub: { fontSize: 12, fontFamily: 'DMSans', marginTop: 2 },
  fieldLbl: { fontSize: 11, fontFamily: 'DMSans', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 8, marginBottom: 4 },
  input: { borderRadius: BorderRadius.sm, paddingHorizontal: 14, paddingVertical: 11, fontFamily: 'DMMono', fontSize: 15, borderWidth: StyleSheet.hairlineWidth },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full, borderWidth: StyleSheet.hairlineWidth },
  chipOn: { backgroundColor: Colors.rose, borderColor: Colors.rose },
  chipTxt: { fontSize: 12, fontFamily: 'DMMono' },
  chipTxtOn: { color: Colors.white, fontWeight: '600' },
  actions: { paddingHorizontal: Spacing.md, marginTop: Spacing.lg, gap: 10 },
  testBtn: { borderWidth: 1, borderColor: Colors.rose, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', backgroundColor: `${Colors.rose}11` },
  testTxt: { color: Colors.rose, fontFamily: 'DMSans', fontSize: 14, fontWeight: '600' },
  resetBtn: { borderWidth: 1, borderColor: Colors.coral, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', backgroundColor: `${Colors.coral}11` },
  resetTxt: { color: Colors.coral, fontFamily: 'DMSans', fontSize: 14, fontWeight: '600' },
  stickyBar: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.md, paddingTop: 10 },
  stickySave: { backgroundColor: Colors.rose, borderRadius: BorderRadius.md, paddingVertical: 15, alignItems: 'center' },
  stickySaveTxt: { color: Colors.white, fontFamily: 'DMSans', fontSize: 15, fontWeight: '700' },
});
