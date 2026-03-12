import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, Switch, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useNotifications } from '../hooks/useNotifications';
import { Colors, Spacing, BorderRadius } from '../lib/theme';

const DAY_OPTIONS = [
  { label: 'Sun', value: 0 }, { label: 'Mon', value: 1 }, { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 }, { label: 'Thu', value: 4 }, { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const { prefs, updatePrefs, testNotification } = useNotifications();

  // Local text state for number inputs — avoids the "32" appending bug.
  // We commit to prefs only on blur/submit.
  const [shipDaysText, setShipDaysText] = useState(String(prefs.shippingReminder.daysAfterAccepted));
  const [payDaysText, setPayDaysText] = useState(String(prefs.paymentReminder.daysAfterDelivery));

  // Keep local state in sync if prefs change externally
  useEffect(() => { setShipDaysText(String(prefs.shippingReminder.daysAfterAccepted)); }, [prefs.shippingReminder.daysAfterAccepted]);
  useEffect(() => { setPayDaysText(String(prefs.paymentReminder.daysAfterDelivery)); }, [prefs.paymentReminder.daysAfterDelivery]);

  const commitShipDays = () => {
    const n = Math.max(1, parseInt(shipDaysText) || 3);
    setShipDaysText(String(n));
    updatePrefs({ shippingReminder: { ...prefs.shippingReminder, daysAfterAccepted: n } });
  };
  const commitPayDays = () => {
    const n = Math.max(1, parseInt(payDaysText) || 2);
    setPayDaysText(String(n));
    updatePrefs({ paymentReminder: { ...prefs.paymentReminder, daysAfterDelivery: n } });
  };

  const toggleDayInterval = (day: number) => {
    const curr = prefs.dueSoonAlerts.intervals;
    const next = curr.includes(day) ? curr.filter((d) => d !== day) : [...curr, day].sort((a, b) => a - b);
    updatePrefs({ dueSoonAlerts: { ...prefs.dueSoonAlerts, intervals: next } });
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}><Text style={s.back}>←</Text></TouchableOpacity>
        <Text style={s.headerTitle}>Notification Settings</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

          {/* Master */}
          <Sec title="Master">
            <Row label="Enable all notifications" value={prefs.enabled} onChange={(v) => updatePrefs({ enabled: v })} />
          </Sec>

          {/* Due alerts */}
          <Sec title="Due-Date Alerts">
            <Row label="Remind me before due dates" value={prefs.dueSoonAlerts.enabled} onChange={(v) => updatePrefs({ dueSoonAlerts: { ...prefs.dueSoonAlerts, enabled: v } })} />
            {prefs.dueSoonAlerts.enabled && <>
              <Lbl>Days before due</Lbl>
              <View style={s.chips}>
                {[1, 2, 3, 5, 7, 14].map((d) => (
                  <TouchableOpacity key={d} style={[s.chip, prefs.dueSoonAlerts.intervals.includes(d) && s.chipOn]} onPress={() => toggleDayInterval(d)}>
                    <Text style={[s.chipTxt, prefs.dueSoonAlerts.intervals.includes(d) && s.chipTxtOn]}>{d}d</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Lbl>Alert time (HH:MM)</Lbl>
              <TextInput style={s.input} value={prefs.dueSoonAlerts.time} onChangeText={(v) => updatePrefs({ dueSoonAlerts: { ...prefs.dueSoonAlerts, time: v } })} placeholder="09:00" placeholderTextColor={Colors.muted} keyboardType="numbers-and-punctuation" />
            </>}
          </Sec>

          {/* Daily digest */}
          <Sec title="Daily Digest">
            <Row label="Morning summary" sublabel="Active orders, what's due, revenue" value={prefs.dailyDigest.enabled} onChange={(v) => updatePrefs({ dailyDigest: { ...prefs.dailyDigest, enabled: v } })} />
            {prefs.dailyDigest.enabled && <>
              <Lbl>Send at (HH:MM)</Lbl>
              <TextInput style={s.input} value={prefs.dailyDigest.time} onChangeText={(v) => updatePrefs({ dailyDigest: { ...prefs.dailyDigest, time: v } })} placeholder="08:00" placeholderTextColor={Colors.muted} keyboardType="numbers-and-punctuation" />
            </>}
          </Sec>

          {/* Weekly summary */}
          <Sec title="Weekly Summary">
            <Row label="Weekly recap" sublabel="Revenue, completed orders, upcoming" value={prefs.weeklySummary.enabled} onChange={(v) => updatePrefs({ weeklySummary: { ...prefs.weeklySummary, enabled: v } })} />
            {prefs.weeklySummary.enabled && <>
              <Lbl>Day of week</Lbl>
              <View style={s.chips}>
                {DAY_OPTIONS.map((d) => (
                  <TouchableOpacity key={d.value} style={[s.chip, prefs.weeklySummary.dayOfWeek === d.value && s.chipOn]} onPress={() => updatePrefs({ weeklySummary: { ...prefs.weeklySummary, dayOfWeek: d.value } })}>
                    <Text style={[s.chipTxt, prefs.weeklySummary.dayOfWeek === d.value && s.chipTxtOn]}>{d.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Lbl>Send at (HH:MM)</Lbl>
              <TextInput style={s.input} value={prefs.weeklySummary.time} onChangeText={(v) => updatePrefs({ weeklySummary: { ...prefs.weeklySummary, time: v } })} placeholder="09:00" placeholderTextColor={Colors.muted} keyboardType="numbers-and-punctuation" />
            </>}
          </Sec>

          {/* Shipping */}
          <Sec title="Shipping Reminders">
            <Row label="Remind me to ship accepted orders" value={prefs.shippingReminder.enabled} onChange={(v) => updatePrefs({ shippingReminder: { ...prefs.shippingReminder, enabled: v } })} />
            {prefs.shippingReminder.enabled && <>
              <Lbl>Days after accepting</Lbl>
              <TextInput
                style={s.input}
                value={shipDaysText}
                onChangeText={setShipDaysText}
                onBlur={commitShipDays}
                onSubmitEditing={commitShipDays}
                keyboardType="number-pad"
                placeholder="3"
                placeholderTextColor={Colors.muted}
              />
            </>}
          </Sec>

          {/* Payment */}
          <Sec title="Payment Reminders">
            <Row label="Remind me about unpaid orders" value={prefs.paymentReminder.enabled} onChange={(v) => updatePrefs({ paymentReminder: { ...prefs.paymentReminder, enabled: v } })} />
            {prefs.paymentReminder.enabled && <>
              <Lbl>Days after delivery if unpaid</Lbl>
              <TextInput
                style={s.input}
                value={payDaysText}
                onChangeText={setPayDaysText}
                onBlur={commitPayDays}
                onSubmitEditing={commitPayDays}
                keyboardType="number-pad"
                placeholder="2"
                placeholderTextColor={Colors.muted}
              />
            </>}
          </Sec>

          {/* Test */}
          <View style={{ paddingHorizontal: Spacing.md, marginTop: Spacing.lg }}>
            <TouchableOpacity style={s.testBtn} onPress={testNotification}>
              <Text style={s.testTxt}>Send Test Notification</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
function Row({ label, sublabel, value, onChange }: { label: string; sublabel?: string; value: boolean; onChange: (v: boolean) => void }) {
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
  testBtn: { borderWidth: 1, borderColor: Colors.rose, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', backgroundColor: `${Colors.rose}11` },
  testTxt: { color: Colors.rose, fontFamily: 'DMSans', fontSize: 14, fontWeight: '600' },
});
