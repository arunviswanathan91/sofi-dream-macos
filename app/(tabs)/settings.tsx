import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity,
  TextInput, Switch, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotifications } from '../../hooks/useNotifications';
import { useProfile } from '../../hooks/useProfile';
import { Colors, Spacing, BorderRadius } from '../../lib/theme';
import type { AppTheme } from '../../types';

const THEMES: { label: string; value: AppTheme; bg: string; text: string }[] = [
  { label: 'Warm Cream', value: 'warm-cream', bg: '#FAF7F2', text: '#3D2B1F' },
  { label: 'Dark Walnut', value: 'dark-walnut', bg: '#2A1F17', text: '#F5EDE3' },
  { label: 'Soft Sage', value: 'soft-sage', bg: '#EAF0EA', text: '#2D402D' },
  { label: 'Lavender', value: 'lavender', bg: '#F0EAF8', text: '#3D2D52' },
];

const CURRENCIES = ['EUR', 'GBP', 'USD', 'CHF', 'INR', 'SEK', 'PLN'];

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { prefs, updatePrefs, testNotification } = useNotifications();
  const { profile, saveProfile } = useProfile();

  const [name, setName] = useState(profile.name);
  const [tagline, setTagline] = useState(profile.tagline ?? '');
  const [currency, setCurrency] = useState(profile.currency);
  const [theme, setTheme] = useState<AppTheme>(profile.theme);
  const [saving, setSaving] = useState(false);

  // Sync local state when profile loads from storage
  useEffect(() => {
    setName(profile.name);
    setTagline(profile.tagline ?? '');
    setCurrency(profile.currency);
    setTheme(profile.theme);
  }, [profile.name, profile.tagline, profile.currency, profile.theme]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveProfile({ name: name.trim() || 'Sofi Dream', tagline: tagline.trim(), currency, theme, timezone: profile.timezone });
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (e) {
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleThemeSelect = async (t: AppTheme) => {
    setTheme(t);
    // Persist immediately so the greeting + other screens see it
    await saveProfile({ ...profile, theme: t });
  };

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        >
          <Text style={s.title}>Settings</Text>

          {/* Business Profile */}
          <Sec title="Business Profile">
            <Lbl>Business Name</Lbl>
            <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Your business name" placeholderTextColor={Colors.muted} />
            <Lbl>Tagline</Lbl>
            <TextInput style={s.input} value={tagline} onChangeText={setTagline} placeholder="Handmade with love ✦" placeholderTextColor={Colors.muted} />
            <Lbl>Default Currency</Lbl>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {CURRENCIES.map((c) => (
                <TouchableOpacity key={c} style={[s.chip, currency === c && s.chipOn]} onPress={() => setCurrency(c)}>
                  <Text style={[s.chipTxt, currency === c && s.chipTxtOn]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
              <Text style={s.saveTxt}>{saving ? 'Saving…' : 'Save Profile'}</Text>
            </TouchableOpacity>
          </Sec>

          {/* App Theme */}
          <Sec title="App Theme">
            <Text style={s.themeHint}>Tap to apply instantly</Text>
            <View style={s.themeGrid}>
              {THEMES.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[s.themeCard, { backgroundColor: t.bg }, theme === t.value && s.themeCardOn]}
                  onPress={() => handleThemeSelect(t.value)}
                  activeOpacity={0.85}
                >
                  <Text style={[s.themeLbl, { color: t.text }]}>{t.label}</Text>
                  {theme === t.value && <Text style={s.themeCheck}>✓ Active</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </Sec>

          {/* Notifications */}
          <Sec title="Notifications">
            <SRow label="Enable Notifications" right={
              <Switch value={prefs.enabled} onValueChange={(v) => updatePrefs({ enabled: v })} trackColor={{ false: Colors.border, true: Colors.rose }} thumbColor={Colors.white} />
            } />
            <SRow label="Daily Digest" right={
              <Switch value={prefs.dailyDigest.enabled} onValueChange={(v) => updatePrefs({ dailyDigest: { ...prefs.dailyDigest, enabled: v } })} trackColor={{ false: Colors.border, true: Colors.rose }} thumbColor={Colors.white} />
            } />
            <SRow label="Due Date Alerts" right={
              <Switch value={prefs.dueSoonAlerts.enabled} onValueChange={(v) => updatePrefs({ dueSoonAlerts: { ...prefs.dueSoonAlerts, enabled: v } })} trackColor={{ false: Colors.border, true: Colors.rose }} thumbColor={Colors.white} />
            } />
            <TouchableOpacity style={s.testBtn} onPress={testNotification}>
              <Text style={s.testTxt}>Send Test Notification</Text>
            </TouchableOpacity>
          </Sec>

          {/* Quick Links */}
          <Sec title="More">
            <SRow label="Notification Preferences" right={<Text style={s.arrow}>›</Text>} onPress={() => router.push('/notifications')} />
            <SRow label="Craft Categories" right={<Text style={s.arrow}>›</Text>} onPress={() => router.push('/(tabs)/track')} />
            <SRow label="Reports & Export" right={<Text style={s.arrow}>›</Text>} onPress={() => router.push('/reports')} />
          </Sec>

          {/* About */}
          <Sec title="About">
            <SRow label="Version" right={<Text style={s.meta}>1.0.0</Text>} />
            <SRow label="Made with" right={<Text style={s.meta}>✦ for Sofie</Text>} />
          </Sec>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.secTitle}>{title}</Text>
      <View style={s.card}>{children}</View>
    </View>
  );
}
function Lbl({ children }: { children: string }) {
  return <Text style={s.lbl}>{children}</Text>;
}
function SRow({ label, right, onPress }: { label: string; right: React.ReactNode; onPress?: () => void }) {
  return (
    <TouchableOpacity style={s.sRow} onPress={onPress} disabled={!onPress} activeOpacity={onPress ? 0.7 : 1}>
      <Text style={s.sRowLbl}>{label}</Text>
      {right}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  title: { fontSize: 26, fontFamily: 'PlayfairDisplay', color: Colors.bark, paddingHorizontal: Spacing.md, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  section: { paddingHorizontal: Spacing.md, marginBottom: Spacing.lg },
  secTitle: { fontSize: 11, fontFamily: 'DMSans', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '600', marginBottom: 8 },
  card: { backgroundColor: Colors.warmWhite, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border },
  lbl: { fontSize: 11, fontFamily: 'DMSans', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5, marginTop: 4 },
  input: { backgroundColor: Colors.cream, borderRadius: BorderRadius.sm, paddingHorizontal: 14, paddingVertical: 12, fontFamily: 'DMSans', fontSize: 15, color: Colors.bark, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, marginBottom: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: BorderRadius.full, backgroundColor: Colors.cream, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, marginRight: 8 },
  chipOn: { backgroundColor: Colors.rose, borderColor: Colors.rose },
  chipTxt: { fontSize: 13, fontFamily: 'DMMono', color: Colors.muted },
  chipTxtOn: { color: Colors.white },
  saveBtn: { backgroundColor: Colors.rose, borderRadius: BorderRadius.md, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  saveTxt: { color: Colors.white, fontFamily: 'DMSans', fontSize: 14, fontWeight: '700' },
  themeHint: { fontSize: 12, fontFamily: 'DMSans', color: Colors.muted, marginBottom: 12 },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  themeCard: { width: '47%', height: 72, borderRadius: BorderRadius.md, padding: 12, justifyContent: 'space-between', borderWidth: 2, borderColor: 'transparent' },
  themeCardOn: { borderColor: Colors.rose },
  themeLbl: { fontSize: 13, fontFamily: 'DMSans', fontWeight: '600' },
  themeCheck: { fontSize: 11, fontFamily: 'DMMono', color: Colors.rose },
  sRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  sRowLbl: { fontSize: 14, fontFamily: 'DMSans', color: Colors.bark },
  arrow: { fontSize: 20, color: Colors.muted },
  meta: { fontSize: 13, fontFamily: 'DMMono', color: Colors.muted },
  testBtn: { borderWidth: 1, borderColor: Colors.rose, borderRadius: BorderRadius.md, paddingVertical: 11, alignItems: 'center', marginTop: 8 },
  testTxt: { color: Colors.rose, fontFamily: 'DMSans', fontSize: 13, fontWeight: '600' },
});
