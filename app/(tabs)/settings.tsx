import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Switch, Alert, KeyboardAvoidingView, Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotifications } from '../../hooks/useNotifications';
import { useProfile } from '../../hooks/useProfile';
import { useTheme } from '../../context/ThemeContext';
import { Colors, Spacing, BorderRadius } from '../../lib/theme';
import type { AppTheme } from '../../types';

const THEMES: { label: string; value: AppTheme; bg: string; text: string; desc: string }[] = [
  { label: 'System Default', value: 'system', bg: '#888888', text: '#FFFFFF', desc: 'Follows device dark/light mode' },
  { label: 'Warm Cream', value: 'warm-cream', bg: '#FAF7F2', text: '#3D2B1F', desc: 'Default warm tone' },
  { label: 'Dark Walnut', value: 'dark-walnut', bg: '#2A1F17', text: '#F5EDE3', desc: 'Dark, rich brown' },
  { label: 'Soft Sage', value: 'soft-sage', bg: '#EAF0EA', text: '#2D402D', desc: 'Calm green' },
  { label: 'Lavender', value: 'lavender', bg: '#F0EAF8', text: '#3D2D52', desc: 'Gentle purple' },
];

const CURRENCIES = ['EUR', 'GBP', 'USD', 'CHF', 'INR', 'SEK', 'PLN'];

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { prefs, updatePrefs, testNotification } = useNotifications();
  const { profile, saveProfile } = useProfile();
  const { theme: activeTheme, setTheme: setGlobalTheme, colors } = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

  const [name, setName] = useState(profile.name);
  const [tagline, setTagline] = useState(profile.tagline ?? '');
  const [address, setAddress] = useState(profile.address ?? '');
  const [gstNumber, setGstNumber] = useState(profile.gstNumber ?? '');
  const [currency, setCurrency] = useState(profile.currency);
  const [theme, setTheme] = useState<AppTheme>(profile.theme);
  const [saving, setSaving] = useState(false);

  // Sync local state when profile loads from storage
  useEffect(() => {
    setName(profile.name);
    setTagline(profile.tagline ?? '');
    setAddress(profile.address ?? '');
    setGstNumber(profile.gstNumber ?? '');
    setCurrency(profile.currency);
    setTheme(profile.theme);
  }, [profile.name, profile.tagline, profile.address, profile.gstNumber, profile.currency, profile.theme]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveProfile({
        name: name.trim() || 'Sofi Dream',
        tagline: tagline.trim(),
        address: address.trim() || undefined,
        gstNumber: gstNumber.trim() || undefined,
        currency,
        theme,
        timezone: profile.timezone,
      });
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (e) {
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleThemeSelect = async (t: AppTheme) => {
    setTheme(t);
    setGlobalTheme(t); // Apply instantly to entire app
    await saveProfile({ ...profile, theme: t });
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        >
          <Text style={[s.title, { color: colors.text }]}>Settings</Text>

          {/* Business Profile */}
          <Sec title="Business Profile" colors={colors}>
            <Lbl colors={colors}>Business Name</Lbl>
            <TextInput style={[s.input, { backgroundColor: colors.bg, borderColor: colors.cardBorder, color: colors.text }]} value={name} onChangeText={setName} placeholder="Your business name" placeholderTextColor={colors.subText} />
            <Lbl colors={colors}>Tagline</Lbl>
            <TextInput style={[s.input, { backgroundColor: colors.bg, borderColor: colors.cardBorder, color: colors.text }]} value={tagline} onChangeText={setTagline} placeholder="Handmade with love ✦" placeholderTextColor={colors.subText} />
            <Lbl colors={colors}>Business Address (for invoices)</Lbl>
            <TextInput
              style={[s.input, s.multiline, { backgroundColor: colors.bg, borderColor: colors.cardBorder, color: colors.text }]}
              value={address}
              onChangeText={setAddress}
              placeholder="Street, City, Country"
              placeholderTextColor={colors.subText}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
            <Lbl colors={colors}>GST / Tax Number (optional)</Lbl>
            <TextInput style={[s.input, { backgroundColor: colors.bg, borderColor: colors.cardBorder, color: colors.text }]} value={gstNumber} onChangeText={setGstNumber} placeholder="e.g. 22AAAAA0000A1Z5" placeholderTextColor={colors.subText} autoCapitalize="characters" />
            <Lbl colors={colors}>Default Currency</Lbl>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} keyboardShouldPersistTaps="always">
              {CURRENCIES.map((c) => (
                <TouchableOpacity key={c} style={[s.chip, { backgroundColor: colors.bg, borderColor: colors.cardBorder }, currency === c && s.chipOn]} onPress={() => setCurrency(c)}>
                  <Text style={[s.chipTxt, { color: colors.subText }, currency === c && s.chipTxtOn]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
              <Text style={s.saveTxt}>{saving ? 'Saving…' : 'Save Profile'}</Text>
            </TouchableOpacity>
          </Sec>

          {/* App Theme */}
          <Sec title="App Theme" colors={colors}>
            <Text style={[s.themeHint, { color: colors.subText }]}>Tap to apply instantly — changes the whole app</Text>
            <View style={[s.themeGrid, isTablet && s.themeGridTablet]}>
              {THEMES.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[s.themeCard, isTablet && s.themeCardTablet, { backgroundColor: t.bg }, (theme === t.value || activeTheme === t.value) && s.themeCardOn]}
                  onPress={() => handleThemeSelect(t.value)}
                  activeOpacity={0.85}
                >
                  <Text style={[s.themeLbl, { color: t.text }]}>{t.label}</Text>
                  <Text style={[s.themeDesc, { color: t.text, opacity: 0.6 }]}>{t.desc}</Text>
                  {(theme === t.value || activeTheme === t.value) && (
                    <Text style={[s.themeCheck, { color: t.text }]}>✓ Active</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Sec>

          {/* Notifications */}
          <Sec title="Notifications" colors={colors}>
            <SRow label="Enable Notifications" colors={colors} right={
              <Switch value={prefs.enabled} onValueChange={(v) => updatePrefs({ enabled: v })} trackColor={{ false: Colors.border, true: Colors.rose }} thumbColor={Colors.white} />
            } />
            <SRow label="Daily Digest" colors={colors} right={
              <Switch value={prefs.dailyDigest.enabled} onValueChange={(v) => updatePrefs({ dailyDigest: { ...prefs.dailyDigest, enabled: v } })} trackColor={{ false: Colors.border, true: Colors.rose }} thumbColor={Colors.white} />
            } />
            <SRow label="Due Date Alerts" colors={colors} right={
              <Switch value={prefs.dueSoonAlerts.enabled} onValueChange={(v) => updatePrefs({ dueSoonAlerts: { ...prefs.dueSoonAlerts, enabled: v } })} trackColor={{ false: Colors.border, true: Colors.rose }} thumbColor={Colors.white} />
            } />
            <TouchableOpacity style={s.testBtn} onPress={testNotification}>
              <Text style={s.testTxt}>Send Test Notification</Text>
            </TouchableOpacity>
          </Sec>

          {/* Quick Links */}
          <Sec title="More" colors={colors}>
            <SRow label="Notification Preferences" colors={colors} right={<Text style={[s.arrow, { color: colors.subText }]}>›</Text>} onPress={() => router.push('/notifications')} />
            <SRow label="Craft Categories" colors={colors} right={<Text style={[s.arrow, { color: colors.subText }]}>›</Text>} onPress={() => router.push('/(tabs)/track')} />
            <SRow label="Reports & Export" colors={colors} right={<Text style={[s.arrow, { color: colors.subText }]}>›</Text>} onPress={() => router.push('/reports')} />
            <SRow label="Data Backup" colors={colors} right={<Text style={[s.arrow, { color: colors.subText }]}>›</Text>} onPress={() => router.push('/backup')} />
          </Sec>

          {/* About */}
          <Sec title="About" colors={colors}>
            <SRow label="Version" colors={colors} right={<Text style={[s.meta, { color: colors.subText }]}>1.0.0</Text>} />
            <SRow label="Made with" colors={colors} right={<Text style={[s.meta, { color: colors.subText }]}>✦ for Sofie</Text>} />
          </Sec>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Sec({ title, children, colors }: { title: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={s.section}>
      <Text style={[s.secTitle, { color: colors.subText }]}>{title}</Text>
      <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>{children}</View>
    </View>
  );
}
function Lbl({ children, colors }: { children: string; colors: any }) {
  return <Text style={[s.lbl, { color: colors.subText }]}>{children}</Text>;
}
function SRow({ label, right, onPress, colors }: { label: string; right: React.ReactNode; onPress?: () => void; colors: any }) {
  return (
    <TouchableOpacity style={[s.sRow, { borderBottomColor: colors.cardBorder }]} onPress={onPress} disabled={!onPress} activeOpacity={onPress ? 0.7 : 1}>
      <Text style={[s.sRowLbl, { color: colors.text }]}>{label}</Text>
      {right}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 26, fontFamily: 'PlayfairDisplay', paddingHorizontal: Spacing.md, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  section: { paddingHorizontal: Spacing.md, marginBottom: Spacing.lg },
  secTitle: { fontSize: 11, fontFamily: 'DMSans', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '600', marginBottom: 8 },
  card: { borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: StyleSheet.hairlineWidth },
  lbl: { fontSize: 11, fontFamily: 'DMSans', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5, marginTop: 4 },
  input: { borderRadius: BorderRadius.sm, paddingHorizontal: 14, paddingVertical: 12, fontFamily: 'DMSans', fontSize: 15, borderWidth: StyleSheet.hairlineWidth, marginBottom: 12 },
  multiline: { minHeight: 64, paddingTop: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: BorderRadius.full, borderWidth: StyleSheet.hairlineWidth, marginRight: 8 },
  chipOn: { backgroundColor: Colors.rose, borderColor: Colors.rose },
  chipTxt: { fontSize: 13, fontFamily: 'DMMono' },
  chipTxtOn: { color: Colors.white },
  saveBtn: { backgroundColor: Colors.rose, borderRadius: BorderRadius.md, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  saveTxt: { color: Colors.white, fontFamily: 'DMSans', fontSize: 14, fontWeight: '700' },
  themeHint: { fontSize: 12, fontFamily: 'DMSans', marginBottom: 12 },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  themeGridTablet: { gap: 12 },
  themeCard: { width: '47%', height: 80, borderRadius: BorderRadius.md, padding: 12, justifyContent: 'space-between', borderWidth: 2, borderColor: 'transparent' },
  themeCardTablet: { width: '23%', height: 90 },
  themeCardOn: { borderColor: Colors.rose },
  themeLbl: { fontSize: 13, fontFamily: 'DMSans', fontWeight: '600' },
  themeDesc: { fontSize: 10, fontFamily: 'DMSans' },
  themeCheck: { fontSize: 11, fontFamily: 'DMMono' },
  sRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  sRowLbl: { fontSize: 14, fontFamily: 'DMSans' },
  arrow: { fontSize: 20 },
  meta: { fontSize: 13, fontFamily: 'DMMono' },
  testBtn: { borderWidth: 1, borderColor: Colors.rose, borderRadius: BorderRadius.md, paddingVertical: 11, alignItems: 'center', marginTop: 8 },
  testTxt: { color: Colors.rose, fontFamily: 'DMSans', fontSize: 13, fontWeight: '600' },
});
